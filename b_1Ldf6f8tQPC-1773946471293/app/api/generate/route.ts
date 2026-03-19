import Replicate from "replicate";

export const runtime = "nodejs";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const file = formData.get("image") as File;
    const name = formData.get("name") as string;

    if (!file || !name) {
      return Response.json({ error: "Missing data" }, { status: 400 });
    }

    // 🔥 USIAMO DIRETTAMENTE IL FILE (NO BASE64)
    const output = await replicate.run(
      "okaris/roop:8c1e100ecabb3151cf1e6c62879b6de7a4b84602de464ed249b6cff0b86211d8",
      {
        input: {
          source_image: file,
          target_image:
            "https://images.unsplash.com/photo-1606813907291-d86efa9b94db",
        },
      }
    );

    console.log("OUTPUT:", output);

    // 🔥 GESTIONE OUTPUT SICURA
    let imageUrl;

    if (Array.isArray(output)) {
      imageUrl = output[0];
    } else if (typeof output === "string") {
      imageUrl = output;
    } else if (output?.image) {
      imageUrl = output.image;
    } else {
      return Response.json(
        { error: "Invalid output format", raw: output },
        { status: 500 }
      );
    }

    return Response.json({
      result: imageUrl,
    });

  } catch (err: any) {
    console.error("ERROR:", err);

    return Response.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}