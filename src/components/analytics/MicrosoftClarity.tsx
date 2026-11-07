"use client";

import React, { Suspense, useEffect } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { CLARITY_PROJECT_ID, claritySet, clarityEvent } from "@/lib/analytics/clarity";

function ClarityNavigationTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;

    const timeout = setTimeout(() => {
      const fullUrl = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;
      claritySet("current_path", pathname);
      claritySet("full_url", fullUrl);
      if (typeof document !== "undefined" && document.title) {
        claritySet("page_title", document.title);
      }

      // Group pages for easy filtering in Microsoft Clarity recordings & heatmaps
      if (pathname === "/") claritySet("page_category", "home");
      else if (pathname.startsWith("/shop")) claritySet("page_category", "shop");
      else if (pathname.startsWith("/cart")) claritySet("page_category", "cart");
      else if (pathname.startsWith("/checkout")) claritySet("page_category", "checkout");
      else if (pathname.startsWith("/custom-orders")) claritySet("page_category", "custom_orders");
      else if (pathname.startsWith("/account")) claritySet("page_category", "account");
      else if (pathname.startsWith("/policies")) claritySet("page_category", "policies");
      else if (pathname.startsWith("/admin")) claritySet("page_category", "admin");

      clarityEvent("spa_pageview");
    }, 150);

    return () => clearTimeout(timeout);
  }, [pathname, searchParams]);

  return null;
}

interface MicrosoftClarityProps {
  projectId?: string;
}

export function MicrosoftClarity({
  projectId = CLARITY_PROJECT_ID,
}: MicrosoftClarityProps) {
  if (!projectId) return null;

  return (
    <>
      <Script
        id="microsoft-clarity-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${projectId}");
          `,
        }}
      />
      <Suspense fallback={null}>
        <ClarityNavigationTracker />
      </Suspense>
    </>
  );
}
