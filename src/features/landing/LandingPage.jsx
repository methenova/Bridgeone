import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Video,
  MessageSquare,
  Monitor,
  ArrowRight,
  PlayCircle,
  CheckCircle,
  Star,
  Zap,
  BarChart3,
  ShoppingBag,
  Shield,
  Phone,
  LayoutDashboard
} from "lucide-react";

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState("video");

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
      
      {/* ── NAVBAR ─────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between bg-white/80 px-6 backdrop-blur-md border-b border-slate-100">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 font-black text-white shadow-md shadow-blue-500/20">
              B
            </div>
            <span className="text-xl font-extrabold tracking-tight">BridgeOne</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#testimonials" className="hover:text-blue-600 transition-colors">Testimonials</a>
            <a href="#integrations" className="hover:text-blue-600 transition-colors">Integrations</a>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="hidden sm:block text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">
            Log in
          </Link>
          <Link
            to="/register"
            className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-500 transition-all hover:scale-105"
          >
            Start for Free
          </Link>
        </div>
      </nav>

      {/* ── HERO SECTION ─────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 text-center px-6 overflow-hidden">
        {/* Abstract Light Gradients */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-white"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-400/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] text-slate-900">
            Live Video & Support OS <br className="hidden md:block" />
            For E-Commerce
          </h1>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-600 font-medium">
            Turn browsers into buyers by bringing the in-store experience to your website. Instantly connect via live video, chat, and product sharing.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/register"
              className="w-full sm:w-auto rounded-full bg-blue-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-blue-500/20 hover:bg-blue-500 hover:-translate-y-1 transition-all"
            >
              Get Started Free
            </Link>
            <a
              href="#demo"
              className="w-full sm:w-auto rounded-full border-2 border-slate-200 bg-white px-8 py-4 text-base font-bold text-slate-700 hover:border-blue-600 hover:text-blue-600 transition-all"
            >
              Book a Demo <ArrowRight className="inline-block ml-2 h-4 w-4" />
            </a>
          </div>

          <p className="text-sm text-slate-500 pt-4 font-medium flex items-center justify-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" /> No credit card required. Setup in 5 mins.
          </p>
        </div>

        {/* Floating Stats */}
        <div className="max-w-5xl mx-auto mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 text-center border-t border-slate-100 pt-10">
          <div>
            <h3 className="text-3xl font-black text-slate-900">5,000+</h3>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Stores Active</p>
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-900">3x</h3>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Higher Conversion</p>
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-900">1M+</h3>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Calls Hosted</p>
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-900">99.9%</h3>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Uptime SLA</p>
          </div>
        </div>
      </section>

      {/* ── TRUSTED BUSINESSES (LOGO STRIP) ──────────────────────────────── */}
      <section className="bg-slate-50 py-12 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Trusted by the fastest growing e-commerce brands
          </p>
          <div className="flex justify-center">
            {/* The generated image is used here */}
            <img 
              src="/trusted-logos.png" 
              alt="Trusted Businesses" 
              className="h-16 md:h-20 object-contain opacity-80 mix-blend-multiply filter hover:opacity-100 transition-opacity"
            />
          </div>
        </div>
      </section>

      {/* ── FEATURE SUITES (Like the screenshot) ─────────────────────────── */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-6 space-y-32">
        
        {/* Suite 1: Video Sales Suite */}
        <div>
          <div className="mb-12">
            <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Video className="h-4 w-4" /> Feature 1
            </h2>
            <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900">Live Video Sales Suite</h3>
            <p className="text-slate-500 mt-4 text-lg">Bring the human touch to your digital storefront with one-click video calls.</p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Left Nav */}
            <div className="lg:col-span-4 flex flex-col gap-3">
              {[
                { id: "video", title: "1-on-1 Video Calls", desc: "Instantly connect with high-intent shoppers." },
                { id: "products", title: "Live Product Sharing", desc: "Push products directly into the call view." },
                { id: "screen", title: "Screen Sharing", desc: "Walk customers through complex checkouts." }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`text-left p-5 rounded-2xl border transition-all duration-300 ${
                    activeTab === tab.id 
                      ? "border-blue-200 bg-blue-50 shadow-sm ring-1 ring-blue-500/20" 
                      : "border-transparent hover:bg-slate-50 hover:border-slate-200"
                  }`}
                >
                  <h4 className={`text-base font-bold ${activeTab === tab.id ? 'text-blue-700' : 'text-slate-800'}`}>
                    {tab.title}
                  </h4>
                  <p className="text-sm text-slate-500 mt-1">{tab.desc}</p>
                </button>
              ))}
            </div>

            {/* Right Visual */}
            <div className="lg:col-span-8">
              <div className="rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 p-1 shadow-2xl">
                <div className="rounded-[22px] bg-slate-900 overflow-hidden relative aspect-video flex items-center justify-center">
                  {/* Mockup UI */}
                  <div className="absolute inset-0 flex">
                    <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80" className="w-1/2 object-cover opacity-80" alt="Agent" />
                    <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80" className="w-1/2 object-cover opacity-60" alt="Customer" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
                  
                  <div className="relative z-10 text-center">
                    <button className="h-16 w-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4 hover:bg-white/30 transition-colors hover:scale-110">
                      <PlayCircle className="h-8 w-8 text-white" />
                    </button>
                    <p className="text-white font-bold text-lg">Watch Live Demo</p>
                  </div>

                  {/* UI Overlay */}
                  <div className="absolute bottom-6 w-full px-8 flex justify-between items-end">
                    <div className="bg-black/50 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-white/10">
                      Agent: Sarah
                    </div>
                    <div className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4" /> Pushed: Leather Bag
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Suite 2: Support & Chat */}
        <div>
          <div className="mb-12">
            <h2 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" /> Feature 2
            </h2>
            <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900">Omnichannel Support Suite</h3>
            <p className="text-slate-500 mt-4 text-lg">Don't miss a beat. Handle offline queries and instant chat from one dashboard.</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 overflow-hidden">
            <div className="grid lg:grid-cols-2">
              <div className="p-12 flex flex-col justify-center space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <Phone className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">Call Requests</h4>
                      <p className="text-sm text-slate-500">Shoppers schedule callbacks when you're offline.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">Live Text Chat</h4>
                      <p className="text-sm text-slate-500">Instantly reply to quick queries without video.</p>
                    </div>
                  </div>
                </div>
                <Link to="/register" className="inline-flex items-center gap-2 font-bold text-blue-600 hover:text-blue-700">
                  See how it works <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="bg-slate-200 relative min-h-[300px]">
                {/* Dashboard Mockup Image/UI */}
                <div className="absolute inset-4 rounded-xl bg-white shadow-xl border border-slate-100 overflow-hidden flex flex-col">
                  <div className="h-12 border-b border-slate-100 flex items-center px-4 bg-slate-50">
                    <div className="flex gap-2">
                      <div className="h-3 w-3 rounded-full bg-red-400"></div>
                      <div className="h-3 w-3 rounded-full bg-amber-400"></div>
                      <div className="h-3 w-3 rounded-full bg-green-400"></div>
                    </div>
                  </div>
                  <div className="flex-1 p-6 space-y-4">
                    <div className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-200"></div>
                      <div className="bg-slate-100 rounded-2xl rounded-tl-none p-3 text-sm text-slate-600 max-w-[80%]">
                        Hi, I have a question about the sizing for the blue jacket.
                      </div>
                    </div>
                    <div className="flex gap-3 flex-row-reverse">
                      <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">B</div>
                      <div className="bg-blue-600 text-white rounded-2xl rounded-tr-none p-3 text-sm max-w-[80%] shadow-md">
                        Sure! I can start a quick video call to show you the material up close?
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────── */}
      <section id="testimonials" className="bg-slate-50 py-24 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">Don't take our word, see what they say</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Review 1 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
              <div className="flex gap-1 text-amber-400">
                <Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" />
              </div>
              <h4 className="font-bold text-lg text-slate-900 leading-snug">"Making online shopping human again"</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                "BridgeOne completely transformed how we sell high-ticket items. Customers love seeing the product live before buying. Our conversion rate shot up by 40% in the first month."
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <img src="https://ui-avatars.com/api/?name=John+Doe&background=random" className="h-10 w-10 rounded-full" alt="User" />
                <div>
                  <p className="font-bold text-sm text-slate-900">Michael T.</p>
                  <p className="text-xs text-slate-500">CEO, TechStore</p>
                </div>
              </div>
            </div>

            {/* Review 2 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4 relative transform md:-translate-y-4">
              <div className="absolute top-0 left-0 w-full h-1 bg-blue-600 rounded-t-2xl"></div>
              <div className="flex gap-1 text-amber-400">
                <Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" />
              </div>
              <h4 className="font-bold text-lg text-slate-900 leading-snug">"The best Shopify integration we've used"</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                "The setup took literally 2 minutes. The agent console is incredibly intuitive, and being able to push products directly into the customer's cart during a call is magical."
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <img src="https://ui-avatars.com/api/?name=Sarah+Smith&background=random" className="h-10 w-10 rounded-full" alt="User" />
                <div>
                  <p className="font-bold text-sm text-slate-900">Sarah J.</p>
                  <p className="text-xs text-slate-500">Founder, StyleBoutique</p>
                </div>
              </div>
            </div>

            {/* Review 3 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
              <div className="flex gap-1 text-amber-400">
                <Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" /><Star className="h-4 w-4 fill-current" />
              </div>
              <h4 className="font-bold text-lg text-slate-900 leading-snug">"Incredible support and stability"</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                "We host hundreds of calls daily across our support team. The WebRTC video quality is crystal clear even on mobile networks. Highly recommend for any serious e-comm brand."
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <img src="https://ui-avatars.com/api/?name=David+L&background=random" className="h-10 w-10 rounded-full" alt="User" />
                <div>
                  <p className="font-bold text-sm text-slate-900">David L.</p>
                  <p className="text-xs text-slate-500">CX Director, HomeGoods</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── INTEGRATIONS ───────────────────────────────────────────────────── */}
      <section id="integrations" className="py-24 max-w-7xl mx-auto px-6 text-center">
        <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Integrations With All Your Favorite Apps</h2>
        <p className="text-slate-500 mb-12">BridgeOne connects seamlessly with the tools you already use.</p>
        
        <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
          {['Shopify', 'WooCommerce', 'Magento', 'BigCommerce', 'Wix', 'Squarespace', 'WordPress', 'Stripe', 'Klaviyo', 'Zendesk'].map((brand, i) => (
            <div key={i} className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-default">
              <div className="h-6 w-6 rounded bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                {brand.charAt(0)}
              </div>
              <span className="font-bold text-sm text-slate-700">{brand}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 border-dashed rounded-xl px-4 py-3">
            <span className="font-bold text-sm text-slate-500">+ Custom HTML / API</span>
          </div>
        </div>
      </section>

      {/* ── CTA / FOOTER ───────────────────────────────────────────────────── */}
      <section className="bg-slate-900 text-white py-20 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            Ready to transform your sales?
          </h2>
          <p className="text-slate-400 text-lg">
            Join thousands of modern merchants who use BridgeOne to drive revenue through live video.
          </p>
          <div className="pt-4">
            <Link
              to="/register"
              className="inline-block rounded-full bg-blue-600 px-8 py-4 text-base font-bold text-white shadow-xl hover:bg-blue-500 hover:-translate-y-1 transition-all"
            >
              Start Your Free Trial
            </Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-20 pt-10 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-600 font-bold text-white text-[10px]">B</div>
            <span className="font-bold text-slate-300">BridgeOne Inc.</span> © 2026
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </section>

    </div>
  );
}
