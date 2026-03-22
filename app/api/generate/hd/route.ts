export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const rawImage = searchParams.get("image");

    // 🔴 VALIDAZIONE
    if (!rawImage) {
      return Response.json(
        { error: "Missing image URL" },
        { status: 400 }
      );
    }

    // 🔥 decode (Stripe encoding)
    const imageUrl = decodeURIComponent(rawImage);

    // 🔴 sicurezza base (evita roba strana)
    if (!imageUrl.startsWith("http")) {
      return Response.json(
        { error: "Invalid image URL" },
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

        // 🔥 evita cache
        "Cache-Control": "no-store",

        // 🔥 forza download se chiamato diretto
        "Content-Disposition": 'attachment; filename="filmface-hd.jpg"',
      },
    });

  } catch (err: any) {
    console.error("HD ROUTE ERROR:", err);

    return Response.json(
      {
        error: err?.message || "Errore download HD",
      },
      { status: 500 }
    );
  }
}