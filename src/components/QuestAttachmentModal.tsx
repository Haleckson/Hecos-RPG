import React, { useState, useRef, useEffect } from 'react';
import {
  QuestAttachment,
  QuestAttachmentType,
  ItemVisibility
} from '../types';
import {
  uploadToImgBB,
  getCustomImgBBKey
} from '../services/imgbb';
import {
  Upload,
  Image as ImageIcon,
  Music,
  Video,
  FileText,
  MapPin,
  Scroll,
  X,
  Check,
  Loader2,
  AlertCircle,
  Play,
  Pause,
  ExternalLink,
  Volume2,
  Lock,
  Sparkles,
  Link2,
  Film,
  Disc,
  Eye,
  EyeOff
} from 'lucide-react';

interface QuestAttachmentModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onSaveAttachment?: (attachment: QuestAttachment) => void;
  onSave?: (attachment: QuestAttachment) => void;
  editAttachment?: QuestAttachment | null;
  initialData?: QuestAttachment | null;
  questTitle?: string;
}

// Extract YouTube Video ID from any standard or shortened URL
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

// Extract Google Drive File ID from any share link
export function extractGoogleDriveId(url: string): string | null {
  if (!url) return null;
  const match =
    url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    url.match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
    url.match(/\/d\/([a-zA-Z0-9_-]+)/) ||
    url.match(/open\?id=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

export function formatGoogleDriveAudio(url: string): { streamUrl: string; previewUrl: string; fileId: string } | null {
  const fileId = extractGoogleDriveId(url);
  if (!fileId) return null;
  return {
    fileId,
    streamUrl: `https://docs.google.com/uc?export=download&id=${fileId}`,
    previewUrl: `https://drive.google.com/file/d/${fileId}/preview`,
  };
}

export const QuestAttachmentModal: React.FC<QuestAttachmentModalProps> = ({
  isOpen = true,
  onClose,
  onSaveAttachment,
  onSave,
  editAttachment,
  initialData,
  questTitle = 'Missão',
}) => {
  const activeAttachment = editAttachment || initialData;
  const handleSaveCallback = onSaveAttachment || onSave || (() => {});

  const [selectedType, setSelectedType] = useState<QuestAttachmentType>(activeAttachment?.type || 'image');
  const [title, setTitle] = useState(activeAttachment?.title || '');
  const [url, setUrl] = useState(activeAttachment?.url || '');
  const [caption, setCaption] = useState(activeAttachment?.caption || '');
  const [description, setDescription] = useState(activeAttachment?.description || '');
  const [isSecret, setIsSecret] = useState(Boolean(activeAttachment?.isSecret));
  const [visibility, setVisibility] = useState<ItemVisibility>(activeAttachment?.visibility || 'all');

  // Image Upload States
  const [isUploadingImg, setIsUploadingImg] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Audio Testing State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (activeAttachment) {
      setSelectedType(activeAttachment.type);
      setTitle(activeAttachment.title);
      setUrl(activeAttachment.url);
      setCaption(activeAttachment.caption || '');
      setDescription(activeAttachment.description || '');
      setIsSecret(Boolean(activeAttachment.isSecret));
      setVisibility(activeAttachment.visibility || 'all');
    } else {
      setSelectedType('image');
      setTitle('');
      setUrl('');
      setCaption('');
      setDescription('');
      setIsSecret(false);
      setVisibility('all');
    }
    setUploadError(null);
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
    }
    setIsPlayingAudio(false);
  }, [activeAttachment, isOpen]);

  // Clean audio on unmount / close
  useEffect(() => {
    return () => {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
        audioPreviewRef.current = null;
      }
    };
  }, []);

  if (!isOpen) return null;

  // Handle direct ImgBB file upload
  const handleProcessFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Por favor selecione um arquivo de imagem válido (PNG, JPG, WebP, GIF).');
      return;
    }

    setIsUploadingImg(true);
    setUploadError(null);

    try {
      const result = await uploadToImgBB(file, {
        category: 'quest',
        entityName: questTitle,
        role: 'anexo',
        originalFilename: file.name,
      });

      if (result.url) {
        setUrl(result.url);
      }
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }
    } catch (err: any) {
      setUploadError(err.message || 'Erro ao realizar upload da imagem no ImgBB.');
    } finally {
      setIsUploadingImg(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleProcessFile(files[0]);
    }
  };

  // Audio Preview helper
  const handleToggleAudioPreview = () => {
    if (!url) return;

    let audioSrc = url;
    const driveInfo = formatGoogleDriveAudio(url);
    if (driveInfo) {
      audioSrc = driveInfo.streamUrl;
    }

    if (isPlayingAudio && audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      if (!audioPreviewRef.current) {
        audioPreviewRef.current = new Audio(audioSrc);
        audioPreviewRef.current.onended = () => setIsPlayingAudio(false);
        audioPreviewRef.current.onerror = () => {
          setIsPlayingAudio(false);
          setUploadError('Não foi possível reproduzir o áudio diretamente. Certifique-se de que o arquivo no Google Drive está com compartilhamento público ("Qualquer pessoa com o link").');
        };
      } else {
        audioPreviewRef.current.src = audioSrc;
      }

      audioPreviewRef.current
        .play()
        .then(() => setIsPlayingAudio(true))
        .catch((err) => {
          console.warn('Audio play error:', err);
          setIsPlayingAudio(false);
          setUploadError('Erro ao iniciar áudio. Se for link do Google Drive, verifique se o arquivo está público.');
        });
    }
  };

  // YouTube calculations
  const youtubeId = selectedType === 'video' ? extractYouTubeId(url) : null;
  const youtubeEmbedUrl = youtubeId ? `https://www.youtube.com/embed/${youtubeId}` : null;
  const youtubeThumbnail = youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : null;

  // Google Drive calculations
  const driveAudioInfo = selectedType === 'audio' ? formatGoogleDriveAudio(url) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setUploadError('Informe uma URL ou faça o upload da mídia.');
      return;
    }

    const finalTitle = title.trim() || (
      selectedType === 'video' ? 'Vídeo da Missão' :
      selectedType === 'audio' ? 'Trilha Sonora da Missão' :
      selectedType === 'map' ? 'Mapa do Local' :
      selectedType === 'handout' ? 'Pista / Documento' : 'Imagem Anexa'
    );

    let finalUrl = url.trim();
    let videoId = youtubeId || undefined;
    let embedUrl = youtubeEmbedUrl || undefined;
    let driveFileId = driveAudioInfo?.fileId || undefined;
    let isDriveAudio = Boolean(driveAudioInfo);

    if (selectedType === 'audio' && driveAudioInfo) {
      finalUrl = driveAudioInfo.streamUrl;
    }

    const newAttachment: QuestAttachment = {
      id: activeAttachment?.id || `att-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      title: finalTitle,
      url: finalUrl,
      type: selectedType,
      caption: caption.trim() || undefined,
      description: description.trim() || undefined,
      isSecret,
      visibility,
      createdAt: activeAttachment?.createdAt || Date.now(),
      videoId,
      embedUrl,
      driveFileId,
      isDriveAudio,
    };

    handleSaveCallback(newAttachment);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#0e0c19] border border-cyan-900/60 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.2)] overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#131124] to-[#1a1233] border-b border-cyan-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-950/80 border border-cyan-700/60 text-cyan-300">
              {selectedType === 'image' && <ImageIcon className="w-5 h-5" />}
              {selectedType === 'video' && <Video className="w-5 h-5 text-rose-400" />}
              {selectedType === 'audio' && <Music className="w-5 h-5 text-purple-400" />}
              {selectedType === 'map' && <MapPin className="w-5 h-5 text-emerald-400" />}
              {selectedType === 'handout' && <Scroll className="w-5 h-5 text-amber-400" />}
              {selectedType === 'document' && <FileText className="w-5 h-5 text-blue-400" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100 font-sans">
                {editAttachment ? 'Editar Anexo' : 'Adicionar Anexo & Multimídia'}
              </h2>
              <p className="text-xs text-cyan-400/80 font-mono">
                {questTitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Type Selection Tabs */}
        <div className="px-6 pt-4 pb-2 border-b border-zinc-800/80 bg-black/40">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'image', label: 'Imagem (ImgBB)', icon: ImageIcon, color: 'text-cyan-300 border-cyan-700 bg-cyan-950/40' },
              { id: 'video', label: 'Vídeo (YouTube)', icon: Video, color: 'text-rose-300 border-rose-700 bg-rose-950/40' },
              { id: 'audio', label: 'Música (Drive/URL)', icon: Music, color: 'text-purple-300 border-purple-700 bg-purple-950/40' },
              { id: 'handout', label: 'Pista / Documento', icon: Scroll, color: 'text-amber-300 border-amber-700 bg-amber-950/40' },
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = selectedType === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setSelectedType(tab.id as QuestAttachmentType);
                    setUploadError(null);
                  }}
                  className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isSelected
                      ? tab.color + ' shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                      : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {uploadError && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-xs text-rose-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p>{uploadError}</p>
              </div>
            </div>
          )}

          {/* ─── TAB: IMAGEM (IMGBB UPLOAD OU LINK) ─── */}
          {selectedType === 'image' && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Upload de Imagem para o ImgBB
              </label>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-cyan-400 bg-cyan-950/30'
                    : 'border-zinc-700/80 hover:border-cyan-500/80 bg-black/40 hover:bg-cyan-950/10'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleProcessFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                {isUploadingImg ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-4">
                    <Loader2 className="w-7 h-7 text-cyan-400 animate-spin" />
                    <span className="text-xs text-cyan-300 font-medium">Otimizando e enviando para o ImgBB...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 py-2">
                    <div className="p-3 rounded-2xl bg-cyan-950/60 border border-cyan-800/60 text-cyan-400">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-zinc-200">
                      Clique para selecionar ou arraste sua imagem aqui
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      Formatos aceitos: PNG, JPG, WebP, GIF. Hospedagem direta no ImgBB.
                    </p>
                  </div>
                )}
              </div>

              {/* Alternative Direct URL */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Ou informe a URL direta da imagem:
                </label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://i.ibb.co/... ou https://..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-black/60 border border-zinc-700 rounded-xl text-zinc-200 focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>
              </div>

              {/* Image Preview */}
              {url && (
                <div className="p-3 rounded-2xl bg-black/60 border border-cyan-900/60 flex items-center gap-3">
                  <img
                    src={url}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded-xl border border-zinc-700 shrink-0"
                    onError={() => setUploadError('URL de imagem inválida ou inacessível.')}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-cyan-300 truncate">Prévia da Imagem</p>
                    <p className="text-[11px] text-zinc-400 truncate">{url}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── TAB: VÍDEO (YOUTUBE) ─── */}
          {selectedType === 'video' && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                <Film className="w-4 h-4 text-rose-400" />
                Vídeo do YouTube (Trailer, Cutscene ou Cena Narrativa)
              </label>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Link do Vídeo no YouTube:
                </label>
                <div className="relative">
                  <Video className="absolute left-3 top-2.5 w-4 h-4 text-rose-400" />
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... ou https://youtu.be/..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-black/60 border border-rose-900/60 rounded-xl text-zinc-100 focus:outline-none focus:border-rose-400 font-mono"
                  />
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Suporta links padrão do YouTube, links curtos (youtu.be) e YouTube Shorts.
                </p>
              </div>

              {/* YouTube Preview Card */}
              {youtubeId && (
                <div className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-800/60 space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={youtubeThumbnail!}
                      alt="Thumbnail do YouTube"
                      className="w-24 h-16 object-cover rounded-xl border border-rose-700/60 shadow-md shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] uppercase font-bold text-rose-400 font-mono">
                        YouTube Detectado
                      </span>
                      <p className="text-xs font-bold text-zinc-100 truncate">
                        ID: {youtubeId}
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        O vídeo será reproduzido em player responsivo de alta qualidade no artigo da quest.
                      </p>
                    </div>
                  </div>

                  {/* Responsive Iframe Preview */}
                  <div className="aspect-video w-full rounded-xl overflow-hidden border border-rose-900/80 bg-black">
                    <iframe
                      src={youtubeEmbedUrl!}
                      title="Prévia do Vídeo"
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── TAB: MÚSICA & ÁUDIO (GOOGLE DRIVE OU LINK) ─── */}
          {selectedType === 'audio' && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <Disc className="w-4 h-4 text-purple-400" />
                Música & Trilha Sonora (Google Drive ou Link de Áudio)
              </label>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Link de Compartilhamento do Google Drive ou URL de Áudio:
                </label>
                <div className="relative">
                  <Music className="absolute left-3 top-2.5 w-4 h-4 text-purple-400" />
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/d/.../view?usp=sharing ou https://...audio.mp3"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-black/60 border border-purple-900/60 rounded-xl text-zinc-100 focus:outline-none focus:border-purple-400 font-mono"
                  />
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  💡 <strong>Google Drive:</strong> Cole o link de compartilhamento normal. O sistema converte automaticamente para streaming direto. Lembre-se de definir a permissão do arquivo no Drive para <em>"Qualquer pessoa com o link"</em>.
                </p>
              </div>

              {/* Audio Player Test Box */}
              {url && (
                <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-800/60 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={handleToggleAudioPreview}
                      className="w-10 h-10 rounded-xl bg-purple-700 hover:bg-purple-600 text-purple-100 flex items-center justify-center transition-transform active:scale-95 shadow-[0_0_15px_rgba(168,85,247,0.4)] shrink-0 cursor-pointer"
                      title={isPlayingAudio ? 'Pausar Áudio' : 'Testar Reprodução de Áudio'}
                    >
                      {isPlayingAudio ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                    </button>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-purple-200 truncate">
                        {driveAudioInfo ? 'Áudio do Google Drive Pronto' : 'Áudio Direto Pronto'}
                      </p>
                      <p className="text-[11px] text-zinc-400 truncate">
                        {isPlayingAudio ? 'Tocando prévia...' : 'Clique no botão Play para testar o som'}
                      </p>
                    </div>
                  </div>

                  <span className="px-2 py-1 rounded-lg bg-purple-900/60 border border-purple-700/60 text-purple-300 text-[10px] font-mono shrink-0">
                    {driveAudioInfo ? 'Google Drive' : 'Áudio Direto'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ─── TAB: HANDOUT / DOCUMENTO / MAPA ─── */}
          {(selectedType === 'handout' || selectedType === 'document' || selectedType === 'map' || selectedType === 'other') && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Scroll className="w-4 h-4 text-amber-400" />
                Pista, Carta, Mapa ou Documento
              </label>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  URL do Documento ou Imagem da Pista:
                </label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-2.5 w-4 h-4 text-amber-400" />
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-black/60 border border-amber-900/60 rounded-xl text-zinc-100 focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ─── METADATA FIELDS (TITLE, CAPTION, GM NOTES) ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-800/80">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                Título / Nome da Mídia
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Trilha da Emboscada, Carta Enigmática, Mapa do Templo"
                className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-700 rounded-xl text-zinc-200 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                Legenda Curta / Subtítulo
              </label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Ex: Tocada quando o grupo encontra o guardião"
                className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-700 rounded-xl text-zinc-200 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
              Observações / Contexto Narrativo (Opcional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Instruções para o Mestre ou descrição detalhada da mídia..."
              className="w-full p-2.5 text-xs bg-black/60 border border-zinc-700 rounded-xl text-zinc-200 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* ─── SECRET GM & VISIBILITY ─── */}
          <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between gap-4">
            <label className="flex items-center gap-2.5 text-xs font-semibold text-zinc-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isSecret}
                onChange={(e) => setIsSecret(e.target.checked)}
                className="rounded border-zinc-700 text-rose-500 focus:ring-rose-500 w-4 h-4 cursor-pointer"
              />
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-rose-400" />
                <span>Anexo Confidencial (Apenas Mestre / GM)</span>
              </div>
            </label>

            <span className="text-[10px] font-mono text-zinc-500">
              {isSecret ? '🔒 Oculto dos Jogadores' : '👁️ Visível aos Jogadores'}
            </span>
          </div>

          {/* Footer Submit Buttons */}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-bold text-zinc-300 cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-zinc-950 text-xs font-bold shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Salvar Anexo</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
