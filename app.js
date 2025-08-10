const express = require("express");
const nunjucks = require("nunjucks");
const path = require("path");
const fs = require("fs");
const { Database } = require("sqlite3").verbose();

const { AppError } = require("./utils/errors");
const { fetchBlogs, fetchBlog } = require("./utils/blogsDatabase");
const { renderMarkdownToHtml } = require("./utils/markdownRenderer");
const config = require("./config");
const { buildHead } = require("./utils/buildHead");
const { logVisit, getTotalVisitsPerPage } = require("./utils/statics");
const { resolveTracks } = require("./utils/playlist");

const app = express();
const dbPath = path.join(__dirname, "stats.db");
const db = new Database(dbPath);

db.run(`
    CREATE TABLE IF NOT EXISTS page_visits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        path TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_page_visits_path ON page_visits(path);
`);

app.use(express.static("public"));
app.use("/rawblogs", express.static("blogs"));

nunjucks.configure("views", {
  autoescape: true,
  express: app,
});

app.use((req, _, next) => {
  logVisit(db, req.path);
  next();
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

app.get("/playlist", async (_, res) => {
  const { head } = res.locals;
  res.locals.head = buildHead({
    title: `${head.title} - Playlist`,
    description: "Listening to right now",
    url: `${head.og.url}/playlist`,
  });

  const playlist = await resolveTracks();

  res.render("pages/playlist.html", {
    playlist,
  });
});

const devModeEnabled = (req, res, next) => {
  const isDevMode =
    config.devHeader &&
    config.devHeaderValue &&
    req.query[config.devHeader] === config.devHeaderValue;

  res.locals.isDevMode = isDevMode;

  return next();
};

app.get("/blogs", devModeEnabled, async (_, res) => {
  const { head } = res.locals;
  res.locals.head = buildHead({
    title: `${head.title} - Blogs`,
    description: "Writings and guides",
    url: `${head.og.url}/blogs`,
  });

  const blogPosts = fetchBlogs(res.locals.isDevMode);
  res.render("pages/blogs.html", { blogPosts });
});

app.get("/blogs/paginate", devModeEnabled, (req, res) => {
  const { limit, offset } = req.query;
  console.log(limit, offset);
  if (!limit || !offset) return;

  const blogPosts = fetchBlogs(res.locals.isDevMode, limit, offset);

  res.render("partials/bloglist.html", {
    blogPosts,
    paginateIndex: offset - 1,
  });
});

app.get("/blog/:postid", devModeEnabled, (req, res) => {
  const { postid } = req.params;
  const { filePath, description, title } = fetchBlog(
    postid,
    res.locals.isDevMode,
  );

  const { head } = res.locals;
  res.locals.head = buildHead({
    title,
    description,
    url: `${head.og.url}/blog/${postid}`,
  });

  res.render("pages/blog.html", {
    title,
    content: renderMarkdownToHtml(filePath),
  });
});

app.get("/projects", (_, res) => {
  const { head } = res.locals;
  res.locals.head = buildHead({
    title: `${head.title} - Projects`,
    description: "Side Projects which are finished",
    url: `${head.og.url}/projects`,
  });

  const projects = fs.readFileSync("./projects.json");

  res.render("pages/projects.html", {
    projects: JSON.parse(projects),
  });
});

app.get("/api/stats", devModeEnabled, (_, res) => {
  const { isDevMode } = res.locals;

  if (!isDevMode) {
    throw new AppError("NOT FOUND", 404);
  }

  getTotalVisitsPerPage(db, (_, rows) => res.json(rows));
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
