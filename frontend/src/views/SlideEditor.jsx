import React, { useRef, useState } from 'react';
import { Image as ImageIcon, Type, Video, DollarSign, Box, Grid, Clock, Trash2, Minimize2, Maximize2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { SlideElement } from '../components/SlideElement';
import { generateId } from '../services/id';

const TILE_TYPES = [
  { type: 'text', icon: Type, label: 'Text Block' },
  { type: 'image', icon: ImageIcon, label: 'Image' },
  { type: 'video', icon: Video, label: 'Video Player' },
  { type: 'price', icon: DollarSign, label: 'Price Tag' },
  { type: 'shape', icon: Box, label: 'Shape/Panel' },
  { type: 'weather', icon: Grid, label: 'Weather Widget' },
  { type: 'social', icon: Grid, label: 'Social Feed' },
  { type: 'qr', icon: Grid, label: 'QR Code' },
];

export function SlideEditor() {
  const { data, setData, editingSlideId } = useAppContext();
  const slide = data.slides.find((s) => s.id === editingSlideId);
  const [selectedElId, setSelectedElId] = useState(null);
  const [panelsMinimized, setPanelsMinimized] = useState(false);
  const canvasRef = useRef(null);

  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  if (!slide) return <div className="p-6 text-white">Slide not found</div>;

  const updateSlideElements = (newElements) => {
    setData((prev) => ({
      ...prev,
      slides: prev.slides.map((s) => (s.id === editingSlideId ? { ...s, elements: newElements } : s)),
    }));
  };

  const updateSelectedElement = (updates) => {
    if (!selectedElId) return;
    const newElements = slide.elements.map((el) => (el.id === selectedElId ? { ...el, ...updates } : el));
    updateSlideElements(newElements);
  };

  const handleAddElement = (type) => {
    const newEl = {
      id: generateId(),
      type,
      content: type === 'price' ? '$0.00' : type === 'text' ? 'New Text' : '',
      x: 100,
      y: 100,
      width: type === 'text' || type === 'price' ? 200 : 150,
      height: type === 'text' || type === 'price' ? 60 : 150,
      color: '#ffffff',
      backgroundColor: type === 'shape' ? '#333333' : 'transparent',
      fontSize: 24,
      zIndex: slide.elements.length + 1,
      opacity: 1,
    };

    updateSlideElements([...slide.elements, newEl]);
  };

  const handleMouseDown = (e, elId) => {
    e.stopPropagation();
    setSelectedElId(elId);
    setDragging(true);

    setDragOffset({
      x: e.nativeEvent.offsetX,
      y: e.nativeEvent.offsetY,
    });
  };

  const handleMouseMove = (e) => {
    if (!dragging || !selectedElId) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - canvasRect.left - dragOffset.x;
    const y = e.clientY - canvasRect.top - dragOffset.y;

    updateSelectedElement({ x, y });
  };

  const handleMouseUp = () => setDragging(false);

  const selectedElement = slide.elements.find((e) => e.id === selectedElId);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] bg-neutral-900 text-white">
      <div className={`w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col transition-all ${panelsMinimized ? '-translate-x-full' : ''}`}>
        <div className="p-4 border-b border-neutral-800 flex justify-between items-center">
          <h2 className="font-semibold text-neutral-200">Elements</h2>
          <button
            onClick={() => setPanelsMinimized(!panelsMinimized)}
            className="p-1 hover:bg-neutral-700 rounded"
            title={panelsMinimized ? 'Show Panels' : 'Hide Panels'}
          >
            {panelsMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {TILE_TYPES.map((tile) => (
            <button
              key={tile.type}
              onClick={() => handleAddElement(tile.type)}
              className="w-full flex items-center gap-2 p-2 rounded bg-neutral-800 hover:bg-neutral-700 text-left"
            >
              <tile.icon size={16} />
              <div>
                <div className="text-sm font-medium">{tile.label}</div>
                <div className="text-[11px] text-neutral-500">{tile.type.toUpperCase()}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex">
        <div className="flex-1 bg-neutral-950 relative overflow-hidden"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div className="absolute top-2 left-2 text-xs text-neutral-500 flex items-center gap-2">
            <Clock size={14} /> Editing: {slide.name}
          </div>

          <div
            ref={canvasRef}
            onMouseDown={() => setSelectedElId(null)}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-neutral-800 border border-neutral-700 rounded shadow-xl"
            style={{ width: 800, height: 450 }}
          >
            {slide.elements.sort((a, b) => a.zIndex - b.zIndex).map((el) => (
              <SlideElement
                key={el.id}
                data={el}
                isSelected={el.id === selectedElId}
                onMouseDown={(e) => handleMouseDown(e, el.id)}
              />
            ))}
          </div>
        </div>

        <div className="w-80 bg-neutral-900 border-l border-neutral-800 p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-neutral-300">Inspector</h3>
            <button
              onClick={() => setPanelsMinimized(!panelsMinimized)}
              className="p-1 hover:bg-neutral-700 rounded"
              title={panelsMinimized ? 'Show Panels' : 'Hide Panels'}
            >
              {panelsMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
            </button>
          </div>

          {selectedElement ? (
            <>
              <div className="space-y-2">
                <div className="text-xs text-neutral-500 uppercase">Position</div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs text-neutral-400">X
                    <input
                      type="number"
                      value={selectedElement.x}
                      onChange={(e) => updateSelectedElement({ x: parseInt(e.target.value, 10) })}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-sm text-white"
                    />
                  </label>
                  <label className="text-xs text-neutral-400">Y
                    <input
                      type="number"
                      value={selectedElement.y}
                      onChange={(e) => updateSelectedElement({ y: parseInt(e.target.value, 10) })}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-sm text-white"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs text-neutral-400">Width
                    <input
                      type="number"
                      value={selectedElement.width}
                      onChange={(e) => updateSelectedElement({ width: parseInt(e.target.value, 10) })}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-sm text-white"
                    />
                  </label>
                  <label className="text-xs text-neutral-400">Height
                    <input
                      type="number"
                      value={selectedElement.height}
                      onChange={(e) => updateSelectedElement({ height: parseInt(e.target.value, 10) })}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-sm text-white"
                    />
                  </label>
                </div>

                <div>
                  <label className="text-xs text-neutral-400">Z-Index</label>
                  <input
                    type="number"
                    value={selectedElement.zIndex}
                    onChange={(e) => updateSelectedElement({ zIndex: parseInt(e.target.value, 10) })}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-sm text-white"
                  />
                </div>

                {['text', 'price'].includes(selectedElement.type) && (
                  <div>
                    <label className="text-xs text-neutral-400">Content</label>
                    <textarea
                      value={selectedElement.content}
                      onChange={(e) => updateSelectedElement({ content: e.target.value })}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-sm text-white"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs text-neutral-400">Font Size
                    <input
                      type="number"
                      value={selectedElement.fontSize}
                      onChange={(e) => updateSelectedElement({ fontSize: parseInt(e.target.value, 10) })}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-sm text-white"
                    />
                  </label>
                  <label className="text-xs text-neutral-400">Color
                    <input
                      type="color"
                      value={selectedElement.color}
                      onChange={(e) => updateSelectedElement({ color: e.target.value })}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-sm"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs text-neutral-400">Background
                    <input
                      type="color"
                      value={selectedElement.backgroundColor || '#000000'}
                      onChange={(e) => updateSelectedElement({ backgroundColor: e.target.value })}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-sm"
                    />
                  </label>
                  <label className="text-xs text-neutral-400">Opacity
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.05"
                      value={selectedElement.opacity}
                      onChange={(e) => updateSelectedElement({ opacity: parseFloat(e.target.value) })}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-sm text-white"
                    />
                  </label>
                </div>

                <button
                  onClick={() => {
                    const filtered = slide.elements.filter((el) => el.id !== selectedElId);
                    updateSlideElements(filtered);
                    setSelectedElId(null);
                  }}
                  className="mt-4 flex items-center justify-center gap-2 px-3 py-2 bg-red-900/40 hover:bg-red-800/50 rounded text-red-200 text-sm"
                >
                  <Trash2 size={16} /> Delete Element
                </button>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-xs text-neutral-500 uppercase mb-1 block">Slide Name</label>
                <input
                  type="text"
                  value={slide.name}
                  onChange={(e) => setData((prev) => ({
                    ...prev,
                    slides: prev.slides.map((s) => (s.id === editingSlideId ? { ...s, name: e.target.value } : s)),
                  }))}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-500 uppercase mb-1 block">Background Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={slide.background}
                    onChange={(e) => setData((prev) => ({
                      ...prev,
                      slides: prev.slides.map((s) => (s.id === editingSlideId ? { ...s, background: e.target.value } : s)),
                    }))}
                    className="w-8 h-8 rounded cursor-pointer bg-transparent border-none"
                  />
                </div>
              </div>
              <div className="mt-8 text-neutral-500 text-sm p-4 bg-neutral-900 rounded border border-neutral-800">
                Select an element on the canvas to edit its properties.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
