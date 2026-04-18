"use client";
import { useRef } from "react";
import { ImagePlus, X } from "lucide-react";

interface Props {
  preview: string | null; // full data URL
  onSelect: (base64: string, dataUrl: string) => void;
  onClear: () => void;
}

export default function ImageUpload({ preview, onSelect, onClear }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const base64 = dataUrl.split(",")[1]; // strip "data:image/...;base64,"
      onSelect(base64, dataUrl);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="p-2 rounded-lg text-gray-400 hover:text-farm-green hover:bg-farm-pale transition-colors"
        title="Upload image"
      >
        <ImagePlus className="w-5 h-5" />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          // reset so same file can be re-selected
          e.target.value = "";
        }}
      />
      {preview && (
        <div className="relative">
          <img
            src={preview}
            alt="preview"
            className="w-10 h-10 object-cover rounded-lg border border-gray-200"
          />
          <button
            type="button"
            onClick={onClear}
            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </div>
      )}
    </div>
  );
}
