import { useEffect, useState } from 'react';

const DEFAULT_SLIDE_DURATION = 5000;

export function useSlideRotation(slides = [], rotation) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return undefined;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, rotation || DEFAULT_SLIDE_DURATION);

    return () => clearInterval(interval);
  }, [rotation, slides.length]);

  return { currentSlide: slides[currentIndex], currentIndex, setCurrentIndex };
}
