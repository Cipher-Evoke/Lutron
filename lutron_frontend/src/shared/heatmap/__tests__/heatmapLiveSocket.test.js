/**
 * @jest-environment jsdom
 */

import {
  buildHeatmapLiveWsUrl,
  createHeatmapLiveSocket,
  isUnauthorizedWebSocketClose,
  WS_UNAUTHORIZED_CLOSE_CODE,
} from "../heatmapLiveSocket";

jest.mock("../../auth/authToken", () => ({
  getValidToken: jest.fn(),
}));

jest.mock("../../auth/sessionRedirect", () => ({
  clearSessionAndRedirectToLogin: jest.fn(() => true),
}));

const { getValidToken } = require("../../auth/authToken");
const { clearSessionAndRedirectToLogin } = require("../../auth/sessionRedirect");

class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  static instances = [];

  constructor(url) {
    this.url = url;
    this.readyState = MockWebSocket.CONNECTING;
    this.onopen = null;
    this.onmessage = null;
    this.onclose = null;
    this.onerror = null;
    this.sent = [];
    MockWebSocket.instances.push(this);
  }

  send(data) {
    this.sent.push(data);
  }

  close(code = 1000, reason = "") {
    this._emitClose(code, reason);
  }

  open() {
    this.readyState = MockWebSocket.OPEN;
    if (typeof this.onopen === "function") this.onopen({});
  }

  _emitClose(code, reason = "") {
    if (this.readyState === MockWebSocket.CLOSED) return;
    this.readyState = MockWebSocket.CLOSED;
    if (typeof this.onclose === "function") {
      this.onclose({ code, reason });
    }
  }
}

function lastSocket() {
  return MockWebSocket.instances[MockWebSocket.instances.length - 1];
}

describe("heatmapLiveSocket auth / reconnect", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    MockWebSocket.instances = [];
    global.WebSocket = MockWebSocket;
    getValidToken.mockReset();
    clearSessionAndRedirectToLogin.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("isUnauthorizedWebSocketClose recognizes 4401 and Unauthorized reason", () => {
    expect(isUnauthorizedWebSocketClose({ code: 4401, reason: "" })).toBe(true);
    expect(
      isUnauthorizedWebSocketClose({ code: 1006, reason: "Unauthorized" })
    ).toBe(true);
    expect(isUnauthorizedWebSocketClose({ code: 1006, reason: "" })).toBe(false);
    expect(WS_UNAUTHORIZED_CLOSE_CODE).toBe(4401);
  });

  it("valid token connects and invokes onOpen once", () => {
    getValidToken.mockReturnValue("valid.jwt.token");
    const onOpen = jest.fn();
    const socket = createHeatmapLiveSocket({ onOpen });
    socket.start();

    expect(MockWebSocket.instances).toHaveLength(1);
    expect(lastSocket().url).toContain("token=valid.jwt.token");
    lastSocket().open();
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(clearSessionAndRedirectToLogin).not.toHaveBeenCalled();
  });

  it("expired local token redirects once and does not reconnect", () => {
    getValidToken.mockReturnValue(null);
    const onAuthFailure = jest.fn();
    const socket = createHeatmapLiveSocket({ onAuthFailure });
    socket.start();

    expect(MockWebSocket.instances).toHaveLength(0);
    expect(onAuthFailure).toHaveBeenCalledTimes(1);
    expect(clearSessionAndRedirectToLogin).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(120000);
    expect(MockWebSocket.instances).toHaveLength(0);
    expect(clearSessionAndRedirectToLogin).toHaveBeenCalledTimes(1);
    expect(socket.isAuthFailureHandled()).toBe(true);
  });

  it("invalid token (server 4401) redirects once and stops reconnect", () => {
    getValidToken.mockReturnValue("invalid.jwt.token");
    const onAuthFailure = jest.fn();
    const socket = createHeatmapLiveSocket({ onAuthFailure });
    socket.start();
    expect(MockWebSocket.instances).toHaveLength(1);

    lastSocket()._emitClose(4401, "Unauthorized");

    expect(onAuthFailure).toHaveBeenCalledTimes(1);
    expect(clearSessionAndRedirectToLogin).toHaveBeenCalledTimes(1);
    expect(socket.hasPendingReconnect()).toBe(false);

    jest.advanceTimersByTime(120000);
    expect(MockWebSocket.instances).toHaveLength(1);
    expect(clearSessionAndRedirectToLogin).toHaveBeenCalledTimes(1);
  });

  it("network disconnect reconnects with backoff", () => {
    getValidToken.mockReturnValue("valid.jwt.token");
    const socket = createHeatmapLiveSocket();
    socket.start();
    expect(MockWebSocket.instances).toHaveLength(1);
    lastSocket().open();

    lastSocket()._emitClose(1006, "");
    expect(socket.hasPendingReconnect()).toBe(true);
    expect(clearSessionAndRedirectToLogin).not.toHaveBeenCalled();

    jest.advanceTimersByTime(2000);
    expect(MockWebSocket.instances).toHaveLength(2);
    lastSocket().open();
    expect(socket.getReconnectAttempt()).toBe(0);
  });

  it("server restart reconnects", () => {
    getValidToken.mockReturnValue("valid.jwt.token");
    const socket = createHeatmapLiveSocket();
    socket.start();
    lastSocket().open();

    lastSocket()._emitClose(1001, "Going Away");
    expect(clearSessionAndRedirectToLogin).not.toHaveBeenCalled();
    expect(socket.isAuthFailureHandled()).toBe(false);

    jest.advanceTimersByTime(2000);
    expect(MockWebSocket.instances).toHaveLength(2);
    lastSocket().open();
    expect(MockWebSocket.instances[1].readyState).toBe(MockWebSocket.OPEN);
  });

  it("does not enter an infinite reconnect loop after auth failure", () => {
    getValidToken.mockReturnValue("stale.jwt.token");
    const socket = createHeatmapLiveSocket();
    socket.start();
    lastSocket()._emitClose(4401, "Unauthorized");

    const before = MockWebSocket.instances.length;
    for (let i = 0; i < 20; i += 1) {
      jest.advanceTimersByTime(30000);
    }
    expect(MockWebSocket.instances.length).toBe(before);
    expect(clearSessionAndRedirectToLogin).toHaveBeenCalledTimes(1);
    expect(socket.hasPendingReconnect()).toBe(false);
  });

  it("buildHeatmapLiveWsUrl keeps ?token= protocol", () => {
    const url = buildHeatmapLiveWsUrl("abc.def.ghi");
    expect(url).toMatch(/^ws:\/\//);
    expect(url).toContain("/ws/heatmap/live?token=");
    expect(url).toContain(encodeURIComponent("abc.def.ghi"));
  });
});
