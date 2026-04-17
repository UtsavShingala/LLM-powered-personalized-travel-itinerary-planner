import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js";
import tripRoutes from "./routes/trips.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 8080);

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN?.split(",") ?? ["http://localhost:3000"],
    credentials: true
  })
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/trips", tripRoutes);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

async function bootstrap(): Promise<void> {
  const mongoUri = process.env.MONGO_URI;
  const jwt = process.env.JWT_SECRET;

  if (!mongoUri || !jwt) {
    throw new Error("Missing required environment variables: MONGO_URI, JWT_SECRET");
  }

  await mongoose.connect(mongoUri);
  const host = process.env.HOST || "0.0.0.0";
  app.listen(port, host, () => {
    console.log(`Server listening on http://${host}:${port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
