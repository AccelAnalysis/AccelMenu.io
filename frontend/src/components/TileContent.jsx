import React from 'react';
import { CloudSun, Image as ImageIcon, MessageCircle, QrCode, Video } from 'lucide-react';

export function TileContent({ data, mode = 'editor' }) {
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
    case 'weather':
      return (
        <div className="w-full h-full bg-gradient-to-br from-sky-900/60 to-slate-900/60 border border-sky-800/40 rounded px-3 py-2 text-left">
          <div className="flex items-start gap-2">
            <CloudSun size={28} className="text-sky-300" />
            <div className="flex-1">
              <div className="text-sm font-semibold">{data.location || 'Set location'}</div>
              <div className="text-xs text-sky-100/80">{data.units === 'metric' ? 'Celsius' : 'Fahrenheit'} forecast</div>
              {mode === 'editor' && !data.apiKey && (
                <div className="text-[11px] text-amber-200 mt-1">API key needed for live data</div>
              )}
            </div>
          </div>
        </div>
      );
    case 'social':
      return (
        <div className="w-full h-full bg-neutral-800/60 border border-neutral-700 rounded p-3 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-neutral-300">
            <MessageCircle size={18} />
            <span className="text-xs uppercase tracking-wide">{data.platform || 'Social'}</span>
          </div>
          <div className="flex-1 mt-2 text-sm text-neutral-100 overflow-hidden">
            <div className="font-semibold">{data.handle || '@your-handle'}</div>
            <div className="text-[12px] text-neutral-400 truncate">
              {data.feedUrl || 'Feed URL goes here'}
            </div>
          </div>
        </div>
      );
    case 'qr':
      return (
        <div className="w-full h-full bg-neutral-900/80 border border-dashed border-neutral-700 rounded p-3 flex flex-col items-center justify-center text-center">
          <QrCode size={32} className="text-neutral-400" />
          <div className="text-xs text-neutral-200 mt-2 break-words line-clamp-3">
            {data.url || 'https://example.com'}
          </div>
          {data.label && <div className="text-[11px] text-neutral-400 mt-1">{data.label}</div>}
        </div>
      );
    default:
      return <div className="w-full h-full bg-neutral-900/40 border border-neutral-800 rounded" />;
  }
}
