document.addEventListener("DOMContentLoaded", function () {
  function loadContent(url) {
    if (!url) return;

    const path = url.split("/").pop();
    const targetUrl = path ? path : "/home.html";
    htmx.ajax("GET", targetUrl, "main");
  }

  // Handle the initial load based on the current URL
  loadContent(window.location.pathname);

  // Intercept link clicks to handle routing
  document.querySelectorAll("nav a").forEach((link) => {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      const url = this.getAttribute("href");
      loadContent(url);
    });
  });

  // Handle back/forward navigation
  window.addEventListener("popstate", function () {
    loadContent(window.location.pathname);
  });
});
