// import { Stripe } from "stripe";

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// export async function POST(request: Request) {
//   try {
//     const body = await request.json();
//     const { payment_method_id, payment_intent_id, customer_id, client_secret } =
//       body;

//     if (!payment_method_id || !payment_intent_id || !customer_id) {
//       return new Response(
//         JSON.stringify({ error: "Missing required fields" }),
//         { status: 400 }
//       );
//     }

//     const paymentMethod = await stripe.paymentMethods.attach(
//       payment_method_id,
//       { customer: customer_id }
//     );

//     const result = await stripe.paymentIntents.confirm(payment_intent_id, {
//       payment_method: paymentMethod.id,
//     });

//     return new Response(
//       JSON.stringify({
//         success: true,
//         message: "Payment successful",
//         result: result,
//       })
//     );
//   } catch (error) {
//     console.error("Error paying:", error);
//     return new Response(JSON.stringify({ error: "Internal Server Error" }), {
//       status: 500,
//     });
//   }
// }

import { Stripe } from "stripe";

// Add validation for environment variable
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not defined in environment variables");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request: Request) {
  try {
    console.log("=== PAY API ROUTE HIT ===");

    const body = await request.json();
    console.log("🚀 ~ POST ~ body:", body);

    const { payment_method_id, payment_intent_id, customer_id, client_secret } =
      body;

    if (!payment_method_id || !payment_intent_id) {
      console.log("Missing required fields:", {
        payment_method_id: !!payment_method_id,
        payment_intent_id: !!payment_intent_id,
      });

      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.log("Confirming payment intent...");

    // Confirm the payment intent
    const paymentIntent = await stripe.paymentIntents.confirm(
      payment_intent_id,
      {
        payment_method: payment_method_id,
      }
    );

    console.log("Payment intent confirmed:", paymentIntent.status);

    if (paymentIntent.status === "succeeded") {
      return new Response(
        JSON.stringify({
          result: {
            client_secret: paymentIntent.client_secret,
            status: "completed",
          },
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          error: "Payment confirmation failed",
          status: paymentIntent.status,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
  } catch (error: any) {
    console.error("Pay API Route Error:", error);

    return new Response(
      JSON.stringify({
        error: "Payment processing failed",
        message: error.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
