import Replicate from "replicate";
import sharp from "sharp";

export const runtime = "nodejs";

// ✅ FIX DEFINITIVO ESTRAZIONE URL
function extractReplicateUrl(output: any): string | null {
  if (!output) return null;

  // string diretta
  if (typeof output === "string") return output;

  // array (caso più comune)
  if (Array.isArray(output)) {
    const first = output[0];

    if (typeof first === "string") return first;

    if (first?.url && typeof first.url === "string") {
      return first.url;
    }

    if (first?.toString) {
      const str = first.toString();
      if (str.startsWith("http")) return str;
    }
  }

  // oggetto singolo
  if (output?.url && typeof output.url === "string") {
    return output.url;
  }

  if (output?.toString) {
    const str = output.toString();
    if (str.startsWith("http")) return str;
  }

  console.error("❌ OUTPUT NON PARSABILE:", output);
  return null;
}

// ✅ WATERMARK
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

  const resizedWatermark = await sharp(watermarkBuffer)
    .resize(metadata.width, metadata.height)
    .png()
    .toBuffer();

  return await image
    .composite([{ input: resizedWatermark }])
    .jpeg({ quality: 95 })
    .toBuffer();
}

// 🚀 MAIN (SEMPLICE, SOLO FACE SWAP)
export async function POST(req: Request) {
  try {
    const { sourceImageUrl, targetImageUrl } = await req.json();

    if (!sourceImageUrl || !targetImageUrl) {
      throw new Error("Missing images");
    }

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN!,
    });

    // 🔥 DEBUG (FONDAMENTALE)
    console.log("SOURCE:", sourceImageUrl);
    console.log("TARGET:", targetImageUrl);

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

    console.log("RAW ROOP OUTPUT:", roopOutput);

    const roopImageUrl = extractReplicateUrl(roopOutput);

    if (!roopImageUrl) {
      throw new Error("ROOP URL NON TROVATA");
    }

    console.log("✅ ROOP OK:", roopImageUrl);

    // 🔥 PREVIEW (con watermark)
const previewBuffer = await applyWatermark(roopImageUrl);

const body = new Uint8Array(previewBuffer);

return new Response(body, {
  headers: {
    "Content-Type": "image/jpeg",
    "Cache-Control": "no-store",
    "x-hd-url": roopImageUrl,
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