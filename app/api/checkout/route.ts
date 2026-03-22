import Stripe from "stripe";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const { imageUrl } = await req.json();

    // 🔴 sicurezza minima
    if (!imageUrl) {
      return Response.json(
        { error: "Missing imageUrl" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",

      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "FilmFace HD Download",
              description: "Download immagine HD senza watermark",
            },
            unit_amount: 299, // €2.99
          },
          quantity: 1,
        },
      ],

      // 🔥 PASSIAMO IMMAGINE ALLA SUCCESS PAGE
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?image=${encodeURIComponent(imageUrl)}`,

      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}`,
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