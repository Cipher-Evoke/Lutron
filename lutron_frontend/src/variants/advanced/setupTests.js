/**
 * CRA test bootstrap: stub native `canvas` so jsdom does not load canvas.node
 * (ABI mismatch on Windows / Node 22 breaks suites that use jest-environment-jsdom).
 */
jest.mock("canvas", () => {
  const stub = {};
  return stub;
});
