export const MAX_BYTES = 20 * 1024 * 1024;
const LONG_EDGE = 1080;
const THUMB = 160;

export class PhotoError extends Error {}

function loadImg(src: Blob) {
  return new Promise<HTMLImageElement>((ok, fail) => {
    const url = URL.createObjectURL(src);
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = () => {
      URL.revokeObjectURL(url); // the caller never gets this URL back, so it must clean up here
      fail(new PhotoError("Couldn't read that photo. Try a JPG or PNG."));
    };
    img.src = url;
  });
}

/** decode honouring EXIF orientation; <img> fallback where createImageBitmap can't */
export async function decode(src: Blob): Promise<ImageBitmap | HTMLImageElement> {
  try {
    return await createImageBitmap(src, { imageOrientation: "from-image" });
  } catch {
    return loadImg(src);
  }
}

function draw(img: CanvasImageSource & { width: number; height: number }, long: number) {
  const k = Math.min(1, long / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(img.width * k));
  c.height = Math.max(1, Math.round(img.height * k));
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return c;
}

/** file -> compressed JPEG (max 1080px) + object URL + 160px thumbnail data URL */
export async function processPhoto(file: File) {
  if (!file.type.startsWith("image/")) throw new PhotoError("That's not a photo. Pick an image file.");
  if (file.size > MAX_BYTES) throw new PhotoError("That photo is too big. Pick one under 20 MB.");
  const img = await decode(file);
  if (!img.width || !img.height) throw new PhotoError("Couldn't read that photo. Try a JPG or PNG.");
  const full = draw(img, LONG_EDGE);
  const blob = await new Promise<Blob | null>((ok) => full.toBlob(ok, "image/jpeg", 0.85));
  if (!blob) throw new PhotoError("Couldn't read that photo. Try a JPG or PNG.");
  const thumb = draw(full, THUMB).toDataURL("image/jpeg", 0.7);
  if ("close" in img) img.close();
  else URL.revokeObjectURL(img.src);
  return { blob, url: URL.createObjectURL(blob), thumb };
}
