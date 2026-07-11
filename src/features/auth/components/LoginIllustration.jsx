import {
  Video,
  Smartphone,
  ShoppingBag,
  ArrowDown,
} from "lucide-react";

export default function LoginIllustration() {
  return (
    <div className="space-y-10">

      <div className="rounded-3xl border border-slate-200 bg-white/50 shadow-sm p-10">

        <div className="flex flex-col items-center gap-5">

          <div className="rounded-2xl bg-slate-100 p-5">
            <ShoppingBag className="size-8 text-cyan-400" />
          </div>

          <ArrowDown className="text-slate-600" />

          <div className="rounded-2xl bg-blue-600 p-5">
            <Video className="size-8" />
          </div>

          <ArrowDown className="text-slate-600" />

          <div className="rounded-2xl bg-slate-100 p-5">
            <Smartphone className="size-8 text-green-400" />
          </div>

        </div>

      </div>

      <div className="space-y-4">

        <Feature text="HD Video Calls" />

        <Feature text="Instant Product Demonstration" />

        <Feature text="Increase Customer Trust" />

      </div>

    </div>
  );
}

function Feature({ text }) {
  return (
    <div className="flex items-center gap-3">

      <div className="size-2 rounded-full bg-cyan-400" />

      <span className="text-slate-700">
        {text}
      </span>

    </div>
  );
}