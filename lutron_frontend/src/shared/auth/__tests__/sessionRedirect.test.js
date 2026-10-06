/**
 * @jest-environment jsdom
 */

import { AUTH_REDIRECT_FLAG_KEY } from "../../../utils/authRedirectGuard";
import {
  clearAuthSessionStorage,
  clearSessionAndRedirectToLogin,
} from "../sessionRedirect";

describe("sessionRedirect", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem("lutron", "tok");
    localStorage.setItem("role", "Admin");
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: {
        pathname: "/dashboard",
        href: "http://localhost:3000/dashboard",
        replace: jest.fn(),
      },
    });
  });

  it("clearAuthSessionStorage removes auth keys", () => {
    clearAuthSessionStorage();
    expect(localStorage.getItem("lutron")).toBeNull();
    expect(localStorage.getItem("role")).toBeNull();
  });

  it("redirects once and sets the shared guard flag", () => {
    const first = clearSessionAndRedirectToLogin();
    expect(first).toBe(true);
    expect(sessionStorage.getItem(AUTH_REDIRECT_FLAG_KEY)).toBe("1");
    expect(window.location.replace).toHaveBeenCalledWith("/login");
    expect(localStorage.getItem("lutron")).toBeNull();

    window.location.replace.mockClear();
    const second = clearSessionAndRedirectToLogin();
    expect(second).toBe(true);
    expect(window.location.replace).not.toHaveBeenCalled();
  });
});
