import React from 'react';

const typeStyles = {
  info: 'bg-neutral-800 border-neutral-700 text-neutral-100',
  success: 'bg-green-700/80 border-green-500 text-white',
  error: 'bg-red-800/80 border-red-500 text-white',
};

export function Toast({ toast, onClose }) {
  if (!toast) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      <div
        className={`rounded border px-3 py-2 shadow-lg backdrop-blur-sm ${typeStyles[toast.type] || typeStyles.info}`}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-start justify-between gap-3">
          <span className="text-sm leading-5">{toast.message}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Dismiss notification"
            className="text-xs text-neutral-300 hover:text-white"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
