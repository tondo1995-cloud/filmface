import Replicate from "replicate";
import sharp from "sharp";

export const runtime = "nodejs";

// 🔥 NORMALIZZA URL
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

// 🔥 OUTPUT → BUFFER
async function getBuffer(output: any): Promise<Buffer> {
  if (!output) throw new Error("Output vuoto");

  if (Array.isArray(output)) return getBuffer(output[0]);

  if (typeof output === "string" && output.startsWith("http")) {
    const res = await fetch(output);
    return Buffer.from(await res.arrayBuffer());
  }

  if (output?.url && typeof output.url === "function") {
    const res = await fetch(output.url().toString());
    return Buffer.from(await res.arrayBuffer());
  }

  if (output?.url && typeof output.url === "string") {
    const res = await fetch(output.url);
    return Buffer.from(await res.arrayBuffer());
  }

  console.error("❌ OUTPUT NON GESTITO:", output);
  throw new Error("Formato output ROOP non gestito");
}

// 🔥 RIDIMENSIONA PER ROOP (CRITICO)
async function resizeForRoop(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize({
      width: 1024,
      height: 1024,
      fit: "inside",
    })
    .jpeg({ quality: 90 })
    .toBuffer();
}

// 🔥 WATERMARK
async function applyWatermark(buffer: Buffer): Promise<Buffer> {
  const watermarkRes = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/watermarks/watermark1.png`
  );

  const watermarkBuffer = Buffer.from(await watermarkRes.arrayBuffer());

  const image = sharp(buffer);
  const metadata = await image.metadata();

  const resizedWatermark = await sharp(watermarkBuffer)
    .resize(metadata.width, metadata.height)
    .png()
    .toBuffer();

  return image
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        file: `data:image/jpeg;base64,${base64}`,
        upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
        folder: "filmface/generated",
      }),
    }
  );

  const data = await res.json();

  if (!data.secure_url) {
    console.error("❌ CLOUDINARY ERROR:", data);
    throw new Error("Upload fallito");
  }

  return data.secure_url;
}

// 🚀 MAIN
export async function POST(req: Request) {
  try {
    let { sourceImageUrl, targetImageUrl } = await req.json();

    sourceImageUrl = toPublicUrl(sourceImageUrl);
    targetImageUrl = toPublicUrl(targetImageUrl);

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN!,
    });

    // 🔥 1. scarico target HD
    const targetRes = await fetch(targetImageUrl);
    const targetBuffer = Buffer.from(await targetRes.arrayBuffer());

    // 🔥 2. ridimensiono SOLO per ROOP
    const resizedTarget = await resizeForRoop(targetBuffer);

    // 🔥 3. carico versione ridotta (NO base64 diretto a ROOP)
    const resizedTargetUrl = await uploadToCloudinary(resizedTarget);

    console.log("🔥 TARGET RESIZED:", resizedTargetUrl);

    // 🔥 4. ROOP
    const output = await replicate.run(
      "okaris/roop:8c1e100ecabb3151cf1e6c62879b6de7a4b84602de464ed249b6cff0b86211d8",
      {
        input: {
          source: sourceImageUrl,
          target: resizedTargetUrl,

          keep_fps: true,
          keep_frames: true,
          enhance_face: true,
        },
      }
    );

    if (!output) throw new Error("Output vuoto");

    // 🔥 5. output finale
    const buffer = await getBuffer(output);
    const previewBuffer = await applyWatermark(buffer);

    const previewUrl = await uploadToCloudinary(previewBuffer);
    const hdUrl = await uploadToCloudinary(buffer);

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