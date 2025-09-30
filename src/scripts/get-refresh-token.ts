import express from "express";
import dotenv from "dotenv";
import open from "open";
import { google } from "googleapis";

dotenv.config();

const PORT = Number(process.env.PORT ?? 3000);
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "";
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI ?? `http://localhost:${PORT}/oauth2callback`;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env");
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2({
  clientId: CLIENT_ID,
  clientSecret: CLIENT_SECRET,
  redirectUri: REDIRECT_URI,
});

const SCOPES = [
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube",
  "https://www.googleapis.com/auth/userinfo.email",
];

async function startServer() {
  const app = express();

  app.get("/", (_req, res) => {
    res.send(
      `<html><body>
        <h3>Get Google Refresh Token</h3>
        <p>Open <a href="/auth">/auth</a> to start the OAuth flow.</p>
      </body></html>`
    );
  });

  app.get("/auth", (_req, res) => {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: SCOPES,
    });
    res.redirect(authUrl);
  });

  app.get("/oauth2callback", async (req, res) => {
    const code = req.query.code as string | undefined;
    const error = req.query.error as string | undefined;

    if (error) {
      console.error("OAuth error:", error);
      res.status(500).send(`OAuth error: ${error}`);
      return;
    }

    if (!code) {
      res.status(400).send("Missing code in query");
      return;
    }

    try {
      const { tokens } = await oauth2Client.getToken(code);
      console.log("=== TOKENS RECEIVED ===");
      console.log(JSON.stringify(tokens, null, 2));

      if (!tokens.refresh_token) {
        console.warn(
          "No refresh_token returned. See instructions in README: remove previous app access and retry (prompt=consent + access_type=offline must be used)."
        );
      }

      const outHtml = `<html><body>
        <h3>Tokens received</h3>
        <pre>${JSON.stringify(tokens, null, 2)}</pre>
        <p><strong>Copy the refresh_token and paste into your .env file:</strong></p>
        <code>GOOGLE_REFRESH_TOKEN=${tokens.refresh_token ?? ""}</code>
        <p>You may now close this window.</p>
      </body></html>`;

      res.send(outHtml);

      console.log("Copy this REFRESH_TOKEN into your .env:");
      console.log(tokens.refresh_token ?? "<NO_REFRESH_TOKEN_RETURNED>");
      setTimeout(() => process.exit(0), 2000);
    } catch (err) {
      console.error("Error exchanging code for tokens:", err);
      res.status(500).send("Error exchanging code for tokens. See server logs.");
    }
  });

  app.listen(PORT, () => {
    console.log(`OAuth helper running at http://localhost:${PORT}`);
    console.log(`Open http://localhost:${PORT}/auth or visit the printed URL`);
    (async () => {
      try {
        await open(`http://localhost:${PORT}/auth`);
      } catch {
        // ignorar se não abrir (não alterar lucas)
      }
    })();
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
