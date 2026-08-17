import React, { useState, useEffect, useRef } from 'react';
import { uploadToImgBB, getCustomImgBBKey, setCustomImgBBKey } from '../services/imgbb';
import {
  Upload,
  Image as ImageIcon,
  Loader2,
  Check,
  Copy,
  X,
  ExternalLink,
  AlertCircle,
  Sparkles,
  Key,
  FolderOpen,
  ClipboardPaste,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ImgBBUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertImage?: (imageUrl: string, altText: string) => void;
  defaultAltText?: string;
}

export const ImgBBUploadModal: React.FC<ImgBBUploadModalProps> = ({
  isOpen,
  onClose,
  onInsertImage,
  defaultAltText = 'Ilustração de Hecos',
}) => {
  const [altText, setAltText] = useState(defaultAltText);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  
  // Custom API key settings state
  const [showKeySettings, setShowKeySettings] = useState(false);
  const [customKeyInput, setCustomKeyInput] = useState('');
  const [savedKeyMessage, setSavedKeyMessage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCustomKeyInput(getCustomImgBBKey());
      setErrorMsg(null);
    }
  }, [isOpen]);

  // Handle global paste when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            handleProcessFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleProcessFile = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg('O arquivo selecionado não é uma imagem válida.');
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);

    try {
      const cleanName = file.name ? file.name.replace(/\.[^/.]+$/, '') : altText;
      const res = await uploadToImgBB(file, cleanName);

      if (res.success && res.url) {
        setUploadedUrl(res.url);
        if (!altText || altText === 'Ilustração de Hecos') {
          setAltText(cleanName);
        }
      } else {
        setErrorMsg(res.error || 'Erro ao enviar imagem.');
      }
    } catch (err: any) {
      setErrorMsg('Falha ao conectar com o serviço ImgBB.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleCopyUrl = () => {
    if (!uploadedUrl) return;
    navigator.clipboard.writeText(uploadedUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCopyMarkdown = () => {
    if (!uploadedUrl) return;
    const md = `![${altText || 'Imagem'}](${uploadedUrl})`;
    navigator.clipboard.writeText(md);
    setCopiedMarkdown(true);
    setTimeout(() => setCopiedMarkdown(false), 2000);
  };

  const handleInsert = () => {
    if (uploadedUrl && onInsertImage) {
      onInsertImage(uploadedUrl, altText || 'Imagem');
      onClose();
    }
  };

  const handleSaveCustomKey = () => {
    setCustomImgBBKey(customKeyInput);
    setSavedKeyMessage(true);
    setTimeout(() => setSavedKeyMessage(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-lg bg-[#0e0d16] border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/80 bg-[#141220]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-300">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                  <span>Upload de Imagem (ImgBB)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-mono">
                    Hospedagem Permanente
                  </span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Envie imagens do computador, arraste ou cole com Ctrl+V
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowKeySettings(!showKeySettings)}
                title="Configurar Chave de API ImgBB"
                className={`p-1.5 rounded-lg border transition-colors ${
                  showKeyInputActive(customKeyInput)
                    ? 'bg-purple-950/60 border-purple-500/50 text-purple-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Key className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Custom API Key popdown */}
          {showKeySettings && (
            <div className="p-4 bg-[#181428] border-b border-purple-800/50 space-y-2 text-xs">
              <div className="flex items-center justify-between text-purple-200 font-bold">
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-purple-400" />
                  <span>Chave de API ImgBB Pessoal (Opcional)</span>
                </span>
                <a
                  href="https://api.imgbb.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-cyan-400 hover:underline flex items-center gap-0.5"
                >
                  <span>Obter chave grátis</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
              <p className="text-[11px] text-zinc-400">
                O sistema já inclui chaves automáticas com rotação. Se desejar usar sua própria conta do ImgBB, insira sua chave abaixo:
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customKeyInput}
                  onChange={(e) => setCustomKeyInput(e.target.value)}
                  placeholder="Ex: 879c8465e668705b..."
                  className="flex-1 px-3 py-1.5 rounded-lg bg-[#0e0d14] border border-zinc-700 text-xs font-mono text-zinc-100 placeholder-zinc-600 outline-none focus:border-purple-400"
                />
                <button
                  type="button"
                  onClick={handleSaveCustomKey}
                  className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors"
                >
                  {savedKeyMessage ? 'Salvo!' : 'Salvar'}
                </button>
              </div>
            </div>
          )}

          {/* Body */}
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            {/* Alt / Title Field */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-300">
                Descrição / Título da Imagem
              </label>
              <input
                type="text"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Ex: Retrato do Sylphari, Mapa de Hecos, Emblema..."
                className="w-full px-3 py-2 rounded-xl bg-[#141220] border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-600 outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            {/* Drop / Select Zone */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {!uploadedUrl ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-cyan-400 bg-cyan-950/30 ring-4 ring-cyan-500/20'
                    : 'border-zinc-800 hover:border-cyan-500/60 bg-[#12101c] hover:bg-[#161324]'
                }`}
              >
                {isUploading ? (
                  <div className="py-4 flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold text-zinc-200">Fazendo upload para ImgBB...</p>
                      <p className="text-xs text-zinc-500">Aguarde a extração da URL permanente</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mb-3 shadow-inner">
                      <FolderOpen className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-zinc-200">
                      Clique para selecionar ou arraste uma imagem aqui
                    </p>
                    <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                      Suporta PNG, JPG, JPEG, WEBP, GIF ou cole direto da área de transferência (<kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-[10px] text-zinc-300 font-mono">Ctrl+V</kbd>)
                    </p>
                    <div className="mt-4 flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-800/40 text-[11px] text-cyan-300">
                      <Sparkles className="w-3 h-3" />
                      <span>Upload direto e extração automática de link</span>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* Success / Result View */
              <div className="space-y-3 p-4 rounded-2xl bg-[#13111e] border border-emerald-900/60 shadow-lg">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <Check className="w-4 h-4" /> Upload concluído com sucesso!
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadedUrl(null);
                      fileInputRef.current?.click();
                    }}
                    className="text-xs text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                  >
                    Enviar outra imagem
                  </button>
                </div>

                {/* Preview Image */}
                <div className="relative rounded-xl overflow-hidden border border-zinc-800 bg-black/60 max-h-48 flex items-center justify-center">
                  <img
                    src={uploadedUrl}
                    alt={altText}
                    referrerPolicy="no-referrer"
                    className="max-h-48 object-contain rounded-lg"
                  />
                </div>

                {/* URL Result Box */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-400">
                    URL Extraída (ImgBB):
                  </label>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-black/60 border border-zinc-800">
                    <input
                      type="text"
                      readOnly
                      value={uploadedUrl}
                      className="flex-1 bg-transparent text-xs font-mono text-cyan-300 outline-none select-all"
                    />
                    <button
                      type="button"
                      onClick={handleCopyUrl}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors"
                      title="Copiar URL direta"
                    >
                      {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedUrl ? 'Copiado!' : 'Copiar URL'}</span>
                    </button>
                  </div>
                </div>

                {/* Markdown snippet */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleCopyMarkdown}
                    className="flex items-center gap-1.5 text-xs text-purple-300 hover:text-purple-200 font-mono transition-colors"
                  >
                    {copiedMarkdown ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copiar código Markdown `![alt](url)`</span>
                  </button>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/40 border border-rose-800/80 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-zinc-800/80 bg-[#141220]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-750 text-xs font-bold text-zinc-300 transition-colors"
            >
              Fechar
            </button>
            {uploadedUrl && onInsertImage && (
              <button
                type="button"
                onClick={handleInsert}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs transition-colors shadow-lg shadow-cyan-950/50 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Inserir no Artigo</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

function showKeyInputActive(key: string): boolean {
  return Boolean(key && key.trim().length > 5);
}
