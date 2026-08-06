(function () {
  console.log("[BridgeOne] Widget loader started.");

  // 1. Constants
  const SUPABASE_URL = "https://xrsujalzbvvlyplehdrm.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhyc3VqYWx6YnZ2bHlwbGVoZHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5OTAzNDMsImV4cCI6MjA5ODU2NjM0M30.xewCP7FmemrZ1D7_wtlsPjT1tQlTUBcLa52hi6_R1sE";

  // 2. Extract Configuration dynamically from script tag attributes or global config
  const scriptEl = document.currentScript || Array.from(document.querySelectorAll('script')).find(s => s.src && s.src.includes('widget-loader.js'));
  const config = window.BridgeOneConfig || {};
  
  let shopId = config.shopId || (scriptEl ? scriptEl.getAttribute("data-shop-id") : null);
  let widgetKey = config.widgetKey || (scriptEl ? scriptEl.getAttribute("data-widget-key") : null);

  // Parse query parameters from the script URL as a fallback
  if (scriptEl && scriptEl.src) {
    try {
      const urlParams = new URL(scriptEl.src).searchParams;
      if (!shopId) shopId = urlParams.get("shopId") || urlParams.get("shop_id");
      if (!widgetKey) widgetKey = urlParams.get("widgetKey") || urlParams.get("widget_key");
    } catch (e) {
      console.warn("[BridgeOne] Failed to parse script URL query parameters:", e);
    }
  }

  console.log("[BridgeOne] Config:", { shopId, widgetKey, hasScript: !!scriptEl });

  // Dynamic host determination (works in localhost and production)
  const hostUrl = scriptEl && scriptEl.src ? new URL(scriptEl.src).origin : "http://localhost:5173";
  console.log("[BridgeOne] Host URL:", hostUrl);

  const currentDomain = window.location.hostname;

  // 3. Main loader entry point
  if (shopId) {
    validateAndInit(shopId, widgetKey);
  } else if (window.Shopify && window.Shopify.shop) {
    const shopifyDomain = window.Shopify.shop;
    console.log("[BridgeOne] shopId missing. Detected Shopify store. Auto-discovering shop config for:", shopifyDomain);

    const fetchUrl = `${SUPABASE_URL}/rest/v1/shops?shopify_domain=eq.${encodeURIComponent(shopifyDomain)}&widget_enabled=eq.true&select=id,widget_key`;
    fetch(fetchUrl, {
      method: "GET",
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json"
      }
    })
      .then(res => res.json())
      .then(shops => {
        if (shops && shops.length > 0) {
          const shop = shops[0];
          console.log("[BridgeOne] Auto-discovered shop config:", shop);
          validateAndInit(shop.id, shop.widget_key);
        } else {
          console.error("[BridgeOne] No active registered shop found for Shopify domain:", shopifyDomain);
        }
      })
      .catch(err => {
        console.error("[BridgeOne] Failed to auto-discover shop config:", err);
      });
  } else {
    console.warn("[BridgeOne] shopId is missing. Widget will not load. Set window.BridgeOneConfig = { shopId: '...' } before loading this script.");
  }

  function validateAndInit(targetShopId, targetWidgetKey) {
    const cleanShopId = String(targetShopId).trim();
    const cleanWidgetKey = targetWidgetKey ? String(targetWidgetKey).trim() : "";

    if (cleanWidgetKey) {
      const fetchUrl = `${SUPABASE_URL}/rest/v1/rpc/validate_widget_key`;
      console.log("[BridgeOne] Validating widget key for shop:", cleanShopId);

      fetch(fetchUrl, {
        method: "POST",
        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          p_shop_id: cleanShopId,
          p_widget_key: cleanWidgetKey,
          p_domain: currentDomain
        })
      })
        .then(res => {
          console.log("[BridgeOne] RPC response status:", res.status);
          return res.json();
        })
        .then(validationResult => {
          console.log("[BridgeOne] Validation result:", validationResult);
          if (!validationResult || validationResult.valid === false) {
            const errorMsg = validationResult?.error || 'Unknown error';
            // Allow widget to load when disabled (agents offline) - widget handles offline state gracefully
            if (errorMsg.includes('disabled')) {
              console.warn(`[BridgeOne] Widget is disabled (agents may be offline). Loading in offline mode.`);
              initializeWidget(cleanShopId, { valid: true, primary_color: "#2563eb", widget_position: "bottom-right" });
              return;
            }
            console.error(`[BridgeOne] Widget validation failed: ${errorMsg}`);
            return;
          }
          initializeWidget(cleanShopId, validationResult);
        })
        .catch(err => {
          console.warn("[BridgeOne] Validation request failed, loading widget with defaults:", err.message);
          // Fallback: load widget anyway with default settings
          initializeWidget(cleanShopId, { valid: true, primary_color: "#2563eb", widget_position: "bottom-right" });
        });
    } else {
      // No widgetKey provided - load directly with defaults
      console.log("[BridgeOne] No widgetKey provided, loading widget with defaults.");
      initializeWidget(cleanShopId, { valid: true, primary_color: "#2563eb", widget_position: "bottom-right" });
    }
  }

  function initializeWidget(targetShopId, settings) {
    console.log("[BridgeOne] Initializing widget UI with settings:", settings);
    const color = settings.primary_color || "#2563eb";
    const position = settings.widget_position || "bottom-right";
    const isOnline = true; // Assume online for widget UI until socket connects

    // Apply basic styles dynamically
    const style = document.createElement("style");
    style.innerHTML = `
      .b1-widget-launcher {
        position: fixed;
        bottom: 24px;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        color: white;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999998;
        transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s;
        border: none;
        outline: none;
      }
      .b1-widget-launcher:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2), 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      .b1-widget-launcher:active {
        transform: scale(0.95);
      }
      .b1-widget-launcher-bottom-right {
        right: 24px;
      }
      .b1-widget-launcher-bottom-left {
        left: 24px;
      }
      .b1-widget-indicator {
        position: absolute;
        top: 2px;
        right: 2px;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      .b1-widget-indicator-online {
        background-color: #22c55e;
      }
      .b1-widget-indicator-offline {
        background-color: #94a3b8;
      }
      .b1-widget-container {
        position: fixed;
        bottom: 96px;
        width: 380px;
        height: 600px;
        max-height: calc(100vh - 120px);
        border-radius: 20px;
        box-shadow: 0 12px 32px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.1);
        z-index: 999999;
        display: none;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.08);
        transition: opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1), transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        transform: translateY(20px);
        opacity: 0;
      }
      .b1-widget-container-bottom-right {
        right: 24px;
        transform-origin: bottom right;
      }
      .b1-widget-container-bottom-left {
        left: 24px;
        transform-origin: bottom left;
      }
      .b1-widget-container.active {
        display: block;
        transform: translateY(0);
        opacity: 1;
      }
      .b1-widget-iframe {
        width: 100%;
        height: 100%;
        border: none;
        background: transparent;
      }
      @media (max-width: 480px) {
        .b1-widget-container {
          bottom: 0 !important;
          right: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          max-height: 100% !important;
          border-radius: 0 !important;
        }
      }
    `;
    document.head.appendChild(style);

    // Create Launcher Button
    const launcher = document.createElement("button");
    launcher.className = `b1-widget-launcher b1-widget-launcher-${position}`;
    launcher.style.backgroundColor = color;

    // SVG Video Camera Icon
    const videoIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="m22 8-6 4 6 4V8Z"/>
        <rect width="14" height="12" x="2" y="6" rx="2" ry="2"/>
      </svg>
    `;

    // SVG Close Icon
    const closeIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    `;

    launcher.innerHTML = videoIcon;

    // Create Online Status Indicator Dot
    const indicator = document.createElement("span");
    indicator.className = `b1-widget-indicator ${isOnline ? 'b1-widget-indicator-online' : 'b1-widget-indicator-offline'}`;
    launcher.appendChild(indicator);

    // Create Widget Container & Iframe
    const container = document.createElement("div");
    container.className = `b1-widget-container b1-widget-container-${position}`;

    const iframe = document.createElement("iframe");
    iframe.className = "b1-widget-iframe";
    iframe.src = `${hostUrl}/widget/${targetShopId}`;
    iframe.setAttribute("allow", "camera; microphone; display-capture; autoplay; fullscreen");

    container.appendChild(iframe);

    // Append elements to DOM
    document.body.appendChild(launcher);
    document.body.appendChild(container);

    let isOpen = false;

    // Click handler
    launcher.addEventListener("click", () => {
      isOpen = !isOpen;
      if (isOpen) {
        container.style.display = "block";
        launcher.innerHTML = closeIcon;
        setTimeout(() => {
          container.classList.add("active");
        }, 10);
      } else {
        container.classList.remove("active");
        launcher.innerHTML = videoIcon;
        launcher.appendChild(indicator);
        setTimeout(() => {
          if (!isOpen) container.style.display = "none";
        }, 250);
      }
    });

    // Listen to messages from the Iframe
    window.addEventListener("message", (event) => {
      if (event.origin !== hostUrl) return;

      if (event.data === "close-widget") {
        isOpen = false;
        container.classList.remove("active");
        launcher.innerHTML = videoIcon;
        launcher.appendChild(indicator);
        setTimeout(() => {
          container.style.display = "none";
        }, 250);
      }
    });
  }
})();
