import Replicate from "replicate";

export async function POST(req: Request) {
  try {
    const { sourceImageUrl, targetImageUrl, name } = await req.json();

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN!,
    });

    // 🔥 STEP 1 — FACE SWAP (ROOP)
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

    let roopImageUrl: string | null = null;

    // 🔥 FIX TYPE + PARSING COMPLETO
    const output: any = roopOutput;

    if (typeof output === "string") {
      roopImageUrl = output;
    } else if (Array.isArray(output)) {
      const first = output[0];

      if (typeof first === "string") {
        roopImageUrl = first;
      } else if (first && typeof first === "object" && "url" in first) {
        roopImageUrl = first.url;
      }
    } else if (output && typeof output === "object" && "url" in output) {
      roopImageUrl = output.url;
    }

    if (!roopImageUrl || typeof roopImageUrl !== "string") {
      throw new Error("ROOP output non valido");
    }

    console.log("ROOP URL:", roopImageUrl);

    // 🔥 STEP 2 — FLUX TEXT REPLACE
    const maskUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/masks/wolf-text-mask.png`;

    const prediction = await replicate.predictions.create({
      model: "black-forest-labs/flux-fill-pro",
      input: {
        image: String(roopImageUrl), // ⚠️ IMPORTANTISSIMO: stringa pura
        mask: maskUrl,

        prompt: `Replace the text "LEONARDO DICAPRIO" with "${name}".
Use EXACT same font, size, color and alignment.
Do NOT modify anything else in the image.`,

        steps: 50,
        guidance: 60,
        safety_tolerance: 2,
        output_format: "jpg",
        prompt_upsampling: false,
      },
    });

    let result = prediction;

    // 🔁 WAIT LOOP
    while (result.status !== "succeeded") {
      if (result.status === "failed") {
        console.error("FLUX FAILED:", result);
        throw new Error("Flux failed");
      }

      await new Promise((r) => setTimeout(r, 1000));
      result = await replicate.predictions.get(result.id);
    }

    const finalImageUrl = result.output?.[0];

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
      error: error.message,
    });
  }
}