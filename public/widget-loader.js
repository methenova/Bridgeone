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

    function openWidget() {
      isOpen = true;
      container.style.display = "block";
      launcher.innerHTML = closeIcon;
      setTimeout(() => {
        container.classList.add("active");
      }, 10);
    }

    function closeWidget() {
      isOpen = false;
      container.classList.remove("active");
      launcher.innerHTML = videoIcon;
      launcher.appendChild(indicator);
      setTimeout(() => {
        if (!isOpen) container.style.display = "none";
      }, 250);
    }

    // Click handler
    launcher.addEventListener("click", () => {
      if (isOpen) {
        closeWidget();
      } else {
        openWidget();
      }
    });

    // Listen to messages from the Iframe
    window.addEventListener("message", (event) => {
      if (event.origin !== hostUrl) return;

      if (event.data === "close-widget") {
        closeWidget();
      }
    });

    // Proactive Popins Engine
    fetchAndInitPopins(targetShopId, position, openWidget);
  }

  function fetchAndInitPopins(targetShopId, position, openWidgetFn) {
    const fetchUrl = `${SUPABASE_URL}/rest/v1/popins?shop_id=eq.${encodeURIComponent(targetShopId)}&is_active=eq.true&select=*`;
    fetch(fetchUrl, {
      method: "GET",
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json"
      }
    })
      .then(res => res.json())
      .then(popins => {
        if (!popins || !Array.isArray(popins) || popins.length === 0) return;

        const currentPath = window.location.pathname;
        const currentUrl = window.location.href;

        const activeRule = popins.find(p => {
          const freqKey = `b1_popin_${p.id}`;
          if (p.frequency_limit === 'once_per_session' && sessionStorage.getItem(freqKey)) return false;
          if (p.frequency_limit === 'once_per_visitor' && localStorage.getItem(freqKey)) return false;

          if (p.page_target_type === 'specific') {
            const urls = p.page_target_urls || [];
            if (urls.length > 0 && !urls.some(u => currentPath.includes(u) || currentUrl.includes(u))) {
              return false;
            }
          } else if (p.page_target_type === 'exclude') {
            const urls = p.page_target_urls || [];
            if (urls.some(u => currentPath.includes(u) || currentUrl.includes(u))) {
              return false;
            }
          }

          return true;
        });

        if (!activeRule) return;

        const triggerPopin = () => {
          showPopinCard(activeRule, position, openWidgetFn);
        };

        if (activeRule.trigger_type === 'delay') {
          const delayMs = (activeRule.trigger_delay_seconds || 5) * 1000;
          setTimeout(triggerPopin, delayMs);
        } else if (activeRule.trigger_type === 'exit_intent') {
          let triggered = false;
          const handleMouseLeave = (e) => {
            if (e.clientY <= 5 && !triggered) {
              triggered = true;
              document.removeEventListener('mouseleave', handleMouseLeave);
              triggerPopin();
            }
          };
          document.addEventListener('mouseleave', handleMouseLeave);
        } else if (activeRule.trigger_type === 'scroll') {
          let triggered = false;
          const targetPercent = activeRule.trigger_scroll_percent || 50;
          const handleScroll = () => {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrollPercent = (scrollTop / (scrollHeight || 1)) * 100;
            if (scrollPercent >= targetPercent && !triggered) {
              triggered = true;
              window.removeEventListener('scroll', handleScroll);
              triggerPopin();
            }
          };
          window.addEventListener('scroll', handleScroll);
        } else {
          setTimeout(triggerPopin, 3000);
        }
      })
      .catch(err => {
        console.warn("[BridgeOne] Popin fetch warning:", err.message);
      });
  }

  function showPopinCard(rule, position, openWidgetFn) {
    const freqKey = `b1_popin_${rule.id}`;
    sessionStorage.setItem(freqKey, "1");
    localStorage.setItem(freqKey, "1");

    // Track impression
    try {
      fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_popin_impressions`, {
        method: "POST",
        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ p_popin_id: rule.id })
      }).catch(() => {});
    } catch (e) {}

    const popinEl = document.createElement("div");
    const isRight = position === "bottom-right";
    const themeColor = rule.theme_color || "#2563eb";

    popinEl.style.cssText = `
      position: fixed;
      bottom: 96px;
      ${isRight ? "right: 24px;" : "left: 24px;"}
      width: 320px;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.05);
      padding: 16px;
      z-index: 999997;
      font-family: system-ui, -apple-system, sans-serif;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      transform: translateY(20px) scale(0.95);
      opacity: 0;
    `;

    popinEl.innerHTML = `
      <div style="display: flex; items-center; justify-content: space-between; margin-bottom: 8px;">
        <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; tracking-wider; color: ${themeColor}; background: ${themeColor}15; padding: 2px 8px; border-radius: 9999px;">
          Live Assistance
        </span>
        <button id="b1-popin-close" style="background: none; border: none; cursor: pointer; color: #94a3b8; padding: 2px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 700; color: #0f172a;">${rule.title}</h4>
      <p style="margin: 0 0 14px 0; font-size: 12px; color: #64748b; line-height: 1.4;">${rule.message}</p>
      <button id="b1-popin-cta" style="width: 100%; background: ${themeColor}; color: white; border: none; border-radius: 10px; padding: 10px 14px; font-size: 12px; font-weight: 700; cursor: pointer; transition: opacity 0.2s;">
        ${rule.cta_text || "Talk to Expert Live"}
      </button>
    `;

    document.body.appendChild(popinEl);

    setTimeout(() => {
      popinEl.style.transform = "translateY(0) scale(1)";
      popinEl.style.opacity = "1";
    }, 50);

    const closeBtn = popinEl.querySelector("#b1-popin-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        popinEl.style.opacity = "0";
        popinEl.style.transform = "translateY(10px) scale(0.95)";
        setTimeout(() => popinEl.remove(), 300);
      });
    }

    const ctaBtn = popinEl.querySelector("#b1-popin-cta");
    if (ctaBtn) {
      ctaBtn.addEventListener("click", () => {
        // Track conversion
        try {
          fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_popin_conversions`, {
            method: "POST",
            headers: {
              "apikey": SUPABASE_ANON_KEY,
              "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ p_popin_id: rule.id })
          }).catch(() => {});
        } catch (e) {}

        popinEl.style.opacity = "0";
        setTimeout(() => popinEl.remove(), 200);

        if (rule.cta_action === "custom_url" && rule.cta_url) {
          window.open(rule.cta_url, "_blank");
        } else {
          openWidgetFn();
        }
      });
    }
  }
})();
