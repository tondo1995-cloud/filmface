import Replicate from "replicate";
import sharp from "sharp";

export const runtime = "nodejs";

// ✅ QUESTA MANCAVA → ERRORE RISOLTO
let LAST_HD_IMAGE: string | null = null;

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
    .composite([{ input: resizedWatermark, blend: "over" }])
    .jpeg({ quality: 95 })
    .toBuffer();
}

export async function POST(req: Request) {
  try {
    const { sourceImageUrl, targetImageUrl } = await req.json();

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN!,
    });

    // 🔥 ROOP
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
    if (!roopImageUrl) throw new Error("ROOP failed");

    // 🔥 FLUX
    const maskUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/masks/wolf-text-mask.png`;

    const prediction = await replicate.predictions.create({
      model: "black-forest-labs/flux-fill-pro",
      input: {
        image: roopImageUrl,
        mask: maskUrl,
        prompt: `
Remove the actor name at the top of the poster.
Do NOT add text.
Keep everything identical.
        `,
        steps: 50,
        guidance: 60,
        output_format: "jpg",
      },
    });

    let result = prediction;

    while (result.status !== "succeeded") {
      if (result.status === "failed") throw new Error("Flux failed");

      await new Promise((r) => setTimeout(r, 1000));
      result = await replicate.predictions.get(result.id);
    }

    const finalImageUrl = extractReplicateUrl(result.output);
    if (!finalImageUrl) throw new Error("Flux output vuoto");

    console.log("FLUX OK:", finalImageUrl);

    // ✅ SALVATAGGIO HD
    LAST_HD_IMAGE = finalImageUrl;

    // 🔥 WATERMARK
    const buffer = await applyWatermark(finalImageUrl);

// ✅ conversione fondamentale
const body = new Uint8Array(buffer);

return new Response(body, {
  headers: {
    "Content-Type": "image/jpeg",
  },
});
  } catch (err: any) {
    console.error("ERROR:", err);
    return Response.json({
      error: err.message || "Errore",
    });
  }
}

// 🔥 DOWNLOAD HD
export function getLastHDImage() {
  return LAST_HD_IMAGE;
}