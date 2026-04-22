import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const steps: Record<string, unknown> = {};
  try {
    steps.node = process.version;
    steps.hasGroqKey = Boolean(process.env.GROQ_API_KEY);
    steps.hasServiceAccount = Boolean(process.env.FIREBASE_SERVICE_ACCOUNT);

    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        steps.serviceAccountKeys = Object.keys(parsed);
        steps.projectId = parsed.project_id;
        steps.privateKeyStartsWith = String(parsed.private_key ?? "").slice(0, 30);
        steps.privateKeyHasRealNewlines =
          typeof parsed.private_key === "string" && parsed.private_key.includes("\n");
        steps.privateKeyHasEscapedNewlines =
          typeof parsed.private_key === "string" && parsed.private_key.includes("\\n");
      } catch (e) {
        steps.serviceAccountParseError = e instanceof Error ? e.message : String(e);
      }
    }

    try {
      const mod = await import("firebase-admin/app");
      steps.importedFirebaseAdminApp = Object.keys(mod);
    } catch (e) {
      steps.importErrorApp = e instanceof Error ? e.message : String(e);
    }

    try {
      const mod = await import("firebase-admin/firestore");
      steps.importedFirestore = Object.keys(mod);
    } catch (e) {
      steps.importErrorFirestore = e instanceof Error ? e.message : String(e);
    }

    try {
      const mod = await import("firebase-admin/auth");
      steps.importedAuth = Object.keys(mod);
    } catch (e) {
      steps.importErrorAuth = e instanceof Error ? e.message : String(e);
    }

    try {
      const { cert, getApps, initializeApp } = await import("firebase-admin/app");
      if (process.env.FIREBASE_SERVICE_ACCOUNT && getApps().length === 0) {
        const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        initializeApp({ credential: cert(parsed) });
        steps.initOk = true;
      } else {
        steps.initSkipped = getApps().length > 0 ? "already-initialized" : "no-service-account";
      }
    } catch (e) {
      steps.initError = e instanceof Error ? e.message : String(e);
      steps.initStack = e instanceof Error ? e.stack : undefined;
    }

    res.status(200).json({ ok: true, steps });
  } catch (err) {
    res.status(500).json({
      ok: false,
      steps,
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
  }
}
