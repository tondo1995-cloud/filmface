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

    if (roopOutput && typeof roopOutput === "object") {
      if ("url" in roopOutput && typeof roopOutput.url === "string") {
        roopImageUrl = roopOutput.url;
      }
    }

    if (!roopImageUrl && Array.isArray(roopOutput)) {
      const first = roopOutput[0];
      if (typeof first === "string") {
        roopImageUrl = first;
      } else if (first && typeof first === "object" && "url" in first) {
        roopImageUrl = (first as any).url;
      }
    }

    if (!roopImageUrl && roopOutput?.toString) {
      const maybe = roopOutput.toString();
      if (maybe.startsWith("http")) {
        roopImageUrl = maybe;
      }
    }

    if (!roopImageUrl) {
      throw new Error("Errore roop: immagine non generata");
    }

    // 🔥 STEP 2 — TEXT REPLACE (FLUX FILL PRO)

    const fluxOutput = await replicate.run(
      "black-forest-labs/flux-fill-pro",
      {
        input: {
          image: roopImageUrl,
          mask: `${process.env.NEXT_PUBLIC_BASE_URL}/masks/wolf-text-mask.png`,
          prompt: `Replace the text "Leonardo DiCaprio" with "${name}".

Keep EXACTLY:
- same font
- same size
- same spacing
- same alignment
- same color
- same lighting
- same texture

The result must look identical to the original movie poster.

Do not modify anything else.`,
        },
      }
    );

    let finalImageUrl: string | null = null;

    if (fluxOutput && typeof fluxOutput === "object") {
      if ("url" in fluxOutput && typeof fluxOutput.url === "string") {
        finalImageUrl = fluxOutput.url;
      }
    }

    if (!finalImageUrl && Array.isArray(fluxOutput)) {
      const first = fluxOutput[0];
      if (typeof first === "string") {
        finalImageUrl = first;
      } else if (first && typeof first === "object" && "url" in first) {
        finalImageUrl = (first as any).url;
      }
    }

    if (!finalImageUrl && fluxOutput?.toString) {
      const maybe = fluxOutput.toString();
      if (maybe.startsWith("http")) {
        finalImageUrl = maybe;
      }
    }

    if (!finalImageUrl) {
      throw new Error("Errore flux: immagine finale non generata");
    }

    return Response.json({
      success: true,
      image: finalImageUrl,
    });

  } catch (error: any) {
    return Response.json({
      success: false,
      error: error.message,
    });
  }
}