import { Leaf, Droplets, FlaskConical } from "lucide-react";
import ModuleCard from "@/components/dashboard/ModuleCard";
import FinanceSummary from "@/components/dashboard/FinanceSummary";

const modules = [
  { title: "Crop Doctor", description: "Upload a photo or describe symptoms to diagnose plant diseases and get organic treatment recommendations.", href: "/chat/crop-doctor", icon: Leaf, color: "bg-green-600", delay: "0s" },
  { title: "Irrigation Advisor", description: "Get precision watering schedules based on your crop type, soil, and real-time local weather data.", href: "/chat/irrigation", icon: Droplets, color: "bg-blue-500", delay: "0.1s" },
  { title: "Soil Health Advisor", description: "Analyse your soil, get cover crop recommendations, and design 3-season crop rotation plans.", href: "/chat/soil-health", icon: FlaskConical, color: "bg-amber-600", delay: "0.2s" },
];

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto page-enter">
      <div className="mb-8 animate-slide-up">
        <h2 className="text-2xl font-bold text-gray-800">Welcome to FarmSense AI</h2>
        <p className="text-gray-500 mt-1">Your intelligent farming companion — powered by Gemini AI</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {modules.map((m) => <ModuleCard key={m.href} {...m} />)}
      </div>
      <div className="mt-8 animate-slide-up" style={{ animationDelay: "0.3s" }}>
        <h3 className="text-lg font-semibold text-gray-700 mb-1">Finance Snapshot</h3>
        <p className="text-sm text-gray-400">Live from your finance tracker</p>
        <FinanceSummary />
      </div>
    </div>
  );
}
