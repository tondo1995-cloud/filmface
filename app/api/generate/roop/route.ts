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
    if (typeof output.url === "string") return output.url;
    if (typeof output.href === "string") return output.href;
  }

  return null;
}

// 🔥 TESTO PRECISO (con box reale)
async function applyText(buffer: Buffer, name: string): Promise<Buffer> {
  const image = sharp(buffer);
  const metadata = await image.metadata();

  const width = metadata.width!;
  const height = metadata.height!;

  const fontPath = path.join(
    process.cwd(),
    "public/fonts/Special_Gothic_Condensed/SpecialGothicCondensedOne-Regular.ttf"
  );

  // 🔥 BOX REALE (coerente con poster)
  const boxWidth = width * 0.7;
  const boxHeight = height * 0.08;
  const boxX = width * 0.15;
  const boxY = height * 0.08;

  const fontSize = boxHeight * 0.65;

  const safeName = name.toUpperCase().replace(/&/g, "&amp;");

  const svg = `
  <svg width="${width}" height="${height}">
    <style>
      @font-face {
        font-family: 'PosterFont';
        src: url('file://${fontPath}');
      }

      .text {
        fill: #000000;
        font-size: ${fontSize}px;
        font-family: 'PosterFont';
        letter-spacing: 3px;
      }
    </style>

    <rect 
      x="${boxX}" 
      y="${boxY}" 
      width="${boxWidth}" 
      height="${boxHeight}" 
      fill="#f5a623"
    />

    <text 
      x="50%" 
      y="${boxY + boxHeight / 2}" 
      text-anchor="middle" 
      dominant-baseline="middle"
      class="text"
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

// 🔥 WATERMARK
async function applyWatermark(buffer: Buffer): Promise<Buffer> {
  const watermarkRes = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/watermarks/watermark1.png`
  );

  if (!watermarkRes.ok) throw new Error("Errore watermark");

  const watermarkBuffer = Buffer.from(await watermarkRes.arrayBuffer());

  const image = sharp(buffer);
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

    if (!sourceImageUrl || !targetImageUrl || !name) {
      throw new Error("Missing data");
    }

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN!,
    });

    // 🔥 FACE SWAP
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

    // 🔥 scarica immagine
    const imgRes = await fetch(roopImageUrl);
    if (!imgRes.ok) throw new Error("Errore download roop");

    const baseBuffer = Buffer.from(await imgRes.arrayBuffer());

    // 🔥 aggiungi testo
    const withTextBuffer = await applyText(baseBuffer, name);

    // 🔥 watermark preview
    const previewBuffer = await applyWatermark(withTextBuffer);

    const body = new Uint8Array(previewBuffer);

    // 🔥 HD = CON TESTO (no watermark)
    const hdBase64 = Buffer.from(withTextBuffer).toString("base64");

    return new Response(body, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "no-store",
        "x-hd-image": hdBase64,
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