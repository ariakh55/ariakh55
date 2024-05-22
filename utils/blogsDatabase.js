const path = require("path");
const fs = require("fs");

const BLOGS_PATH = path.resolve(process.cwd(), "blogs");

const extractDescriptionFromFile = (filePath) => {
  const markdown = fs.readFileSync(filePath, "utf8");

  const descriptionRegex = /Description:\s*(.*)/i;
  const titleRegex = /Title:\s*(.*)/i;
  const authorRegex = /Author:\s*(.*)/i;
  const dateRegex = /Date:\s*(.*)/i;

  const descriptionMatch = markdown.match(descriptionRegex);
  const titleMatch = markdown.match(titleRegex);
  const authorMatch = markdown.match(authorRegex);
  const dateMatch = markdown.match(dateRegex);

  const result = {
    description: descriptionMatch ? descriptionMatch[1].trim() : "",
    title: titleMatch ? titleMatch[1].trim() : "",
    author: authorMatch ? authorMatch[1].trim() : "",
    date: dateMatch ? dateMatch[1].trim() : "",
  };

  return result;
};

const readBlogsDir = () => {
  if (!fs.statfsSync(BLOGS_PATH)) {
    return [];
  }

  const blogFiles = fs
    .readdirSync(BLOGS_PATH)
    .map((file) => {
      const filePath = path.resolve(BLOGS_PATH, file);
      if (!fs.statfsSync(filePath)) return null;

      const fileInfo = extractDescriptionFromFile(filePath);

      return {
        link: `/blog/${file}`,
        name: file,
        info: fileInfo,
      };
    })
    .filter((file) => !!file);

  return blogFiles;
};

module.exports.fetchAllBlogs = () => {
  return readBlogsDir();
};
