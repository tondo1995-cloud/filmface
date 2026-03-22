import Replicate from "replicate";
import sharp from "sharp";

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
    if (typeof output.url === "string" && output.url.startsWith("http")) {
      return output.url;
    }

    if (typeof output.href === "string" && output.href.startsWith("http")) {
      return output.href;
    }

    if (typeof output.toString === "function") {
      const maybe = output.toString();
      if (typeof maybe === "string" && maybe.startsWith("http")) {
        return maybe;
      }
    }
  }

  return null;
}

// 🔥 WATERMARK SU BUFFER
async function applyWatermarkBuffer(imageBuffer: Buffer): Promise<Buffer> {
  const watermarkRes = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/watermarks/watermark1.png`
  );

  if (!watermarkRes.ok) {
    throw new Error("Errore watermark");
  }

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
    .composite([
      {
        input: resizedWatermark,
        gravity: "center",
        blend: "over",
      },
    ])
    .jpeg({ quality: 95 })
    .toBuffer();
}

// 🔥 MAIN
export async function POST(req: Request) {
  try {
    const { sourceImageUrl, targetImageUrl, name } = await req.json();

    if (!sourceImageUrl || !targetImageUrl) {
      throw new Error("Missing images");
    }

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN!,
    });

    // 🔥 STEP 1 — FACE SWAP
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

    // 🔥 STEP 2 — FLUX
    const maskUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/masks/wolf-text-mask.png`;

    const finalPrompt =
      name && String(name).trim()
        ? `
Replace the actor name at the top of the poster with:
"${String(name).trim()}"

STRICT RULES:
- Replace only the top actor name area
- Keep the exact same layout and position
- Keep the same font style, weight and spacing as closely as possible
- Keep the same color and cinematic poster look
- Do not modify anything else in the image
`
        : `
Remove the actor name at the top of the poster.

STRICT RULES:
- Completely erase the text
- Rebuild background naturally
- Keep lighting and grain identical
- Do NOT add any text
- Do NOT modify anything else
`;

    const prediction = await replicate.predictions.create({
      model: "black-forest-labs/flux-fill-pro",
      input: {
        image: roopImageUrl,
        mask: maskUrl,
        prompt: finalPrompt,
        steps: 50,
        guidance: 60,
        safety_tolerance: 2,
        prompt_upsampling: false,
        output_format: "jpg",
        outpaint: "None",
      },
    });

    let result = prediction;

    while (result.status !== "succeeded") {
      if (result.status === "failed" || result.status === "canceled") {
        console.error("FLUX FAILED:", result);
        throw new Error("Flux failed");
      }

      await new Promise((r) => setTimeout(r, 1000));
      result = await replicate.predictions.get(result.id);
    }

    const finalImageUrl = extractReplicateUrl(result.output);

    if (!finalImageUrl) {
      throw new Error("Flux output vuoto");
    }

    console.log("FLUX OK:", finalImageUrl);

    // 🔥 STEP 3 — scarica HD con testo
    const finalImageRes = await fetch(finalImageUrl);
    if (!finalImageRes.ok) {
      throw new Error("Errore download immagine finale");
    }

    const finalImageBuffer = Buffer.from(await finalImageRes.arrayBuffer());

    // 🔥 STEP 4 — watermark preview
    const previewBuffer = await applyWatermarkBuffer(finalImageBuffer);

    const previewBody = new Uint8Array(previewBuffer);

    // 🔥 HD = CON testo, SENZA watermark
    const hdBase64 = finalImageBuffer.toString("base64");

    return new Response(previewBody, {
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