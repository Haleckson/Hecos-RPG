import React, { useState, useRef, useEffect } from 'react';
import {
  uploadToImgBB,
  uploadMultipleToImgBB,
  downloadImage,
  generateSemanticImageName,
  ImgBBUploadResult,
  SemanticNamingOptions
} from '../services/imgbb';
import {
  Upload,
  Images,
  Image as ImageIcon,
  Loader2,
  Check,
  Download,
  X,
  AlertCircle,
  Sparkles,
  Link2,
  Trash2,
  Plus,
  FileCheck,
  CheckCircle2,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface PendingAlbumUploadItem {
  id: string;
  file?: File;
  url: string;
  caption: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress?: number;
  error?: string;
  previewUrl?: string;
  fileName?: string;
  wasConverted?: boolean;
}

interface MultiImageAlbumUploaderProps {
  onImagesUploaded: (images: { url: string; caption?: string }[]) => void;
  onCancel?: () => void;
  title?: string;
  description?: string;
  themeColor?: 'purple' | 'cyan' | 'amber';
  maxFiles?: number;
  inline?: boolean;
  category?: string;
  entityName?: string;
  role?: string;
  startIndex?: number;
}

export const MultiImageAlbumUploader: React.FC<MultiImageAlbumUploaderProps> = ({
  onImagesUploaded,
  onCancel,
  title = 'Adicionar Múltiplas Imagens ao Álbum',
  description = 'Selecione ou arraste múltiplas imagens ao mesmo tempo para carregar no álbum.',
  themeColor = 'purple',
  maxFiles = 50,
  inline = false,
  category = 'ancestralidade',
  entityName,
  role = 'album',
  startIndex = 1,
}) => {
  const [items, setItems] = useState<PendingAlbumUploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploadingAll, setIsUploadingAll] = useState(false);
  const [urlInputMode, setUrlInputMode] = useState(false);
  const [bulkUrlsText, setBulkUrlsText] = useState('');
  const [commonCaption, setCommonCaption] = useState('');
  const [overallProgress, setOverallProgress] = useState({ completed: 0, total: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Styling based on themeColor
  const themeClasses = {
    purple: {
      borderActive: 'border-purple-400 bg-purple-950/20 ring-2 ring-purple-500/30',
      borderDefault: 'border-purple-900/50 hover:border-purple-600/60',
      badge: 'bg-purple-900/60 text-purple-200 border-purple-700/50',
      buttonPrimary: 'bg-purple-700 hover:bg-purple-600 text-purple-100 shadow-purple-900/40',
      buttonSecondary: 'bg-purple-950/80 hover:bg-purple-900 border-purple-500/50 text-purple-300',
      textAccent: 'text-purple-300',
      progressBg: 'bg-purple-600',
    },
    cyan: {
      borderActive: 'border-cyan-400 bg-cyan-950/20 ring-2 ring-cyan-500/30',
      borderDefault: 'border-cyan-900/50 hover:border-cyan-600/60',
      badge: 'bg-cyan-900/60 text-cyan-200 border-cyan-700/50',
      buttonPrimary: 'bg-cyan-700 hover:bg-cyan-600 text-cyan-100 shadow-cyan-900/40',
      buttonSecondary: 'bg-cyan-950/80 hover:bg-cyan-900 border-cyan-500/50 text-cyan-300',
      textAccent: 'text-cyan-300',
      progressBg: 'bg-cyan-600',
    },
    amber: {
      borderActive: 'border-amber-400 bg-amber-950/20 ring-2 ring-amber-500/30',
      borderDefault: 'border-amber-900/50 hover:border-amber-600/60',
      badge: 'bg-amber-900/60 text-amber-200 border-amber-700/50',
      buttonPrimary: 'bg-amber-700 hover:bg-amber-600 text-amber-100 shadow-amber-900/40',
      buttonSecondary: 'bg-amber-950/80 hover:bg-amber-900 border-amber-500/50 text-amber-300',
      textAccent: 'text-amber-300',
      progressBg: 'bg-amber-600',
    },
  }[themeColor];

  // Handle pasting images from clipboard
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const clipboardItems = e.clipboardData?.items;
      if (!clipboardItems) return;

      const filesToAdd: File[] = [];
      for (let i = 0; i < clipboardItems.length; i++) {
        if (clipboardItems[i].type.startsWith('image/')) {
          const file = clipboardItems[i].getAsFile();
          if (file) filesToAdd.push(file);
        }
      }

      if (filesToAdd.length > 0) {
        e.preventDefault();
        addFilesToList(filesToAdd);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const addFilesToList = (files: File[]) => {
    const newItems: PendingAlbumUploadItem[] = files.map((file, idx) => {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      return {
        id: `pending-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
        file,
        url: '',
        caption: commonCaption || cleanName,
        status: 'pending',
        previewUrl: URL.createObjectURL(file),
      };
    });

    setItems((prev) => [...prev, ...newItems]);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files: File[] = [];
    for (let i = 0; i < e.target.files.length; i++) {
      const file = e.target.files[i];
      if (file) files.push(file);
    }
    if (files.length > 0) {
      addFilesToList(files);
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (!e.dataTransfer.files) return;
    const imageFiles: File[] = [];
    for (let i = 0; i < e.dataTransfer.files.length; i++) {
      const file = e.dataTransfer.files[i];
      if (file && file.type && file.type.startsWith('image/')) {
        imageFiles.push(file);
      }
    }
    if (imageFiles.length > 0) {
      addFilesToList(imageFiles);
    }
  };

  const handleAddBulkUrls = () => {
    if (!bulkUrlsText.trim()) return;

    const urls = bulkUrlsText
      .split(/[\n,]+/)
      .map((u) => u.trim())
      .filter((u) => u.startsWith('http://') || u.startsWith('https://') || u.startsWith('data:image/'));

    if (urls.length === 0) return;

    const newItems: PendingAlbumUploadItem[] = urls.map((url, idx) => ({
      id: `url-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
      url,
      caption: commonCaption || '',
      status: 'success', // URLs are ready immediately
      previewUrl: url,
    }));

    setItems((prev) => [...prev, ...newItems]);
    setBulkUrlsText('');
    setUrlInputMode(false);
  };

  const removeItem = (id: string) => {
    setItems((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl && target.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const updateItemCaption = (id: string, caption: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, caption } : item))
    );
  };

  const startUploadAll = async () => {
    const pendingItems = items.filter((item) => item.status === 'pending' && item.file);
    if (pendingItems.length === 0) {
      // If all are already uploaded or URLs, finalize
      finalizeSubmission();
      return;
    }

    setIsUploadingAll(true);
    setOverallProgress({ completed: 0, total: pendingItems.length });

    let currentCompleted = 0;

    for (const item of pendingItems) {
      // Mark current item as uploading
      setItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, status: 'uploading' } : it))
      );

      try {
        const itemIndex = (startIndex || 1) + currentCompleted;
        const semanticOpts: SemanticNamingOptions = {
          category: category || 'ancestralidade',
          entityName: entityName || 'album',
          role: role || 'album',
          index: itemIndex,
          originalFilename: item.file?.name
        };

        const res: ImgBBUploadResult = await uploadToImgBB(item.file!, semanticOpts);

        if (res.success && res.url) {
          setItems((prev) =>
            prev.map((it) =>
              it.id === item.id
                ? {
                    ...it,
                    status: 'success',
                    url: res.url!,
                    fileName: res.fileName,
                    wasConverted: res.wasConvertedToWebP,
                    error: undefined
                  }
                : it
            )
          );
        } else {
          setItems((prev) =>
            prev.map((it) =>
              it.id === item.id
                ? { ...it, status: 'error', error: res.error || 'Falha no upload' }
                : it
            )
          );
        }
      } catch (err: any) {
        setItems((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? { ...it, status: 'error', error: err?.message || 'Erro de conexão' }
              : it
          )
        );
      }

      currentCompleted++;
      setOverallProgress({ completed: currentCompleted, total: pendingItems.length });
    }

    setIsUploadingAll(false);
  };

  const finalizeSubmission = () => {
    const successful = items.filter((item) => item.status === 'success' && item.url.trim().length > 0);
    if (successful.length === 0) return;

    onImagesUploaded(
      successful.map((item) => ({
        url: item.url.trim(),
        caption: item.caption.trim() || undefined,
      }))
    );

    // Clean up blobs
    items.forEach((item) => {
      if (item.previewUrl && item.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });

    setItems([]);
  };

  const successfulCount = items.filter((it) => it.status === 'success').length;
  const pendingCount = items.filter((it) => it.status === 'pending').length;
  const errorCount = items.filter((it) => it.status === 'error').length;

  return (
    <div className={`space-y-4 ${inline ? '' : 'p-4 sm:p-5 rounded-2xl bg-[#120f20] border border-purple-900/60 shadow-xl'}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-950/80 text-purple-300 border border-purple-700/50">
            <Images className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-extrabold text-zinc-100 flex items-center gap-2">
              <span>{title}</span>
              {items.length > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-normal border ${themeClasses.badge}`}>
                  {items.length} {items.length === 1 ? 'item' : 'itens'}
                </span>
              )}
            </h4>
            <p className="text-xs text-zinc-400">{description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setUrlInputMode(!urlInputMode)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
          >
            <Link2 className="w-3.5 h-3.5 text-zinc-400" />
            <span>{urlInputMode ? 'Modo Arquivos' : 'Colar Múltiplas URLs'}</span>
          </button>
        </div>
      </div>

      {/* URL Bulk Input Mode */}
      {urlInputMode ? (
        <div className="p-4 rounded-xl bg-[#0a0814] border border-purple-900/40 space-y-3 animate-in fade-in">
          <label className="text-xs font-bold text-zinc-300 block">
            Cole links de imagens (uma URL por linha ou separadas por vírgula):
          </label>
          <textarea
            rows={4}
            value={bulkUrlsText}
            onChange={(e) => setBulkUrlsText(e.target.value)}
            placeholder="https://exemplo.com/arte1.jpg&#10;https://exemplo.com/arte2.png&#10;https://exemplo.com/arte3.webp"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#120f20] border border-zinc-700 text-xs text-zinc-100 font-mono focus:outline-none focus:border-purple-500 placeholder:text-zinc-600"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setUrlInputMode(false)}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={handleAddBulkUrls}
              disabled={!bulkUrlsText.trim()}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${themeClasses.buttonPrimary} disabled:opacity-50`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar URLs à Fila</span>
            </button>
          </div>
        </div>
      ) : (
        /* Drag and Drop Zone */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative p-6 sm:p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center group ${
            isDragging
              ? themeClasses.borderActive
              : `bg-[#0a0814] ${themeClasses.borderDefault}`
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />

          <div className="p-3.5 rounded-2xl bg-purple-950/50 border border-purple-800/40 text-purple-300 group-hover:scale-110 transition-transform mb-3">
            <Upload className="w-7 h-7" />
          </div>

          <h5 className="text-sm font-bold text-zinc-200 mb-1">
            Clique para selecionar <span className={themeClasses.textAccent}>várias imagens</span> ou arraste-as aqui
          </h5>
          <p className="text-xs text-zinc-400 max-w-md mb-2">
            Suporta seleção simultânea de múltiplos arquivos PNG, JPG, WEBP e GIF (ou cole com <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] font-mono border border-zinc-700">Ctrl+V</kbd>).
          </p>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-900/40 border border-purple-700/50 text-[11px] font-medium text-purple-300">
            <Sparkles className="w-3 h-3" />
            <span>Upload automático no ImgBB com redundância</span>
          </div>
        </div>
      )}

      {/* Progress Bar during batch upload */}
      {isUploadingAll && overallProgress.total > 0 && (
        <div className="p-3.5 rounded-xl bg-[#090812] border border-purple-800/60 space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-purple-200 flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
              <span>
                Enviando {overallProgress.completed} de {overallProgress.total} imagens para o ImgBB...
              </span>
            </span>
            <span className="font-mono text-purple-300">
              {Math.round((overallProgress.completed / overallProgress.total) * 100)}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${themeClasses.progressBg}`}
              style={{
                width: `${(overallProgress.completed / overallProgress.total) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Pending Items List */}
      {items.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>
                Imagens Selecionadas ({items.length}) • {successfulCount} prontas, {pendingCount} pendentes
              </span>
            </span>

            <button
              type="button"
              onClick={() => setItems([])}
              className="text-xs text-zinc-500 hover:text-rose-400 transition-colors"
            >
              Limpar todas
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className={`p-2.5 rounded-xl border flex gap-2.5 items-start transition-all ${
                  item.status === 'success'
                    ? 'bg-emerald-950/20 border-emerald-800/50'
                    : item.status === 'error'
                    ? 'bg-rose-950/20 border-rose-800/50'
                    : item.status === 'uploading'
                    ? 'bg-purple-950/30 border-purple-500 animate-pulse'
                    : 'bg-[#141124] border-purple-900/40'
                }`}
              >
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-black/60 border border-zinc-800 shrink-0 relative flex items-center justify-center">
                  {item.previewUrl || item.url ? (
                    <img
                      src={item.previewUrl || item.url}
                      alt={item.caption || 'Preview'}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-zinc-600" />
                  )}

                  {/* Status Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    {item.status === 'uploading' && (
                      <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
                    )}
                    {item.status === 'success' && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 drop-shadow" />
                    )}
                    {item.status === 'error' && (
                      <AlertCircle className="w-5 h-5 text-rose-400 drop-shadow" />
                    )}
                  </div>
                </div>

                {/* Details & Caption */}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] font-bold text-zinc-200 truncate font-mono">
                      #{idx + 1} {item.fileName || item.file?.name || 'URL Externa'}
                    </span>
                    <div className="flex items-center gap-1">
                      {item.status === 'success' && (
                        <button
                          type="button"
                          onClick={() => downloadImage(item.url, item.fileName || `album-${idx + 1}.webp`)}
                          className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-cyan-300 transition-colors"
                          title="Baixar imagem (.webp)"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-zinc-500 hover:text-rose-400 p-0.5 rounded transition-colors"
                        title="Remover"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={item.caption}
                    onChange={(e) => updateItemCaption(item.id, e.target.value)}
                    placeholder="Legenda da foto (opcional)..."
                    className="w-full px-2 py-1 text-[11px] rounded bg-[#0a0812] border border-zinc-700 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-purple-500"
                  />

                  {item.status === 'error' && (
                    <p className="text-[10px] text-rose-400 truncate">{item.error || 'Erro no envio'}</p>
                  )}
                  {item.status === 'success' && (
                    <div className="flex items-center justify-between gap-1 text-[10px]">
                      <span className="text-emerald-400 font-mono flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" /> Pronta
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-950/70 border border-purple-800/40 text-purple-300 font-mono">
                        {item.wasConverted ? 'WebP 100%' : 'WebP'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Action Footer */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-purple-900/50">
            <div className="text-xs text-zinc-400">
              {pendingCount > 0 ? (
                <span>
                  {pendingCount} {pendingCount === 1 ? 'imagem precisa' : 'imagens precisam'} de upload
                </span>
              ) : (
                <span className="text-emerald-400 font-semibold">
                  Todas as {successfulCount} imagens estão prontas para salvar!
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {successfulCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const ready = items.filter((it) => it.status === 'success' && it.url);
                    ready.forEach((it, i) => {
                      setTimeout(() => downloadImage(it.url, it.fileName || `album-${i + 1}.webp`), i * 300);
                    });
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-cyan-300 text-xs font-semibold transition-colors cursor-pointer"
                  title="Baixar todas as imagens prontas"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Prontas ({successfulCount})</span>
                </button>
              )}
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
              )}

              {pendingCount > 0 ? (
                <button
                  type="button"
                  disabled={isUploadingAll}
                  onClick={startUploadAll}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${themeClasses.buttonPrimary} disabled:opacity-50`}
                >
                  {isUploadingAll ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Enviando Lote...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Fazer Upload de Todas ({pendingCount})</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={finalizeSubmission}
                  disabled={successfulCount === 0}
                  className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer ${themeClasses.buttonPrimary} disabled:opacity-50`}
                >
                  <Check className="w-4 h-4" />
                  <span>Adicionar Todas ({successfulCount}) ao Álbum</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
