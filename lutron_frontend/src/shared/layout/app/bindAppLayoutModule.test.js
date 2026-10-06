import {
  bindAppLayoutModule,
  getAppLayoutBindings,
  resetAppLayoutBindingsForTests,
} from "./bindAppLayoutModule";

describe("bindAppLayoutModule", () => {
  afterEach(() => resetAppLayoutBindingsForTests());

  it("requires binding before access", () => {
    expect(() => getAppLayoutBindings()).toThrow(/bindAppLayoutModule/);
    bindAppLayoutModule({ themeSlice: {}, components: {} });
    expect(getAppLayoutBindings().themeSlice).toBeDefined();
  });
});
