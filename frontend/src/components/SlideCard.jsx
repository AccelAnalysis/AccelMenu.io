import React from 'react';
import { Plus } from 'lucide-react';

export function SlideCard({ slide, onEdit }) {
  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData('slideId', slide.id)}
      className="bg-neutral-800 p-3 rounded border border-neutral-700 hover:border-orange-500 cursor-move group"
    >
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium">{slide.name}</span>
        <button
          onClick={() => onEdit(slide.id)}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-neutral-600 rounded text-xs"
        >
          Edit
        </button>
      </div>
      <div
        className="w-full h-20 rounded bg-neutral-900 overflow-hidden relative"
        style={{ backgroundColor: slide.background }}
      >
        {slide.elements.length > 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-neutral-600 text-xs">
            {slide.elements.length} items
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-neutral-700 text-xs">
            Empty slide
          </div>
        )}
      </div>
    </div>
  );
}

export function SlideCardPlaceholder({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-neutral-700 text-neutral-400 hover:text-white hover:border-orange-500 rounded"
    >
      <Plus size={16} /> New Slide
    </button>
  );
}
