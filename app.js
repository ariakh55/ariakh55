const express = require("express");
const nunjucks = require("nunjucks");
const path = require("path");
const fs = require("fs");
const { fetchBlogs, fetchBlog } = require("./utils/blogsDatabase");
const { renderMarkdownToHtml } = require("./utils/markdownRenderer");
const config = require("./config");
const { buildHead } = require("./utils/buildHead");

const app = express();

app.use(express.static("public"));
app.use("/rawblogs", express.static("blogs"));

nunjucks.configure("views", {
  autoescape: true,
  express: app,
});

app.use((req, res, next) => {
  res.locals.currentUrl = req.url;
  res.locals.useLayout = req.headers["hx-request"] !== "true";
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate");

  res.locals.head = buildHead();

  next();
});

app.get("/", (_, res) => {
  res.render("pages/home.html", {
    content: renderMarkdownToHtml("./README.md"),
  });
});

app.get("/resume", (_, res) => {
  const { head } = res.locals;
  res.locals.head = buildHead({
    title: `${head.title} - Resume`,
    description: "Official Works",
    url: `${head.og.url}/resume`,
  });

  res.render("pages/resume.html", {
    content: renderMarkdownToHtml("./CV.md"),
  });
});

const showDraftsMiddleware = (req, res, next) => {
  const showDrafts =
    config.devHeader &&
    config.devHeaderValue &&
    req.query[config.devHeader] === config.devHeaderValue;

  res.locals.showDrafts = showDrafts;

  return next();
};

app.get("/blogs", showDraftsMiddleware, async (_, res) => {
  const { head } = res.locals;
  res.locals.head = buildHead({
    title: `${head.title} - Blogs`,
    description: "Writings and guides",
    url: `${head.og.url}/blogs`,
  });

  const blogPosts = fetchBlogs(res.locals.showDrafts);
  res.render("pages/blogs.html", { blogPosts });
});

app.get("/blogs/paginate", showDraftsMiddleware, (req, res) => {
  const { limit, offset } = req.query;
  console.log(limit, offset);
  if (!limit || !offset) return;

  const blogPosts = fetchBlogs(res.locals.showDrafts, limit, offset);

  res.render("partials/bloglist.html", {
    blogPosts,
    paginateIndex: offset - 1,
  });
});

app.get("/blog/:postid", showDraftsMiddleware, (req, res) => {
  const title = req.params.postid;

  const { head } = res.locals;
  res.locals.head = buildHead({
    title,
    description: "Writings and guides",
    url: `${head.og.url}/blog/${title}`,
  });

  const blogPost = fetchBlog(title, res.locals.showDrafts);
  res.render("pages/blog.html", {
    title,
    content: renderMarkdownToHtml(blogPost),
  });
});

app.get("/projects", (_, res) => {
  const { head } = res.locals;
  res.locals.head = buildHead({
    title: `${head.title} - Projects`,
    description: "Side Projects which are finished",
    url: `${head.og.url}/projects`,
  });

  res.render("pages/projects.html");
});

app.get("*", (_, res) => {
  res.locals.head = buildHead({
    title: `NOT FOUND`,
    description: "What are you looking for",
  });

  res.status(404).render("pages/error.html", { error: "404 | PAGE NOT FOUND" });
});

app.use((err, _req, res, _next) => {
  res.locals.head = buildHead({
    title: `ERROR`,
    description: "You messed up!!",
  });

  if ("code" in err) {
    return res
      .status(err.code)
      .render("pages/error.html", { error: `${err.code} | ${err.message}` });
  }
  console.error(err.stack);
  res
    .status(500)
    .render("pages/error.html", { error: `500 | Internal server Error` });
});

const host = process.env.HOST ?? "127.0.0.1";
const port = process.env.PORT ?? 3000;

app.listen(port, host, () => {
  console.info(`Application running http://${host}:${port}`);
});
