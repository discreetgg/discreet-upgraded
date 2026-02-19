export type NormalizedMenuPreviewMedia = {
  _id: string;
  url: string;
  type: "image" | "video";
};

export const isVideoMediaUrl = (url: string) => {
  const lower = (url || "").toLowerCase();
  return (
    lower.includes("/video/upload/") ||
    lower.includes(".mp4") ||
    lower.includes(".mov") ||
    lower.includes(".webm") ||
    lower.includes(".m4v")
  );
};

export const normalizeMenuPreviewMedia = (
  entries:
    | Array<{
        _id?: string;
        url?: string;
        type?: string;
        media?: { _id?: string; url?: string; type?: string };
      }>
    | undefined,
): NormalizedMenuPreviewMedia[] => {
  return (Array.isArray(entries) ? entries : [])
    .map((entry: any) => {
      const source = entry?.url ? entry : entry?.media;
      if (!source?.url) return null;
      const url = String(source.url);
      const type =
        source.type === "video" || isVideoMediaUrl(url) ? "video" : "image";
      return {
        _id: String(source._id || entry?._id || url),
        url,
        type,
      } satisfies NormalizedMenuPreviewMedia;
    })
    .filter((entry): entry is NormalizedMenuPreviewMedia => Boolean(entry));
};
