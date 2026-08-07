/**
 * Centralized Standardized Widget Embed Generator for BridgeOne
 * Ensures 100% consistent embed script generation across Onboarding, Seller Settings, and Admin pages.
 */

export function getWidgetBaseUrl(originOverride = null) {
  if (originOverride) return originOverride;
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "https://bridgeone.app";
}

/**
 * Standard single HTML script tag embed snippet.
 */
export function getStandardEmbedScript({ shopId = "", widgetKey = "", origin = null }) {
  const baseUrl = getWidgetBaseUrl(origin);
  const cleanShopId = shopId || "YOUR_SHOP_ID";
  const cleanWidgetKey = widgetKey || "YOUR_WIDGET_KEY";

  return `<!-- BridgeOne Live Video Call Widget Embed -->
<script src="${baseUrl}/widget-loader.js" data-shop-id="${cleanShopId}" data-widget-key="${cleanWidgetKey}" async></script>`;
}

/**
 * Generate platform-specific embed snippets (React, Next.js, Vue, Angular, Shopify, WordPress, HTML).
 */
export function getFrameworkEmbedSnippets({ shopId = "", widgetKey = "", origin = null }) {
  const baseUrl = getWidgetBaseUrl(origin);
  const cleanShopId = shopId || "YOUR_SHOP_ID";
  const cleanWidgetKey = widgetKey || "YOUR_WIDGET_KEY";
  const scriptTag = `<script src="${baseUrl}/widget-loader.js" data-shop-id="${cleanShopId}" data-widget-key="${cleanWidgetKey}" async></script>`;

  return [
    {
      id: "html",
      name: "HTML / Generic",
      description: "Paste before closing </body> tag in your website HTML file.",
      language: "html",
      code: scriptTag,
    },
    {
      id: "shopify",
      name: "Shopify",
      description: "Paste right before </body> in layout/theme.liquid (Online Store > Themes > Edit code).",
      language: "html",
      code: `<!-- Paste right before </body> in layout/theme.liquid -->
${scriptTag}`,
    },
    {
      id: "wordpress",
      name: "WordPress",
      description: "Add to your theme's footer.php or functions.php file.",
      language: "php",
      code: `// Add this to your child theme's functions.php file
add_action('wp_footer', 'add_bridgeone_widget');
function add_bridgeone_widget() {
    ?>
    ${scriptTag}
    <?php
}`,
    },
    {
      id: "react",
      name: "React",
      description: "Add inside a useEffect hook in your top-level component or App.jsx.",
      language: "jsx",
      code: `import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "${baseUrl}/widget-loader.js";
    script.setAttribute('data-shop-id', "${cleanShopId}");
    script.setAttribute('data-widget-key', "${cleanWidgetKey}");
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return <div>Your React App</div>;
}`,
    },
    {
      id: "nextjs",
      name: "Next.js",
      description: "Use Next.js Script component in app/layout.jsx or pages/_app.jsx.",
      language: "jsx",
      code: `import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script
          src="${baseUrl}/widget-loader.js"
          data-shop-id="${cleanShopId}"
          data-widget-key="${cleanWidgetKey}"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}`,
    },
    {
      id: "vue",
      name: "Vue 3",
      description: "Add in onMounted hook in App.vue.",
      language: "html",
      code: `<script setup>
import { onMounted } from 'vue';

onMounted(() => {
  const script = document.createElement('script');
  script.src = "${baseUrl}/widget-loader.js";
  script.setAttribute('data-shop-id', "${cleanShopId}");
  script.setAttribute('data-widget-key', "${cleanWidgetKey}");
  script.async = true;
  document.body.appendChild(script);
});
</script>

<template>
  <div>Your Vue App</div>
</template>`,
    },
    {
      id: "angular",
      name: "Angular",
      description: "Add script tag dynamically in AppComponent ngOnInit lifecycle hook.",
      language: "typescript",
      code: `import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  template: '<router-outlet></router-outlet>'
})
export class AppComponent implements OnInit {
  ngOnInit() {
    const script = document.createElement('script');
    script.src = '${baseUrl}/widget-loader.js';
    script.setAttribute('data-shop-id', '${cleanShopId}');
    script.setAttribute('data-widget-key', '${cleanWidgetKey}');
    script.async = true;
    document.body.appendChild(script);
  }
}`,
    },
  ];
}
