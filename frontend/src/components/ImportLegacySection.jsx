import React, { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { Toast } from './Toast';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function ImportLegacySection({ onImport, isImporting }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [validationError, setValidationError] = useState('');
  const inputRef = useRef(null);
  const { toast, showToast, clearToast } = useToast();

  const resetInput = () => {
    setSelectedFile(null);
    setValidationError('');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    setValidationError('');

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const isJson = file.type === 'application/json' || file.name.toLowerCase().endsWith('.json');
    if (!isJson) {
      setValidationError('Only .json files are supported.');
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setValidationError('File is too large. Please keep legacy imports under 5MB.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedFile) {
      setValidationError('Please select a legacy export to import.');
      return;
    }

    try {
      const text = await selectedFile.text();
      const parsed = JSON.parse(text);
      await onImport(parsed);
      showToast('Legacy data imported successfully.', 'success');
      resetInput();
    } catch (error) {
      console.error('Legacy import failed', error);
      showToast(error.message || 'Legacy import failed. Please verify the file and try again.', 'error');
    }
  };

  return (
    <section className="border-t border-neutral-800 bg-neutral-900/70 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-neutral-100">Import legacy data</h3>
          <p className="text-xs text-neutral-500 mt-1">
            Upload a legacy JSON export to merge it with your existing slides, screens, and playlists.
          </p>
        </div>
      </div>

      <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
        <div className="flex items-center gap-3">
          <label
            className="flex items-center gap-2 px-3 py-2 rounded border border-dashed border-neutral-700 bg-neutral-800/60 cursor-pointer hover:border-orange-500"
          >
            <Upload size={16} />
            <span className="text-sm">Choose legacy JSON</span>
            <input
              ref={inputRef}
              type="file"
              aria-label="Legacy JSON file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          <button
            type="submit"
            disabled={isImporting}
            className="px-3 py-2 bg-orange-600 hover:bg-orange-500 rounded text-sm font-semibold text-white disabled:opacity-60"
          >
            {isImporting ? 'Importing…' : 'Import legacy data'}
          </button>
        </div>

        <div className="text-xs text-neutral-400">
          {selectedFile ? (
            <span data-testid="selected-file">{selectedFile.name}</span>
          ) : (
            <span>No file selected</span>
          )}
        </div>

        {validationError && <div className="text-xs text-red-400" role="alert">{validationError}</div>}
      </form>

      <Toast toast={toast} onClose={clearToast} />
    </section>
  );
}
