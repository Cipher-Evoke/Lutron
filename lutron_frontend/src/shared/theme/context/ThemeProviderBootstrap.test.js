import React from "react";
import { renderHook, act, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { useThemeProviderBootstrap } from "./ThemeProviderBootstrap";
import { useThemeReload } from "./useThemeReload";
import { rawBackgroundResolvers } from "./backgroundResolvers";

function createThemeSliceReducer() {
  return (
    state = {
      settings: null,
      loading: false,
      error: null,
    },
    action
  ) => {
    switch (action.type) {
      case "theme/setSettings":
        return { ...state, settings: action.payload, loading: false };
      default:
        return state;
    }
  };
}

function createWrapper(store) {
  return function Wrapper({ children }) {
    return <Provider store={store}>{children}</Provider>;
  };
}

describe("useThemeReload", () => {
  test("updates theme and background via injected resolvers", () => {
    const applyCssVariables = jest.fn();
    const createAppTheme = jest.fn((ui, bg) => ({ palette: { ui, bg } }));
    const setTheme = jest.fn();
    const setBackgroundImage = jest.fn();

    const { result, rerender } = renderHook(
      (backgroundImage) =>
        useThemeReload({
          backgroundImage,
          setBackgroundImage,
          setTheme,
          applyCssVariables,
          createAppTheme,
          resolveReloadBackgroundImage: rawBackgroundResolvers.onReload,
        }),
      { initialProps: "" }
    );

    act(() => {
      result.current({ background: "#aaa" }, "/new-bg.png");
    });

    expect(applyCssVariables).toHaveBeenCalledWith(
      { background: "#aaa" },
      "/new-bg.png"
    );
    expect(createAppTheme).toHaveBeenCalledWith(
      { background: "#aaa" },
      "/new-bg.png"
    );
    expect(setBackgroundImage).toHaveBeenCalledWith("/new-bg.png");
    expect(setTheme).toHaveBeenCalledWith({
      palette: { ui: { background: "#aaa" }, bg: "/new-bg.png" },
    });

    rerender("/new-bg.png");
    applyCssVariables.mockClear();

    act(() => {
      result.current({ background: "#bbb" });
    });

    expect(applyCssVariables).toHaveBeenCalledWith(
      { background: "#bbb" },
      "/new-bg.png"
    );
  });
});

describe("useThemeProviderBootstrap", () => {
  test("fetches theme settings and applies theme on load", async () => {
    const fetchThemeSettings = jest.fn(() => ({
      type: "theme/fetchSettings/pending",
    }));
    const applyCssVariables = jest.fn();
    const createAppTheme = jest.fn((ui, bg) => ({
      palette: { main: ui.background || "default", bg },
    }));

    const store = configureStore({
      reducer: { theme: createThemeSliceReducer() },
    });

    const { result } = renderHook(
      () =>
        useThemeProviderBootstrap({
          createAppTheme,
          applyCssVariables,
          fetchThemeSettings,
          selectThemeSettings: (state) => state.theme.settings,
          selectThemeLoading: (state) => state.theme.loading,
          selectThemeError: (state) => state.theme.error,
          initialBackgroundImage: "",
          mountCssBackground: "",
          resolveApiBackgroundImage: rawBackgroundResolvers.fromApi,
          resolveReloadBackgroundImage: rawBackgroundResolvers.onReload,
        }),
      { wrapper: createWrapper(store) }
    );

    expect(applyCssVariables).toHaveBeenCalledWith({}, "");
    expect(fetchThemeSettings).toHaveBeenCalled();

    act(() => {
      store.dispatch({
        type: "theme/setSettings",
        payload: {
          ui_theme_colors: {
            background: "#111111",
            content: "#222222",
            button: "#333333",
          },
          background_image: "/uploads/bg.png",
        },
      });
    });

    await waitFor(() => {
      expect(result.current.backgroundImage).toBe("/uploads/bg.png");
    });

    expect(applyCssVariables).toHaveBeenCalledWith(
      {
        background: "#111111",
        content: "#222222",
        button: "#333333",
      },
      "/uploads/bg.png"
    );
    expect(result.current.theme.palette.main).toBe("#111111");
  });

  test("optional applicationTheme sync calls applyCssVariables", async () => {
    const applyCssVariables = jest.fn();
    const createAppTheme = jest.fn(() => ({ palette: {} }));
    const fetchThemeSettings = jest.fn(() => ({
      type: "theme/fetchSettings/pending",
    }));
    const pickThemeBackgroundImage = jest.fn(() => "/explicit.png");

    const store = configureStore({
      reducer: {
        theme: (
          state = {
            settings: {
              ui_theme_colors: {},
              background_image: "",
            },
            loading: false,
            error: null,
          }
        ) => state,
        appTheme: (
          state = {
            application_theme: {
              background: "#aaaaaa",
              content: "#bbbbbb",
              button: "#cccccc",
            },
          }
        ) => state,
      },
    });

    renderHook(
      () =>
        useThemeProviderBootstrap({
          createAppTheme,
          applyCssVariables,
          fetchThemeSettings,
          selectThemeSettings: (state) => state.theme.settings,
          selectThemeLoading: (state) => state.theme.loading,
          selectThemeError: (state) => state.theme.error,
          initialBackgroundImage: "/assets/defaultBg.png",
          mountCssBackground: "/assets/defaultBg.png",
          resolveApiBackgroundImage: rawBackgroundResolvers.fromApi,
          resolveReloadBackgroundImage: rawBackgroundResolvers.onReload,
          applicationTheme: store.getState().appTheme,
          pickThemeBackgroundImage,
        }),
      { wrapper: createWrapper(store) }
    );

    await waitFor(() => {
      expect(
        applyCssVariables.mock.calls.some(
          ([ui]) => ui.background === "#aaaaaa" && ui.content === "#bbbbbb"
        )
      ).toBe(true);
    });
  });

  test("preferApplicationThemeCss skips settings CSS when application theme is loaded", async () => {
    const applyCssVariables = jest.fn();
    const createAppTheme = jest.fn((ui) => ({
      palette: { main: ui.background || "default" },
    }));
    const fetchThemeSettings = jest.fn(() => ({
      type: "theme/fetchSettings/pending",
    }));
    const pickThemeBackgroundImage = jest.fn(() => undefined);

    const store = configureStore({
      reducer: {
        theme: (
          state = {
            settings: {
              ui_theme_colors: {
                background: "#111111",
                content: "#222222",
                button: "#333333",
              },
              background_image: "",
            },
            loading: false,
            error: null,
          }
        ) => state,
      },
    });

    const applicationTheme = {
      application_theme: {
        background: "#aaaaaa",
        content: "#bbbbbb",
        button: "#cccccc",
      },
    };

    const { result } = renderHook(
      () =>
        useThemeProviderBootstrap({
          createAppTheme,
          applyCssVariables,
          fetchThemeSettings,
          selectThemeSettings: (state) => state.theme.settings,
          selectThemeLoading: (state) => state.theme.loading,
          selectThemeError: (state) => state.theme.error,
          initialBackgroundImage: "/assets/defaultBg.png",
          mountCssBackground: "/assets/defaultBg.png",
          resolveApiBackgroundImage: rawBackgroundResolvers.fromApi,
          resolveReloadBackgroundImage: rawBackgroundResolvers.onReload,
          applicationTheme,
          pickThemeBackgroundImage,
          preferApplicationThemeCss: true,
        }),
      { wrapper: createWrapper(store) }
    );

    await waitFor(() => {
      expect(
        applyCssVariables.mock.calls.some(
          ([ui]) => ui.background === "#aaaaaa" && ui.content === "#bbbbbb"
        )
      ).toBe(true);
    });

    expect(
      applyCssVariables.mock.calls.some(([ui]) => ui.background === "#111111")
    ).toBe(false);
    expect(result.current.theme.palette.main).toBe("#aaaaaa");
  });
});
