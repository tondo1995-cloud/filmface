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

    // =========================
    // 1. FACE SWAP (ROOP)
    // =========================
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
      else if (first?.url) roopImageUrl = first.url;
    } else if (roopOutput && typeof roopOutput === "object") {
      if ("url" in roopOutput) {
        roopImageUrl = (roopOutput as any).url;
      }
    }

    if (!roopImageUrl) {
      throw new Error("ROOP non ha restituito immagine");
    }

    // =========================
    // 2. SE NON C’È NOME → RETURN
    // =========================
    if (!name || name.trim() === "") {
      return Response.json({
        success: true,
        image: roopImageUrl,
      });
    }

    // =========================
    // 3. TEXT REPLACEMENT (FLUX)
    // =========================
    const fluxOutput = await replicate.run(
      "black-forest-labs/flux-fill-pro",
      {
        input: {
          image: roopImageUrl,

          // ✅ MASK CORRETTA
          mask: "https://filmface.vercel.app/masks/wolf-text-mask.png",

          prompt: `Replace the text in the masked area with "${name}". Keep identical font, size, color and style.`,

          steps: 40,
          guidance: 60,
          safety_tolerance: 2,
          output_format: "jpg"
        },
      }
    );

    console.log("🔥 FLUX OUTPUT:", fluxOutput);

    let finalImageUrl: string | null = null;

    if (typeof fluxOutput === "string") {
      finalImageUrl = fluxOutput;
    } else if (Array.isArray(fluxOutput)) {
      const first = fluxOutput[0];
      if (typeof first === "string") finalImageUrl = first;
      else if (first?.url) finalImageUrl = first.url;
    } else if (fluxOutput && typeof fluxOutput === "object") {
      if ("url" in fluxOutput) {
        finalImageUrl = (fluxOutput as any).url;
      }
    }

    if (!finalImageUrl) {
      throw new Error("FLUX non ha restituito immagine");
    }

    return Response.json({
      success: true,
      image: finalImageUrl,
    });

  } catch (error: any) {
    console.error("❌ ERROR:", error);

    return Response.json({
      success: false,
      error: error.message,
    });
  }
}