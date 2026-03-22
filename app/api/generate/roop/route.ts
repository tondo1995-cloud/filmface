import Replicate from "replicate";

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

    console.log("🔥 ROOP OUTPUT:", roopOutput);

    let roopImageUrl: string | null = null;

    if (typeof roopOutput === "string") {
      roopImageUrl = roopOutput;
    } else if (Array.isArray(roopOutput)) {
      const first = roopOutput[0];
      if (typeof first === "string") roopImageUrl = first;
      else if (first && typeof first === "object" && "url" in first) {
        roopImageUrl = (first as any).url;
      }
    } else if (roopOutput && typeof roopOutput === "object" && "url" in roopOutput) {
      roopImageUrl = (roopOutput as any).url;
    }

    if (!roopImageUrl) {
      throw new Error("ROOP failed");
    }

    // 👉 se NON c'è nome → ritorna subito
    if (!name || name.trim() === "") {
      return Response.json({
        success: true,
        image: roopImageUrl,
      });
    }

    // 🔥 STEP 2 — FLUX TEXT REPLACEMENT

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
    const maskUrl = `${baseUrl}/masks/wolf-text-mask.png`;

    console.log("🎯 FLUX INPUT:", {
      image: roopImageUrl,
      mask: maskUrl,
      name: name,
    });

    const fluxOutput = await replicate.run(
      "black-forest-labs/flux-fill-pro",
      {
        input: {
          image: roopImageUrl,
          mask: maskUrl,

          prompt: `Replace the top name with "${name}". 
          Use identical font, color, spacing, and alignment.
          Keep cinematic movie poster style. 
          Do not change anything else.`,

          steps: 50,
          guidance: 60,
          safety_tolerance: 2,
          output_format: "jpg",
          prompt_upsampling: false,
        },
      }
    );

    console.log("🔥 FLUX OUTPUT:", fluxOutput);

    let finalImageUrl: string | null = null;

    if (typeof fluxOutput === "string") {
      finalImageUrl = fluxOutput;
    } else if (Array.isArray(fluxOutput)) {
      finalImageUrl = fluxOutput[0];
    }

    if (!finalImageUrl) {
      throw new Error("FLUX failed");
    }

    return Response.json({
      success: true,
      image: finalImageUrl,
    });

  } catch (error: any) {
    console.error("❌ ERROR FULL:", error);
    return Response.json({
      success: false,
      error: error.message,
    });
  }
}