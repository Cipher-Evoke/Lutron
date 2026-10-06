(function () {
  var NativeWorker = window.Worker;
  if (!NativeWorker) return;
  function Worker(url, options) {
    try {
      var value = url instanceof URL ? url.href : String(url);
      if (value.indexOf("pdf.worker.min.mjs") !== -1 && value.indexOf("pdfworker=") === -1) {
        url = value + (value.indexOf("?") < 0 ? "?pdfworker=2" : "&pdfworker=2");
      }
    } catch (e) {}
    return new NativeWorker(url, options);
  }
  Worker.prototype = NativeWorker.prototype;
  window.Worker = Worker;
})();
