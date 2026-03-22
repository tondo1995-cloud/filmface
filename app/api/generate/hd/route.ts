import { getLastHDImage } from "../roop/route";

export const runtime = "nodejs";

export async function GET() {
  try {
    const imageUrl = getLastHDImage();

    if (!imageUrl) {
      return Response.json({ error: "No image available" }, { status: 404 });
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
  } catch (err) {
    console.error("HD ERROR:", err);

    return Response.json(
      { error: "Errore recupero immagine HD" },
      { status: 500 }
    );
  }
}