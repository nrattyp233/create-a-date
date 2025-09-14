<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1gH2LdLDqrcGIgEOUAXHZm_kZp1J5pe8s

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Admin Access

To ensure only you can access the Premium Manager (admin dashboard with the crown icon):

1. Copy `.env.example` to `.env.local` (or `.env` for your deployment environment).
2. Set `VITE_ADMIN_EMAIL` to your exact account email used in the `users` table (case-insensitive match).

```
VITE_ADMIN_EMAIL=your.admin@email.com
```

Behavior:
- If `VITE_ADMIN_EMAIL` is set, ONLY the user with that email is treated as `isAdmin`.
- If it is not set, the fallback is user with `id = 1`.
- Non-admin users will NOT see the crown navigation button and direct navigation to the admin view will show an access restricted message.

If you change the admin email, restart the dev server so Vite picks up the new env variable.
