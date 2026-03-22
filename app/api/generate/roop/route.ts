import Replicate from "replicate";

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

    console.log("ROOP RAW:", roopOutput);

    const roopImageUrl = extractReplicateUrl(roopOutput);

    if (!roopImageUrl) {
      throw new Error("ROOP output non valido");
    }

    console.log("ROOP URL:", roopImageUrl);

    // 👉 se non c’è nome → ritorna subito
    if (!name || !String(name).trim()) {
      return Response.json({
        success: true,
        image: roopImageUrl,
      });
    }

    // 🔥 STEP 2 — FLUX
    const maskUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/masks/wolf-text-mask.png`;

    const safeName = String(name).trim().toUpperCase();

    const prompt = `
Replace ONLY the actor name at the top of the poster with the text: "${safeName}".

STRICT RULES:
- Modify ONLY the top name text.
- Keep EXACT same position and alignment.
- Keep EXACT same bounding box width as original text.
- DO NOT move, scale or shift the text block.

TYPOGRAPHY:
- Use identical font style (bold cinematic sans-serif).
- Match font weight, thickness and proportions exactly.
- Match original color precisely (warm yellow/orange).

WIDTH CONTROL:
- The new text MUST occupy the SAME WIDTH as the original.
- If text is longer → reduce letter spacing (tracking).
- If text is shorter → increase letter spacing.
- Keep font size visually identical.

VISUAL INTEGRATION:
- Preserve lighting, glow, shadows and blending.
- Text must look printed, not generated.

REFERENCE:
The result must visually match the width and style of "LEONARDO DICAPRIO".

IMPORTANT:
- Do NOT modify anything else.
- Do NOT touch background, subject or layout.
`;

    console.log("FLUX INPUT:", {
      image: roopImageUrl,
      mask: maskUrl,
      name: safeName,
    });

    const prediction = await replicate.predictions.create({
      model: "black-forest-labs/flux-fill-pro",
      input: {
        image: roopImageUrl,
        mask: maskUrl,
        prompt: prompt,
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

      await new Promise((resolve) => setTimeout(resolve, 1000));
      result = await replicate.predictions.get(result.id);
    }

    console.log("FLUX OUTPUT:", result.output);

    const finalImageUrl = extractReplicateUrl(result.output);

    if (!finalImageUrl) {
      throw new Error("Flux output vuoto");
    }

    return Response.json({
      success: true,
      image: finalImageUrl,
    });
  } catch (error: any) {
    console.error("🔥 FULL ERROR:", error);

    return Response.json({
      success: false,
      error: error?.message || "Errore generazione",
    });
  }
}