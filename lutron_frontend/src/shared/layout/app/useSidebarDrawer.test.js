import { renderHook, act } from "@testing-library/react";
import { useSidebarDrawer } from "./useSidebarDrawer";

describe("useSidebarDrawer", () => {
  it("manages drawer open state", () => {
    const { result } = renderHook(() => useSidebarDrawer());

    expect(result.current.drawerOpen).toBe(false);
    act(() => result.current.openDrawer());
    expect(result.current.drawerOpen).toBe(true);
    act(() => result.current.closeDrawer());
    expect(result.current.drawerOpen).toBe(false);
  });
});
