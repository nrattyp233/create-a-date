import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Supabase client (using Service Role key for DB writes)
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// Your PayPal Webhook ID
const PAYPAL_WEBHOOK_ID = "5LL73296N7889722W";

// Premium upgrade price - ensure this matches frontend
const PREMIUM_PRICE = 10.00;

// Webhook listener
serve(async (req) => {
  try {
    const event = await req.json();
    console.log("✅ Webhook event received:", event.event_type);

    // Only handle completed payments for now
    if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
      const capture = event.resource;
      
      // Verify this is a premium upgrade payment
      const paymentAmount = parseFloat(capture.amount.value);
      if (paymentAmount !== PREMIUM_PRICE) {
        console.log(`⚠️ Payment amount ${paymentAmount} doesn't match premium price ${PREMIUM_PRICE}`);
        return new Response("Payment amount mismatch", { status: 400 });
      }

      // Extract user ID from invoice_id or custom field
      const userId = capture.invoice_id || capture.custom_id;
      if (!userId) {
        console.error("❌ No user ID found in payment");
        return new Response("No user ID found", { status: 400 });
      }

      console.log(`💰 Processing premium upgrade for user ${userId}, amount: $${paymentAmount}`);

      // Start transaction: record payment AND upgrade user to premium
      const { error: orderError } = await supabase
        .from("orders")
        .upsert({
          order_id: capture.invoice_id || capture.id,
          user_id: parseInt(userId),
          status: "paid",
          paypal_transaction_id: capture.id,
          amount: paymentAmount.toString(),
          created_at: new Date().toISOString()
        });

      if (orderError) {
        console.error("❌ Failed to record order:", orderError);
        return new Response("Failed to record order", { status: 500 });
      }

      // Grant premium status to user
      const { error: userError } = await supabase
        .from("users")
        .update({ 
          is_premium: true,
          premium_upgraded_at: new Date().toISOString()
        })
        .eq("id", parseInt(userId));

      if (userError) {
        console.error("❌ Failed to upgrade user to premium:", userError);
        return new Response("Failed to upgrade user", { status: 500 });
      }

      console.log(`🎉 Successfully upgraded user ${userId} to premium!`);
    }

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("❌ Webhook handler error:", err);
    return new Response("Webhook error", { status: 500 });
  }
});

