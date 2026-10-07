import cors from "cors";
import dotenv from "dotenv";
import express from "express";

// Primero que cualquier otro uso de process.env a propósito: carga
// apps/api/.env (ANTHROPIC_API_KEY, fase 3 del agente de insights) ANTES de
// que algún módulo lo necesite. Sin .env (todavía no hay key) esto no rompe
// nada — dotenv simplemente no encuentra el archivo y sigue. (Import de
// subruta "dotenv/config" no resuelve con moduleResolution: "node" de este
// proyecto, ver tsconfig.json — por eso el import + config() explícito.)
dotenv.config();
import habitsRouter from "./routes/habits";
import cyclesRouter from "./routes/cycles";
import logsRouter from "./routes/logs";
import journalRouter from "./routes/journal";
import dashboardRouter from "./routes/dashboard";
import authRouter from "./routes/auth";
import libraryRouter from "./routes/library";
import insightsRouter from "./routes/insights";
import goalsRouter from "./routes/goals";

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

app.use("/api/habits", habitsRouter);
app.use("/api/cycles", cyclesRouter);
app.use("/api/logs", logsRouter);
app.use("/api/journal", journalRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/auth", authRouter);
app.use("/api/library", libraryRouter);
app.use("/api/insights", insightsRouter);
app.use("/api/goals", goalsRouter);

app.listen(PORT, () => {
  console.log(`Dr. Axón API escuchando en http://localhost:${PORT}`);
});
