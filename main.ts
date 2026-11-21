// news-image-20261121: the day's front page is drawn by draw.py and stored
// in this repo as entry.png; this program only validates it and writes it
// out, so two runs produce byte-identical output.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PNG_MAGIC = "89504e470d0a1a0a";
const MAX_BYTES = 1048576; // 1 MiB

const here = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const target = join(outDir, "entry.png");

const pngPath = join(here, "entry.png");
if (!existsSync(pngPath)) {
  throw new Error("entry.png is missing from the repository checkout");
}
const bytes = readFileSync(pngPath);
if (bytes.length > MAX_BYTES) {
  throw new Error(
    `entry image is ${bytes.length} bytes, over the 1 MiB cap`,
  );
}
if (bytes.subarray(0, 8).toString("hex") !== PNG_MAGIC) {
  throw new Error("entry image is not a PNG file");
}
// Parse the IHDR chunk: length (4 bytes) + type "IHDR" (4 bytes), then
// width and height as big-endian uint32 at offsets 16 and 20.
if (bytes.length < 33 || bytes.subarray(12, 16).toString("ascii") !== "IHDR") {
  throw new Error("entry image has no IHDR chunk");
}
const width = bytes.readUInt32BE(16);
const height = bytes.readUInt32BE(20);
if (width !== 1024 || height !== 1024) {
  throw new Error(
    `entry image is ${width}x${height}, expected 1024x1024`,
  );
}

mkdirSync(outDir, { recursive: true });
if (!existsSync(outDir)) {
  throw new Error(`output directory ${outDir} could not be created`);
}
writeFileSync(target, bytes);
// Verify the copy: the written file must match the source byte for byte.
const written = readFileSync(target);
if (written.length !== bytes.length) {
  throw new Error(
    `copied entry.png is ${written.length} bytes, expected ${bytes.length}`,
  );
}
if (!written.equals(bytes)) {
  throw new Error("copied entry.png differs from the source image");
}
console.log(`wrote ${bytes.length} bytes to ${target}`);
