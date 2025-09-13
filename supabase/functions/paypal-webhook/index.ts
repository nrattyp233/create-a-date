import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Supabase client (using Service Role key for DB writes)
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// Your PayPal Webhook ID for verification
const PAYPAL_WEBHOOK_ID = Deno.env.get("PAYPAL_WEBHOOK_ID") || "5LL73296N7889722W";

// Webhook listener
serve(async (req) => {
  try {
    const event = await req.json();
    console.log("✅ Webhook event received:", event.event_type);

    // Handle completed payments
    if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
      const capture = event.resource;
      const transactionId = capture.id;
      const amount = parseFloat(capture.amount.value);

      console.log(`💰 Payment captured: ${transactionId} for $${amount}`);

      // Find the order in our database using the PayPal order ID
      const { data: orderRecord, error: orderError } = await supabase
        .from("payment_orders")
        .select("*")
        .eq("paypal_transaction_id", transactionId)
        .single();

      if (orderError && orderError.code !== 'PGRST116') {
        console.error("❌ Error finding order:", orderError);
        // Try to find by order ID if transaction ID lookup fails
        const paypalOrderId = capture.supplementary_data?.related_ids?.order_id;
        if (paypalOrderId) {
          const { data: altOrderRecord, error: altOrderError } = await supabase
            .from("payment_orders")
            .select("*")
            .eq("order_id", paypalOrderId)
            .single();
          
          if (altOrderError) {
            console.error("❌ Could not find order record for payment:", transactionId);
            return new Response("Order not found", { status: 404 });
          }
          
          // Update the order with transaction ID
          await supabase
            .from("payment_orders")
            .update({
              status: "completed",
              paypal_transaction_id: transactionId,
              completed_at: new Date().toISOString(),
            })
            .eq("order_id", paypalOrderId);
          
          // Grant premium status to user if this is a $10 premium upgrade
          if (amount >= 10.00 && altOrderRecord.user_id) {
            const { error: userUpdateError } = await supabase
              .from("users")
              .update({ is_premium: true })
              .eq("id", altOrderRecord.user_id);

            if (userUpdateError) {
              console.error("❌ Failed to grant premium status:", userUpdateError);
            } else {
              console.log(`🎉 Premium status granted to user ${altOrderRecord.user_id}`);
            }
          }
        }
      } else if (orderRecord) {
        // Update order status if found
        const { error: updateError } = await supabase
          .from("payment_orders")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
          })
          .eq("id", orderRecord.id);

        if (updateError) {
          console.error("❌ Failed to update order status:", updateError);
        }

        // Grant premium status to user if this is a $10 premium upgrade
        if (amount >= 10.00 && orderRecord.user_id) {
          const { error: userUpdateError } = await supabase
            .from("users")
            .update({ is_premium: true })
            .eq("id", orderRecord.user_id);

          if (userUpdateError) {
            console.error("❌ Failed to grant premium status:", userUpdateError);
          } else {
            console.log(`🎉 Premium status granted to user ${orderRecord.user_id}`);
          }
        }
      }
    }

    // Handle failed payments
    if (event.event_type === "PAYMENT.CAPTURE.DENIED" || event.event_type === "PAYMENT.CAPTURE.DECLINED") {
      const capture = event.resource;
      console.log("❌ Payment failed:", capture.id);

      // Update order status to failed
      await supabase
        .from("payment_orders")
        .update({ status: "failed" })
        .eq("paypal_transaction_id", capture.id);
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("❌ Webhook handler error:", err);
    return new Response("Webhook error", { status: 500 });
  }
});

