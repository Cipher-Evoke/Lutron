const path = require('path');

const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
  "X-Permitted-Cross-Domain-Policies": "none",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: http://127.0.0.1:8000 http://localhost:8000; font-src 'self' data:; connect-src 'self' http://127.0.0.1:8000 http://localhost:8000 ws://127.0.0.1:8000 ws://localhost:8000 ws://localhost:3000; frame-ancestors 'self'; base-uri 'self'; object-src 'none'",
};

module.exports = {
  // Skip ESLintWebpackPlugin during `craco start` / `craco build`.
  // Does not change bundled JS, variants, or runtime behavior — only removes
  // compile-time linting (saves RAM/CPU). Use `npm run lint` when you want ESLint.
  eslint: {
    enable: false,
  },
  webpack: {
    alias: {
      'pdfjs-dist': path.resolve(__dirname, 'node_modules/pdfjs-dist'),
    },
    configure: (webpackConfig, { env }) => {
      // No source maps: avoids react-datepicker warnings in dev, and keeps
      // production DevTools from mapping back to original src/ files.
      // App runtime behavior is unchanged; also set GENERATE_SOURCEMAP=false.
      if (env === 'development' || env === 'production') {
        webpackConfig.devtool = false;
      }

      // Add ignoreWarnings as backup
      webpackConfig.ignoreWarnings = [
        ...(webpackConfig.ignoreWarnings || []),
        /Failed to parse source map/,
        /react-datepicker/,
        /ENOENT: no such file or directory/,
      ];

      return webpackConfig;
    },
  },
  devServer: (devServerConfig) => {
    devServerConfig.headers = {
      ...(devServerConfig.headers || {}),
      ...securityHeaders,
    };
    return devServerConfig;
  },
};
