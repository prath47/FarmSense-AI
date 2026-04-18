import "dotenv/config";
import express from "express";
import cors from "cors";
import authRouter from "./routes/auth";
import chatRouter from "./routes/chat";
import weatherRouter from "./routes/weather";
import trackerRouter from "./routes/tracker";
import alertsRouter from "./routes/alerts";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json({ limit: "20mb" }));

app.use("/api/auth", authRouter);
app.use("/api/chat", chatRouter);
app.use("/api/weather", weatherRouter);
app.use("/api/tracker", trackerRouter);
app.use("/api/alerts", alertsRouter);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`FarmSense backend running on http://localhost:${PORT}`);
});
