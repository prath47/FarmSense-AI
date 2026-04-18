import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface Props {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  color: string;
  delay?: string;
}

export default function ModuleCard({ title, description, href, icon: Icon, color, delay = "0s" }: Props) {
  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-4 hover:shadow-md hover:-translate-y-1 transition-all duration-300 animate-slide-up group"
      style={{ animationDelay: delay }}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <h3 className="font-semibold text-lg text-gray-800">{title}</h3>
        <p className="text-sm text-gray-500 mt-1 leading-relaxed">{description}</p>
      </div>
      <Link
        href={href}
        className="mt-auto inline-flex items-center justify-center bg-farm-green text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-farm-light transition-all duration-200 active:scale-95"
      >
        Start Chat →
      </Link>
    </div>
  );
}
