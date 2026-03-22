import Stripe from "stripe";

export const runtime = "nodejs";

// 🔥 FIX: niente apiVersion (evita errori Vercel)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const { imageUrl } = await req.json();

    // 🔴 VALIDAZIONE
    if (!imageUrl || typeof imageUrl !== "string") {
      return Response.json(
        { error: "Invalid imageUrl" },
        { status: 400 }
      );
    }

    // 🔥 BASE URL CORRETTA (fix precedenza logica)
    let BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

    if (!BASE_URL) {
      if (process.env.VERCEL_URL) {
        BASE_URL = process.env.VERCEL_URL.startsWith("http")
          ? process.env.VERCEL_URL
          : `https://${process.env.VERCEL_URL}`;
      }
    }

    if (!BASE_URL) {
      throw new Error("Missing BASE_URL");
    }

    // 🔥 STRIPE SESSION
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],

      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "FilmFace HD Download",
              description: "Download immagine HD senza watermark",
            },
            unit_amount: 299,
          },
          quantity: 1,
        },
      ],

      // 🔥 IMPORTANTE: salva immagine
      metadata: {
        imageUrl,
      },

      // 🔥 SUCCESS → passa URL immagine
      success_url: `${BASE_URL}/success?image=${encodeURIComponent(imageUrl)}`,

      cancel_url: `${BASE_URL}`,
    });

    return Response.json({
      url: session.url,
    });

  } catch (error: any) {
    console.error("STRIPE ERROR:", error);

    return Response.json(
      {
        error: error?.message || "Stripe error",
      },
      { status: 500 }
    );
  }
}