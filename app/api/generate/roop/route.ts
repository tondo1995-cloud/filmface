import Replicate from "replicate";
import sharp from "sharp";

export const runtime = "nodejs";

// 🔥 NORMALIZZA URL (CRITICO)
function toPublicUrl(url: string) {
  if (!url) return "";

  if (!url.startsWith("http")) {
    return `${process.env.NEXT_PUBLIC_BASE_URL}${url}`;
  }

  if (url.startsWith("http://")) {
    return url.replace("http://", "https://");
  }

  return url;
}

// 🔥 OUTPUT → BUFFER (ROBUSTO)
async function getBuffer(output: any): Promise<Buffer> {
  if (!output) throw new Error("Output vuoto");

  // 👉 array
  if (Array.isArray(output)) {
    return getBuffer(output[0]);
  }

  // 👉 string URL (caso vecchio)
  if (typeof output === "string" && output.startsWith("http")) {
    const res = await fetch(output);
    return Buffer.from(await res.arrayBuffer());
  }

  // 👉 oggetto replicato moderno (FileOutput)
  if (output?.url && typeof output.url === "function") {
    const realUrl = output.url().toString();

    const res = await fetch(realUrl);
    return Buffer.from(await res.arrayBuffer());
  }

  // 👉 oggetto con url string
  if (output?.url && typeof output.url === "string") {
    const res = await fetch(output.url);
    return Buffer.from(await res.arrayBuffer());
  }

  // 👉 stream
  if (output instanceof ReadableStream) {
    const reader = output.getReader();
    const chunks: Uint8Array[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    return Buffer.concat(chunks);
  }

  console.error("❌ OUTPUT NON GESTITO:", output);
  throw new Error("Formato output ROOP non gestito");
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

// 🔥 UPLOAD CLOUDINARY
async function uploadToCloudinary(buffer: Buffer): Promise<string> {
  const base64 = buffer.toString("base64");

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        file: `data:image/jpeg;base64,${base64}`,
        upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,

        // 🔥 AGGIUNGI QUESTO
        public_id: `generated_${Date.now()}`, 
      }),
    }
  );

  const data = await res.json();

  if (!data.secure_url) {
    console.error("❌ CLOUDINARY ERROR:", data);
    throw new Error("Upload Cloudinary fallito");
  }

  return data.secure_url;
}

// 🚀 MAIN
export async function POST(req: Request) {
  try {
    let { sourceImageUrl, targetImageUrl } = await req.json();

    // 🔥 NORMALIZZA URL (QUI STA LA MAGIA)
    sourceImageUrl = toPublicUrl(sourceImageUrl);
    targetImageUrl = toPublicUrl(targetImageUrl);

    console.log("🔥 SOURCE:", sourceImageUrl);
    console.log("🔥 TARGET:", targetImageUrl);

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN!,
    });

    // 🔥 ROOP
    const output = await replicate.run(
      "okaris/roop:8c1e100ecabb3151cf1e6c62879b6de7a4b84602de464ed249b6cff0b86211d8",
      {
        input: {
          source: sourceImageUrl,
          target: targetImageUrl,
        },
      }
    );

    console.log("RAW OUTPUT:", output);

    if (!output) {
      throw new Error("Output vuoto da Replicate");
    }

    // 🔥 BUFFER
    const buffer = await getBuffer(output);

    // 🔥 PREVIEW
    const previewBuffer = await applyWatermark(buffer);

    // 🔥 CLOUDINARY
    const previewUrl = await uploadToCloudinary(previewBuffer);
    const hdUrl = await uploadToCloudinary(buffer);

    console.log("✅ PREVIEW:", previewUrl);
    console.log("✅ HD:", hdUrl);

    return Response.json({
      success: true,
      preview: previewUrl,
      hd: hdUrl,
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