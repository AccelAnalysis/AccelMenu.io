import React from 'react';
import { Image as ImageIcon, Video } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useSlideRotation } from '../hooks/useSlideRotation';
import { useScreens } from '../hooks/useScreens';
import { useSlides } from '../hooks/useSlides';
import { usePlaylist } from '../hooks/usePlaylist';

export function DisplayPlayer() {
  const { displayScreenId, goDashboard } = useAppContext();
  const { data: screens = [] } = useScreens();
  const { data: slides = [] } = useSlides();
  const playlist = usePlaylist(displayScreenId);

  const screen = screens.find((s) => s.id === displayScreenId);
  const slideQueue = (playlist.data || screen?.slides || [])
    .map((id) => slides.find((s) => s.id === id))
    .filter(Boolean);

  const { currentSlide } = useSlideRotation(slideQueue, screen?.rotation ?? 15000);

  if (!screen || !currentSlide) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white">
        <h1 className="text-4xl font-bold mb-4">No Signal</h1>
        <p className="text-neutral-500">Screen: {screen?.name || 'Unknown'}</p>
        <p className="text-neutral-500">No slides configured.</p>
        <button onClick={goDashboard} className="mt-8 px-4 py-2 bg-neutral-800 rounded">Exit</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden cursor-none">
      <div
        className="w-full h-full relative"
        style={{ backgroundColor: currentSlide.background }}
      >
        {currentSlide.elements.sort((a, b) => a.zIndex - b.zIndex).map((el) => (
          <div
            key={el.id}
            style={{
              position: 'absolute',
              left: el.x,
              top: el.y,
              width: el.width,
              height: el.height,
              zIndex: el.zIndex,
              color: el.color,
              fontSize: el.fontSize,
              fontFamily: el.fontFamily,
              backgroundColor: el.backgroundColor,
              opacity: el.opacity,
              display: 'flex',
              alignItems: 'center',
              whiteSpace: 'pre-wrap',
            }}
          >
            {el.type === 'text' || el.type === 'price' ? el.content : ''}
            {el.type === 'image' && (
              <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                <ImageIcon className="opacity-50" size={48} />
              </div>
            )}
            {el.type === 'video' && (
              <div className="w-full h-full bg-black flex items-center justify-center">
                <Video className="opacity-50" size={48} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div
        onClick={goDashboard}
        className="fixed bottom-0 right-0 w-16 h-16 opacity-0 hover:opacity-10 z-50 cursor-pointer flex items-center justify-center bg-white transition-opacity"
        title="Exit Display Mode"
      >
        <span className="text-black font-bold text-xs">EXIT</span>
      </div>
    </div>
  );
}
