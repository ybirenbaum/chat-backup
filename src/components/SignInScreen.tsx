"use client";

import { useAuth } from "@/context/AuthContext";
import { firebaseConfigured } from "@/lib/firebase";

export default function SignInScreen() {
  const { signIn } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-50 px-4 text-center dark:bg-neutral-950">
      <div className="flex flex-col items-center gap-2">
        <div className="text-4xl">💬</div>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          Chat Backup
        </h1>
        <p className="max-w-sm text-sm text-neutral-500 dark:text-neutral-400">
          Sign in to upload WhatsApp chat exports and browse, search, play
          and share their messages, photos and videos.
        </p>
      </div>

      {!firebaseConfigured ? (
        <div className="max-w-md rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          Firebase isn&apos;t configured yet. Set the{" "}
          <code>NEXT_PUBLIC_FIREBASE_*</code> environment variables (see{" "}
          <code>.env.local.example</code>) and restart the app.
        </div>
      ) : (
        <button
          onClick={() => signIn()}
          className="flex items-center gap-3 rounded-full border border-neutral-300 bg-white px-6 py-3 font-medium text-neutral-800 shadow-sm transition hover:shadow-md dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path
              fill="#FFC107"
              d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
            />
            <path
              fill="#FF3D00"
              d="M6.3 14.7l6.6 4.8C14.6 16 18.9 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4c-7.4 0-13.8 4.1-17.1 10.1z"
            />
            <path
              fill="#4CAF50"
              d="M24 44c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.6C29.6 35.4 26.9 36.4 24 36.4c-5.2 0-9.6-3.3-11.3-8l-6.6 5.1C9.9 39.6 16.4 44 24 44z"
            />
            <path
              fill="#1976D2"
              d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.6 5.6C40.9 36.6 44 30.9 44 24c0-1.3-.1-2.7-.4-3.5z"
            />
          </svg>
          Sign in with Google
        </button>
      )}
    </div>
  );
}
