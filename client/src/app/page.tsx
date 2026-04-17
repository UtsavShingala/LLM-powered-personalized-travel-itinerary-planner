import Link from "next/link";

export default function HomePage() {
  return (
    <section className="space-y-6 py-16 text-center">
      <h1 className="text-4xl font-bold">AI-Powered Personalized Travel Itinerary Planner</h1>
      <p className="mx-auto max-w-2xl text-slate-300">
        Build complete travel plans with day-by-day activities, budget estimation, hotel suggestions, and easy itinerary editing.
      </p>
      <div className="flex justify-center gap-3">
        <Link href="/login" className="rounded bg-indigo-500 px-5 py-2 font-medium text-white">
          Start Planning
        </Link>
        <Link href="/dashboard" className="rounded border border-slate-700 px-5 py-2 font-medium text-slate-200">
          Dashboard
        </Link>
      </div>
    </section>
  );
}
