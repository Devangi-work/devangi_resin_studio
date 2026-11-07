"use client";

import React, { useState, useEffect, useRef } from "react";

// In-memory flag: resets on full page reload/visit, but persists across client-side page transitions
let hasPlayedInCurrentNavigation = false;

export function WebsiteLoadingScreen() {
  const [isMounted, setIsMounted] = useState(() => !hasPlayedInCurrentNavigation);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const desktopVideoRef = useRef<HTMLVideoElement | null>(null);
  const mobileVideoRef = useRef<HTMLVideoElement | null>(null);
  const hasTriggeredEndRef = useRef(false);

  const getActiveVideo = () => {
    if (typeof window !== "undefined" && window.innerWidth >= 768) {
      return desktopVideoRef.current;
    }
    return mobileVideoRef.current;
  };

  useEffect(() => {
    if (!isMounted) return;

    // Lock body scrolling while loading screen is active
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Play active video element with guaranteed autoplay
    const playActiveVideo = () => {
      const video = getActiveVideo();
      if (video) {
        video.muted = true;
        video.defaultMuted = true;
        video.play().catch(() => {
          if (video) {
            video.muted = true;
            video.play().catch(() => {});
          }
        });
      }
    };

    playActiveVideo();

    // Enable audio on user interaction (touch, tap, click anywhere on screen)
    const enableAudio = () => {
      const video = getActiveVideo();
      if (video && !hasTriggeredEndRef.current) {
        try {
          video.muted = false;
          if (video.paused) {
            video.play().catch(() => {});
          }
        } catch {
          // ignore
        }
      }
      window.removeEventListener("pointerdown", enableAudio);
      window.removeEventListener("touchstart", enableAudio);
      window.removeEventListener("click", enableAudio);
      window.removeEventListener("keydown", enableAudio);
    };

    window.addEventListener("pointerdown", enableAudio, { once: true });
    window.addEventListener("touchstart", enableAudio, { once: true });
    window.addEventListener("click", enableAudio, { once: true });
    window.addEventListener("keydown", enableAudio, { once: true });

    // Safety fallback: only trigger after 9.5s if video stalled
    const safetyTimer = setTimeout(() => {
      handleComplete();
    }, 9500);

    return () => {
      document.body.style.overflow = originalOverflow;
      clearTimeout(safetyTimer);
    };
  }, [isMounted]);

  const handleComplete = () => {
    if (hasTriggeredEndRef.current) return;
    hasTriggeredEndRef.current = true;
    hasPlayedInCurrentNavigation = true;

    // Initiate smooth exit transition to dashboard/website
    setIsFadingOut(true);

    // After 800ms transition finishes, unmount component and notify listeners
    setTimeout(() => {
      setIsMounted(false);
      document.body.style.overflow = "";
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("resin_loading_screen_completed"));
      }
    }, 800);
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (video) {
      const { currentTime, duration } = video;
      // CRITICAL: Must have loaded real duration (> 4s) and played past 4s
      // Never trigger on initial 0s load!
      if (duration && duration > 4 && currentTime > 4 && currentTime >= duration - 0.3) {
        handleComplete();
      }
    }
  };

  const handleInteraction = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    const video = getActiveVideo();
    if (video && !hasTriggeredEndRef.current) {
      try {
        video.muted = false;
        // CRITICAL: Touching screen must NEVER stop video!
        if (video.paused) {
          video.play().catch(() => {});
        }
      } catch {
        // ignore
      }
    }
  };

  const handlePause = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (!hasTriggeredEndRef.current) {
      e.currentTarget.play().catch(() => {});
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-label="Website Loading Screen"
      onClick={handleInteraction}
      onTouchStart={handleInteraction}
      onTouchEnd={handleInteraction}
      className={`fixed inset-0 z-[99999] w-full h-[100dvh] overflow-hidden bg-[#3A1823] flex items-center justify-center transition-all duration-800 ease-in-out select-none ${
        isFadingOut ? "opacity-0 scale-105 pointer-events-none" : "opacity-100 scale-100"
      }`}
      style={{ backgroundColor: "#3A1823" }}
    >
      {/* Desktop Video (md and above >= 768px): Landscape */}
      <video
        ref={desktopVideoRef}
        src="/video/pc_Website_loading_screen_animation_25e5f393.mp4"
        autoPlay
        playsInline
        muted
        preload="auto"
        controls={false}
        disablePictureInPicture
        disableRemotePlayback
        onPause={handlePause}
        onEnded={handleComplete}
        onTimeUpdate={handleTimeUpdate}
        className="hidden md:block w-full h-full max-w-full max-h-[100dvh] object-cover object-center pointer-events-none"
        style={{ backgroundColor: "#3A1823" }}
        {...({ "webkit-playsinline": "true" } as any)}
      />

      {/* Mobile Video (below md < 768px): Portrait */}
      <video
        ref={mobileVideoRef}
        src="/video/VID_20261107_070440_886_bsl.mp4"
        autoPlay
        playsInline
        muted
        preload="auto"
        controls={false}
        disablePictureInPicture
        disableRemotePlayback
        onPause={handlePause}
        onEnded={handleComplete}
        onTimeUpdate={handleTimeUpdate}
        className="block md:hidden w-full h-full max-w-full max-h-[100dvh] object-cover object-center pointer-events-none"
        style={{ backgroundColor: "#3A1823" }}
        {...({ "webkit-playsinline": "true" } as any)}
      />
    </div>
  );
}