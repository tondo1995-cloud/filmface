import Replicate from "replicate";
import sharp from "sharp";

export const runtime = "nodejs";

// 🔥 ESTRAZIONE URL ROBUSTA
function extractReplicateUrl(output: any): string | null {
  if (!output) return null;

  // string
  if (typeof output === "string" && output.startsWith("http")) {
    return output;
  }

  // array
  if (Array.isArray(output)) {
    for (const item of output) {
      if (typeof item === "string" && item.startsWith("http")) {
        return item;
      }
      if (item?.url) return item.url;
      if (item?.image) return item.image;
    }
  }

  // object
  if (typeof output === "object") {
    if (output.url) return output.url;
    if (output.image) return output.image;
  }

  return null;
}

// 🔥 WATERMARK
async function applyWatermark(imageUrl: string): Promise<Buffer> {
  const imageRes = await fetch(imageUrl);
  if (!imageRes.ok) throw new Error("Errore download immagine");

  const imageBuffer = Buffer.from(await imageRes.arrayBuffer());

  const watermarkRes = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/watermarks/watermark1.png`
  );
  if (!watermarkRes.ok) throw new Error("Errore watermark");

  const watermarkBuffer = Buffer.from(await watermarkRes.arrayBuffer());

  const image = sharp(imageBuffer);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("Dimensioni immagine non valide");
  }

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
    const { sourceImageUrl, targetImageUrl } = await req.json();

    if (!sourceImageUrl || !targetImageUrl) {
      throw new Error("Missing images");
    }

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN!,
    });

    // 🔥 STEP 1 — FACE SWAP (SOLO QUESTO)
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
      console.error("ROOP OUTPUT:", roopOutput);
      throw new Error("ROOP output non valido");
    }

    console.log("ROOP OK:", roopImageUrl);

    // 🔥 STEP 2 — WATERMARK (preview)
    const previewBuffer = await applyWatermark(roopImageUrl);

    const body = new Uint8Array(previewBuffer);

    // 🔥 RESPONSE
    return new Response(body, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "no-store",
        "x-hd-url": roopImageUrl, // ✅ HD = immagine originale senza watermark
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