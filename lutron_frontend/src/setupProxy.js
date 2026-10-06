const { createProxyMiddleware } = require("http-proxy-middleware");

const MEDIA = ["/background_image", "/logo_image", "/help_files"];

module.exports = function setupProxy(app) {
  MEDIA.forEach((mediaPath) => {
    app.use(
      mediaPath,
      createProxyMiddleware({
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      })
    );
  });
};
