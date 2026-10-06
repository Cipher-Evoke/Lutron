import React, { useRef } from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { createTheme, useTheme } from "@mui/material/styles";
import Button from "@mui/material/Button";
import {
  ThemeMuiProviderShell,
  getPaletteRemountKey,
} from "./ThemeMuiProviderShell";

function ThemeProbe({ testId = "theme-probe" }) {
  const theme = useTheme();
  return (
    <div data-testid={testId}>
      {theme.palette.primary.main}
    </div>
  );
}

function MountCounter() {
  const count = useRef(0);
  count.current += 1;
  return <span data-testid="mount-count">{count.current}</span>;
}

describe("ThemeMuiProviderShell", () => {
  test("provides theme to descendants via a single MUI ThemeProvider", () => {
    const theme = createTheme({
      palette: { primary: { main: "#1565C0" } },
    });

    render(
      <ThemeMuiProviderShell theme={theme}>
        <ThemeProbe />
        <Button>Action</Button>
      </ThemeMuiProviderShell>
    );

    expect(screen.getByTestId("theme-probe")).toHaveTextContent("#1565C0");
    expect(screen.getByRole("button", { name: "Action" })).toBeInTheDocument();
  });

  test("renders CssBaseline global styles", () => {
    const theme = createTheme();
    const styleCountBefore = document.head.querySelectorAll("style").length;

    render(
      <ThemeMuiProviderShell theme={theme}>
        <div>content</div>
      </ThemeMuiProviderShell>
    );

    expect(document.head.querySelectorAll("style").length).toBeGreaterThan(
      styleCountBefore
    );
  });

  test("getPaletteRemountKey serializes palette for remount strategy", () => {
    const theme = createTheme({
      palette: { primary: { main: "#111111" } },
    });

    expect(getPaletteRemountKey(theme)).toContain("#111111");
  });

  test("remountKey forces subtree remount when palette changes", () => {
    const themeA = createTheme({
      palette: { primary: { main: "#111111" } },
    });
    const themeB = createTheme({
      palette: { primary: { main: "#222222" } },
    });

    const { rerender } = render(
      <ThemeMuiProviderShell
        theme={themeA}
        remountKey={getPaletteRemountKey(themeA)}
      >
        <MountCounter />
      </ThemeMuiProviderShell>
    );

    expect(screen.getByTestId("mount-count")).toHaveTextContent("1");

    rerender(
      <ThemeMuiProviderShell
        theme={themeB}
        remountKey={getPaletteRemountKey(themeB)}
      >
        <MountCounter />
      </ThemeMuiProviderShell>
    );

    expect(screen.getByTestId("mount-count")).toHaveTextContent("1");
  });

  test("advanced mode omits remountKey without breaking theme propagation", () => {
    const theme = createTheme({
      palette: { primary: { main: "#6f809d" } },
    });

    render(
      <ThemeMuiProviderShell theme={theme}>
        <ThemeProbe />
      </ThemeMuiProviderShell>
    );

    expect(screen.getByTestId("theme-probe")).toHaveTextContent("#6f809d");
  });
});

describe("App provider architecture", () => {
  test("nested duplicate ThemeProvider is not required for theme propagation", () => {
    const theme = createTheme({
      palette: { primary: { main: "#1565C0" } },
    });

    render(
      <ThemeMuiProviderShell theme={theme} remountKey={getPaletteRemountKey(theme)}>
        <ThemeProbe testId="single-provider-probe" />
      </ThemeMuiProviderShell>
    );

    expect(screen.getByTestId("single-provider-probe")).toHaveTextContent(
      "#1565C0"
    );
  });
});
