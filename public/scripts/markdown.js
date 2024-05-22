function renderMarkdown({ detail }) {
  detail.serverResponse = window
    .markdownit({
      html: true,
      // breaks: true,
      typographer: true,
    })
    .render(detail.serverResponse);
}
