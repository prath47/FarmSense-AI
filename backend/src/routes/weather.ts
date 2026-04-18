import { Router, Request, Response } from "express";
import { getWeather } from "../services/weatherService";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  const { lat, lon } = req.query as { lat: string; lon: string };
  if (!lat || !lon) {
    res.status(400).json({ error: "lat and lon required" });
    return;
  }
  try {
    const weather = await getWeather(parseFloat(lat), parseFloat(lon));
    res.json(weather);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch weather" });
  }
});

export default router;
