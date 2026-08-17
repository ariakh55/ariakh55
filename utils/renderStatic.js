const fs = require("fs");
const path = require("path");
const { renderMarkdownToHtml } = require("./markdownRenderer");

const ROOT = path.resolve(__dirname, "..");
const BLOGS_DIR = path.join(ROOT, "blogs");
const STATIC_DIR = path.join(ROOT, "static");

const read = (p) => fs.readFileSync(p, "utf8");
const writeStatic = (name, body) =>
  fs.writeFileSync(path.join(STATIC_DIR, name), body);
const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const stripDocInfo = (html) =>
  html.replace(/<doc-info>[\s\S]*?<\/doc-info>/gi, "").trim();
const rewriteRawblogs = (html) => html.replace(/\/rawblogs\//g, "blogs/");

const BLOG_TEMPLATE = `<div class="wide-container">
    <div class="markdown-container justify-parapragh">
    <a href="#/blogs" class="back-button">
        [GO BACK]
    </a>
        __CONTENT__
    </div>
</div>
`;

const readDocInfo = (md) => {
  const g = (tag) => {
    const m = md.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
    return m ? m[1].trim() : "";
  };
  return {
    title: g("doc-title"),
    description: g("doc-description"),
    author: g("doc-author"),
    date: g("doc-published"),
  };
};

function renderHome() {}

function renderResume() {}

function renderBlogPosts() {
  const files = fs.readdirSync(BLOGS_DIR).filter((f) => f.endsWith(".md"));
  for (const file of files) {
    let body = renderMarkdownToHtml(path.join(BLOGS_DIR, file));
    body = stripDocInfo(body);
    body = rewriteRawblogs(body);
    const slug = file.replace(/\.md$/, "");
    writeStatic(
      `blog-${slug}.html`,
      BLOG_TEMPLATE.replace("__CONTENT__", body),
    );
  }
}

function renderBlogsIndex() {
  const files = fs.readdirSync(BLOGS_DIR).filter((f) => f.endsWith(".md"));
  const entries = files
    .map((file, i) => {
      const info = readDocInfo(read(path.join(BLOGS_DIR, file)));
      const slug = file.replace(/\.md$/, "");
      return `    <div>
        <a href="#/blog/${slug}">
            <div>
                <span class="number">${i + 1}</span>
                <span>${esc(info.title)}</span>
            </div>
            <div>${esc(file)}</div>
        </a>
        ${esc(info.description)} <br>
        ${esc(info.date)} - created by ${esc(info.author)}
        <hr />
    </div>`;
    })
    .join("\n");
  writeStatic(
    "blogs.html",
    `<div class="wide-container">
    <div class="blogs-list">
${entries}
    </div>
</div>
`,
  );
}

function main() {
  fs.mkdirSync(STATIC_DIR, { recursive: true });
  const readme = renderMarkdownToHtml(path.join(ROOT, "README.md"));
  const homeTemplate = `<div class="wide-container">
    <div class="markdown-container" data-src="/public/README.md">
          ${readme}
    </div>
    <img src="public/assets/site-microbanner.png" class="micro-banner" alt="made with HTMX" />

    <pre class="cream-of-crop lolcat">
          ___           ___                         ___           ___           ___     
         /\\__\\         /\\  \\                       /\\__\\         /\\  \\         /\\  \\    
        /:/ _/_        \\:\\  \\                     /:/ _/_        \\:\\  \\       /::\\  \\   
       /:/ /\\  \\        \\:\\  \\                   /:/ /\\__\\        \\:\\  \\     /:/\\:\\__\\  
      /:/ /::\\  \\   ___  \\:\\  \\   ___     ___   /:/ /:/  /    ___  \\:\\  \\   /:/ /:/  /  
     /:/_/:/\\:\\__\\ /\\  \\  \\:\\__\\ /\\  \\   /\\__\\ /:/_/:/  /    /\\  \\  \\:\\__\\ /:/_/:/__/___
     \\:\\/:/ /:/  / \\:\\  \\ /:/  / \\:\\  \\ /:/  / \\:\\/:/  /     \\:\\  \\ /:/  / \\:\\/:::::/  /
      \\::/ /:/  /   \\:\\  /:/  /   \\:\\  /:/  /   \\::/__/       \\:\\  /:/  /   \\::/~~/~~~~ 
       \\/_/:/  /     \\:\\/:/  /     \\:\\/:/  /     \\:\\  \\        \\:\\/:/  /     \\:\\~~\\     
         /:/  /       \\::/  /       \\::/  /       \\:\\__\\        \\::/  /       \\:\\__\\    
         \\/__/         \\/__/         \\/__/         \\/__/         \\/__/         \\/__/    
    </pre>
</div>`;
  writeStatic("home.html", homeTemplate);

  const resume = renderMarkdownToHtml(path.join(ROOT, "CV.md"));
  writeStatic(
    "resume.html",
    `<div class="wide-container">
             <div class="markdown-container" data-src="/public/CV.md">
                  ${resume}
             </div>
     </div>`,
  );

  renderBlogPosts();
  renderBlogsIndex();
}

main();
