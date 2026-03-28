import Replicate from "replicate";
import sharp from "sharp";

export const runtime = "nodejs";

// ✅ WATERMARK (lavora su buffer diretto)
async function applyWatermarkFromBuffer(imageBuffer: Buffer): Promise<Buffer> {
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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { sourceImageUrl, targetImageUrl } = body;

    const base = process.env.NEXT_PUBLIC_BASE_URL!;

    // 🔥 FORZA URL PUBBLICHE
    if (!sourceImageUrl.startsWith("http")) {
      sourceImageUrl = `${base}${sourceImageUrl}`;
    }

    if (!targetImageUrl.startsWith("http")) {
      targetImageUrl = `${base}${targetImageUrl}`;
    }

    console.log("FINAL SOURCE:", sourceImageUrl);
    console.log("FINAL TARGET:", targetImageUrl);

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

    console.log("RAW OUTPUT:", roopOutput);

    let imageBuffer: Buffer;

    // 🔥 CASO 1: URL
    if (typeof roopOutput === "string") {
      const res = await fetch(roopOutput);
      imageBuffer = Buffer.from(await res.arrayBuffer());
    }

    // 🔥 CASO 2: ARRAY con URL
    else if (Array.isArray(roopOutput) && typeof roopOutput[0] === "string") {
      const res = await fetch(roopOutput[0]);
      imageBuffer = Buffer.from(await res.arrayBuffer());
    }

    // 🔥 CASO 3: STREAM (quello che ti sta fregando)
    else if (roopOutput instanceof ReadableStream) {
      const reader = roopOutput.getReader();
      const chunks = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }

      imageBuffer = Buffer.concat(chunks);
    }

    // 🔥 CASO FALLBACK
    else {
      console.error("❌ OUTPUT NON SUPPORTATO:", roopOutput);
      throw new Error("Formato output ROOP non gestito");
    }

    // 🔥 WATERMARK
    const previewBuffer = await applyWatermarkFromBuffer(imageBuffer);

    return new Response(new Uint8Array(previewBuffer), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "no-store",
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