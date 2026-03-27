import Replicate from "replicate";
import sharp from "sharp";

export const runtime = "nodejs";

// ✅ PARSING ULTRA ROBUSTO
async function getImageUrl(output: any): Promise<string | null> {
  if (!output) return null;

  // 🔹 stringa diretta
  if (typeof output === "string") return output;

  // 🔹 array
  if (Array.isArray(output)) {
    return await getImageUrl(output[0]);
  }

  // 🔹 oggetto con url
  if (output.url) return output.url;

  // 🔹 file/blob/stream → converti a buffer e crea URL temporanea
  if (output instanceof ReadableStream) {
    const reader = output.getReader();
    const chunks = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const buffer = Buffer.concat(chunks);

    // 👉 qui NON puoi creare URL pubblico → fallback errore chiaro
    throw new Error("ROOP ha restituito uno stream, serve hosting intermedio");
  }

  // 🔹 fallback toString
  if (output.toString) {
    const str = output.toString();
    if (str.startsWith("http")) return str;
  }

  console.error("❌ OUTPUT NON GESTITO:", output);
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

// 🚀 MAIN
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sourceImageUrl, targetImageUrl } = body;

    if (
      !sourceImageUrl ||
      !targetImageUrl ||
      !sourceImageUrl.startsWith("http") ||
      !targetImageUrl.startsWith("http")
    ) {
      return Response.json(
        { success: false, error: "URL non validi" },
        { status: 400 }
      );
    }

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN!,
    });

    console.log("SOURCE:", sourceImageUrl);
    console.log("TARGET:", targetImageUrl);

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

    console.log("RAW ROOP OUTPUT:", roopOutput);

    const roopImageUrl = await getImageUrl(roopOutput);

    if (!roopImageUrl) {
      throw new Error("ROOP URL NON TROVATA (formato output non supportato)");
    }

    console.log("✅ ROOP OK:", roopImageUrl);

    // 🔥 WATERMARK
    const previewBuffer = await applyWatermark(roopImageUrl);

    return new Response(new Uint8Array(previewBuffer), {
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