"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";

type Trip = {
  _id: string;
  destination: string;
  days: number;
  itinerary: Array<{ day: number; activities: string[] }>;
  budgetEstimate: { flights: number; accommodation: number; food: number; activities: number; transport: number; total: number };
  hotelSuggestions: string[];
  packingChecklist: string[];
};

export default function TripDetailsPage() {
  const params = useParams<{ id: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [newActivity, setNewActivity] = useState("");
  const [day, setDay] = useState(1);
  const [regenInstruction, setRegenInstruction] = useState("more outdoor activities");
  const [error, setError] = useState("");

  const id = useMemo(() => params.id, [params.id]);

  async function load() {
    try {
      setTrip(await api<Trip>(`/api/trips/${id}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load trip");
    }
  }

  useEffect(() => {
    if (id) load();
  }, [id]);

  async function addActivity() {
    const updated = await api<Trip>(`/api/trips/${id}/activities`, {
      method: "POST",
      body: JSON.stringify({ day, activity: newActivity })
    });
    setTrip(updated);
    setNewActivity("");
  }

  async function removeActivity(activity: string, d: number) {
    const updated = await api<Trip>(`/api/trips/${id}/activities`, {
      method: "DELETE",
      body: JSON.stringify({ day: d, activity })
    });
    setTrip(updated);
  }

  async function regenerateDay() {
    const updated = await api<Trip>(`/api/trips/${id}/regenerate-day`, {
      method: "POST",
      body: JSON.stringify({ day, instruction: regenInstruction })
    });
    setTrip(updated);
  }

  if (!trip) return <p>{error || "Loading trip..."}</p>;

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold">{trip.destination} itinerary</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded border border-slate-800 p-4">
          <h2 className="mb-2 font-semibold">Budget Estimate</h2>
          <p>Flights: ${trip.budgetEstimate.flights}</p>
          <p>Accommodation: ${trip.budgetEstimate.accommodation}</p>
          <p>Food: ${trip.budgetEstimate.food}</p>
          <p>Activities: ${trip.budgetEstimate.activities}</p>
          <p>Transport: ${trip.budgetEstimate.transport}</p>
          <p className="font-semibold">Total: ${trip.budgetEstimate.total}</p>
        </div>

        <div className="rounded border border-slate-800 p-4">
          <h2 className="mb-2 font-semibold">Hotel Suggestions</h2>
          <ul className="list-disc space-y-1 pl-5">
            {trip.hotelSuggestions.map((hotel) => <li key={hotel}>{hotel}</li>)}
          </ul>
        </div>
      </div>

      <div className="rounded border border-slate-800 p-4">
        <h2 className="mb-2 font-semibold">Packing Checklist (Custom Feature)</h2>
        <ul className="list-disc space-y-1 pl-5">
          {trip.packingChecklist.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </div>

      <div className="rounded border border-slate-800 p-4">
        <h2 className="mb-3 font-semibold">Edit Itinerary</h2>
        <div className="mb-4 flex flex-wrap gap-2">
          <input type="number" min={1} max={trip.days} className="rounded bg-slate-900 p-2" value={day} onChange={(e) => setDay(Number(e.target.value))} />
          <input className="min-w-60 flex-1 rounded bg-slate-900 p-2" value={newActivity} onChange={(e) => setNewActivity(e.target.value)} placeholder="New activity" />
          <button className="rounded bg-indigo-600 px-3" onClick={addActivity}>Add</button>
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          <input className="min-w-72 flex-1 rounded bg-slate-900 p-2" value={regenInstruction} onChange={(e) => setRegenInstruction(e.target.value)} />
          <button className="rounded bg-amber-600 px-3" onClick={regenerateDay}>Regenerate Day</button>
        </div>

        <div className="space-y-3">
          {trip.itinerary.map((entry) => (
            <div key={entry.day} className="rounded bg-slate-900 p-3">
              <p className="mb-2 font-medium">Day {entry.day}</p>
              <ul className="space-y-1">
                {entry.activities.map((activity) => (
                  <li key={`${entry.day}-${activity}`} className="flex items-center justify-between gap-2 rounded bg-slate-800 px-2 py-1">
                    <span>{activity}</span>
                    <button className="rounded bg-rose-700 px-2 text-sm" onClick={() => removeActivity(activity, entry.day)}>Remove</button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
