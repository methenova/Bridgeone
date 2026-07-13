import { Link } from "react-router-dom";
import {
  Video,
  Zap,
  BarChart3,
  Globe,
  MessageSquare,
  ShoppingBag,
  CheckCircle,
  ArrowRight,
  Star,
  PlayCircle,
  Code2,
  Bell,
  Users,
} from "lucide-react";

// ─── Feature card ─────────────────────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, description, gradient }) {
  return (
    <div className="group relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10">
      <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${gradient} shadow-md`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <h3 className="mb-2 text-base font-semibold text-slate-900">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-500">{description}</p>
    </div>
  );
}

// ─── Step card ────────────────────────────────────────────────────────────────
function StepCard({ number, title, description }) {
  return (
    <div className="flex gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white shadow-md">
        {number}
      </div>
      <div>
        <h3 className="mb-1 text-base font-semibold text-slate-900">{title}</h3>
        <p className="text-sm leading-relaxed text-slate-500">{description}</p>
      </div>
    </div>
  );
}

// ─── Stat ─────────────────────────────────────────────────────────────────────
function Stat({ value, label }) {
  return (
    <div className="text-center">
      <p className="text-3xl font-extrabold text-blue-600">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </div>
  );
}

// ─── Main Landing Page ────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="bg-white">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 pb-24 pt-20 text-white">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-blue-600/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-indigo-600/15 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-5xl px-6 text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-medium text-blue-300">
            <Zap className="h-3 w-3" />
            Embed in 5 minutes · Works with Shopify &amp; any website
          </div>

          <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Turn browsers into buyers with{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              live video selling
            </span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-slate-400">
            BridgeOne drops a one-click video call widget onto your existing store.
            Customers call you instantly. You show products, answer questions, and close deals — all in real time.
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-500 hover:shadow-blue-500/40 hover:-translate-y-0.5"
            >
              Start for free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
            >
              <PlayCircle className="h-4 w-4" />
              See it in action
            </Link>
          </div>

          {/* Hero mockup */}
          <div className="mt-16 mx-auto max-w-3xl">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-800/60 shadow-2xl shadow-black/40 backdrop-blur-sm">
              {/* Fake browser bar */}
              <div className="flex items-center gap-2 border-b border-white/10 bg-slate-900/80 px-4 py-3">
                <div className="h-3 w-3 rounded-full bg-red-500/80" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <div className="h-3 w-3 rounded-full bg-green-500/80" />
                <div className="ml-4 flex-1 rounded-md bg-slate-700/60 px-3 py-1 text-xs text-slate-400">
                  yourshopify-store.com/products/air-max
                </div>
              </div>
              {/* Fake page content with floating widget */}
              <div className="relative h-48 bg-gradient-to-br from-slate-800 to-slate-900 p-6">
                <div className="flex gap-4">
                  <div className="h-32 w-32 rounded-xl bg-slate-700/60" />
                  <div className="flex-1 space-y-2 pt-2">
                    <div className="h-4 w-48 rounded bg-slate-600/60" />
                    <div className="h-3 w-32 rounded bg-slate-700/60" />
                    <div className="h-3 w-56 rounded bg-slate-700/60" />
                    <div className="mt-4 h-8 w-28 rounded-lg bg-blue-600/40" />
                  </div>
                </div>
                {/* Floating widget button */}
                <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 shadow-lg shadow-blue-600/40 animate-pulse">
                  <Video className="h-4 w-4 text-white" />
                  <span className="text-xs font-semibold text-white">Talk to us live</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────────── */}
      <section className="border-b border-slate-100 bg-slate-50 py-12">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            <Stat value="3x" label="Higher conversion rate" />
            <Stat value="5 min" label="Setup time" />
            <Stat value="100%" label="Works on any store" />
            <Stat value="24/7" label="Call monitoring" />
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-extrabold text-slate-900">
              Everything you need to sell live
            </h2>
            <p className="mt-3 text-slate-500">
              One widget. Infinite conversations. Zero friction.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={Video}
              title="Instant Video Calls"
              description="Customers click a button on your store and connect to your team in seconds — no apps, no downloads."
              gradient="bg-gradient-to-br from-blue-500 to-blue-700"
            />
            <FeatureCard
              icon={Code2}
              title="One-Line Embed"
              description="Drop a single script tag into your Shopify theme, WooCommerce, or any website. That's it."
              gradient="bg-gradient-to-br from-violet-500 to-violet-700"
            />
            <FeatureCard
              icon={Globe}
              title="Platform Agnostic"
              description="Works with Shopify, WooCommerce, Magento, custom sites — anywhere a script tag can go."
              gradient="bg-gradient-to-br from-cyan-500 to-cyan-700"
            />
            <FeatureCard
              icon={Users}
              title="Multi-Agent Routing"
              description="Route calls to available agents. Set status, handle queues, and track who answered what."
              gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
            />
            <FeatureCard
              icon={Bell}
              title="Smart Notifications"
              description="Get real-time browser alerts, ringtones, and vibrations the moment a customer calls."
              gradient="bg-gradient-to-br from-amber-500 to-amber-600"
            />
            <FeatureCard
              icon={BarChart3}
              title="Call Analytics"
              description="Track call history, duration, missed calls, and customer sentiment across your whole team."
              gradient="bg-gradient-to-br from-rose-500 to-rose-700"
            />
            <FeatureCard
              icon={MessageSquare}
              title="Chat + Callbacks"
              description="Customers can chat, schedule a callback, or call live — all from the same familiar widget."
              gradient="bg-gradient-to-br from-indigo-500 to-indigo-700"
            />
            <FeatureCard
              icon={ShoppingBag}
              title="Product Sharing"
              description="Share products directly during a video call. Link, show, and close — without leaving the call."
              gradient="bg-gradient-to-br from-pink-500 to-pink-700"
            />
            <FeatureCard
              icon={Zap}
              title="Live Streaming"
              description="Go live to showcase new arrivals, run flash sales, or host product demos for all your visitors."
              gradient="bg-gradient-to-br from-orange-500 to-orange-700"
            />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-4xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-extrabold text-slate-900">Up and running in minutes</h2>
            <p className="mt-3 text-slate-500">No developers required. No monthly maintenance.</p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            <div className="space-y-8">
              <StepCard
                number="1"
                title="Create your BridgeOne account"
                description="Sign up as a seller and set up your shop profile in under 2 minutes."
              />
              <StepCard
                number="2"
                title="Copy your embed snippet"
                description="Grab the one-line script from your Integrations page. No configuration needed."
              />
              <StepCard
                number="3"
                title="Paste into your store"
                description="Add the script to your Shopify theme, website footer, or any HTML page. Save and publish."
              />
              <StepCard
                number="4"
                title="Go live and start selling"
                description="Turn on your status in the dashboard. Customers can now call you from your store instantly."
              />
            </div>

            {/* Code snippet mockup */}
            <div className="self-center">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-xl">
                <div className="flex items-center gap-2 border-b border-slate-700 bg-slate-800 px-4 py-3">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                  <span className="ml-2 text-xs text-slate-500">theme.liquid</span>
                </div>
                <div className="p-5 font-mono text-sm">
                  <p className="text-slate-500">{`<!-- Add before </body> -->`}</p>
                  <p className="mt-2 text-emerald-400">{`<script`}</p>
                  <p className="pl-4 text-blue-400">{'  src="https://cdn.bridgeone.io/widget.js"'}</p>
                  <p className="pl-4 text-yellow-400">{'  data-shop-id="your-shop-id"'}</p>
                  <p className="text-emerald-400">{'  async>'}</p>
                  <p className="text-emerald-400">{'</script>'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ─────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="mb-10 text-center text-3xl font-extrabold text-slate-900">
            Loved by online sellers
          </h2>
          <div className="grid gap-5 sm:grid-cols-3">
            {[
              {
                quote: "We increased our average order value by 40% because we can now answer questions on the spot and upsell in real time.",
                name: "Priya S.",
                role: "Shopify store owner",
              },
              {
                quote: "Setup literally took 4 minutes. My agents were handling live calls from our website the same afternoon.",
                name: "Marcus T.",
                role: "Head of E-commerce",
              },
              {
                quote: "The missed call notifications and callbacks mean we never lose a lead even when we're busy.",
                name: "Anita R.",
                role: "Founder, fashion boutique",
              },
            ].map((t) => (
              <div key={t.name} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-3 flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="mb-4 text-sm leading-relaxed text-slate-600">"{t.quote}"</p>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 py-20 text-white">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-extrabold">Ready to sell like never before?</h2>
          <p className="mt-4 text-blue-200">
            Join hundreds of sellers already using BridgeOne to have real conversations with their customers.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-blue-700 shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
            >
              Create free account
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-white/10"
            >
              Sign in to dashboard
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-blue-200">
            {["No credit card required", "Free plan available", "Cancel anytime"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-slate-50 py-10">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-xs font-bold text-white">
                B
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">BridgeOne</p>
                <p className="text-[10px] text-slate-400">Live Video Selling Platform</p>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              © {new Date().getFullYear()} BridgeOne. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
