"use client";

import Image from "next/image";
import { useState } from "react";
import { fetchValorantProfile } from "../lib/trnClient";

export default function Home() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any | null>(null);

  function populateProfile(data: any) {
    // The tracker.gg response wraps the useful object under `data`.
    // We'll store that object for rendering.
    setProfile(data);
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setProfile(null);
    if (!username.trim()) {
      setError("Veuillez entrer un nom d'utilisateur Valorant, ex: Player#TAG");
      return;
    }

    setLoading(true);
    try {
      const resp = await fetchValorantProfile(username.trim());
      // tracker.gg returns { data: { ... } }
      populateProfile(resp.data);
    } catch (err: any) {
      setError(err?.message || "Erreur lors de la récupération du profil");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-start py-24 px-6 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />

        <h1 className="mt-6 text-2xl font-semibold">Recherche de profil Valorant</h1>

        <form onSubmit={onSubmit} className="mt-6 w-full max-w-lg">
          <label className="block text-sm font-medium text-gray-700">Nom d'utilisateur Valorant</label>
          <div className="mt-2 flex gap-2">
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Player#TAG"
              className="w-full rounded-md border px-3 py-2"
            />
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-4 py-2 text-white"
              disabled={loading}
            >
              {loading ? "Chargement…" : "Rechercher"}
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </form>

        <section className="mt-8 w-full max-w-3xl">
          {profile ? (
            <div className="rounded-md border p-4">
              <h2 className="text-lg font-medium">Profil récupéré</h2>
              <pre className="mt-2 max-h-96 overflow-auto text-sm">{JSON.stringify(profile, null, 2)}</pre>
            </div>
          ) : (
            <p className="mt-6 text-sm text-zinc-600">Aucun profil chargé.</p>
          )}
        </section>
      </main>
    </div>
  );
}
