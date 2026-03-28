import Replicate from "replicate";
import sharp from "sharp";

export const runtime = "nodejs";

// 🔥 CONVERTE QUALSIASI OUTPUT IN BUFFER
async function getBuffer(output: any): Promise<Buffer> {
  if (!output) throw new Error("Output vuoto");

  // 👉 URL stringa
  if (typeof output === "string") {
    const res = await fetch(output);
    return Buffer.from(await res.arrayBuffer());
  }

  // 👉 array
  if (Array.isArray(output)) {
    return getBuffer(output[0]);
  }

  // 👉 oggetto con url
  if (output?.url) {
    const res = await fetch(output.url);
    return Buffer.from(await res.arrayBuffer());
  }

  // 👉 stream (caso roop recente)
  if (output instanceof ReadableStream) {
    const reader = output.getReader();
    const chunks = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    return Buffer.concat(chunks);
  }

  console.error("❌ OUTPUT NON SUPPORTATO:", output);
  throw new Error("Formato output ROOP non gestito");
}

// 🔥 WATERMARK SU BUFFER
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

// 🔥 UPLOAD CLOUDINARY (SERVER)
async function uploadToCloudinary(buffer: Buffer): Promise<string> {
  const formData = new FormData();

  formData.append(
    "file",
    new Blob([new Uint8Array(buffer)], { type: "image/jpeg" })
  );

  formData.append(
    "upload_preset",
    process.env.CLOUDINARY_UPLOAD_PRESET!
  );

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
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

    const base = process.env.NEXT_PUBLIC_BASE_URL!;

    // 👉 normalizza URL
    if (!sourceImageUrl.startsWith("http")) {
      sourceImageUrl = `${base}${sourceImageUrl}`;
    }

    if (!targetImageUrl.startsWith("http")) {
      targetImageUrl = `${base}${targetImageUrl}`;
    }

    console.log("SOURCE:", sourceImageUrl);
    console.log("TARGET:", targetImageUrl);

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

    // 🔥 SEMPRE BUFFER
    const buffer = await getBuffer(output);

    // 🔥 PREVIEW (con watermark)
    const previewBuffer = await applyWatermark(buffer);

    // 🔥 UPLOAD CLOUDINARY
    const previewUrl = await uploadToCloudinary(previewBuffer);
    const hdUrl = await uploadToCloudinary(buffer);

    console.log("✅ PREVIEW:", previewUrl);
    console.log("✅ HD:", hdUrl);

    // 🔥 OUTPUT STANDARD
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