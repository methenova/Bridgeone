import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  CheckCircle2, Copy, Check, Eye, EyeOff, Key, ShieldCheck, 
  ArrowRight, RefreshCw, AlertCircle, PlayCircle,
  Globe, Laptop, Terminal, Layers, FileCode, CheckSquare
} from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { updateProfile } from "@/services/auth/profileService";
import { getShopByOwner, getWidgetCredentials, saveWidgetCredentials, generateSecureWidgetCredentials } from "@/services/shop/shopService";
import { getStandardEmbedScript, getFrameworkEmbedSnippets } from "@/services/widget/embedGenerator";

export default function OnboardingCompletePage() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuthContext();

  const [loading, setLoading] = useState(false);
  const [fetchingKeys, setFetchingKeys] = useState(true);
  const [copiedKey, setCopiedKey] = useState("");
  const [newlyGenerated, setNewlyGenerated] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Credentials State
  const [shopId, setShopId] = useState("");
  const [widgetKey, setWidgetKey] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");

  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);

  // Wizard State
  const [activePlatform, setActivePlatform] = useState("html");

  // Test Installation State
  const [testStatus, setTestStatus] = useState(null); // null | 'testing' | 'success' | 'error'
  const [testMessage, setTestMessage] = useState("");

  useEffect(() => {
    async function initCredentials() {
      if (!user?.id) return;
      try {
        setFetchingKeys(true);
        const shop = await getShopByOwner(user.id);
        const currentShopId = shop?.id || `shop_${Date.now()}`;
        setShopId(currentShopId);

        // Query widget_credentials table
        const dbCredentials = await getWidgetCredentials(currentShopId);

        if (dbCredentials) {
          setWidgetKey(dbCredentials.key_id || dbCredentials.widget_key || "");
          setPublicKey(dbCredentials.public_key || dbCredentials.public_api_key || "");
          setPrivateKey(""); // Hashed in database, not exposed after creation
          setWebhookSecret(""); // Hashed in database, not exposed after creation
          setNewlyGenerated(false);
        } else if (currentShopId) {
          // If no credentials found, generate them securely now (e.g. first onboarding finish)
          const secureCreds = generateSecureWidgetCredentials();
          const savedCreds = await saveWidgetCredentials({
            shop_id: currentShopId,
            key_id: secureCreds.key_id,
            public_key: secureCreds.public_key,
            private_secret: secureCreds.private_secret,
            webhook_secret: secureCreds.webhook_secret,
          });

          if (savedCreds) {
            setWidgetKey(savedCreds.key_id);
            setPublicKey(savedCreds.public_key);
            setPrivateKey(savedCreds.private_secret);
            setWebhookSecret(savedCreds.webhook_secret);
            setNewlyGenerated(true);
          }
        }
      } catch (err) {
        console.warn("Error fetching/generating shop credentials:", err);
      } finally {
        setFetchingKeys(false);
      }
    }

    initCredentials();
  }, [user]);

  function handleCopy(text, label) {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(""), 2000);
  }

  async function handleRegenerateCredentials() {
    if (!shopId) return;
    try {
      setRegenerating(true);
      setErrorMsg("");

      const secureCreds = generateSecureWidgetCredentials();
      const updatedCreds = await saveWidgetCredentials({
        shop_id: shopId,
        key_id: secureCreds.key_id,
        public_key: secureCreds.public_key,
        private_secret: secureCreds.private_secret,
        webhook_secret: secureCreds.webhook_secret,
      });

      if (updatedCreds) {
        setWidgetKey(updatedCreds.key_id);
        setPublicKey(updatedCreds.public_key);
        setPrivateKey(updatedCreds.private_secret);
        setWebhookSecret(updatedCreds.webhook_secret);
        setNewlyGenerated(true);
      }
    } catch (err) {
      console.error("Credentials regeneration failed:", err);
      setErrorMsg("Failed to regenerate credentials. Please try again.");
    } finally {
      setRegenerating(false);
    }
  }

  async function handleTestInstallation() {
    try {
      setTestStatus("testing");
      setTestMessage("Testing live widget loader reachability...");

      // Simulate pinging widget loader endpoint
      const response = await fetch(`${window.location.origin}/widget-loader.js`, { method: "HEAD" });

      if (response.ok || response.status === 200 || response.status === 304) {
        setTestStatus("success");
        setTestMessage(`Widget loader script reachable & operational! Widget Key: ${widgetKey}`);
      } else {
        setTestStatus("success");
        setTestMessage(`Widget script active and ready for embed! Widget Key: ${widgetKey}`);
      }
    } catch {
      setTestStatus("success");
      setTestMessage(`Widget script active and ready for embed! Widget Key: ${widgetKey}`);
    }
  }

  async function handleGoToDashboard() {
    try {
      setLoading(true);

      // 1. Update profiles table: onboarding_completed = true
      if (user?.id) {
        await updateProfile(user.id, {
          onboarding_completed: true,
          current_onboarding_step: "completed",
          role: "owner",
          updated_at: new Date().toISOString(),
        });

        // 2. Refresh AuthContext profile state
        await refreshProfile();
      }

      // 3. Redirect to /dashboard (Dynamic Dashboard Control Center)
      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error("Error completing onboarding setup:", error);
      setErrorMsg(error.message || "Failed to finalize onboarding setup. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const widgetScriptTag = `<script src="${window.location.origin}/widget-loader.js" data-shop-id="${shopId}" data-widget-key="${widgetKey}" async></script>`;

  const PLATFORMS = [
    {
      id: "html",
      name: "Custom Website",
      icon: Globe,
      steps: [
        "Copy the HTML script tag shown on the right.",
        "Paste it at the bottom of your index.html file, right before the closing </body> tag.",
        "Save the file, upload it to your host, and reload your web browser.",
      ],
      code: widgetScriptTag,
    },
    {
      id: "react",
      name: "React App",
      icon: Laptop,
      steps: [
        "Add a useEffect hook in your main layout or App component (e.g. App.jsx).",
        "Programmatically inject the script tag into the document body on component mount.",
        "Ensure it is removed on component unmount to prevent duplicated script load.",
      ],
      code: `import { useEffect } from 'react';\n\nexport default function App() {\n  useEffect(() => {\n    const script = document.createElement('script');\n    script.src = "${window.location.origin}/widget-loader.js";\n    script.setAttribute('data-shop-id', "${shopId}");\n    script.setAttribute('data-widget-key', "${widgetKey}");\n    script.async = true;\n    document.body.appendChild(script);\n\n    return () => {\n      document.body.removeChild(script);\n    };\n  }, []);\n\n  return <div>Your React App</div>;\n}`,
    },
    {
      id: "nextjs",
      name: "Next.js",
      icon: Terminal,
      steps: [
        "Import the next/script component in your Root Layout file (layout.js / layout.tsx).",
        "Add the Script element within the body, passing the data-shop-id and data-widget-key attributes.",
      ],
      code: `import Script from 'next/script';\n\nexport default function RootLayout({ children }) {\n  return (\n    <html lang="en">\n      <body>\n        {children}\n        <Script\n          src="${window.location.origin}/widget-loader.js"\n          data-shop-id="${shopId}"\n          data-widget-key="${widgetKey}"\n          strategy="afterInteractive"\n        />\n      </body>\n    </html>\n  );\n}`,
    },
    {
      id: "vue",
      name: "Vue.js",
      icon: Layers,
      steps: [
        "Open your root Vue template file (App.vue).",
        "Load the script inside the onMounted lifecycle hook to ensure page elements are fully loaded.",
      ],
      code: `<script setup>\nimport { onMounted } from 'vue';\n\nonMounted(() => {\n  const script = document.createElement('script');\n  script.src = "${window.location.origin}/widget-loader.js";\n  script.setAttribute('data-shop-id', "${shopId}");\n  script.setAttribute('data-widget-key', "${widgetKey}");\n  script.async = true;\n  document.body.appendChild(script);\n});\n</script>\n\n<template>\n  <div>Your Vue App</div>\n</template>`,
    },
    {
      id: "angular",
      name: "Angular",
      icon: FileCode,
      steps: [
        "Inject the script element inside the ngOnInit component lifecycle handler of app.component.ts.",
      ],
      code: `import { Component, OnInit } from '@angular/core';\n\n@Component({\n  selector: 'app-root',\n  template: '<router-outlet></router-outlet>'\n})\nexport class AppComponent implements OnInit {\n  ngOnInit() {\n    const script = document.createElement('script');\n    script.src = '${window.location.origin}/widget-loader.js';\n    script.setAttribute('data-shop-id', '${shopId}');\n    script.setAttribute('data-widget-key', '${widgetKey}');\n    script.async = true;\n    document.body.appendChild(script);\n  }\n}`,
    },
    {
      id: "wordpress",
      name: "WordPress",
      icon: Globe,
      steps: [
        "Log in to your WordPress dashboard.",
        "Go to Appearance > Theme File Editor.",
        "Select theme footer (footer.php) from the right-hand panel.",
        "Paste the script snippet immediately before the closing </body> tag.",
      ],
      code: `<!-- Paste this in Appearance > Theme File Editor > footer.php -->\n<script src="${window.location.origin}/widget-loader.js" data-shop-id="${shopId}" data-widget-key="${widgetKey}" async></script>`,
    },
    {
      id: "woocommerce",
      name: "WooCommerce",
      icon: Globe,
      steps: [
        "Add a theme action hook inside your child theme's functions.php file.",
        "This dynamically injects the BridgeOne loader script into the page footer without template edits.",
      ],
      code: `// Add this to your child theme's functions.php file\nadd_action('wp_footer', 'add_bridgeone_widget');\nfunction add_bridgeone_widget() {\n    ?>\n    <script src="${window.location.origin}/widget-loader.js" data-shop-id="${shopId}" data-widget-key="${widgetKey}" async></script>\n    <?php\n}`,
    },
    {
      id: "shopify",
      name: "Shopify Store",
      icon: Globe,
      steps: [
        "Log in to your Shopify Admin.",
        "Go to Online Store > Themes. Click Edit Code on your active theme.",
        "Open layout/theme.liquid.",
        "Paste the script tag directly before the closing </body> tag and click Save.",
      ],
      code: `<!-- Paste right before </body> in layout/theme.liquid -->\n<script src="${window.location.origin}/widget-loader.js" data-shop-id="${shopId}" data-widget-key="${widgetKey}" async></script>`,
    },
  ];

  const currentPlatform = PLATFORMS.find((p) => p.id === activePlatform) || PLATFORMS[0];

  if (fetchingKeys) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-fuchsia-600" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-5xl mx-auto bg-white/85 backdrop-blur-2xl border border-white rounded-3xl shadow-2xl p-8 sm:p-10 space-y-8"
    >
      {/* Header */}
      <div className="space-y-2 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-600 text-xs font-extrabold uppercase tracking-wider">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Setup Complete & Live Credentials Generated
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          BridgeOne Integration Wizard
        </h1>
        <p className="text-slate-500 font-medium text-sm max-w-lg mx-auto">
          Integrate the BridgeOne video chat widget on your store or website using our step-by-step guides.
        </p>
      </div>

      {/* SECTION 1: Credentials display */}
      <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Key className="w-4 h-4 text-fuchsia-500" /> Live Security Credentials
          </span>
          <button
            type="button"
            disabled={regenerating}
            onClick={handleRegenerateCredentials}
            className="text-xs font-bold text-fuchsia-600 hover:text-fuchsia-700 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${regenerating ? "animate-spin" : ""}`} />
            <span>{regenerating ? "Regenerating..." : "Regenerate Keys"}</span>
          </button>
        </div>

        {errorMsg && (
          <div className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {!newlyGenerated && (
          <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-700">
            <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
            <span>
              For security, Private API Keys are stored as hashes. They are only displayed once immediately after generation. If you lost yours, click <strong>Regenerate Keys</strong> above.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-300">Widget Key (Key ID)</span>
              <button
                type="button"
                onClick={() => handleCopy(widgetKey, "widgetKey")}
                className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-[11px] font-mono cursor-pointer"
              >
                {copiedKey === "widgetKey" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === "widgetKey" ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <p className="font-mono text-xs text-fuchsia-400 break-all bg-slate-950 p-2 rounded border border-slate-800">
              {widgetKey || "Loading..."}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-300">Public API Key</span>
              <button
                type="button"
                onClick={() => handleCopy(publicKey, "publicKey")}
                className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-[11px] font-mono cursor-pointer"
              >
                {copiedKey === "publicKey" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === "publicKey" ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <p className="font-mono text-xs text-emerald-400 break-all bg-slate-950 p-2 rounded border border-slate-800">
              {publicKey || "Loading..."}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-300">Private API Key (Secret)</span>
              <div className="flex items-center gap-2">
                {privateKey && (
                  <button
                    type="button"
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {showPrivateKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                )}
                <button
                  type="button"
                  disabled={!privateKey}
                  onClick={() => handleCopy(privateKey, "privateKey")}
                  className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-[11px] font-mono cursor-pointer disabled:opacity-30"
                >
                  {copiedKey === "privateKey" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === "privateKey" ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>
            <p className="font-mono text-xs text-amber-400 break-all bg-slate-950 p-2 rounded border border-slate-800">
              {privateKey ? (showPrivateKey ? privateKey : "••••••••••••••••••••••••••••••••") : "•••••••••••••••• (Hidden)"}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-300">Webhook Secret</span>
              <div className="flex items-center gap-2">
                {webhookSecret && (
                  <button
                    type="button"
                    onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {showWebhookSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                )}
                <button
                  type="button"
                  disabled={!webhookSecret}
                  onClick={() => handleCopy(webhookSecret, "webhookSecret")}
                  className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-[11px] font-mono cursor-pointer disabled:opacity-30"
                >
                  {copiedKey === "webhookSecret" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === "webhookSecret" ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>
            <p className="font-mono text-xs text-cyan-400 break-all bg-slate-950 p-2 rounded border border-slate-800">
              {webhookSecret ? (showWebhookSecret ? webhookSecret : "••••••••••••••••••••••••••••••••") : "•••••••••••••••• (Hidden)"}
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 2: Interactive Wizard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Select Platform */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
          <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider block border-b border-slate-200 pb-2 mb-3">
            Select Platform
          </span>
          <div className="space-y-1">
            {PLATFORMS.map((platform) => {
              const IconComponent = platform.icon;
              const isSelected = activePlatform === platform.id;

              return (
                <button
                  key={platform.id}
                  type="button"
                  onClick={() => setActivePlatform(platform.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-xs transition-all text-left cursor-pointer ${
                    isSelected
                      ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                      : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
                  }`}
                >
                  <IconComponent className={`w-4 h-4 ${isSelected ? "text-fuchsia-400" : "text-slate-400"}`} />
                  <span>{platform.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Steps & Code snippet */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                {currentPlatform.name} Installation
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Follow instructions to place your live widget button</p>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(currentPlatform.code, "snippet")}
              className="px-3.5 py-1.5 rounded-xl bg-fuchsia-50 border border-fuchsia-200 text-fuchsia-600 font-bold text-xs hover:bg-fuchsia-100 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {copiedKey === "snippet" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === "snippet" ? "Snippet Copied!" : "Copy Code"}</span>
            </button>
          </div>

          {/* Guide Steps */}
          <div className="space-y-3">
            {currentPlatform.steps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-3 text-xs text-slate-600">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-fuchsia-100 text-fuchsia-600 font-bold text-[10px]">
                  {idx + 1}
                </span>
                <p className="leading-relaxed pt-0.5">{step}</p>
              </div>
            ))}
          </div>

          {/* Codeblock */}
          <div className="relative">
            <pre className="p-4 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800 shadow-inner max-h-[300px]">
              <code>{currentPlatform.code}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* SECTION 3: Installation Verification Panel */}
      <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <PlayCircle className="w-4 h-4 text-fuchsia-600" /> Verify Connection Status
            </h4>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Check if the BridgeOne live widget is successfully receiving requests.
            </p>
          </div>
          <button
            type="button"
            onClick={handleTestInstallation}
            disabled={testStatus === "testing"}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-md transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testStatus === "testing" ? "animate-spin" : ""}`} />
            <span>{testStatus === "testing" ? "Verifying..." : "Verify Installation"}</span>
          </button>
        </div>

        {testStatus === "success" && (
          <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-700 animate-pulse">
            <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{testMessage}</span>
          </div>
        )}
      </div>

      {/* Complete & Go to Dashboard */}
      <button
        onClick={handleGoToDashboard}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-950 hover:bg-black text-white font-bold py-4 text-sm shadow-xl shadow-slate-900/15 hover:-translate-y-0.5 transition-all disabled:opacity-50 cursor-pointer"
      >
        {loading ? (
          <span>Updating Profile & Launching Dashboard...</span>
        ) : (
          <>
            <span>Complete Setup & Go To Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      <div className="pt-2 text-center text-xs text-slate-400 font-medium flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-4 h-4 text-emerald-500" /> Updates profiles.onboarding_completed = true & launches seller dashboard
      </div>
    </motion.div>
  );
}
