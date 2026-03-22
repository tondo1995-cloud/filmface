export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const imageUrl = searchParams.get("image");

    if (!imageUrl) {
      return Response.json(
        { error: "Missing image URL" },
        { status: 400 }
      );
    }

    const res = await fetch(imageUrl);

    if (!res.ok) {
      throw new Error("Errore download immagine");
    }

    const buffer = await res.arrayBuffer();

    return new Response(buffer, {
      headers: {
        "Content-Type": "image/jpeg",
      },
    });

  } catch (err: any) {
    console.error(err);

    return Response.json(
      { error: err.message },
      { status: 500 }
    );
  }
}