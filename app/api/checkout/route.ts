import Stripe from "stripe";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const { imageUrl } = await req.json();

    // 🔥 VALIDAZIONE SERIA
    if (
      !imageUrl ||
      typeof imageUrl !== "string" ||
      !imageUrl.startsWith("http") ||
      !imageUrl.includes("res.cloudinary.com")
    ) {
      throw new Error("Invalid imageUrl (must be Cloudinary URL)");
    }

    // 🔥 BASE URL ROBUSTO
    let BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

    if (!BASE_URL && process.env.VERCEL_URL) {
      BASE_URL = `https://${process.env.VERCEL_URL}`;
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
              name: "Download locandina HD",
            },
            unit_amount: 50, // 0.50€
          },
          quantity: 1,
        },
      ],

      success_url: `${BASE_URL}/success?image=${encodeURIComponent(imageUrl)}`,
      cancel_url: `${BASE_URL}`,
    });

    if (!session.url) {
      throw new Error("Stripe session URL missing");
    }

    return Response.json({ url: session.url });

  } catch (error: any) {
    console.error("🔥 STRIPE ERROR:", error);

    return Response.json(
      {
        success: false,
        error: error?.message || "Errore pagamento",
      },
      { status: 500 }
    );
  }
}