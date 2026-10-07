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
import { requireAuth } from "./middleware/requireAuth";

const app = express();
// Configurable por `.env` (PORT=...) para que cada dispositivo pueda usar
// el suyo sin tocar código — 5000 es el default porque 4000 ya estaba
// ocupado en otro de los dispositivos donde corre esta app.
const PORT = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());

// /api/auth queda afuera a propósito (register/login todavía no tienen
// sesión que verificar). Todo lo demás pasa por requireAuth primero: es lo
// que hace cumplir que cada cuenta solo vea/edite sus propios datos.
app.use("/api/auth", authRouter);
app.use("/api/habits", requireAuth, habitsRouter);
app.use("/api/cycles", requireAuth, cyclesRouter);
app.use("/api/logs", requireAuth, logsRouter);
app.use("/api/journal", requireAuth, journalRouter);
app.use("/api/dashboard", requireAuth, dashboardRouter);
app.use("/api/library", requireAuth, libraryRouter);
app.use("/api/insights", requireAuth, insightsRouter);
app.use("/api/goals", requireAuth, goalsRouter);

app.listen(PORT, () => {
  console.log(`Dr. Axón API escuchando en http://localhost:${PORT}`);
});
