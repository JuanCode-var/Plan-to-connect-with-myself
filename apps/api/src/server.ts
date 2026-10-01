import cors from "cors";
import express from "express";
import habitsRouter from "./routes/habits";
import cyclesRouter from "./routes/cycles";
import logsRouter from "./routes/logs";
import journalRouter from "./routes/journal";
import dashboardRouter from "./routes/dashboard";
import authRouter from "./routes/auth";
import libraryRouter from "./routes/library";

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

app.listen(PORT, () => {
  console.log(`Dr. Axón API escuchando en http://localhost:${PORT}`);
});
