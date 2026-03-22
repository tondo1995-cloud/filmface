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

    if (typeof output.url === "string") return output.url;
    if (typeof output.href === "string") return output.href;

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
    const { sourceImageUrl, targetImageUrl } = await req.json();

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

    // 🔥 STEP 2 — FLUX (SOLO RIMOZIONE TESTO)
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
      if (result.status === "failed") {
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

    return Response.json({
      success: true,
      image: finalImageUrl,
    });
  } catch (error: any) {
    console.error("🔥 ERROR:", error);

    return Response.json({
      success: false,
      error: error.message,
    });
  }
}