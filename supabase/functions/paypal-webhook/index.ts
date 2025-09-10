import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Supabase client (using Service Role key for DB writes)
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// Your PayPal Webhook ID
const PAYPAL_WEBHOOK_ID = "5LL73296N7889722W";

// Webhook listener
serve(async (req) => {
  try {
    const event = await req.json();
    console.log("✅ Webhook event received:", event.event_type);

    // Only handle completed payments for now
    if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
      const capture = event.resource;

      // Example: insert/update your "orders" table
      const { error } = await supabase
        .from("orders")
        .update({
          status: "paid",
          paypal_transaction_id: capture.id,
          amount: capture.amount.value
        })
        .eq("order_id", capture.invoice_id); // assume you used invoice_id as your order reference

      if (error) {
        console.error("❌ Supabase DB error:", error);
        return new Response("DB error", { status: 500 });
      }

      console.log("💰 Payment captured and saved:", capture.id);
    }

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("❌ Webhook handler error:", err);
    return new Response("Webhook error", { status: 500 });
  }
});

