/**
 * Raw background path handling (customized + advanced).
 */
export const rawBackgroundResolvers = {
  fromApi(apiBG) {
    return typeof apiBG === "string" && apiBG.trim() !== "" ? apiBG : "";
  },
  onReload(bgImage, currentBackgroundImage) {
    if (bgImage === undefined) {
      return currentBackgroundImage;
    }
    if (bgImage == null || bgImage === "") {
      return "";
    }
    return bgImage;
  },
};

/**
 * Creates resolvers that normalize paths via the supplied function (basic).
 */
export function createNormalizedBackgroundResolvers(normalizeBackgroundPath) {
  return {
    fromApi(apiBG) {
      const raw = rawBackgroundResolvers.fromApi(apiBG);
      return raw ? normalizeBackgroundPath(raw) : "";
    },
    onReload(bgImage, currentBackgroundImage) {
      if (bgImage === undefined) {
        return currentBackgroundImage;
      }
      if (bgImage == null || bgImage === "") {
        return "";
      }
      return normalizeBackgroundPath(bgImage);
    },
  };
}
