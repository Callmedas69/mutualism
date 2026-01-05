"use client";

import { useState, useEffect, useRef } from "react";
import { LRUCache } from "@/lib/utils/lru-cache";

// LRU cache for loaded images (max 200 entries to prevent memory bloat)
const imageCache = new LRUCache<string, HTMLImageElement>(200);

// LRU cache for pre-rendered circular avatar canvases (max 400 entries)
// Higher limit because same image may have multiple size variants
const avatarCanvasCache = new LRUCache<string, HTMLCanvasElement>(400);

export function loadImage(url: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(url);
  if (cached) {
    return Promise.resolve(cached);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageCache.set(url, img);
      resolve(img);
    };
    img.onerror = reject;
    img.src = url;
  });
}

// Pre-render clipped circular avatar to offscreen canvas (called once per avatar)
// Uses 4x resolution for crisp export quality
export function getAvatarCanvas(img: HTMLImageElement, size: number): HTMLCanvasElement {
  const key = `${img.src}-${size}`;
  const cached = avatarCanvasCache.get(key);
  if (cached) {
    return cached;
  }

  const canvas = document.createElement("canvas");
  const scale = 4; // High-res for export quality
  const diameter = size * 2 * scale;
  canvas.width = diameter;
  canvas.height = diameter;
  const ctx = canvas.getContext("2d")!;

  // Draw circular clip and image at high resolution
  ctx.beginPath();
  ctx.arc(diameter / 2, diameter / 2, diameter / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, 0, 0, diameter, diameter);

  avatarCanvasCache.set(key, canvas);
  return canvas;
}

interface UseImagePreloaderParams {
  centerUserPfp: string | null;
  connectionPfps: (string | null)[];
  maxNodes: number;
}

interface UseImagePreloaderResult {
  loadedImagesRef: React.MutableRefObject<Map<string, HTMLImageElement>>;
  imagesLoaded: boolean;
}

export function useImagePreloader({
  centerUserPfp,
  connectionPfps,
  maxNodes,
}: UseImagePreloaderParams): UseImagePreloaderResult {
  // Use ref for image lookups in callbacks (stable reference)
  // State triggers re-render when images are loaded
  const loadedImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Stable key to detect actual URL changes (prevents infinite re-renders)
  const urlsKey = [centerUserPfp, ...connectionPfps.slice(0, maxNodes)].filter(Boolean).join(",");

  useEffect(() => {
    const urlsToLoad: string[] = [];

    if (centerUserPfp) {
      urlsToLoad.push(centerUserPfp);
    }

    connectionPfps.slice(0, maxNodes).forEach((pfp) => {
      if (pfp) {
        urlsToLoad.push(pfp);
      }
    });

    const loadAllImages = async () => {
      // Preserve existing loaded images from ref
      const currentImages = loadedImagesRef.current;
      const newImages = new Map<string, HTMLImageElement>(currentImages);

      // Only load images that aren't already in the ref
      const urlsToFetch = urlsToLoad.filter((url) => !currentImages.has(url));

      if (urlsToFetch.length === 0) {
        // All images already loaded
        setImagesLoaded(true);
        return;
      }

      await Promise.all(
        urlsToFetch.map(async (url) => {
          try {
            const img = await loadImage(url);
            newImages.set(url, img);
          } catch {
            // Failed to load image, will show fallback
          }
        })
      );

      // Update ref (stable for callbacks) and trigger re-render
      loadedImagesRef.current = newImages;
      setImagesLoaded(true);
    };

    // Reset state for new data
    setImagesLoaded(false);
    loadAllImages();
  }, [urlsKey]); // Use stable string key instead of array references

  return {
    loadedImagesRef,
    imagesLoaded,
  };
}
