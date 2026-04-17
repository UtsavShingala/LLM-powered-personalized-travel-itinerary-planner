"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function NewTripPage() {
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState(3);
  const [budgetType, setBudgetType] = useState<"Low" | "Medium" | "High">("Medium");
  const [interests, setInterests] = useState("Food,Culture");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const trip = await api<{ _id: string }>("/api/trips", {
        method: "POST",
        body: JSON.stringify({
          destination,
          days,
          budgetType,
          interests: interests.split(",").map((s) => s.trim()).filter(Boolean)
        })
      });
      router.push(`/trip/${trip._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create trip");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Create New Trip</h1>
      <form className="space-y-4 rounded border border-slate-800 p-5" onSubmit={submit}>
        <input className="w-full rounded bg-slate-900 p-2" placeholder="Destination" value={destination} onChange={(e) => setDestination(e.target.value)} required />
        <input className="w-full rounded bg-slate-900 p-2" type="number" min={1} max={21} value={days} onChange={(e) => setDays(Number(e.target.value))} required />
        <select className="w-full rounded bg-slate-900 p-2" value={budgetType} onChange={(e) => setBudgetType(e.target.value as "Low" | "Medium" | "High")}>
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>
        <input className="w-full rounded bg-slate-900 p-2" placeholder="Interests comma-separated" value={interests} onChange={(e) => setInterests(e.target.value)} required />
        {error && <p className="text-sm text-rose-400">{error}</p>}
        <button className="rounded bg-indigo-600 px-4 py-2" disabled={loading}>{loading ? "Generating..." : "Generate Itinerary"}</button>
      </form>
    </section>
  );
}
