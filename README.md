# Chat Backup

A website for uploading WhatsApp chat export ZIPs and browsing them: read,
search, play media, and share.

- **Sign-in**: Google (Firebase Authentication)
- **Upload**: a WhatsApp chat export `.zip` (containing `_chat.txt` plus
  photos/videos/voice notes). Each ZIP becomes its own chat thread.
- **Storage**: thread metadata lives in Firestore; media files and the
  parsed chat JSON live in Cloudinary (free tier, no credit card needed —
  see why below), scoped per signed-in user.
- **Viewer**: WhatsApp-style message bubbles, full-text search within a
  thread, inline image/video/audio playback, and a share button on every
  message/media item that uses the device's native share sheet (forward to
  WhatsApp, email, etc.), falling back to download/copy where unsupported.
- **Dashboard**: selecting a chat opens a summary page first — message/date
  stats, most active participants, a "Highlights" strip of recently added
  items, a photo grid, and a videos/voice-notes list — with a button to open
  the full searchable message view.
- **Public share links**: from a chat's dashboard, "Share chat" creates an
  unguessable link that shows that one chat (read-only, no sign-in needed)
  to anyone who has it. "Stop sharing" revokes it immediately.

## Why Cloudinary instead of Firebase Storage?

Google now requires the paid "Blaze" plan to enable Cloud Storage for
Firebase at all, even for usage that stays within the free quota. To keep
this app fully free with no card on file, media and the parsed chat JSON
are stored in [Cloudinary](https://cloudinary.com) instead, uploaded
directly from the browser via an unsigned upload preset. Firebase is still
used for Google sign-in and for the lightweight Firestore metadata (thread
names, participant lists, counts).

## 1. Create a Firebase project (for sign-in + metadata)

1. Go to the [Firebase console](https://console.firebase.google.com/) and
   create a new project.
2. **Authentication** → *Sign-in method* → enable **Google**.
3. **Firestore Database** → *Create database* (production mode is fine —
   this repo ships a security rules file, see below).
4. **Project settings** (gear icon) → *Your apps* → click the web icon
   (`</>`) → register an app → copy the `firebaseConfig` object shown.

These values are public client identifiers, not secrets — real access
control comes from `firestore.rules` in this repo, which restricts every
user to their own `users/{uid}/...` documents.

## 2. Create a free Cloudinary account (for media storage)

1. Sign up at [cloudinary.com](https://cloudinary.com/users/register/free)
   — free, no credit card required.
2. On your **Dashboard**, copy your **Cloud Name**.
3. Go to **Settings → Upload → Upload presets → Add upload preset**:
   - Set **Signing Mode** to **Unsigned** (lets the browser upload directly
     without exposing any secret key).
   - Save it and copy the **preset name**.

## 3. Configure the app

```bash
cp .env.local.example .env.local
```

Fill in `.env.local` with the Firebase config values from step 1 and the
Cloudinary Cloud Name + upload preset from step 2.

`NEXT_PUBLIC_MAX_MEDIA_MB` (default `50`) caps how large an individual
media file can be before it's skipped during upload, to stay comfortably
within Cloudinary's free-tier quota.

## 4. Deploy Firestore security rules

Install the Firebase CLI once, then deploy the rules in this repo:

```bash
npm install -g firebase-tools
firebase login
firebase use --add   # select the project you created
firebase deploy --only firestore:rules
```

## 5. Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000, sign in with Google, and upload a WhatsApp
chat export ZIP (Export chat → "Include media" from any WhatsApp chat).

## 6. Deploy to GitHub Pages

This repo is set up to deploy automatically to GitHub Pages:

1. In the repo's **Settings → Pages**, set **Source** to **GitHub Actions**
   (one-time setup).
2. Push to `main` — `.github/workflows/deploy.yml` builds a static export
   (`output: "export"` in `next.config.ts`) using the config baked into
   `.env.production`, and publishes it to Pages.
3. Add your Pages URL (e.g. `https://<you>.github.io`) to **Authentication
   → Settings → Authorized domains** in the Firebase console, or Google
   sign-in will fail there.

`.env.production` contains the same kind of public client identifiers as
`.env.local` (see above) — not secrets — which is why it's committed and
usable directly by CI with no extra secrets setup. If you change Firebase
or Cloudinary projects, update both `.env.local` (for local dev) and
`.env.production` (for the deployed site).

Any other static host (Vercel, Netlify, Firebase App Hosting, etc.) also
works — just run a normal `next build` (without `GITHUB_PAGES=true`, so
`basePath` stays empty) and set the same environment variables there. As
with GitHub Pages, add whatever domain you deploy to under Firebase's
Authorized domains.

## How it works

- Everything runs client-side: the browser unzips the export with
  [JSZip](https://stuk.github.io/jszip/), parses `_chat.txt` into
  structured messages (`src/lib/whatsappParser.ts`), uploads referenced
  media straight to Cloudinary under `chat-backup/{uid}/{threadId}/media/`
  via an unsigned upload preset (`src/lib/cloudinary.ts`), and uploads the
  parsed message list as a single `messages.json` alongside it. A thread
  summary document (name, participants, counts, the `messages.json` URL)
  is written to Firestore at `users/{uid}/threads/{threadId}`.
- Opening a thread fetches `messages.json` directly from Cloudinary and
  renders it with search and inline media playback; nothing is re-parsed
  after upload.
- No backend server or Cloud Functions are required — Firestore security
  rules enforce that each user can only read/write their own metadata, and
  each user's Cloudinary uploads live under their own uid-prefixed folder.
- A share link (`/share/?id={threadId}`) works by writing a `shares/{threadId}`
  Firestore document (`src/lib/share.ts`) pointing at that thread's
  `messages.json`. `firestore.rules` lets anyone read a `shares` doc (the
  link itself, built from the thread's unguessable ID, is the access
  control) but only the owning user create/update/delete it. "Stop sharing"
  deletes the doc, which immediately breaks the link.

## Known limitations

- The WhatsApp export line-format parser covers the common Android/iOS
  variants but may need tweaks for less common locales/date formats.
- Entire ZIPs are processed in the browser; very large exports (many GB of
  video) may be slow or memory-heavy on low-end devices.
- Day/month date ambiguity (e.g. `01/02/2024`) is resolved assuming
  WhatsApp's non-US `DD/MM/YYYY` convention unless the first number is
  clearly a month (>12).
- Cloudinary's unsigned upload preset scopes uploads by folder convention
  rather than per-user auth, since Cloudinary doesn't verify a Firebase ID
  token itself. Anyone with a thread's Cloudinary URLs could view that
  media directly — fine for personal backups, but don't treat it as a
  strict access-control boundary the way the Firestore rules are.
