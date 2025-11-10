"use client";

import Image from "next/image";
import { useState } from "react";
import { fetchValorantProfile } from "../lib/trn";

export default function Home() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setProfile(null);
    if (!username.trim()) return setError("Veuillez saisir un nom d'utilisateur Valorant (ex: Player#TAG)");
    setLoading(true);
    try {
      const data = await fetchValorantProfile(username.trim());
      // The server returns the tracker.gg payload; the useful payload is usually in data.data
      setProfile(data?.data ?? data);
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-start py-16 px-6 bg-white dark:bg-black sm:items-start">
        <div className="w-full max-w-2xl rounded border border-gray-200 p-6">
          <h2 className="text-2xl font-semibold">Rechercher un profil Valorant</h2>
          <form className="mt-4 flex gap-2" onSubmit={onSubmit}>
            <input
              className="flex-1 rounded border px-3 py-2"
              placeholder="Nom d'utilisateur (ex: Player#TAG)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <button className="rounded bg-sky-600 px-4 py-2 text-white" disabled={loading}>
              {loading ? "Recherche..." : "Rechercher"}
            </button>
          </form>

          {error && <div className="mt-4 text-red-600">Erreur: {String(error)}</div>}

          {profile && (
            <div className="mt-6">
              <h3 className="text-lg font-medium">Profil</h3>
              <pre className="mt-2 max-h-64 overflow-auto bg-black/5 p-3 text-sm">{JSON.stringify(profile, null, 2)}</pre>
            </div>
          )}
        </div>

        <div className="mt-8 flex w-full items-center justify-between gap-4">
          <Image
            className="dark:invert"
            src="/next.svg"
            alt="Next.js logo"
            width={100}
            height={20}
            priority
          />
        </div>
      </main>
    </div>
  );
}
