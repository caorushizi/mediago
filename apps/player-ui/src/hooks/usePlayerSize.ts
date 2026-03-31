import { useMemoizedFn } from "ahooks";
import { useEffect } from "react";
import type Player from "video.js/dist/types/player";

interface ContainerSize {
  width: number;
  height: number;
}

/**
 * Hook for managing video player dimensions
 * Handles aspect ratio calculation and responsive sizing
 *
 * @param playerRef - Reference to the video.js player instance
 * @param containerRef - Reference to the container element
 * @param containerSize - Current size of the container (width, height)
 */
export function usePlayerSize(
  playerRef: React.MutableRefObject<Player | null>,
  containerRef: React.MutableRefObject<HTMLDivElement | null>,
  containerSize: ContainerSize | undefined,
) {
  /**
   * Calculate and set player size based on container dimensions and video aspect ratio
   * Uses letterboxing approach: fits video within container while maintaining aspect ratio
   */
  const calculateAndSetPlayerSize = useMemoizedFn(() => {
    if (!playerRef.current) return;

    const videoWidth = playerRef.current.videoWidth();
    const videoHeight = playerRef.current.videoHeight();

    if (videoWidth === 0 || videoHeight === 0) {
      console.warn("Video dimensions not available");
      return;
    }

    const containerWidth = containerSize?.width || 0;
    const containerHeight = containerSize?.height || 0;

    if (containerWidth === 0 || containerHeight === 0) {
      console.warn("Container dimensions not available");
      return;
    }

    console.log("Calculating player size...", {
      videoWidth,
      videoHeight,
      containerWidth,
      containerHeight,
    });

    // Calculate aspect ratios
    const containerAspectRatio = containerWidth / containerHeight;
    const videoAspectRatio = videoWidth / videoHeight;

    // Determine sizing strategy based on aspect ratio comparison
    if (containerAspectRatio > videoAspectRatio) {
      // Container is wider than video - fit by height
      playerRef.current.width(containerHeight * videoAspectRatio);
      playerRef.current.height(containerHeight);
    } else {
      // Container is taller than video - fit by width
      playerRef.current.width(containerWidth);
      playerRef.current.height(containerWidth / videoAspectRatio);
    }
  });

  /**
   * Monitor container resize and recalculate player size
   */
  useEffect(() => {
    const containerElement = containerRef.current;
    if (!containerElement) return;

    const resizeObserver = new ResizeObserver(() => {
      calculateAndSetPlayerSize();
    });

    resizeObserver.observe(containerElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, [calculateAndSetPlayerSize, containerRef]);

  /**
   * Recalculate when container size changes (from useSize hook)
   */
  useEffect(() => {
    calculateAndSetPlayerSize();
  }, [calculateAndSetPlayerSize]);

  return {
    calculateAndSetPlayerSize,
  };
}
