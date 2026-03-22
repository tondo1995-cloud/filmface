import Replicate from "replicate";
import sharp from "sharp";
import path from "path";

export const runtime = "nodejs";

// 🔥 ESTRAZIONE URL
function extractReplicateUrl(output: any): string | null {
  if (!output) return null;

  if (typeof output === "string" && output.startsWith("http")) {
    return output;
  }

  if (Array.isArray(output)) {
    for (const item of output) {
      const found = extractReplicateUrl(item);
      if (found) return found;
    }
    return null;
  }

  if (typeof output === "object") {
    if (typeof output.url === "string" && output.url.startsWith("http")) {
      return output.url;
    }

    if (typeof output.href === "string" && output.href.startsWith("http")) {
      return output.href;
    }

    if (typeof output.toString === "function") {
      const maybe = output.toString();
      if (typeof maybe === "string" && maybe.startsWith("http")) {
        return maybe;
      }
    }
  }

  return null;
}

// 🔥 AGGIUNTA TESTO (CORE)
async function applyText(imageUrl: string, name: string): Promise<Buffer> {
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error("Errore download immagine");

  const buffer = Buffer.from(await res.arrayBuffer());

  const image = sharp(buffer);
  const metadata = await image.metadata();

  const width = metadata.width!;
  const height = metadata.height!;

  const fontPath = path.join(
    process.cwd(),
    "public/fonts/Special_Gothic_Condensed/SpecialGothicCondensedOne-Regular.ttf"
  );

  const top = Math.floor(height * 0.08);
  const fontSize = Math.floor(width * 0.055);

  const safeName = name.toUpperCase().replace(/&/g, "&amp;");

  const svg = `
  <svg width="${width}" height="${height}">
    <style>
      @font-face {
        font-family: 'Gothic';
        src: url('file://${fontPath}');
      }

      .title {
        fill: #000000;
        font-size: ${fontSize}px;
        font-family: 'Gothic';
        letter-spacing: 3px;
      }
    </style>

    <rect 
      x="${width * 0.15}" 
      y="${top - fontSize * 0.8}" 
      width="${width * 0.7}" 
      height="${fontSize * 1.4}" 
      fill="#f5a623"
    />

    <text 
      x="50%" 
      y="${top}" 
      text-anchor="middle" 
      dominant-baseline="middle"
      class="title"
    >
      ${safeName}
    </text>
  </svg>
  `;

  return await image
    .composite([{ input: Buffer.from(svg) }])
    .jpeg({ quality: 95 })
    .toBuffer();
}

// 🔥 WATERMARK (BUFFER VERSION)
async function applyWatermarkBuffer(imageBuffer: Buffer): Promise<Buffer> {
  const watermarkRes = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/watermarks/watermark1.png`
  );

  if (!watermarkRes.ok) throw new Error("Errore watermark");

  const watermarkBuffer = Buffer.from(await watermarkRes.arrayBuffer());

  const image = sharp(imageBuffer);
  const metadata = await image.metadata();

  const resizedWatermark = await sharp(watermarkBuffer)
    .resize(metadata.width, metadata.height)
    .png()
    .toBuffer();

  return await image
    .composite([{ input: resizedWatermark }])
    .jpeg({ quality: 95 })
    .toBuffer();
}

// 🔥 MAIN
export async function POST(req: Request) {
  try {
    const { sourceImageUrl, targetImageUrl, name } = await req.json();

    if (!sourceImageUrl || !targetImageUrl) {
      throw new Error("Missing images");
    }

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN!,
    });

    // 🔥 STEP 1 — FACE SWAP
    const roopOutput = await replicate.run(
      "okaris/roop:8c1e100ecabb3151cf1e6c62879b6de7a4b84602de464ed249b6cff0b86211d8",
      {
        input: {
          source: sourceImageUrl,
          target: targetImageUrl,
        },
      }
    );

    const roopImageUrl = extractReplicateUrl(roopOutput);

    if (!roopImageUrl) {
      throw new Error("ROOP output non valido");
    }

    console.log("ROOP OK:", roopImageUrl);

    // 🔥 STEP 2 — TESTO (NO AI)
    const withTextBuffer = await applyText(roopImageUrl, name);

    // 🔥 STEP 3 — WATERMARK
    const finalBuffer = await applyWatermarkBuffer(withTextBuffer);

    const body = new Uint8Array(finalBuffer);

    return new Response(body, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "no-store",
        "x-hd-url": roopImageUrl, // HD = senza watermark
      },
    });

  } catch (error: any) {
    console.error("🔥 ERROR:", error);

    return Response.json(
      {
        success: false,
        error: error?.message || "Errore generazione",
      },
      { status: 500 }
    );
  }
}