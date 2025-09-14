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
      const orderRef = capture.invoice_id; // we set this in createOrder client side
      if (!orderRef) {
        console.warn("⚠️ Missing invoice_id on capture", capture.id);
        return new Response("missing invoice_id", { status: 200 });
      }

      // Update existing order row
      const { data: orderRow, error: fetchErr } = await supabase
        .from("orders")
        .select("order_id,user_id,status")
        .eq("order_id", orderRef)
        .single();

      if (fetchErr) {
        console.error("❌ Order lookup failed (will attempt insert)", fetchErr);
      }

      if (!orderRow) {
        // Insert fallback if row somehow wasn't created client-side
        const { error: insertErr } = await supabase.from("orders").insert([
          {
            order_id: orderRef,
            status: "paid",
            paypal_transaction_id: capture.id,
            amount: capture.amount?.value ? Number(capture.amount.value) : 0
          }
        ]);
        if (insertErr) {
          console.error("❌ Insert fallback failed", insertErr);
          return new Response("order insert error", { status: 500 });
        }
      } else {
        // Normal update path
        if (orderRow.status !== "paid") {
          const { error: updateErr } = await supabase
            .from("orders")
            .update({
              status: "paid",
              paypal_transaction_id: capture.id,
              amount: capture.amount?.value ? Number(capture.amount.value) : undefined
            })
            .eq("order_id", orderRef);
          if (updateErr) {
            console.error("❌ Order update failed", updateErr);
            return new Response("order update error", { status: 500 });
          }
        }
      }

      // Auto-upgrade user if user_id present
      if (orderRow?.user_id) {
        const { error: userErr } = await supabase
          .from("users")
          .update({ is_premium: true })
          .eq("id", orderRow.user_id);
        if (userErr) {
          console.error("❌ Failed to upgrade user", userErr);
        } else {
          console.log("🌟 User upgraded to premium", orderRow.user_id);
        }
      } else {
        console.warn("⚠️ No user_id on order, cannot auto-upgrade", orderRef);
      }

      console.log("💰 Payment processed", capture.id, "order", orderRef);
    }

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("❌ Webhook handler error:", err);
    return new Response("Webhook error", { status: 500 });
  }
});

