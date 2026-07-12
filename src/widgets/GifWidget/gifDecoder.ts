import { parseGIF, decompressFrames } from "gifuct-js";

// Native <img src=".gif"> gak bisa di-pause/resume dari JS — browser cuma
// kasih play terus-terusan begitu decode. Makanya GIF di-decode manual jadi
// frame-frame lepas (via gifuct-js), lalu digambar satu-satu ke <canvas>
// lewat loop kita sendiri yang bisa distop/dilanjut kapan pun tanpa reset
// posisi frame.
export interface DecodedGifFrame {
  imageData: ImageData;
  delay: number; // ms, sudah dinormalisasi (gif yang nulis delay 0 dianggap ~100ms sesuai perilaku umum browser)
  dims: { left: number; top: number; width: number; height: number };
  disposalType: number;
}

export interface DecodedGif {
  width: number;
  height: number;
  frames: DecodedGifFrame[];
}

export async function decodeGifFromUrl(url: string): Promise<DecodedGif> {
  const res = await fetch(url);
  const buffer = await res.arrayBuffer();
  const gif = parseGIF(buffer);
  // buildImagePatches=true -> tiap frame.patch sudah jadi Uint8ClampedArray
  // RGBA seukuran frame.dims (bukan seukuran kanvas penuh)
  const rawFrames = decompressFrames(gif, true);

  return {
    width: gif.lsd.width,
    height: gif.lsd.height,
    frames: rawFrames.map((f) => ({
      imageData: new ImageData(
        new Uint8ClampedArray(f.patch),
        f.dims.width,
        f.dims.height,
      ),
      delay: f.delay > 0 ? f.delay : 100,
      dims: f.dims,
      disposalType: f.disposalType,
    })),
  };
}