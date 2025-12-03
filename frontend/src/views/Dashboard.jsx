import React, { useState } from 'react';
import { Monitor, Play, Plus, Trash2, Settings, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { SlideCard } from '../components/SlideCard';
import { useSlides } from '../hooks/useSlides';
import { useScreens } from '../hooks/useScreens';
import { usePlaylist } from '../hooks/usePlaylist';

export function Dashboard() {
  const { openEditor, openDisplay } = useAppContext();
  const { data: slides = [], createSlide, isLoading: slidesLoading } = useSlides();
  const { data: screens = [], updateScreen } = useScreens();
  const [draggedScreen, setDraggedScreen] = useState(null);
  const [selectedScreenId, setSelectedScreenId] = useState(null);
  const playlist = usePlaylist(selectedScreenId);

  const selectedScreen = screens.find((s) => s.id === selectedScreenId);
  const selectedPlaylist = playlist.data || selectedScreen?.slides || [];

  const handleDragStart = (screenId) => {
    setDraggedScreen(screenId);
  };

  const handleDropScreen = (e) => {
    e.preventDefault();
    if (!draggedScreen) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - 50;
    const y = e.clientY - rect.top - 50;

    updateScreen({ id: draggedScreen, updates: { x, y } });
    setDraggedScreen(null);
  };

  const handleDragOver = (e) => e.preventDefault();

  const addSlideToScreen = (screenId, slideId) => {
    playlist.addSlide({ screenId, slideId });
  };

  const createNewSlide = () => {
    createSlide({
      name: 'New Slide',
      background: '#111111',
      elements: [],
    });
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <div className="w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col">
        <div className="p-4 border-b border-neutral-800 flex justify-between items-center">
          <h2 className="font-semibold text-neutral-300">Slide Library</h2>
          <button onClick={createNewSlide} className="p-1 hover:bg-neutral-700 rounded"><Plus size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {slidesLoading && <div className="text-xs text-neutral-500">Loading slides...</div>}
          {!slidesLoading && slides.map((slide) => (
            <SlideCard key={slide.id} slide={slide} onEdit={openEditor} />
          ))}
        </div>
      </div>

      <div
        className="flex-1 bg-neutral-950 relative overflow-hidden"
        onDrop={handleDropScreen}
        onDragOver={handleDragOver}
        style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '20px 20px' }}
      >
        <div className="absolute top-4 left-4 bg-neutral-800/80 p-2 rounded text-xs text-neutral-400 backdrop-blur">
          Screen Layout View
        </div>

        {screens.map((screen) => (
          <div
            key={screen.id}
            draggable
            onDragStart={() => handleDragStart(screen.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const slideId = e.dataTransfer.getData('slideId');
              if (slideId) {
                e.stopPropagation();
                addSlideToScreen(screen.id, slideId);
              }
            }}
            onClick={() => setSelectedScreenId(screen.id)}
            style={{
              left: screen.x,
              top: screen.y,
              borderWidth: selectedScreenId === screen.id ? '2px' : '1px',
            }}
            className={`absolute w-32 h-24 bg-neutral-800 rounded-lg shadow-xl cursor-move border-neutral-600 flex flex-col items-center justify-center transition-colors hover:border-orange-400 ${selectedScreenId === screen.id ? 'border-orange-500 bg-neutral-800' : ''}`}
          >
            <Monitor className="text-neutral-500 mb-1" size={20} />
            <span className="text-xs font-medium text-center px-1 truncate w-full">{screen.name}</span>
            <span className="text-[10px] text-neutral-500">{(screen.slides || []).length} Slides</span>

            <button
              onClick={(e) => { e.stopPropagation(); openDisplay(screen.id); }}
              className="absolute -top-2 -right-2 bg-green-600 text-white rounded-full p-1 shadow-lg hover:bg-green-500 hover:scale-110 transition-all"
            >
              <Play size={10} fill="currentColor" />
            </button>
          </div>
        ))}
      </div>

      <div className={`w-80 bg-neutral-900 border-l border-neutral-800 flex flex-col transition-all duration-300 ${selectedScreenId ? 'translate-x-0' : 'translate-x-full absolute right-0 h-full'}`}>
        {selectedScreen && (
          <>
            <div className="p-4 border-b border-neutral-800">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-lg">{selectedScreen.name}</h2>
                <button onClick={() => setSelectedScreenId(null)}><X size={16} /></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-neutral-500 uppercase">Rotation (ms)</label>
                  <input
                    type="number"
                    value={selectedScreen.rotation}
                    onChange={(e) => {
                      updateScreen({ id: selectedScreen.id, updates: { rotation: parseInt(e.target.value, 10) } });
                    }}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 mt-1 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="text-xs font-semibold text-neutral-500 uppercase mb-3">Slide Stack</h3>
              <div className="space-y-2">
                {selectedPlaylist.map((sId, idx) => {
                  const slideObj = slides.find((s) => s.id === sId);
                  if (!slideObj) return null;
                  return (
                    <div key={`${sId}-${idx}`} className="bg-neutral-800 p-2 rounded flex items-center justify-between group">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-500 w-4">{idx + 1}</span>
                        <span className="text-sm">{slideObj.name}</span>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditor(sId)}
                          className="p-1 hover:bg-neutral-700 rounded text-neutral-400 hover:text-white"
                        >
                          <Settings size={14} />
                        </button>
                        <button
                          onClick={() => playlist.removeFromPlaylist({ screenId: selectedScreen.id, itemId: idx })}
                          className="p-1 hover:bg-red-900/50 rounded text-neutral-400 hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {selectedPlaylist.length === 0 && (
                  <div className="text-center py-8 text-neutral-600 text-sm border-2 border-dashed border-neutral-800 rounded">
                    Drag slides here from the library
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
