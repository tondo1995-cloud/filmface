import Stripe from "stripe";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// 🔥 helper URL robusto
function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  throw new Error("Missing BASE_URL");
}

export async function POST(req: Request) {
  try {
    const { imageUrl } = await req.json();

    // 🔥 VALIDAZIONE SERIA
    if (
      !imageUrl ||
      typeof imageUrl !== "string" ||
      !imageUrl.startsWith("https://") ||
      !imageUrl.includes("res.cloudinary.com")
    ) {
      console.error("❌ INVALID IMAGE URL:", imageUrl);
      throw new Error("Invalid imageUrl (must be Cloudinary https URL)");
    }

    const BASE_URL = getBaseUrl();

    console.log("✅ CHECKOUT IMAGE:", imageUrl);
    console.log("✅ BASE URL:", BASE_URL);

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
              description: "Immagine generata con FilmFace",
            },
            unit_amount: 50, // 0.50€
          },
          quantity: 1,
        },
      ],

      // 🔥 utile dopo per tracking / download
      metadata: {
        imageUrl,
      },

      success_url: `${BASE_URL}/success?image=${encodeURIComponent(imageUrl)}`,
      cancel_url: `${BASE_URL}`,

    });

    if (!session.url) {
      throw new Error("Stripe session URL missing");
    }

    return Response.json({
      success: true,
      url: session.url,
    });

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