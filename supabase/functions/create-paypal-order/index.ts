// @ts-nocheck
// Deno Edge Function: Create PayPal Order
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type PayPalAccessToken = {
  access_token: string;
  expires_in: number;
  token_type: string;
};

type CreateOrderResponse = {
  id: string;
  status: string;
  links?: Array<{ href: string; rel: string; method: string }>;
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
    const { user_id } = await req.json();
    if (!user_id) return new Response("Missing user_id", { status: 400 });

    // Create a local order row first in 'orders' table with pending status
    const price = 10.0; // USD
    const { data: orderRow, error: orderErr } = await supabase
      .from("orders")
      .insert({ user_id, amount: price.toFixed(2), status: "pending" })
      .select()
      .single();
    if (orderErr) throw orderErr;

    const accessToken = await getAccessToken();
    const orderBody = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: { currency_code: "USD", value: price.toFixed(2) },
          invoice_id: orderRow.order_id, // tie back to our local order id
        },
      ],
      application_context: {
        brand_name: "Create-A-Date Premium",
        user_action: "PAY_NOW",
        shipping_preference: "NO_SHIPPING",
        // Return/cancel URLs are optional for app-based flow; left blank
      },
    };

    const res = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify(orderBody),
    });
    if (!res.ok) {
      console.error("PayPal create order failed", await res.text());
      return new Response("PayPal create order failed", { status: 500 });
    }
    const data = (await res.json()) as CreateOrderResponse;

    // Save PayPal id onto our order
    await supabase
      .from("orders")
      .update({ paypal_order_id: data.id })
      .eq("order_id", orderRow.order_id);

    const approveLink = data.links?.find((l) => l.rel === "approve")?.href ?? null;
    return new Response(JSON.stringify({ orderID: data.id, approveLink, localOrderId: orderRow.order_id }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-paypal-order error", e);
    return new Response("Internal Error", { status: 500 });
  }
});
