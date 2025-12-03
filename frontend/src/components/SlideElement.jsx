import React from 'react';
import { Image as ImageIcon, Video } from 'lucide-react';

export function SlideElement({ data, isSelected, onMouseDown }) {
  const style = {
    position: 'absolute',
    left: `${data.x}px`,
    top: `${data.y}px`,
    width: `${data.width}px`,
    height: `${data.height}px`,
    zIndex: data.zIndex,
    cursor: onMouseDown ? 'move' : 'default',
    color: data.color,
    fontSize: `${data.fontSize}px`,
    fontFamily: data.fontFamily || 'sans-serif',
    backgroundColor: data.backgroundColor || 'transparent',
    opacity: data.opacity || 1
  };

  const renderContent = () => {
    switch (data.type) {
      case 'text':
      case 'price':
        return (
          <div className="w-full h-full flex items-center leading-tight whitespace-pre-wrap">
            {data.content}
          </div>
        );
      case 'shape':
        return <div className="w-full h-full border border-white/10" />;
      case 'image':
        return (
          <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-neutral-500 border border-dashed border-neutral-600">
            <ImageIcon size={32} />
            <span className="text-xs ml-2">Image Placeholder</span>
          </div>
        );
      case 'video':
        return (
          <div className="w-full h-full bg-black flex items-center justify-center text-neutral-500">
            <Video size={32} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      style={style}
      onMouseDown={onMouseDown}
      className={`${isSelected ? 'ring-2 ring-orange-500' : ''} hover:ring-1 hover:ring-white/30 transition-shadow select-none`}
    >
      {renderContent()}
      {isSelected && (
        <>
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-orange-500 rounded-full" />
          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-orange-500 rounded-full" />
        </>
      )}
    </div>
  );
}
