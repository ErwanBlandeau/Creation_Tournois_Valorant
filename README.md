# Deployment to Vercel

This project is prepared to run on Vercel as a static site with a serverless API endpoint.

What I changed / added
- Added a serverless function at `api/valorant/profile.js` which exposes the same API as the old Express endpoint.
- Updated `server.js` to use an environment variable for the TRN API key (kept as a local fallback server for development).
- Added `.env.example` showing `TRN_API_KEY`.
- Added `vercel.json` with a simple route for the API.

Environment variable
- Set TRN_API_KEY in your Vercel project settings (Environment Variables) to your Tracker.gg API key.

Local development
- To run locally using the existing Express fallback:

```powershell
# copy and edit the .env file
copy .env.example .env
# add your TRN_API_KEY in .env (or set it in your shell)
npm install
npm run dev
```

- To test the serverless functions locally with the Vercel CLI (if you have it installed):

```powershell
npm install -g vercel
vercel dev
```

Notes and follow-ups
- Do not commit your real TRN API key. Use Vercel Environment Variables for deployment.
- Once verified on Vercel, you can remove the Express fallback and the `server.js` file to slim dependencies.
