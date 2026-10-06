import { configureStore } from "@reduxjs/toolkit";
import { createThemeModule } from "../redux/createThemeModule";

function createMockBaseUrl() {
  const handlers = {};
  return {
    get: jest.fn((path, config) => {
      const key = `GET ${path}`;
      if (handlers[key]) return handlers[key](config);
      return Promise.reject(new Error(`Unhandled ${key}`));
    }),
    post: jest.fn((path, data, config) => {
      const key = `POST ${path}`;
      if (handlers[key]) return handlers[key](data, config);
      return Promise.reject(new Error(`Unhandled ${key}`));
    }),
    onGet(path, fn) {
      handlers[`GET ${path}`] = fn;
    },
    onPost(path, fn) {
      handlers[`POST ${path}`] = fn;
    },
  };
}

function buildStore(moduleConfig) {
  const BaseUrl = createMockBaseUrl();
  const getToken = jest.fn(() => "test-token");
  const themeModule = createThemeModule({ BaseUrl, getToken, ...moduleConfig });

  const store = configureStore({
    reducer: { theme: themeModule.reducer },
  });

  return { store, BaseUrl, themeModule, getToken };
}

describe("createThemeModule", () => {
  test("basic initialState seeds applicationTheme defaults", () => {
    const { store } = buildStore({
      initialState: {
        applicationTheme: {
          application_theme: {
            background: "#ffffff",
            content: "#f5f5f5",
            button: "#232323",
          },
        },
      },
    });

    expect(store.getState().theme.applicationTheme.application_theme).toEqual({
      background: "#ffffff",
      content: "#f5f5f5",
      button: "#232323",
    });
  });

  test("fetchThemeSettings stores normalized background_image", async () => {
    const { store, BaseUrl, themeModule } = buildStore({});
    BaseUrl.onGet("/theme/", () =>
      Promise.resolve({
        data: {
          status: "Success",
          background_image: "  ",
          ui_theme_colors: { background: "#fff" },
        },
      })
    );

    await store.dispatch(themeModule.fetchThemeSettings());

    expect(store.getState().theme.settings.background_image).toBe("");
    expect(store.getState().theme.loading).toBe(false);
  });

  test("fetchApplicationTheme updates applicationTheme", async () => {
    const { store, BaseUrl, themeModule, getToken } = buildStore({});
    BaseUrl.onGet("/theme/application", (config) => {
      expect(config.headers.Authorization).toBe("Bearer test-token");
      return Promise.resolve({
        data: {
          application_theme: {
            background: "#111111",
            content: "#222222",
            button: "#333333",
          },
        },
      });
    });

    await store.dispatch(themeModule.fetchApplicationTheme());
    expect(getToken).toHaveBeenCalled();
    expect(store.getState().theme.applicationTheme.application_theme.background).toBe(
      "#111111"
    );
  });

  test("clearBackgroundImage clears nested theme state", async () => {
    const { store, BaseUrl, themeModule } = buildStore({
      initialState: {
        settings: { background_image: "/bg.png" },
        applicationTheme: {
          application_theme: {
            background: "#fff",
            background_image: "/bg.png",
            backgroundImageUrl: "/bg.png",
          },
        },
        backgroundImage: { background_image: "/bg.png" },
      },
    });

    BaseUrl.onPost("/theme/background_image_clear", () =>
      Promise.resolve({ data: { status: "Success" } })
    );

    await store.dispatch(themeModule.clearBackgroundImage());

    const state = store.getState().theme;
    expect(state.backgroundImage.background_image).toBe("");
    expect(state.settings.background_image).toBe("");
    expect(state.applicationTheme.application_theme.background_image).toBe("");
    expect(state.applicationTheme.application_theme.backgroundImageUrl).toBe("");
  });

  test("updateApplicationTheme.fulfilled merges optimistically when enabled", async () => {
    const { store, BaseUrl, themeModule } = buildStore({
      includeUpdateApplicationThemeFulfilled: true,
      initialState: {
        settings: {
          ui_theme_colors: { background: "#aaa", content: "#bbb", button: "#ccc" },
        },
        applicationTheme: {
          application_theme: {
            background: "#aaa",
            content: "#bbb",
            button: "#ccc",
          },
        },
      },
    });

    BaseUrl.onPost("/theme/application", (data) => {
      expect(data).toEqual({ background: "#new-bg", content: "#new-content" });
      return Promise.resolve({
        data: {
          application_theme: {
            background: "#new-bg",
            content: "#new-content",
          },
        },
      });
    });

    await store.dispatch(
      themeModule.updateApplicationTheme({
        background: "#new-bg",
        content: "#new-content",
      })
    );

    const state = store.getState().theme;
    expect(state.applicationTheme.application_theme.background).toBe("#new-bg");
    expect(state.applicationTheme.application_theme.content).toBe("#new-content");
    expect(state.applicationTheme.application_theme.button).toBe("#ccc");
    expect(state.settings.ui_theme_colors.background).toBe("#new-bg");
  });

  test("updateApplicationTheme.fulfilled is not registered by default", async () => {
    const { store, BaseUrl, themeModule } = buildStore({
      initialState: {
        applicationTheme: {
          application_theme: { background: "#aaa", content: "#bbb", button: "#ccc" },
        },
      },
    });

    BaseUrl.onPost("/theme/application", () =>
      Promise.resolve({
        data: {
          application_theme: { background: "#new-bg" },
        },
      })
    );

    await store.dispatch(
      themeModule.updateApplicationTheme({ background: "#new-bg" })
    );

    expect(store.getState().theme.applicationTheme.application_theme.background).toBe(
      "#aaa"
    );
  });
});
