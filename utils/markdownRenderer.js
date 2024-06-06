const hljs = require("highlight.js");
const { Marked } = require("marked");
const { markedHighlight } = require("marked-highlight");
const fs = require("fs");

const imageLazyLoad = {
  name: "image",
  level: "inline",
  renderer: {
    image(src, title, text) {
      return `<img loading="lazy" alt="${text}" title="${title}" src="${src}">`;
    },
  },
};

module.exports.renderMarkdownToHtml = (markdownFilePath) => {
  const marked = new Marked(
    markedHighlight({
      langPrefix: "hljs language-",
      highlight(code, lang, _) {
        const language = hljs.getLanguage(lang) ? lang : "plaintext";
        return hljs.highlight(code, { language }).value;
      },
    }),
  );

  marked.use(imageLazyLoad);

  const markdownFile = fs.readFileSync(markdownFilePath, { encoding: "utf8" });
  return marked.parse(markdownFile);
};
