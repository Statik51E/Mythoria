# Mythoria

TTRPG multijoueur piloté par une IA maître du jeu (Groq).

- **Frontend** : React 18 + Vite + TypeScript + Tailwind, déployé sur **Vercel**.
- **API** : Vercel Serverless Functions (`/api/*.ts`) — proxy sécurisé vers Groq, vérification du token Firebase Auth, écriture Firestore via Admin SDK.
- **Auth** : Firebase Authentication (email/password + Google) — plan **Spark gratuit**.
- **Données** : Cloud Firestore — plan **Spark gratuit**.
- **CI/CD** : Vercel auto-déploie sur chaque push GitHub. GitHub Actions ne déploie que les *rules* Firestore quand elles changent.

Tout est conçu pour rester **gratuit** : Vercel free tier + Firebase Spark. Pas de Cloud Functions, pas de Storage, pas de Blaze.

## Architecture

```
[Joueurs navigateur]
       │  Firestore SDK (onSnapshot temps réel, lecture/écriture directe)
       │  fetch /api/groq, /api/join (avec ID token Firebase en header)
       ▼
[Vercel — frontend statique + serverless API] ─── [Groq API]
       │
       └──────► [Firebase Firestore]
```

La clé `GROQ_API_KEY` vit uniquement dans les variables d'environnement Vercel et n'apparaît jamais dans le bundle frontend.

## Premier déploiement

### 1. Firebase (gratuit, plan Spark)

Sur https://console.firebase.google.com :

- Crée le projet (ou utilise `mythoria-79c58` déjà configuré dans [.firebaserc](.firebaserc)).
- **Authentication** → onglet *Sign-in method* : active **Email/Password** + **Google**.
- **Firestore Database** → crée en mode production.
- **Ne pas activer Storage** (demande Blaze sur les nouveaux projets).

Récupère la config Web (Project Settings → Your apps → Web) et remplis [frontend/.env.local](frontend/.env.local) à partir de [.env.example](frontend/.env.example).

### 2. Compte de service Firebase Admin (pour l'API Vercel)

L'API Vercel a besoin d'un service account pour vérifier les ID tokens et écrire dans Firestore avec les droits admin.

- https://console.cloud.google.com/iam-admin/serviceaccounts?project=mythoria-79c58
- *Create service account* → nom `vercel-api` → rôle **Firebase Admin SDK Administrator Service Agent** (ou minimum **Cloud Datastore User** + **Service Account Token Creator**).
- Onglet *Keys* → *Add key* → *JSON* → télécharge le fichier.
- Ouvre le JSON, copie tout son contenu (une seule ligne).

### 3. Compte Vercel (gratuit)

- Crée un compte sur https://vercel.com (login avec GitHub recommandé).
- Push ton projet sur GitHub si ce n'est pas déjà fait.
- *Add New Project* → importe le repo GitHub Mythoria.
- Vercel détecte `vercel.json` automatiquement. Tu n'as **rien** à configurer côté framework.

Dans *Project Settings → Environment Variables*, ajoute pour les 3 environnements (Production, Preview, Development) :

| Nom | Valeur |
|---|---|
| `GROQ_API_KEY` | ta clé depuis https://console.groq.com/keys |
| `FIREBASE_SERVICE_ACCOUNT` | le JSON complet du service account (copié à l'étape 2) |
| `VITE_FIREBASE_API_KEY` | depuis ton `.env.local` |
| `VITE_FIREBASE_AUTH_DOMAIN` | depuis ton `.env.local` |
| `VITE_FIREBASE_PROJECT_ID` | depuis ton `.env.local` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | depuis ton `.env.local` |
| `VITE_FIREBASE_APP_ID` | depuis ton `.env.local` |
| `VITE_FIREBASE_MEASUREMENT_ID` | depuis ton `.env.local` |

Clique *Deploy*. Vercel build le frontend et déploie les serverless functions. Tu obtiens une URL `mythoria-xxx.vercel.app`.

### 4. Autoriser le domaine Vercel dans Firebase Auth

Sinon Google sign-in échoue.

- Firebase Console → Authentication → Settings → *Authorized domains* → *Add domain* → `mythoria-xxx.vercel.app` (et tout domaine custom).

### 5. Pousser les Firestore rules

Une fois en local :

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules,firestore:indexes
```

Ou laisse GitHub Actions s'en charger (voir étape 6).

### 6. (Optionnel) GitHub Actions pour les rules

Pour que les rules Firestore se redéploient automatiquement quand tu modifies [firestore.rules](firestore.rules) :

- *Repo Settings → Secrets and variables → Actions* :
  - `FIREBASE_PROJECT_ID` = `mythoria-79c58`
  - `FIREBASE_SERVICE_ACCOUNT` = même JSON qu'à l'étape 2.

Le workflow [.github/workflows/deploy.yml](.github/workflows/deploy.yml) se déclenche sur les pushs qui touchent les rules.

## Dev local

```bash
# Terminal 1 — émulateurs Auth + Firestore
firebase emulators:start

# Terminal 2 — Vercel (frontend Vite + API serverless en local)
npm install
npx vercel dev   # http://localhost:3000
```

Pour utiliser les émulateurs Firebase, mets `VITE_USE_EMULATORS=true` dans [frontend/.env.local](frontend/.env.local).

Si tu préfères Vite seul (sans tester l'API en local), `cd frontend && npm run dev` suffit, mais les appels `/api/*` ne marcheront que vers une URL Vercel déployée — règle alors `VITE_API_BASE_URL=https://mythoria-xxx.vercel.app`.

## Structure

```
Mythoria/
├── .github/workflows/deploy.yml    # CI : redéploie firestore rules
├── api/                            # Vercel serverless functions
│   ├── groq.ts                     # POST /api/groq → proxy Groq
│   ├── join.ts                     # POST /api/join → rejoindre via code
│   └── _lib/{auth,firebaseAdmin,rateLimit,http}.ts
├── frontend/                       # SPA React + Vite + TS + Tailwind
│   └── src/
│       ├── main.tsx, App.tsx
│       ├── firebase.ts             # Auth + Firestore client SDK
│       ├── auth/, campaigns/, sessions/
│       └── lib/{apiClient,groqClient,firestore,types}.ts
├── firebase.json                   # Firestore rules + indexes uniquement
├── firestore.rules
├── firestore.indexes.json
├── package.json                    # racine — deps de l'API Vercel
└── vercel.json                     # config build + functions
```

## Modèle de données Firestore

```
users/{uid}                              # profil
campaigns/{cid}                          # name, hostUid, playerUids[], inviteCode
  members/{uid}                          # role, characterId
  characters/{characterId}               # ownerUid, sheet
  npcs/{npcId}                           # visibleToPlayers
  sessions/{sessionId}                   # active session
    messages/{messageId}                 # player | gm | system | dice
  state/current                          # narrativeState, flags, location
  saves/{saveId}                         # snapshots
rateLimits/{uid}_{bucket}                # sliding window pour /api/groq
```

## Sécurité

- Toutes les écritures *client* passent par les **Firestore Security Rules** : un joueur ne lit que les campagnes dont il est membre.
- Les écritures *privilégiées* (rejoindre via code, persister une réponse MJ) passent par l'API Vercel qui vérifie l'ID token Firebase puis utilise l'Admin SDK.
- La **clé Groq** vit dans les env vars Vercel, jamais dans le bundle frontend.
- Rate limit par utilisateur (30 appels Groq / 60 s) côté API.
