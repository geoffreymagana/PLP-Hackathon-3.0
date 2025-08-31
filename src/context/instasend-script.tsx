
"use client";

import Script from 'next/script';
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';

declare const window: any;

type IntaSendContextType = {
  isScriptLoaded: boolean;
  scriptError: string | null;
};

const IntaSendContext = createContext<IntaSendContextType | undefined>(undefined);

export function useIntaSend() {
  const context = useContext(IntaSendContext);
  if (!context) {
    throw new Error('useIntaSend must be used within an IntaSendProvider');
  }
  return context;
}

export function IntaSendProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState<string | null>(null);
  const publishableKey = process.env.NEXT_PUBLIC_INTASEND_PUBLISHABLE_KEY || "";


  const handleScriptLoad = () => {
    setIsScriptLoaded(true);
    if (typeof window.IntaSend !== 'undefined') {
        new window.IntaSend({
            publicAPIKey: publishableKey,
            live: false
        })
        .on("COMPLETE", (results: any) => {
            console.log("Success", results);
            const redirectUrl = results.redirect_url || '/payment/complete';
            const signature = results.signature;
            const trackingId = results.tracking_id;
            const state = results.state;
            const queryString = `?signature=${signature}&tracking_id=${trackingId}&state=${state}`;
            router.push(`/payment/complete${queryString}`);
        })
        .on("FAILED", (results: any) => {
            console.log("Failed", results);
            const redirectUrl = results.redirect_url || '/payment/complete';
            const signature = results.signature;
            const trackingId = results.tracking_id;
            const state = results.state;
            const queryString = `?signature=${signature}&tracking_id=${trackingId}&state=${state}`;
            router.push(`/payment/complete${queryString}`);
        })
        .on("IN-PROGRESS", (results: any) => console.log("In progress", results));
    }
  };

  const handleScriptError = () => {
    setScriptError("Failed to load payment gateway. Please check your connection and refresh the page.");
  };

  return (
    <IntaSendContext.Provider value={{ isScriptLoaded, scriptError }}>
      <Script
        src="https://payment.intasend.com/js/app.js"
        strategy="afterInteractive"
        onLoad={handleScriptLoad}
        onError={handleScriptError}
      />
      {children}
    </IntaSendContext.Provider>
  );
}
