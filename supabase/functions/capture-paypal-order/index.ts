// @ts-nocheck
// Deno Edge Function: Capture PayPal Order
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type PayPalAccessToken = {
  access_token: string;
  expires_in: number;
  token_type: string;
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID")!;
const PAYPAL_CLIENT_SECRET = Deno.env.get("PAYPAL_CLIENT_SECRET")!;
const PAYPAL_MODE = Deno.env.get("PAYPAL_MODE") || "sandbox"; // 'sandbox' | 'live'

const baseUrl = PAYPAL_MODE === "live"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

async function getAccessToken(): Promise<string> {
  const auth = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`);
  const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`PayPal token failed: ${res.status}`);
  const data = (await res.json()) as PayPalAccessToken;
  return data.access_token;
}

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  try {
    const { orderID } = await req.json();
    if (!orderID) return new Response("Missing orderID", { status: 400 });

    const accessToken = await getAccessToken();
    // capture the order
    const res = await fetch(`${baseUrl}/v2/checkout/orders/${orderID}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
    });
    if (!res.ok) {
      console.error("PayPal capture failed", await res.text());
      return new Response("PayPal capture failed", { status: 500 });
    }
    const data = await res.json();

    // Example response includes purchase_units[0].payments.captures[0]
    const capture = data?.purchase_units?.[0]?.payments?.captures?.[0];
    if (!capture || capture.status !== "COMPLETED") {
      return new Response("Payment not completed", { status: 400 });
    }

    // Find local order using PayPal order id
    const { data: orderRow, error: readErr } = await supabase
      .from("orders")
      .select("order_id,user_id")
      .eq("paypal_order_id", orderID)
      .single();
    if (readErr) throw readErr;

    // Update order to paid
    const amount = capture.amount?.value ?? "10.00";
    const { error: updErr } = await supabase
      .from("orders")
      .update({ status: "paid", paypal_transaction_id: capture.id, amount })
      .eq("order_id", orderRow.order_id);
    if (updErr) throw updErr;

    // Set user premium
    const { error: userErr } = await supabase
      .from("users")
      .update({ is_premium: true })
      .eq("id", orderRow.user_id);
    if (userErr) throw userErr;

    return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    console.error("capture-paypal-order error", e);
    return new Response("Internal Error", { status: 500 });
  }
});
