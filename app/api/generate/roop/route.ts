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

    let roopImageUrl: string | null = null;

    if (typeof roopOutput === "string") {
      roopImageUrl = roopOutput;
    } else if (Array.isArray(roopOutput)) {
      roopImageUrl = roopOutput[0];
    }

    if (!roopImageUrl) {
      throw new Error("Errore ROOP");
    }

    // 🔥 STEP 2 — TEXT REPLACEMENT (FLUX)
    const maskUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/masks/wolf-text-mask.png`;

    const prediction = await replicate.predictions.create({
      model: "black-forest-labs/flux-fill-pro",
      input: {
        image: roopImageUrl,
        mask: maskUrl,

        prompt: `Replace the text "LEONARDO DICAPRIO" with "${name}".
Use identical font, color, spacing and cinematic movie poster style.
Do not change anything else.`,

        steps: 50,
        guidance: 60,
        safety_tolerance: 2,
        output_format: "jpg",
        prompt_upsampling: false,
      },
    });

    // 🔁 WAIT RESULT
    let result = prediction;

    while (result.status !== "succeeded") {
      if (result.status === "failed") {
        throw new Error("Flux failed");
      }

      await new Promise((r) => setTimeout(r, 1000));
      result = await replicate.predictions.get(result.id);
    }

    const finalImageUrl = result.output?.[0];

    if (!finalImageUrl) {
      throw new Error("No output from Flux");
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