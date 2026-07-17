# Time Capsule

Send yourself a message in the future.

## How it works
1. `public/index.html` — form collects email, message, delivery date.
2. `netlify/functions/submit-message.js` — saves it to Postgres via Netlify Database.
3. `netlify/functions/send-due-messages.js` — scheduled function (runs daily at 09:00 UTC,
   see `netlify.toml`), checks for anything due, emails it via Resend, marks it sent.

## Setup
1. `npm install`
2. Install the Netlify CLI if you haven't: `npm install -g netlify-cli`
3. `netlify init` (or `netlify link` if the site already exists on Netlify)
4. Provision the database: `netlify db init` (or it auto-provisions on first deploy
   once `@netlify/neon` is in your dependencies — check current docs, this has changed
   recently)
5. Run `schema.sql` against your database once (Netlify CLI should give you a way to
   open a shell/connection string — check `netlify db --help`)
6. Sign up for Resend, get an API key, add it as an env var: `RESEND_API_KEY`
7. Update the `from` address in `send-due-messages.js` to a domain you've verified with Resend
8. `netlify dev` to test locally, `netlify deploy --prod` to ship

## Notes / things to double check as you build
- Netlify Database and scheduled functions are both fairly new/actively changing
  products — re-check the current docs (docs.netlify.com) if anything here doesn't
  match what you see in the dashboard or CLI.
- The scheduled function catches anything with `deliver_at <= now()`, so a missed
  run just gets caught on the next one — no exact-timestamp precision needed.
- Consider adding a `timezone` column later if you want delivery at a specific local
  time rather than a fixed UTC hour.
# timecapsul
