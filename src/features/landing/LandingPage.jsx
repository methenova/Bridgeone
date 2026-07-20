import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Star,
} from "lucide-react";
import HeroSection from "./components/HeroSection";
import ConnectedJourneySection from "./components/ConnectedJourneySection";
import MiniProductsFeatureGrid from "./components/MiniProductsFeatureGrid";
import ShopifyIntegrationSection from "./components/ShopifyIntegrationSection";
import LogoStrip from "./components/LogoStrip";

export default function LandingPage() {
  return (
    <div className="min-h-screen font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
      
      {/* ── HERO SECTION (Premium Light Theme) ────────────────────────────── */}
      <HeroSection />

      {/* ── ANIMATED LOGO & PROOF MARQUEE TICKER ─────────────────────────── */}
      <LogoStrip />

      {/* ── 8-STEP CONNECTED JOURNEY (Flowing Scroll Animation) ─────────── */}
      <ConnectedJourneySection />

      {/* ── MINIATURE SOFTWARE FEATURE SUITES GRID ─────────────────────── */}
      <MiniProductsFeatureGrid />

      {/* ── SHOPIFY APP INTEGRATION & INSTALLATION FLOW ─────────────────── */}
      <ShopifyIntegrationSection />

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────── */}
      <section id="testimonials" className="bg-[#F8FAFC] py-24 border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 space-y-3">
            <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200/60 px-3.5 py-1 rounded-full uppercase tracking-wider">
              Customer Success
            </span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
              Trusted by Support & Revenue Leaders
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Review 1 */}
            <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-200/80 space-y-4">
              <div className="flex gap-1 text-amber-400">
                <Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" />
              </div>
              <h4 className="font-bold text-lg text-slate-900 leading-snug">"Humanized online customer service"</h4>
              <p className="text-sm text-slate-600 font-normal leading-relaxed">
                "BridgeOne completely transformed how we assist high-intent visitors. Customers love being able to talk face-to-face and see products live. Our conversion rate shot up by 40%."
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <img src="https://ui-avatars.com/api/?name=Michael+T&background=random" className="h-10 w-10 rounded-full" alt="User" />
                <div>
                  <p className="font-bold text-sm text-slate-900">Michael T.</p>
                  <p className="text-xs text-slate-500 font-medium">Head of Sales, TechStore</p>
                </div>
              </div>
            </div>

            {/* Review 2 */}
            <div className="bg-white rounded-2xl p-6 shadow-[0_6px_25px_rgba(0,0,0,0.04)] border border-slate-200/80 space-y-4 relative transform md:-translate-y-2">
              <div className="flex gap-1 text-amber-400">
                <Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" />
              </div>
              <h4 className="font-bold text-lg text-slate-900 leading-snug">"2-minute setup with instant cart sync"</h4>
              <p className="text-sm text-slate-600 font-normal leading-relaxed">
                "The agent console is incredibly intuitive. Being able to push items directly into the customer's cart during a video call is an absolute game changer."
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <img src="https://ui-avatars.com/api/?name=Sarah+J&background=random" className="h-10 w-10 rounded-full" alt="User" />
                <div>
                  <p className="font-bold text-sm text-slate-900">Sarah J.</p>
                  <p className="text-xs text-slate-500 font-medium">Founder, StyleBoutique</p>
                </div>
              </div>
            </div>

            {/* Review 3 */}
            <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-200/80 space-y-4">
              <div className="flex gap-1 text-amber-400">
                <Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" />
              </div>
              <h4 className="font-bold text-lg text-slate-900 leading-snug">"Incredible stability & WebRTC speed"</h4>
              <p className="text-sm text-slate-600 font-normal leading-relaxed">
                "We host hundreds of calls daily across our team. The WebRTC video quality is crystal clear even on mobile networks. Highly recommended for enterprise teams."
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <img src="https://ui-avatars.com/api/?name=David+L&background=random" className="h-10 w-10 rounded-full" alt="User" />
                <div>
                  <p className="font-bold text-sm text-slate-900">David L.</p>
                  <p className="text-xs text-slate-500 font-medium">CX Director, HomeGoods</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── INTEGRATIONS ───────────────────────────────────────────────────── */}
      <section id="integrations" className="py-24 max-w-7xl mx-auto px-6 text-center">
        <h2 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">Integrations With All Your Favorite Tools</h2>
        <p className="text-slate-500 text-base font-normal max-w-lg mx-auto mb-12">BridgeOne connects seamlessly with your existing store and CRM stack.</p>
        
        <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
          {['Shopify', 'WooCommerce', 'Magento', 'BigCommerce', 'Wix', 'Squarespace', 'WordPress', 'Stripe', 'Klaviyo', 'Zendesk'].map((brand, i) => (
            <div key={i} className="flex items-center gap-2 bg-white border border-slate-200/80 rounded-xl px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md hover:-translate-y-0.5 transition-all cursor-default">
              <div className="h-6 w-6 rounded bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-black">
                {brand.charAt(0)}
              </div>
              <span className="font-bold text-sm text-slate-800">{brand}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 bg-[#F8FAFC] border border-slate-200 border-dashed rounded-xl px-4 py-3">
            <span className="font-bold text-sm text-slate-500">+ Custom HTML / API</span>
          </div>
        </div>
      </section>

      {/* ── CTA / FOOTER (Intelligent Light Theme) ───────────────────────── */}
      <section className="bg-[#F8FAFC] text-slate-900 py-24 border-t border-slate-200/80">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900">
            Ready to transform customer conversations?
          </h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium leading-relaxed">
            Join enterprise teams who rely on BridgeOne to connect with website visitors through live video, chat, audio, and AI routing.
          </p>
          <div className="pt-2">
            <Link
              to="/register"
              className="inline-block rounded-full bg-blue-600 px-8 py-4 text-base font-bold text-white shadow-[0_4px_20px_rgba(37,99,235,0.25)] hover:bg-blue-700 hover:shadow-[0_6px_25px_rgba(37,99,235,0.35)] hover:-translate-y-0.5 transition-all"
            >
              Start Your 14-Day Free Trial
            </Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-20 pt-10 border-t border-slate-200/80 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-600 font-bold text-white text-xs shadow-sm">B</div>
            <span className="font-bold text-slate-800">BridgeOne Inc.</span>
            <span className="text-slate-400">© 2026</span>
          </div>
          <div className="flex gap-6 font-medium">
            <a href="#" className="hover:text-slate-900 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Security & Compliance</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Contact Sales</a>
          </div>
        </div>
      </section>

    </div>
  );
}
