import React from 'react';
import { TileContent } from './TileContent';

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
    opacity: data.opacity || 1,
  };

  return (
    <div
      style={style}
      onMouseDown={onMouseDown}
      className={`${isSelected ? 'ring-2 ring-orange-500' : ''} hover:ring-1 hover:ring-white/30 transition-shadow select-none`}
    >
      <TileContent data={data} mode="editor" />
      {isSelected && (
        <>
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-orange-500 rounded-full" />
          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-orange-500 rounded-full" />
        </>
      )}
    </div>
  );
}
