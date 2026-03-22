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

// 🔥 AGGIUNTA TESTO (BUFFER VERSION - CORRETTA)
async function applyText(imageBuffer: Buffer, name: string): Promise<Buffer> {
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();

  const width = metadata.width!;
  const height = metadata.height!;

  const fontSize = Math.floor(width * 0.055);
  const boxWidth = Math.floor(width * 0.7);
  const boxHeight = Math.floor(fontSize * 1.5);

  const left = Math.floor(width * 0.15);
  const top = Math.floor(height * 0.08);

  const safeName = (name && name.trim() ? name : "NOME COGNOME")
    .toUpperCase()
    .replace(/&/g, "&amp;");

  // 🔥 SVG con viewBox (CRITICO)
  const svg = Buffer.from(`
    <svg width="${boxWidth}" height="${boxHeight}" viewBox="0 0 ${boxWidth} ${boxHeight}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f5a623"/>
      
      <text 
        x="50%" 
        y="50%" 
        dominant-baseline="middle" 
        text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="${fontSize}"
        font-weight="700"
        fill="#111111"
        letter-spacing="2"
      >
        ${safeName}
      </text>
    </svg>
  `);

  return await image
    .composite([
      {
        input: svg,
        top: top,
        left: left,
        blend: "over", // 🔥 IMPORTANTISSIMO
      },
    ])
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