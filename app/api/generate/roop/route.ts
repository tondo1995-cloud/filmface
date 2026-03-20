import Replicate from "replicate";

export async function POST(req: Request) {
  try {
    const { sourceImageUrl, targetImageUrl } = await req.json();

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN!,
    });

    const output = await replicate.run(
      "okaris/roop:8c1e100ecabb3151cf1e6c62879b6de7a4b84602de464ed249b6cff0b86211d8",
      {
        input: {
          source: sourceImageUrl,
          target: targetImageUrl,
        },
      }
    );

    console.log("🔥 RAW OUTPUT:", output);

    let imageUrl = null;

    // 🔥 CASO PRINCIPALE (replicate moderno)
    if (output && typeof output === "object") {
      if ("url" in output && typeof output.url === "string") {
        imageUrl = output.url;
      }
    }

    // 🔥 array
    if (!imageUrl && Array.isArray(output)) {
      const first = output[0];

      if (typeof first === "string") {
        imageUrl = first;
      } else if (first && typeof first === "object") {
        if ("url" in first && typeof first.url === "string") {
          imageUrl = first.url;
        }
      }
    }

    // 🔥 fallback CRUCIALE (questo ti manca)
    if (!imageUrl && output?.toString) {
      const maybe = output.toString();
      if (maybe.startsWith("http")) {
        imageUrl = maybe;
      }
    }

    return Response.json({
      success: true,
      image: imageUrl,
      raw: output,
    });

  } catch (error: any) {
    return Response.json({
      success: false,
      error: error.message,
    });
  }
}