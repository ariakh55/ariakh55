const express = require("express");
const nunjucks = require("nunjucks");
const path = require("path");
const { fetchAllBlogs } = require("./utils/blogsDatabase");

const app = express();

const blogPosts = fetchAllBlogs();

app.use(express.static("public"));
app.use("/rawblogs", express.static("blogs"));

app.get("/README.md", (_, res) =>
  res.sendFile(path.resolve(__dirname, "README.md")),
);
app.get("/CV.md", (_, res) => res.sendFile(path.resolve(__dirname, "CV.md")));

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

app.get("/blogs", async (_, res) => {
  res.render("pages/blogs.html", { blogPosts });
});

app.get("/projects", (_, res) => {
  res.render("pages/projects.html");
});

app.get("/blog/:postid", (req, res) => {
  res.render("pages/blog.html", { postid: req.params.postid });
});

app.get("*", (_, res) => {
  res.status(404).render("pages/error.html", { error: "404 | PAGE NOT FOUND" });
});

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res
    .status(500)
    .render("pages/error.html", { error: `500 | Internal server Error` });
});

app.listen(3000, () => {
  console.info(`Application running http://localhost:3000`);
});
