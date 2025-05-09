/** @typedef {{
 * title: string,
 * description: string,
 * themeColor: string,
 * og: {
 *   title: string,
 *   type: string,
 *   url: string,
 *   site_name: string,
 *   description: string
 * }
 * }} HeadMeta */

/** @type {HeadMeta} */
const DEFAULT_HEAD = {
  title: "Aria Khoshnood",
  description: "Common L taker's personal portfolio",
  themeColor: "#f5e0dc",
  og: {
    title: "Aria Khoshnood",
    type: "portfolio",
    url: "https://www.sulfursashimi.tech",
    site_name: "SulfurTech",
    description: "Common L taker's personal portfolio",
  },
};

/**
 * Build a `head` object for HTML meta tags.
 *
 * @param {{
 *   title?: string,
 *   description?: string,
 *   url?: string
 * }} head - Partial head info to override defaults.
 * @returns {HeadMeta}
 */
exports.buildHead = ({ title, description, url } = {}) => {
  return {
    title: title ?? DEFAULT_HEAD.title,
    description: description ?? DEFAULT_HEAD.description,
    themeColor: DEFAULT_HEAD.themeColor,
    og: {
      title: title ?? DEFAULT_HEAD.og.title,
      description: description ?? DEFAULT_HEAD.og.description,
      type: DEFAULT_HEAD.og.type,
      site_name: DEFAULT_HEAD.og.site_name,
      url: url ?? DEFAULT_HEAD.og.url,
    },
  };
};
