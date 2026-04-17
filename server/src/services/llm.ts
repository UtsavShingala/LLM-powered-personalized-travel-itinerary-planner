import OpenAI from "openai";

type TripInput = {
  destination: string;
  days: number;
  budgetType: "Low" | "Medium" | "High";
  interests: string[];
};

type TripOutput = {
  itinerary: Array<{ day: number; activities: string[] }>;
  budgetEstimate: {
    flights: number;
    accommodation: number;
    food: number;
    activities: number;
    transport: number;
    total: number;
  };
  hotelSuggestions: string[];
  packingChecklist: string[];
};

function createOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;
  const baseURL = process.env.OPENAI_BASE_URL?.trim();
  return new OpenAI({
    apiKey,
    ...(baseURL ? { baseURL } : {})
  });
}

const openai = createOpenAIClient();

function destinationSeed(destination: string): number {
  const s = destination.trim().toLowerCase();
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function destinationCostIndex(destination: string): number {
  const d = destination.trim().toLowerCase();

  const expensive =
    /tokyo|osaka|kyoto|paris|london|zurich|geneva|new york|nyc|san francisco|los angeles|singapore|dubai|sydney|melbourne|copenhagen|reykjavik|honolulu|maui|maldives|seychelles/;
  const moderate =
    /rome|milan|barcelona|madrid|amsterdam|berlin|munich|vienna|prague|lisbon|dublin|toronto|vancouver|seoul|taipei|hong kong|shanghai|beijing/;
  const budget =
    /bangkok|chiang|phuket|bali|jakarta|hanoi|ho chi minh|manila|kathmandu|cairo|marrakech|budapest|krakow|warsaw|lima|bogot[aá]|mexico city|goa|delhi|mumbai/;

  if (expensive.test(d)) return 1.45 + (destinationSeed(d) % 17) / 200;
  if (budget.test(d)) return 0.72 + (destinationSeed(d) % 13) / 200;
  if (moderate.test(d)) return 1.05 + (destinationSeed(d) % 15) / 200;
  return 0.92 + (destinationSeed(d) % 21) / 200;
}

function budgetPreferenceMultiplier(budgetType: TripInput["budgetType"]): number {
  if (budgetType === "Low") return 0.82;
  if (budgetType === "High") return 1.28;
  return 1;
}

function pick<T>(arr: T[], seed: number, i: number): T {
  return arr[(seed + i * 17) % arr.length];
}

function buildFallbackItinerary(input: TripInput): TripOutput["itinerary"] {
  const dest = input.destination.trim();
  const seed = destinationSeed(dest);
  const interest = input.interests[0] ?? "local culture";

  const morningPools = [
    `Iconic landmark and viewpoint in ${dest}`,
    `Historic quarter walking tour in ${dest}`,
    `Local market morning visit in ${dest}`,
    `Museum or gallery block in ${dest}`,
    `Scenic neighborhood orientation in ${dest}`
  ];
  const middayPools = [
    `${interest}-focused lunch spot and nearby sights in ${dest}`,
    `Signature local dish crawl in ${dest}`,
    `Guided or self-guided cultural deep-dive in ${dest}`,
    `Outdoor viewpoint or park time in ${dest}`,
    `Artisan quarter and specialty shops in ${dest}`
  ];
  const eveningPools = [
    `Sunset viewpoint or waterfront stroll in ${dest}`,
    `Evening food street or night market in ${dest}`,
    `Live music or theater district in ${dest}`,
    `Rooftop or skyline viewpoint in ${dest}`,
    `Relaxed neighborhood dinner in ${dest}`
  ];

  return Array.from({ length: input.days }, (_, i) => ({
    day: i + 1,
    activities: [
      pick(morningPools, seed, i),
      pick(middayPools, seed, i + 3),
      pick(eveningPools, seed, i + 7)
    ]
  }));
}

function buildFallbackHotels(destination: string): string[] {
  const d = destination.trim();
  const seed = destinationSeed(d);
  const districts = [
    "Old Town",
    "Central Station",
    "Waterfront",
    "Arts Quarter",
    "Market District",
    "Hillside",
    "Harbor",
    "Cathedral Quarter",
    "Garden District",
    "Uptown"
  ];
  const a = pick(districts, seed, 0);
  const b = pick(districts, seed, 2);
  const c = pick(districts, seed, 4);
  return [
    `${a} Inn ${d} — budget pick, strong guest reviews`,
    `${b} Hotel ${d} — mid-range, walkable area`,
    `${c} Grand ${d} — upscale stay, premium amenities`
  ];
}

function buildFallbackBudget(input: TripInput): TripOutput["budgetEstimate"] {
  const days = input.days;
  const city = destinationCostIndex(input.destination);
  const pref = budgetPreferenceMultiplier(input.budgetType);
  const seed = destinationSeed(input.destination);
  const jitter = 0.92 + ((seed % 19) / 100);

  const baseFlight = 180 + (seed % 280) + days * 22;
  const baseAccNight = 55 + (seed % 45);
  const baseFoodDay = 22 + ((seed >> 3) % 28);
  const baseActDay = 18 + ((seed >> 5) % 22);
  const baseTransDay = 10 + ((seed >> 7) % 14);

  const flights = Math.round(baseFlight * city * pref * jitter);
  const accommodation = Math.round(days * baseAccNight * city * pref * jitter);
  const food = Math.round(days * baseFoodDay * city * pref * jitter);
  const activities = Math.round(days * baseActDay * city * pref * jitter);
  const transport = Math.round(days * baseTransDay * city * pref * jitter);
  const total = flights + accommodation + food + activities + transport;

  return { flights, accommodation, food, activities, transport, total };
}

function fallbackPlan(input: TripInput): TripOutput {
  const budgetEstimate = buildFallbackBudget(input);
  return {
    itinerary: buildFallbackItinerary(input),
    budgetEstimate,
    hotelSuggestions: buildFallbackHotels(input.destination),
    packingChecklist: [
      "Passport and travel documents",
      "Comfortable walking shoes",
      input.interests.some((i) => /adventure|hike|outdoor/i.test(i))
        ? "Light layers and daypack"
        : "Compact day bag",
      "Universal adapter and portable charger",
      "Reusable water bottle",
      destinationCostIndex(input.destination) > 1.2
        ? "Extra card/cash buffer for higher cost of living"
        : "Local currency or travel card"
    ]
  };
}

function normalizePlan(raw: unknown, input: TripInput): TripOutput | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;

  const itineraryRaw = o.itinerary;
  if (!Array.isArray(itineraryRaw)) return null;

  const itinerary: TripOutput["itinerary"] = itineraryRaw.map((day, idx) => {
    if (!day || typeof day !== "object") return { day: idx + 1, activities: [] };
    const d = day as Record<string, unknown>;
    const dayNum = typeof d.day === "number" ? d.day : idx + 1;
    const acts = Array.isArray(d.activities)
      ? d.activities.filter((a): a is string => typeof a === "string")
      : [];
    return { day: dayNum, activities: acts };
  });

  const b = o.budgetEstimate;
  if (!b || typeof b !== "object") return null;
  const be = b as Record<string, unknown>;
  const nums = ["flights", "accommodation", "food", "activities", "transport", "total"] as const;
  const budgetEstimate = {} as TripOutput["budgetEstimate"];
  for (const k of nums) {
    const v = be[k];
    const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
    if (!Number.isFinite(n)) return null;
    budgetEstimate[k] = Math.round(n);
  }

  const hotels = o.hotelSuggestions;
  if (
    !Array.isArray(hotels) ||
    !hotels.every((h): h is string => typeof h === "string")
  )
    return null;

  const packing = o.packingChecklist;
  if (
    !Array.isArray(packing) ||
    !packing.every((p): p is string => typeof p === "string")
  )
    return null;

  const sum =
    budgetEstimate.flights +
    budgetEstimate.accommodation +
    budgetEstimate.food +
    budgetEstimate.activities +
    budgetEstimate.transport;
  if (Math.abs(sum - budgetEstimate.total) > Math.max(25, sum * 0.05)) {
    budgetEstimate.total = sum;
  }

  if (itinerary.length !== input.days) return null;

  return {
    itinerary,
    budgetEstimate,
    hotelSuggestions: hotels.slice(0, 8),
    packingChecklist: packing.slice(0, 12)
  };
}

