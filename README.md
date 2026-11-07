# Chat Backup

A website for uploading WhatsApp chat export ZIPs and browsing them: read,
search, play media, and share — all backed by Firebase for persistence.

- **Sign-in**: Google (Firebase Authentication)
- **Upload**: a WhatsApp chat export `.zip` (containing `_chat.txt` plus
  photos/videos/voice notes). Each ZIP becomes its own chat thread.
- **Storage**: messages + media persist in Firebase (Firestore + Storage),
  scoped per signed-in user.
- **Viewer**: WhatsApp-style message bubbles, full-text search within a
  thread, inline image/video/audio playback, and a share button on every
  message/media item that uses the device's native share sheet (forward to
  WhatsApp, email, etc.), falling back to download/copy where unsupported.

## 1. Create a Firebase project

1. Go to the [Firebase console](https://console.firebase.google.com/) and
   create a new project.
2. **Authentication** → *Sign-in method* → enable **Google**.
3. **Firestore Database** → *Create database* (production mode is fine —
   this repo ships proper security rules, see below).
4. **Storage** → *Get started* (production mode).
5. **Project settings** (gear icon) → *Your apps* → click the web icon
   (`</>`) → register an app → copy the `firebaseConfig` object shown.

These values are public client identifiers, not secrets — real access
control comes from `firestore.rules` and `storage.rules` in this repo,
which restrict every user to their own `users/{uid}/...` data.

## 2. Configure the app

```bash
cp .env.local.example .env.local
```

Fill in `.env.local` with the `firebaseConfig` values from step 1.

`NEXT_PUBLIC_MAX_MEDIA_MB` (default `50`) caps how large an individual
media file can be before it's skipped during upload, to avoid blowing
through Firebase Storage's free-tier quota on large videos.

## 3. Deploy security rules

Install the Firebase CLI once, then deploy the rules in this repo:

```bash
npm install -g firebase-tools
firebase login
firebase use --add   # select the project you created
firebase deploy --only firestore:rules,storage
```

## 4. Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000, sign in with Google, and upload a WhatsApp
chat export ZIP (Export chat → "Include media" from any WhatsApp chat).

## 5. Deploy

Any Next.js host works (Vercel, Firebase Hosting + Cloud Run/App Hosting,
etc.) — just set the same environment variables there. If you deploy to a
new domain, add it under **Authentication → Settings → Authorized
domains** in the Firebase console, or Google sign-in will be rejected.

## How it works

- Everything runs client-side: the browser unzips the export with
  [JSZip](https://stuk.github.io/jszip/), parses `_chat.txt` into
  structured messages (`src/lib/whatsappParser.ts`), uploads referenced
  media to Firebase Storage under `users/{uid}/threads/{threadId}/media/`,
  and writes the parsed message list as a single `messages.json` to
  Storage plus a thread summary document to Firestore
  (`users/{uid}/threads/{threadId}`).
- Opening a thread fetches `messages.json` and renders it with search and
  inline media playback; nothing is re-parsed after upload.
- No backend server or Cloud Functions are required — Firebase security
  rules enforce that each user can only read/write their own data.

## Known limitations

- The WhatsApp export line-format parser covers the common Android/iOS
  variants but may need tweaks for less common locales/date formats.
- Entire ZIPs are processed in the browser; very large exports (many GB of
  video) may be slow or memory-heavy on low-end devices.
- Day/month date ambiguity (e.g. `01/02/2024`) is resolved assuming
  WhatsApp's non-US `DD/MM/YYYY` convention unless the first number is
  clearly a month (>12).
