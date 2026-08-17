import React, { useState, useRef } from 'react';
import { uploadToImgBB } from '../services/imgbb';
import {
  Upload,
  Image as ImageIcon,
  Loader2,
  Check,
  Copy,
  X,
  ExternalLink,
  AlertCircle,
  Sparkles
} from 'lucide-react';

interface ImageUploadInputProps {
  id?: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  label?: string;
  helpText?: string;
  className?: string;
  inputClassName?: string;
  showPreview?: boolean;
}

export const ImageUploadInput: React.FC<ImageUploadInputProps> = ({
  id,
  value,
  onChange,
  placeholder = 'https://... ou faça upload de imagem local',
  label,
  helpText,
  className = '',
  inputClassName = '',
  showPreview = true,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadStatus({ type: 'error', message: 'Selecione um arquivo de imagem válido (PNG, JPG, WEBP, GIF).' });
      setTimeout(() => setUploadStatus(null), 4000);
      return;
    }

    setIsUploading(true);
    setUploadStatus(null);

    try {
      const result = await uploadToImgBB(file, file.name.replace(/\.[^/.]+$/, ''));
      if (result.success && result.url) {
        onChange(result.url);
        setUploadStatus({ type: 'success', message: 'Upload para ImgBB concluído com sucesso!' });
      } else {
        setUploadStatus({
          type: 'error',
          message: result.error || 'Erro ao enviar imagem para o ImgBB.'
        });
      }
    } catch (err: any) {
      setUploadStatus({
        type: 'error',
        message: 'Falha de comunicação com o servidor ImgBB.'
      });
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadStatus(null), 4500);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
      // Reset input value so same file can be selected again if needed
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-xs font-bold text-zinc-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-zinc-400" />
            <span>{label}</span>
          </span>
          {value && (
            <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
              <Check className="w-3 h-3" /> Imagem vinculada
            </span>
          )}
        </label>
      )}

      {/* Input container with Drag & Drop */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative flex items-center rounded-xl bg-[#0e0d14] border transition-all ${
          isDragging
            ? 'border-cyan-400 bg-cyan-950/20 ring-2 ring-cyan-500/30'
            : 'border-zinc-800 focus-within:border-cyan-500/80 focus-within:ring-1 focus-within:ring-cyan-500/30'
        }`}
      >
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full pl-3.5 pr-28 py-2 rounded-xl bg-transparent text-xs text-zinc-100 placeholder-zinc-600 outline-none font-mono transition-colors ${inputClassName}`}
        />

        {/* Action buttons inside input */}
        <div className="absolute right-1.5 flex items-center gap-1">
          {value && (
            <>
              <button
                type="button"
                onClick={handleCopy}
                title="Copiar URL"
                className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => onChange('')}
                title="Limpar campo"
                className="p-1.5 rounded-lg hover:bg-rose-950/50 text-zinc-400 hover:text-rose-300 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {/* Hidden native file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Upload Button */}
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            title="Selecionar imagem do computador para upload no ImgBB"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-sm ${
              isUploading
                ? 'bg-zinc-800 text-zinc-400 cursor-not-allowed'
                : 'bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 hover:text-cyan-100'
            }`}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
                <span className="text-[11px]">Enviando...</span>
              </>
            ) : (
              <>
                <Upload className="w-3 h-3 text-cyan-400" />
                <span className="text-[11px] whitespace-nowrap">Upload ImgBB</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Upload Feedback Message */}
      {uploadStatus && (
        <div
          className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border ${
            uploadStatus.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
              : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
          }`}
        >
          {uploadStatus.type === 'success' ? (
            <Check className="w-3.5 h-3.5 shrink-0" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          )}
          <span className="flex-1">{uploadStatus.message}</span>
        </div>
      )}

      {/* Optional Thumbnail Preview */}
      {showPreview && value && (
        <div className="flex items-center gap-3 p-2 rounded-xl bg-black/40 border border-zinc-800/80">
          <div className="w-12 h-12 rounded-lg overflow-hidden border border-zinc-700/60 bg-zinc-900 shrink-0">
            <img
              src={value}
              alt="Preview"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] text-zinc-300 font-mono truncate">{value}</div>
            <div className="flex items-center gap-2 mt-1">
              <a
                href={value}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1"
              >
                <span>Abrir original</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
              <span className="text-zinc-600 text-[10px]">•</span>
              <span className="text-[10px] text-zinc-500">ImgBB / Hospedada</span>
            </div>
          </div>
        </div>
      )}

      {helpText && !uploadStatus && (
        <p className="text-[10px] text-zinc-500 flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5 text-cyan-500/70" />
          <span>{helpText}</span>
        </p>
      )}
    </div>
  );
};