const SYSTEM_PROMPT = `You are a travel planning assistant. Output valid JSON only (no markdown).

Rules:
- Tailor EVERYTHING to the specific destination: real neighborhoods, real landmarks, realistic daily rhythm.
- budgetEstimate must use approximate USD for THAT destination's typical costs (flights from a generic US origin unless user specifies otherwise).
- hotelSuggestions: 3 hotels that are REAL, well-known properties in that destination (include recognizable names). One budget-friendly, one mid-range, one luxury. Short label after em dash is fine.
- itinerary: exactly one object per day; day numbers 1..N; 3-4 concrete activities per day (named places where possible).
- packingChecklist: 5-8 practical items considering climate and activities.
- total must equal flights + accommodation + food + activities + transport (within $5).`;

export async function generateTripPlan(input: TripInput): Promise<TripOutput> {
  if (!openai) return fallbackPlan(input);

  const userPrompt = `Plan a trip as JSON with this exact shape:
{
  "itinerary": [{"day": number, "activities": string[]}],
  "budgetEstimate": {"flights": number, "accommodation": number, "food": number, "activities": number, "transport": number, "total": number},
  "hotelSuggestions": string[],
  "packingChecklist": string[]
}

Trip inputs:
- Destination: ${input.destination}
- Days: ${input.days}
- Budget preference: ${input.budgetType} (scale activities/hotels accordingly)
- Interests: ${input.interests.join(", ")}

Requirements:
- itinerary length must be exactly ${input.days} days.
- Make the plan unmistakably specific to ${input.destination} (not generic).`;

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  try {
    const response = await openai.chat.completions.create({
      model,
      temperature: 0.75,
      ...(model.toLowerCase().includes("gpt") ? { response_format: { type: "json_object" as const } } : {}),
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt }
      ]
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return fallbackPlan(input);

    const parsed = JSON.parse(content) as unknown;
    const normalized = normalizePlan(parsed, input);
    if (normalized) return normalized;
    return fallbackPlan(input);
  } catch (err) {
    console.error("LLM trip generation failed, using destination-aware fallback:", err);
    return fallbackPlan(input);
  }
}