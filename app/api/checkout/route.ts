import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const { imageUrl } = await req.json();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",

      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "FaceFilm Download HD",
            },
            unit_amount: 299, // 2.99€
          },
          quantity: 1,
        },
      ],

      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?image=${encodeURIComponent(
        imageUrl
      )}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}`,

    });

    return Response.json({ url: session.url });

  } catch (err: any) {
    return Response.json({ error: err.message });
  }
}