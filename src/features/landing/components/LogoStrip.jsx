import { motion } from "framer-motion";
import {
  Building2,
  Sparkles,
  ShoppingBag,
  Globe,
  ShieldCheck,
  Zap,
  Layers,
  Hexagon,
  Triangle,
  CircleDot,
} from "lucide-react";

const BRANDS = [
  { name: "Apex Retail", icon: Building2, stat: "4.8x Video ROI" },
  { name: "Lumina Global", icon: Sparkles, stat: "38ms Response" },
  { name: "Verve Luxury", icon: ShoppingBag, stat: "+45% AOV Boost" },
  { name: "Orion Commerce", icon: Globe, stat: "100k+ Live Calls" },
  { name: "Sentinel Direct", icon: ShieldCheck, stat: "SOC 2 Verified" },
  { name: "Kinetix Gear", icon: Zap, stat: "98.4% CSAT" },
  { name: "Strata Design", icon: Layers, stat: "Live Cart Sync" },
  { name: "Hexa Apparel", icon: Hexagon, stat: "Shopify Plus" },
  { name: "Prism Collective", icon: Triangle, stat: "Enterprise Plan" },
  { name: "Nova Home", icon: CircleDot, stat: "Sub-Second SIP" },
];

export default function LogoStrip() {
  // Duplicate for seamless infinite loop
  const marqueeItems = [...BRANDS, ...BRANDS];

  return (
    <section className="bg-[#F8FAFC] py-10 border-y border-slate-200/60 relative overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-6 mb-6 text-center">
        <span className="inline-block text-[11px] font-bold text-blue-600 uppercase tracking-[0.2em] bg-blue-50/80 border border-blue-200/70 px-4 py-1.5 rounded-full shadow-sm">
          Trusted by high-growth brands and enterprise support teams
        </span>
      </div>

      {/* Infinite Scrolling Ticker Track */}
      <div className="relative w-full overflow-hidden flex items-center">
        {/* Left Edge Gradient Blur Fade */}
        <div className="absolute left-0 top-0 bottom-0 w-24 sm:w-40 bg-gradient-to-r from-[#F8FAFC] to-transparent z-10 pointer-events-none" />

        {/* Moving Ticker Rail */}
        <motion.div
          className="flex items-center gap-6 shrink-0"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            duration: 28,
            ease: "linear",
            repeat: Infinity,
          }}
        >
          {marqueeItems.map((brand, i) => {
            const Icon = brand.icon;
            return (
              <div
                key={`${brand.name}-${i}`}
                className="flex items-center gap-3 bg-white border border-slate-200/70 rounded-xl px-5 py-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5 group shrink-0"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">
                    {brand.name}
                  </p>
                  <p className="text-[9px] font-semibold text-slate-400 tracking-wide">
                    {brand.stat}
                  </p>
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Right Edge Gradient Blur Fade */}
        <div className="absolute right-0 top-0 bottom-0 w-24 sm:w-40 bg-gradient-to-l from-[#F8FAFC] to-transparent z-10 pointer-events-none" />
      </div>
    </section>
  );
}
