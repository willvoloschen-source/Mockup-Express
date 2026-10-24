/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';

interface FileUploaderProps {
  label: string;
  onFileSelect: (file: File) => void;
  accept?: string;
  currentPreview?: string;
  onClear?: () => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  label,
  onFileSelect,
  accept = "image/*",
  currentPreview,
  onClear,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  if (currentPreview) {
    return (
      <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white aspect-square flex items-center justify-center p-2 shadow-sm">
        <img src={currentPreview} alt="Prévia" className="w-full h-full object-contain" />
        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button
            onClick={onClear}
            className="p-2 bg-white text-rose-600 rounded-full hover:bg-rose-50 shadow-md transition-colors"
            title="Remover"
          >
            <X size={18} />
          </button>
        </div>
        <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-slate-900/80 rounded text-xs text-white font-medium pointer-events-none">
          {label}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full aspect-[4/3] rounded-xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center cursor-pointer group bg-slate-50/70 hover:bg-slate-50
        ${isDragging 
          ? 'border-indigo-600 bg-indigo-50/50 scale-[0.99]' 
          : 'border-slate-300 hover:border-indigo-400'
        }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        accept={accept}
        onChange={handleChange}
      />
      <div className="p-4 text-center pointer-events-none">
        <div className={`mx-auto w-10 h-10 rounded-full flex items-center justify-center mb-2.5 transition-colors
          ${isDragging ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 group-hover:text-indigo-600 shadow-sm'}`}>
          <Upload size={18} />
        </div>
        <p className="text-sm font-semibold text-slate-800 mb-0.5">{label}</p>
        <p className="text-xs text-slate-500">Arraste ou clique para carregar</p>
      </div>
    </div>
  );
};