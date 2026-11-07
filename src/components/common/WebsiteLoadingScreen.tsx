"use client";

import React, { useState, useEffect, useRef } from "react";

export function WebsiteLoadingScreen() {
  // Check session storage synchronously on client
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
      const isDesktop = typeof window !== "undefined" && window.innerWidth >= 768;
      const expectedSrc = isDesktop
        ? "/video/pc_Website_loading_screen_animation_25e5f393.mp4"
        : "/video/Website_loading_screen_animation_25e5f393.mp4";

      // Ensure explicit source assignment if not already playing expected video
      if (!video.src && !video.currentSrc) {
        video.src = expectedSrc;
        video.load();
      }

      // Ensure muted for guaranteed instant autoplay without browser rejection
      video.muted = true;
      video.defaultMuted = true;

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // On desktop viewports, attempt to unmute for audio immediately
            if (isDesktop) {
              try {
                video.muted = false;
              } catch {
                // ignore
              }
            }
          })
          .catch(() => {
            // Autoplay fallback with muted
            if (video) {
              video.muted = true;
              video.play().catch(() => {});
            }
          });
      }

      // Audio unlock on user interaction (tap, touch, click anywhere on screen)
      const unlockAudio = () => {
        if (video && !hasTriggeredEndRef.current) {
          try {
            video.muted = false;
            // Ensure video NEVER pauses when touched/unmuted
            if (video.paused) {
              video.play().catch(() => {});
            }
          } catch {
            // ignore
          }
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

    // Safety fallback: only trigger after 10s if video stalled
    const safetyTimer = setTimeout(() => {
      handleComplete();
    }, 10000);

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
      // CRITICAL: Must have loaded real duration (> 4s) and played past 4s
      // This prevents any premature exit on mobile metadata load!
      if (duration && duration > 4 && currentTime > 4 && currentTime >= duration - 0.3) {
        handleComplete();
      }
    }
  };

  const handleInteraction = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
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
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        preload="auto"
        controls={false}
        disablePictureInPicture
        disableRemotePlayback
        onPause={() => {
          // CRITICAL: If browser tries to pause for any reason, immediately resume!
          if (!hasTriggeredEndRef.current && videoRef.current) {
            videoRef.current.play().catch(() => {});
          }
        }}
        onEnded={handleComplete}
        onTimeUpdate={handleTimeUpdate}
        className="w-full h-full max-w-full max-h-[100dvh] object-contain sm:object-cover object-center pointer-events-none"
        style={{ backgroundColor: "#3A1823" }}
        {...({ "webkit-playsinline": "true" } as any)}
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