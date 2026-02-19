export const getHighestQualityImageUrl = (url: string) => {
  if (!url || !url.includes("res.cloudinary.com")) {
    return url;
  }

  try {
    const parsedUrl = new URL(url);
    const pathSegments = parsedUrl.pathname.split("/");
    const uploadIndex = pathSegments.findIndex(
      (segment) => segment === "upload",
    );

    if (uploadIndex === -1) {
      return url;
    }

    const versionIndex = pathSegments.findIndex(
      (segment, index) => index > uploadIndex && /^v\d+$/.test(segment),
    );

    // Already original or unsupported pattern.
    if (versionIndex <= uploadIndex + 1) {
      return url;
    }

    const cleanedPathSegments = [
      ...pathSegments.slice(0, uploadIndex + 1),
      ...pathSegments.slice(versionIndex),
    ];

    parsedUrl.pathname = cleanedPathSegments.join("/");
    return parsedUrl.toString();
  } catch {
    return url;
  }
};
