"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Trip = { _id: string; destination: string; days: number; budgetType: string; createdAt: string };

export default function DashboardPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Trip[]>("/api/trips")
      .then(setTrips)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your Trips</h1>
        <Link href="/trip/new" className="rounded bg-indigo-600 px-4 py-2">New Trip</Link>
      </div>
      {error && <p className="text-rose-400">{error}</p>}
      <div className="grid gap-3">
        {trips.map((trip) => (
          <Link key={trip._id} href={`/trip/${trip._id}`} className="rounded border border-slate-800 p-4 hover:bg-slate-900">
            <p className="text-lg font-medium">{trip.destination}</p>
            <p className="text-sm text-slate-400">{trip.days} days - {trip.budgetType} budget</p>
          </Link>
        ))}
        {!trips.length && !error && <p className="text-slate-400">No trips yet. Create your first one.</p>}
      </div>
    </section>
  );
}
