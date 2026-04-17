import { Schema, model } from "mongoose";

const dayPlanSchema = new Schema(
  {
    day: { type: Number, required: true },
    activities: [{ type: String, required: true }]
  },
  { _id: false }
);

const budgetSchema = new Schema(
  {
    flights: { type: Number, required: true },
    accommodation: { type: Number, required: true },
    food: { type: Number, required: true },
    activities: { type: Number, required: true },
    transport: { type: Number, required: true },
    total: { type: Number, required: true }
  },
  { _id: false }
);

const tripSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    destination: { type: String, required: true },
    days: { type: Number, required: true },
    budgetType: { type: String, enum: ["Low", "Medium", "High"], required: true },
    interests: [{ type: String, required: true }],
    itinerary: [dayPlanSchema],
    budgetEstimate: budgetSchema,
    hotelSuggestions: [{ type: String, required: true }],
    packingChecklist: [{ type: String, required: true }],
    notes: { type: String, default: "" }
  },
  { timestamps: true }
);

export const Trip = model("Trip", tripSchema);
