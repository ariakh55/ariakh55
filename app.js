const express = require("express");
const nunjucks = require("nunjucks");
const path = require("path");
const fs = require("fs");
const { fetchBlogs, fetchBlog } = require("./utils/blogsDatabase");
const { renderMarkdownToHtml } = require("./utils/markdownRenderer");
const config = require("./config");

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

  next();
});

app.get("/", (_, res) => {
  res.render("pages/home.html");
});

app.get("/resume", (_, res) => {
  res.render("pages/resume.html");
});

app.get("/public/:filename", (req, res) => {
  const filePath = path.resolve(__dirname, req.params.filename);
  if (!fs.statfsSync(filePath)) {
    res.end();
  }
  res.send(renderMarkdownToHtml(filePath));
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
  const blogPost = fetchBlog(req.params.postid, res.locals.showDrafts);
  res.render("pages/blog.html", {
    blogContent: renderMarkdownToHtml(blogPost),
  });
});

app.get("/projects", (_, res) => {
  res.render("pages/projects.html");
});

app.get("*", (_, res) => {
  res.status(404).render("pages/error.html", { error: "404 | PAGE NOT FOUND" });
});

app.use((err, _req, res, _next) => {
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
