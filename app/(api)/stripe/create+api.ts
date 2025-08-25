import { Stripe } from "stripe";

// Add validation for environment variable
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not defined in environment variables");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request: Request) {
  try {
    console.log("=== API ROUTE HIT - CREATE PAYMENT ===");

    const body = await request.json();
    console.log("🚀 ~ POST ~ body:", body);

    const { name, email, amount, paymentMethodId } = body;

    if (!name || !email || !amount) {
      console.log("Missing required fields:", {
        name: !!name,
        email: !!email,
        amount: !!amount,
      });

      // Fix: Use new Response with proper headers
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

    let customer: any;

    console.log("Checking for existing customer...");
    const doesCustomerExist = await stripe.customers.list({ email });

    if (doesCustomerExist.data.length > 0) {
      customer = doesCustomerExist.data[0];
      console.log("Found existing customer:", customer.id);
    } else {
      console.log("Creating new customer...");
      const newCustomer = await stripe.customers.create({
        name,
        email,
      });
      customer = newCustomer;
      console.log("Created new customer:", customer.id);
    }

    console.log("Creating ephemeral key...");
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: "2024-06-20" }
    );

    console.log("Creating payment intent...");
    const paymentIntent = await stripe.paymentIntents.create({
      amount: parseInt(amount) * 100,
      currency: "usd",
      customer: customer.id,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
    });

    console.log("Payment intent created successfully:", paymentIntent.id);

    // Fix: Use new Response with proper headers
    return new Response(
      JSON.stringify({
        paymentIntent: paymentIntent,
        ephemeralKey: ephemeralKey,
        customer: customer.id,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error("API Route Error:", error);

    // Fix: Use new Response with proper headers for error case too
    return new Response(
      JSON.stringify({
        error: "Internal server error",
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

// export async function GET() {
//   console.log("TEST API ROUTE HIT!");

//   return new Response(
//     JSON.stringify({
//       message: "API route is working!",
//       timestamp: new Date().toISOString(),
//     }),
//     {
//       status: 200,
//       headers: {
//         "Content-Type": "application/json",
//       },
//     }
//   );
// }

// export async function POST() {
//   console.log("TEST API ROUTE POST HIT!");

//   return new Response(
//     JSON.stringify({
//       message: "POST API route is working!",
//       timestamp: new Date().toISOString()
//     }),
//     {
//       status: 200,
//       headers: {
//         'Content-Type': 'application/json',
//       }
//     }
//   );
// }

// File: app/api/stripe/create+api.ts

// export async function POST(request: Request) {
//   console.log("🔥🔥🔥 API ROUTE HIT - POST /api/stripe/create 🔥🔥🔥");

//   try {
//     const body = await request.json();
//     console.log("📝 Request body received:", body);

//     // Return a simple test response first
//     const response = {
//       success: true,
//       message: "API route is working!",
//       receivedData: body,
//       timestamp: new Date().toISOString(),
//     };

//     console.log("✅ Sending response:", response);

//     return new Response(JSON.stringify(response), {
//       status: 200,
//       headers: {
//         "Content-Type": "application/json",
//         "Access-Control-Allow-Origin": "*",
//         "Access-Control-Allow-Methods": "POST, OPTIONS",
//         "Access-Control-Allow-Headers": "Content-Type",
//       },
//     });
//   } catch (error: any) {
//     console.error("❌ API Error:", error);

//     return new Response(
//       JSON.stringify({
//         success: false,
//         error: "API Error",
//         message: error.message,
//         timestamp: new Date().toISOString(),
//       }),
//       {
//         status: 500,
//         headers: {
//           "Content-Type": "application/json",
//         },
//       }
//     );
//   }
// }

// // Add OPTIONS for CORS
// export async function OPTIONS() {
//   return new Response(null, {
//     status: 200,
//     headers: {
//       "Access-Control-Allow-Origin": "*",
//       "Access-Control-Allow-Methods": "POST, OPTIONS",
//       "Access-Control-Allow-Headers": "Content-Type",
//     },
//   });
// }

// // Add GET for testing
// export async function GET() {
//   console.log("🔥 GET request to /api/stripe/create");

//   return new Response(
//     JSON.stringify({
//       message: "GET request works!",
//       timestamp: new Date().toISOString(),
//     }),
//     {
//       status: 200,
//       headers: {
//         "Content-Type": "application/json",
//       },
//     }
//   );
// }
