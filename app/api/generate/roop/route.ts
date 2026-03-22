import Replicate from "replicate";
import sharp from "sharp";

// 🔥 ESTRAZIONE URL DA REPLICATE
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
    if (typeof output.url === "function") {
      const maybe = output.url();
      if (typeof maybe === "string" && maybe.startsWith("http")) {
        return maybe;
      }
    }

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

// 🔥 WATERMARK FUNCTION
async function applyWatermark(imageUrl: string) {
  // scarica immagine finale
  const imageRes = await fetch(imageUrl);
  const imageBuffer = Buffer.from(await imageRes.arrayBuffer());

  // scarica watermark PNG
  const watermarkRes = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/watermarks/watermark1.png`
  );
  const watermarkBuffer = Buffer.from(await watermarkRes.arrayBuffer());

  const image = sharp(imageBuffer);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("Impossibile leggere dimensioni immagine");
  }

  // ridimensiona watermark alla stessa dimensione
  const resizedWatermark = await sharp(watermarkBuffer)
    .resize(metadata.width, metadata.height)
    .png()
    .toBuffer();

  // composizione
  const final = await image
    .composite([
      {
        input: resizedWatermark,
        gravity: "center",
        blend: "over",
      },
    ])
    .jpeg({ quality: 95 })
    .toBuffer();

  return final;
}

export async function POST(req: Request) {
  try {
    const { sourceImageUrl, targetImageUrl } = await req.json();

    if (!sourceImageUrl || !targetImageUrl) {
      throw new Error("Missing images");
    }

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN!,
    });

    // 🔥 STEP 1 — ROOP
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

    // 🔥 STEP 2 — FLUX (RIMOZIONE TESTO)
    const maskUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/masks/wolf-text-mask.png`;

    const prediction = await replicate.predictions.create({
      model: "black-forest-labs/flux-fill-pro",
      input: {
        image: roopImageUrl,
        mask: maskUrl,
        prompt: `
Remove the actor name at the top of the poster.

STRICT RULES:
- Completely erase the text
- Rebuild background naturally
- Keep lighting and grain identical
- Do NOT add any text

Do NOT modify anything else.
        `,
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

    // 🔥 STEP 3 — WATERMARK
    const watermarkedBuffer = await applyWatermark(finalImageUrl);

    // 🔥 RETURN FILE (NON URL)
    return new Response(watermarkedBuffer, {
      headers: {
        "Content-Type": "image/jpeg",
      },
    });

  } catch (error: any) {
    console.error("🔥 ERROR:", error);

    return Response.json({
      success: false,
      error: error?.message || "Errore generazione",
    });
  }
}