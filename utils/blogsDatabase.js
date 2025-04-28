const path = require("path");
const fs = require("fs");
const { XMLParser } = require("fast-xml-parser");
const { AppError } = require("./errors");

/** @typedef {{
 * docTitle: string,
 * docDescription: string,
 * docAuthor: string,
 * docPublished: string,
 * "doc_draft": boolean
 * }} DocInfo */

const BLOGS_PATH = path.resolve(process.cwd(), "blogs");

const transformTagName = (tagName) => {
  const splittedTagName = tagName.split("-");
  return splittedTagName
    .map((word, index) =>
      index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join("");
};

/** @type {XMLParser | null} */
let xmlParser = null;
/** @type {XMLParser} */
const getXmlParser = () => {
  if (!xmlParser) {
    xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "doc_",
      transformTagName,
    });
  }
  return xmlParser;
};

const extractDescriptionFromFile = (filePath) => {
  const markdown = fs.readFileSync(filePath, "utf8");
  const docInfoXml = markdown.match(/<doc-info.*>[\s\S]*?<\/doc-info>/is);

  /** @type {{ docInfo: DocInfo }} */
  const { docInfo } = getXmlParser().parse(docInfoXml);

  const result = {
    description: docInfo.docDescription || "",
    title: docInfo.docTitle || "",
    author: docInfo.docAuthor || "",
    date: docInfo.docPublished || "",
    isDraft: Boolean(docInfo.doc_draft === "true") || false,
  };

  return result;
};

const getBlogFiles = () => fs.readdirSync(BLOGS_PATH);

const readBlogsDir = (limit = 10, offset = 0, showDrafts = false) => {
  if (!fs.statfsSync(BLOGS_PATH)) {
    return [];
  }

  const blogFiles = getBlogFiles()
    .slice(offset, limit + 1)
    .map((file) => {
      const filePath = path.resolve(BLOGS_PATH, file);
      if (!fs.statfsSync(filePath)) return null;
      if (fs.lstatSync(filePath).isDirectory()) return null;

      const fileInfo = extractDescriptionFromFile(filePath);

      return {
        link: `/blog/${file}`,
        name: file,
        info: fileInfo,
      };
    })
    .filter((file) => !!file && (!file.info.isDraft || showDrafts));

  return blogFiles;
};

const getBlogByFileName = (filename, showDraft) => {
  if (!fs.statfsSync(BLOGS_PATH)) {
    throw new AppError("NOTTING FOUND", 404);
  }

  const blogFiles = getBlogFiles();
  const foundBlog = blogFiles.find((blogFileName) => filename === blogFileName);
  if (!foundBlog) {
    throw new AppError("BLOG NOT FOUND", 404);
  }

  const filePath = path.resolve(BLOGS_PATH, foundBlog);
  if (fs.lstatSync(filePath).isDirectory()) {
    throw new AppError("THIS IS DIRECTORY", 500);
  }

  const { isDraft } = extractDescriptionFromFile(filePath);
  if (!showDraft && isDraft) {
    throw new AppError("BLOG NOT FOUND", 404);
  }

  return filePath;
};

module.exports.fetchBlogs = (showDraft = false, limit = 10, offset = 0) =>
  readBlogsDir(limit, offset, showDraft);
module.exports.fetchBlog = (filename, showDraft = false) =>
  getBlogByFileName(filename, showDraft);
