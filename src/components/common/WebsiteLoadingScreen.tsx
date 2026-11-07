"use client";

import React, { useState, useEffect, useRef } from "react";

export function WebsiteLoadingScreen() {
  // Check session storage synchronously on client to prevent any mount delay
  const [isMounted, setIsMounted] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        return sessionStorage.getItem("resin_website_intro_shown") !== "true";
      } catch {
        return true;
      }
    }
    return true;
  });

  const [isFadingOut, setIsFadingOut] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasTriggeredEndRef = useRef(false);

  useEffect(() => {
    if (!isMounted) return;

    // Lock body scrolling while loading screen is active
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const video = videoRef.current;
    if (video) {
      // 1. Start playback immediately with zero delay
      const playPromise = video.play();

      // 2. Attempt unmuted playback for audio
      video.muted = false;

      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // If browser policy prevents unmuted autoplay before interaction,
          // continue playing muted and seamlessly unmute on first tap/click/touch
          if (video) {
            video.muted = true;
            video.play().catch(() => {});

            const unlockAudio = () => {
              if (video) {
                video.muted = false;
              }
              window.removeEventListener("pointerdown", unlockAudio);
              window.removeEventListener("touchstart", unlockAudio);
              window.removeEventListener("click", unlockAudio);
              window.removeEventListener("keydown", unlockAudio);
            };

            window.addEventListener("pointerdown", unlockAudio, { once: true });
            window.addEventListener("touchstart", unlockAudio, { once: true });
            window.addEventListener("click", unlockAudio, { once: true });
            window.addEventListener("keydown", unlockAudio, { once: true });
          }
        });
      }
    }

    // Safety fallback: if video stalls or takes longer than 9.5s, smoothly finish
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

    // Save session flag so subpage navigation doesn't replay intro repeatedly
    try {
      sessionStorage.setItem("resin_website_intro_shown", "true");
    } catch {
      // ignore
    }

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

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const { currentTime, duration } = videoRef.current;
      if (duration && !isNaN(duration) && duration > 0) {
        // Smoothly fade out right as animation reaches the finish
        if (currentTime >= duration - 0.2) {
          handleComplete();
        }
      }
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-label="Website Loading Screen"
      className={`fixed inset-0 z-[99999] w-screen h-screen overflow-hidden bg-black flex items-center justify-center transition-all duration-800 ease-in-out select-none pointer-events-none ${
        isFadingOut ? "opacity-0 scale-105" : "opacity-100 scale-100"
      }`}
    >
      {/* 
        Native HTML5 Video with responsive <source> tags:
        Browser selects the right resolution in C++ network layer with 0ms delay!
        Desktop (>= 768px): pc_Website_loading_screen_animation_25e5f393.mp4 (1280x720 16:9)
        Mobile (< 768px): Website_loading_screen_animation_25e5f393.mp4 (720x1280 9:16)
      */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        preload="auto"
        controls={false}
        disablePictureInPicture
        disableRemotePlayback
        onEnded={handleComplete}
        onTimeUpdate={handleTimeUpdate}
        onError={handleComplete}
        className="w-full h-full object-cover pointer-events-none"
      >
        <source
          media="(min-width: 768px)"
          src="/video/pc_Website_loading_screen_animation_25e5f393.mp4"
          type="video/mp4"
        />
        <source
          src="/video/Website_loading_screen_animation_25e5f393.mp4"
          type="video/mp4"
        />
      </video>
    </div>
  );
}