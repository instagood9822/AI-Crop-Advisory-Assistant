---
name: AI and auth provisioning
description: Platform setup behavior for this project's authentication and server-side Gemini access.
---

The app uses managed Clerk for browser authentication and a server-side Gemini API key when the built-in Replit AI integration cannot be provisioned because of account limits.

**Why:** The workspace may reject the managed AI integration with an account-upgrade response, while Clerk can still be provisioned automatically.

**How to apply:** Check managed Clerk status before auth changes. If Gemini integration setup is rejected for account limits, request `GEMINI_API_KEY` through the secrets flow rather than asking for it in chat, and keep all Gemini calls server-side.