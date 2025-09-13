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
    const { orderID } = await req.json();
    
    if (!orderID) {
      return new Response("Order ID required", { status: 400 });
    }

    // Get user from session/headers (simplified for demo)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Verify order exists in our database
    const { data: orderRecord, error: orderError } = await supabase
      .from("payment_orders")
      .select("*")
      .eq("order_id", orderID)
      .eq("status", "pending")
      .single();

    if (orderError || !orderRecord) {
      return new Response("Order not found or already processed", { status: 404 });
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Capture the PayPal order
    const captureResponse = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderID}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
    });

    if (!captureResponse.ok) {
      throw new Error("Failed to capture PayPal order");
    }

    const captureData = await captureResponse.json();
    
    // Check if payment was successful
    if (captureData.status !== "COMPLETED") {
      throw new Error("Payment was not completed");
    }

    // Extract transaction details
    const capture = captureData.purchase_units[0].payments.captures[0];
    const transactionId = capture.id;
    const amount = parseFloat(capture.amount.value);

    // Update order status in database
    const { error: updateError } = await supabase
      .from("payment_orders")
      .update({
        status: "completed",
        paypal_transaction_id: transactionId,
        completed_at: new Date().toISOString(),
        capture_data: captureData,
      })
      .eq("order_id", orderID);

    if (updateError) {
      console.error("Failed to update order status:", updateError);
      throw new Error("Failed to update order status");
    }

    // Grant premium status to user (assuming user_id is stored in order or can be derived)
    // For now, we'll need to determine the user ID from the session
    // This is a simplified implementation - in production, you'd store user_id with the order
    
    console.log(`✅ Payment captured successfully: ${transactionId} for $${amount}`);

    return new Response(
      JSON.stringify({
        success: true,
        transactionId: transactionId,
        amount: amount,
        status: "completed",
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error capturing PayPal payment:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});