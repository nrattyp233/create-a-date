import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// PayPal API configuration
const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID")!;
const PAYPAL_CLIENT_SECRET = Deno.env.get("PAYPAL_CLIENT_SECRET")!;
const PAYPAL_BASE_URL = Deno.env.get("PAYPAL_ENVIRONMENT") === "production" 
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

// Function to get PayPal access token
async function getPayPalAccessToken() {
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`)}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new Error("Failed to get PayPal access token");
  }

  const data = await response.json();
  return data.access_token;
}

serve(async (req) => {
  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { amount = 10.00 } = await req.json();
    
    // Get user from session/headers (simplified for demo)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Create PayPal order
    const orderData = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: amount.toString(),
          },
          description: "Create-A-Date Premium Subscription",
        },
      ],
      application_context: {
        return_url: `${Deno.env.get("FRONTEND_URL")}/payment/success`,
        cancel_url: `${Deno.env.get("FRONTEND_URL")}/payment/cancel`,
      },
    };

    const paypalResponse = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify(orderData),
    });

    if (!paypalResponse.ok) {
      throw new Error("Failed to create PayPal order");
    }

    const order = await paypalResponse.json();

    // Store order in database
    const { error: dbError } = await supabase
      .from("payment_orders")
      .insert({
        order_id: order.id,
        amount: amount,
        status: "pending",
        paypal_data: order,
      });

    if (dbError) {
      console.error("Database error:", dbError);
      throw new Error("Failed to store order in database");
    }

    // Find approval URL
    const approvalUrl = order.links.find((link: any) => link.rel === "approve")?.href;

    return new Response(
      JSON.stringify({
        orderID: order.id,
        approvalUrl: approvalUrl,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error creating PayPal order:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});