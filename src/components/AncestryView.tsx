import React, { useState, useMemo, useEffect } from 'react';
import { HecosEntity, AncestryAttributes, AncestryAlbumImage } from '../types';
import { RichContentRenderer } from './RichContentRenderer';
import { renderContentWithMentions } from './MentionBadge';
import { PF2eActionGlyph } from './PF2eActionGlyph';
import { parseAncestryFromContent, serializeAncestryToHTML } from '../utils/ancestrySerializer';
import { HecosStorage } from '../services/storage';
import { VisibilityBadgeMenu } from './VisibilityBadgeMenu';
import { AdjustableImage } from './AdjustableImage';
import { EntityIcon } from './EntityIcon';
import { TraitBadge } from './TraitBadge';
import { ImageUploadInput } from './ImageUploadInput';
import { MultiImageAlbumUploader } from './MultiImageAlbumUploader';
import { FeatCard } from './FeatCard';
import { sortTraitsHierarchically } from '../utils/traitUtils';
import { downloadImage, slugify } from '../services/imgbb';
import {
  Swords,
  Dna,
  Sparkles,
  Shield,
  Compass,
  ChevronDown,
  ChevronUp,
  Search,
  BookOpen,
  Heart,
  Eye,
  Activity,
  Zap,
  HelpCircle,
  Clock,
  Copy,
  Check,
  Crown,
  Scale,
  ShieldAlert,
  Globe,
  Users,
  Feather,
  Edit3,
  Lock,
  Save,
  FileText,
  AlertTriangle,
  ExternalLink,
  Code,
  Flame,
  Tag,
  Image as ImageIcon,
  Images,
  Plus,
  Trash2,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  X,
  Camera,
  Download
} from 'lucide-react';

interface AncestryViewProps {
  entity: HecosEntity;
  onEdit?: (initialTab?: 'mechanics' | 'lore' | 'gm') => void;
  onNavigate: (id: string) => void;
  onTagClick: (tag: string) => void;
}

export const AncestryView: React.FC<AncestryViewProps> = ({
  entity,
  onEdit,
  onNavigate,
  onTagClick,
}) => {
  const [activeMainTab, setActiveMainTab] = useState<'mechanics' | 'lore' | 'gm'>('mechanics');
  const [activeFeatRank, setActiveFeatRank] = useState<1 | 5 | 9 | 13 | 17 | 'all'>('all');
  const [copiedStatblock, setCopiedStatblock] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Album (Lore) state
  const [isAlbumOpen, setIsAlbumOpen] = useState(false);
  const [isAddingImage, setIsAddingImage] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageCaption, setNewImageCaption] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  // Real-time GM mode tracking
  const [isGmMode, setIsGmMode] = useState<boolean>(() => HecosStorage.getGmMode());

  useEffect(() => {
    return HecosStorage.subscribeEntities(() => {
      setIsGmMode(HecosStorage.getGmMode());
    });
  }, []);

  // Current user and role
  const currentUser = HecosStorage.getCurrentUser();
  const isActualGm = currentUser?.role === 'gm' || isGmMode;

  // Structured Ancestry Data parsed from entity.ancestryData or content
  const data: AncestryAttributes = useMemo(() => {
    return parseAncestryFromContent(entity.title, entity.content || '', entity.ancestryData);
  }, [entity.title, entity.content, entity.ancestryData]);

  // Filter heritages hierarchically based on user permissions
  const visibleHeritages = useMemo(() => {
    const list = data.heritages || [];
    if (isActualGm) return list;
    return list.filter((h) => HecosStorage.canUserAccessItem(h, currentUser));
  }, [data.heritages, isActualGm, currentUser]);

  // Filter feats hierarchically based on user permissions (including linked feat entities)
  const getVisibleFeatsByRank = (rank: 1 | 5 | 9 | 13 | 17) => {
    const key = `rank${rank}` as keyof typeof data.feats;
    const list = data.feats?.[key] || [];
    if (isActualGm) return list;
    return list.filter((f) => HecosStorage.canUserAccessItem(f, currentUser));
  };

  const totalFeatsCount = useMemo(() => {
    return (
      getVisibleFeatsByRank(1).length +
      getVisibleFeatsByRank(5).length +
      getVisibleFeatsByRank(9).length +
      getVisibleFeatsByRank(13).length +
      getVisibleFeatsByRank(17).length
    );
  }, [data.feats, isActualGm, currentUser]);

  // GM Scratchpad / Notes State
  const initialGmText = useMemo(() => {
    if (data.gmGuide?.gmNotes) return data.gmGuide.gmNotes;
    const pieces: string[] = [];
    if (data.gmGuide?.roleplayingNpcs) pieces.push(`### Diretrizes de Interpretação & NPCs\n${data.gmGuide.roleplayingNpcs}`);
    if (data.gmGuide?.themesAndConflicts) pieces.push(`### Temas & Conflitos\n${data.gmGuide.themesAndConflicts}`);
    if (data.gmGuide?.secretLore) pieces.push(`### Segredos Ocultos\n${data.gmGuide.secretLore}`);
    if (data.gmGuide?.adventureHooks) pieces.push(`### Ganchos de Aventura\n${data.gmGuide.adventureHooks}`);
    if (data.gmGuide?.trueOrigins) pieces.push(`### Origens Secretas\n${data.gmGuide.trueOrigins}`);
    return pieces.join('\n\n');
  }, [data.gmGuide]);

  const [gmNotesText, setGmNotesText] = useState(initialGmText);
  const [isGmSaving, setIsGmSaving] = useState(false);
  const [gmSaveSuccess, setGmSaveSuccess] = useState(false);
  const [gmEditorMode, setGmEditorMode] = useState<'edit' | 'preview'>('edit');

  useEffect(() => {
    setGmNotesText(initialGmText);
  }, [initialGmText]);

  // If user exits GM mode while on the GM tab, automatically switch to mechanics
  useEffect(() => {
    if (!isGmMode && activeMainTab === 'gm') {
      setActiveMainTab('mechanics');
    }
  }, [isGmMode, activeMainTab]);

  const handleSaveGmNotes = () => {
    setIsGmSaving(true);
    const currentData = { ...data };
    currentData.gmGuide = {
      ...currentData.gmGuide,
      gmNotes: gmNotesText,
    };

    const updatedEntity: HecosEntity = {
      ...entity,
      ancestryData: currentData,
      content: serializeAncestryToHTML(entity.title, currentData),
      updatedAt: new Date().toISOString(),
    };

    HecosStorage.saveEntity(updatedEntity);
    setIsGmSaving(false);
    setGmSaveSuccess(true);
    setTimeout(() => setGmSaveSuccess(false), 2500);
  };

  const handleAddMultipleImagesToAlbum = (newImages: { url: string; caption?: string }[]) => {
    if (!newImages || newImages.length === 0) return;
    const formatted: AncestryAlbumImage[] = newImages.map((img, idx) => ({
      id: `img-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
      url: img.url,
      caption: img.caption || undefined,
      createdAt: Date.now(),
    }));
    const currentAlbum = Array.isArray(data.album) ? data.album : [];
    const updatedAlbum = [...currentAlbum, ...formatted];
    const updatedData: AncestryAttributes = {
      ...data,
      album: updatedAlbum,
    };
    const updatedEntity: HecosEntity = {
      ...entity,
      ancestryData: updatedData,
      content: serializeAncestryToHTML(entity.title, updatedData),
      updatedAt: new Date().toISOString(),
    };
    HecosStorage.saveEntity(updatedEntity);
    setIsBulkUploadOpen(false);
    setIsAddingImage(false);
  };

  const handleAddImageToAlbum = () => {
    if (!newImageUrl.trim()) return;
    const newImg: AncestryAlbumImage = {
      id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      url: newImageUrl.trim(),
      caption: newImageCaption.trim() || undefined,
      createdAt: Date.now(),
    };
    const currentAlbum = Array.isArray(data.album) ? data.album : [];
    const updatedAlbum = [...currentAlbum, newImg];
    const updatedData: AncestryAttributes = {
      ...data,
      album: updatedAlbum,
    };
    const updatedEntity: HecosEntity = {
      ...entity,
      ancestryData: updatedData,
      content: serializeAncestryToHTML(entity.title, updatedData),
      updatedAt: new Date().toISOString(),
    };
    HecosStorage.saveEntity(updatedEntity);
    setNewImageUrl('');
    setNewImageCaption('');
    setIsAddingImage(false);
  };

  const handleRemoveImageFromAlbum = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const currentAlbum = Array.isArray(data.album) ? data.album : [];
    const updatedAlbum = currentAlbum.filter((img) => img.id !== id);
    const updatedData: AncestryAttributes = {
      ...data,
      album: updatedAlbum,
    };
    const updatedEntity: HecosEntity = {
      ...entity,
      ancestryData: updatedData,
      content: serializeAncestryToHTML(entity.title, updatedData),
      updatedAt: new Date().toISOString(),
    };
    HecosStorage.saveEntity(updatedEntity);
    if (selectedImageIndex !== null && selectedImageIndex >= updatedAlbum.length) {
      setSelectedImageIndex(updatedAlbum.length > 0 ? updatedAlbum.length - 1 : null);
    }
  };

  const copyStatblockText = () => {
    const text = `=== ${entity.title.toUpperCase()} ===
HP: ${data.hp || '8 PV'} | TAMANHO: ${data.size || 'Médio'} | VELOCIDADE: ${data.speed || '25 pés'}
SENTIDOS: ${data.senses || 'Visão na Penumbra'}
ATRIBUTOS: ${data.attributes || '+2 Des, +2 Int, +2 Livre, -2 For'}
TRAÇOS: ${data.traits || 'Humanoide'}
INATO: ${data.innate || '—'}
IDIOMAS: ${data.languages || 'Humani'}`;
    navigator.clipboard.writeText(text);
    setCopiedStatblock(true);
    setTimeout(() => setCopiedStatblock(false), 2000);
  };

  return (
    <div className="space-y-6 text-zinc-100 font-sans w-full max-w-full overflow-hidden">
      {/* Optional Ancestry Cover Banner */}
      {entity.coverImage && (
        <div className="relative h-48 sm:h-64 lg:h-72 w-full rounded-2xl overflow-hidden border border-[#272338] bg-[#0c0915] shadow-xl group/banner">
          <AdjustableImage
            src={entity.coverImage}
            alt={entity.title}
            imageKey={`ancestry-cover-${entity.id}`}
            isGm={isActualGm}
            containerClassName="relative w-full h-full overflow-hidden bg-[#0c0915]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e0a17] via-[#0e0a17]/40 to-transparent pointer-events-none" />

          {/* Download Cover Button */}
          <div className="absolute top-3 right-3 z-10 opacity-80 group-hover/banner:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => downloadImage(entity.coverImage!, `ancestralidade-${slugify(entity.title)}-capa.webp`)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/75 hover:bg-black/90 border border-white/20 hover:border-cyan-400/60 text-white text-xs font-semibold backdrop-blur-md transition-all shadow-lg cursor-pointer"
              title="Baixar imagem de capa (.webp)"
            >
              <Download className="w-3.5 h-3.5 text-cyan-300" />
              <span>Baixar Capa (.webp)</span>
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* CABEÇALHO PERMANENTE DA ANCESTRALIDADE (FORA DAS ABAS & SEMPRE ACESSÍVEL)   */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-[#1c120c] to-[#0f0a07] border border-[#382618] shadow-xl relative overflow-hidden group">
        {/* Glow de fundo */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#f97316]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#ea580c]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1 flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#29170e] border border-orange-500/40 flex items-center justify-center text-orange-300 shrink-0 shadow-lg mt-0.5 group-hover:scale-105 transition-all overflow-hidden">
              <EntityIcon
                icon={entity.icon}
                category="ancestry"
                className="w-8 h-8"
                imageClassName="w-full h-full object-cover rounded-2xl"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#2a170a] text-orange-300 border border-orange-500/40 font-mono flex items-center gap-1">
                  <EntityIcon icon={entity.icon} category="ancestry" className="w-3 h-3 text-orange-400" />
                  Ancestralidade PF2e
                </span>
                {entity.isSecret && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-600/40 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Secreto GM
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 via-orange-100 to-orange-400 tracking-tight font-serif break-words">
                {entity.title || '[NOME DA ANCESTRALIDADE]'}
              </h1>
              {entity.subtitle && (
                <p className="text-sm sm:text-base text-orange-200/80 font-medium mt-1 break-words">
                  {entity.subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {isActualGm && (
              <VisibilityBadgeMenu
                visibility={entity.visibility}
                allowedUserIds={entity.allowedUserIds}
                isSecret={entity.isSecret}
                onChange={(newVis, newAllowed) => {
                  HecosStorage.setEntityVisibility(entity.id, newVis, newAllowed);
                }}
              />
            )}

            {isActualGm && onEdit && (
              <button
                type="button"
                onClick={() => onEdit(activeMainTab === 'gm' ? 'gm' : activeMainTab === 'lore' ? 'lore' : 'mechanics')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-950/70 hover:bg-orange-900/90 border border-orange-500/50 text-orange-200 text-xs font-bold transition-all cursor-pointer shadow-sm hover:shadow-[0_0_15px_rgba(249,115,22,0.35)]"
                title="Editar Artigo de Ancestralidade"
              >
                <Edit3 className="w-3.5 h-3.5 text-orange-400" />
                <span>Editar Artigo</span>
              </button>
            )}

            <button
              type="button"
              onClick={copyStatblockText}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#17100b] hover:bg-[#241710] border border-[#382618] hover:border-orange-500/50 text-zinc-300 hover:text-orange-300 text-xs font-semibold transition-all cursor-pointer"
              title="Copiar cabeçalho da ficha para a área de transferência"
            >
              {copiedStatblock ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedStatblock ? 'Copiado!' : 'Copiar Ficha'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* NAVEGAÇÃO DAS ABAS (MECÂNICAS, LORE, GM) COM ALTÍSSIMO DESTAQUE & CLAREZA  */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      <div className="p-2 sm:p-2.5 rounded-2xl bg-[#0e0a07] border-2 border-[#382618] shadow-2xl space-y-2">
        <div className="flex items-center justify-between px-2 pt-1 pb-0.5">
          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-orange-400 font-mono flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
            Abas de Navegação do Artigo
          </span>
          <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline-block">
            Clique para alternar entre Mecânicas, Lore & Álbum e Segredos GM
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:flex items-center gap-2">
          {/* Tab 1: Mecânicas */}
          <button
            type="button"
            onClick={() => setActiveMainTab('mechanics')}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3 sm:py-3.5 px-4 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer select-none font-serif ${
              activeMainTab === 'mechanics'
                ? 'bg-gradient-to-r from-[#3a1d0d] via-[#2a1409] to-[#422210] text-orange-200 border-2 border-orange-500 shadow-[0_0_25px_rgba(249,115,22,0.45)] ring-1 ring-orange-300/40 scale-[1.01]'
                : 'bg-[#18110b]/80 hover:bg-[#241710] text-zinc-400 hover:text-orange-200 border border-[#382618] hover:border-orange-600/50'
            }`}
          >
            <div className={`p-1.5 rounded-lg shrink-0 ${activeMainTab === 'mechanics' ? 'bg-orange-950/90 text-orange-300 border border-orange-400/60' : 'bg-black/40 text-zinc-400'}`}>
              <Swords className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
            <div className="flex flex-col items-start leading-tight">
              <span className="font-extrabold tracking-wide">Mecânicas</span>
              <span className={`text-[9px] font-mono font-normal lowercase tracking-normal ${activeMainTab === 'mechanics' ? 'text-orange-300' : 'text-zinc-500'}`}>
                regras & talentos
              </span>
            </div>
            <span className={`ml-auto text-[11px] px-2 py-0.5 rounded-full font-mono font-bold border ${
              activeMainTab === 'mechanics'
                ? 'bg-orange-950 text-orange-300 border-orange-400/70 shadow-sm'
                : 'bg-black/50 text-zinc-400 border-zinc-700/50'
            }`}>
              {totalFeatsCount + (data.heritages?.length || 0)}
            </span>
          </button>

          {/* Tab 2: Lore & Álbum */}
          <button
            type="button"
            onClick={() => setActiveMainTab('lore')}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3 sm:py-3.5 px-4 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer select-none font-serif ${
              activeMainTab === 'lore'
                ? 'bg-gradient-to-r from-[#2a1b42] via-[#201433] to-[#341f52] text-purple-200 border-2 border-purple-400 shadow-[0_0_25px_rgba(168,85,247,0.45)] ring-1 ring-purple-300/40 scale-[1.01]'
                : 'bg-[#18110b]/80 hover:bg-[#241710] text-zinc-400 hover:text-purple-200 border border-[#382618] hover:border-purple-600/50'
            }`}
          >
            <div className={`p-1.5 rounded-lg shrink-0 ${activeMainTab === 'lore' ? 'bg-purple-950/90 text-purple-300 border border-purple-400/60' : 'bg-black/40 text-zinc-400'}`}>
              <BookOpen className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
            <div className="flex flex-col items-start leading-tight">
              <span className="font-extrabold tracking-wide">Lore & Álbum</span>
              <span className={`text-[9px] font-mono font-normal lowercase tracking-normal ${activeMainTab === 'lore' ? 'text-purple-300' : 'text-zinc-500'}`}>
                história & imagens
              </span>
            </div>
            {(data.album || []).length > 0 && (
              <span className={`ml-auto text-[11px] px-2 py-0.5 rounded-full font-mono font-bold border ${
                activeMainTab === 'lore'
                  ? 'bg-purple-950 text-purple-300 border-purple-400/70 shadow-sm'
                  : 'bg-black/50 text-zinc-400 border-zinc-700/50'
              }`}>
                {(data.album || []).length} 📷
              </span>
            )}
          </button>

          {/* Tab 3: GM (Apenas para o Mestre) */}
          {isGmMode && (
            <button
              type="button"
              onClick={() => setActiveMainTab('gm')}
              className={`col-span-2 sm:col-span-1 md:flex-1 flex items-center justify-center gap-2.5 py-3 sm:py-3.5 px-4 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer select-none font-serif ${
                activeMainTab === 'gm'
                  ? 'bg-gradient-to-r from-[#3d1323] via-[#2d0d19] to-[#4a162b] text-rose-200 border-2 border-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.5)] ring-1 ring-rose-400/40 scale-[1.01]'
                  : 'bg-[#1c0d16]/80 hover:bg-[#28121f] text-rose-300 hover:text-rose-100 border border-rose-900/60 hover:border-rose-500/70'
              }`}
            >
              <div className={`p-1.5 rounded-lg shrink-0 ${activeMainTab === 'gm' ? 'bg-rose-950/90 text-rose-300 border border-rose-500/60' : 'bg-black/40 text-rose-400'}`}>
                <Crown className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </div>
              <div className="flex flex-col items-start leading-tight">
                <span className="font-extrabold tracking-wide">Área do GM</span>
                <span className={`text-[9px] font-mono font-normal lowercase tracking-normal ${activeMainTab === 'gm' ? 'text-rose-300' : 'text-rose-400/70'}`}>
                  segredos & notas
                </span>
              </div>
              <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border ${
                activeMainTab === 'gm'
                  ? 'bg-rose-900/90 text-rose-200 border-rose-500/80 shadow-sm'
                  : 'bg-black/50 text-rose-400 border-rose-800/50'
              }`}>
                Privado
              </span>
            </button>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* ABA DE MECÂNICAS                                                            */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {activeMainTab === 'mechanics' && (
        <div className="space-y-6 animate-in fade-in duration-150 p-4 sm:p-6 rounded-2xl bg-[#09080e] border border-[#272438]">
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {/* ÍNDICE TÉCNICO DA ANCESTRALIDADE (COMPACTO, DESTACADO E FUNCIONAL)    */}
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          <section className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#1a110a] to-[#0c0906] border border-orange-500/30 shadow-lg space-y-3.5">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
              <span className="text-xs font-black uppercase tracking-wider text-orange-300 font-mono flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-orange-400" />
                <span>Índice de Atributos & Características Básicas</span>
              </span>
              {isActualGm && onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit('mechanics')}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-orange-950/60 hover:bg-orange-900 border border-orange-700/50 text-orange-300 text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Editar Atributos</span>
                </button>
              )}
            </div>

            {/* DESTAQUE PRINCIPAL: PV, TAMANHO, VELOCIDADES E MODIFICADORES COM MESMO TAMANHO DE FONTE E ESPAÇAMENTO COMPACTO */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* PV */}
              <div className="p-3 rounded-xl bg-[#170e1c] border border-rose-600/40 hover:border-rose-500/70 transition-all flex flex-col justify-start gap-0.5 shadow-sm">
                <span className="text-[11px] font-bold text-rose-300 uppercase tracking-wider font-mono flex items-center gap-1.5 leading-none">
                  <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400/20 shrink-0" />
                  <span>Pontos de Vida</span>
                </span>
                <span className="text-lg sm:text-xl font-black text-rose-100 break-words leading-tight">
                  {data.hp ? (data.hp.toString().includes('PV') ? data.hp : `${data.hp} PV`) : '8 PV'}
                </span>
              </div>

              {/* Tamanho */}
              <div className="p-3 rounded-xl bg-[#1d120a] border border-orange-600/40 hover:border-orange-500/70 transition-all flex flex-col justify-start gap-0.5 shadow-sm">
                <span className="text-[11px] font-bold text-orange-300 uppercase tracking-wider font-mono flex items-center gap-1.5 leading-none">
                  <Scale className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                  <span>Tamanho</span>
                </span>
                <span className="text-lg sm:text-xl font-black text-orange-100 break-words leading-tight">
                  {data.size || 'Médio'}
                </span>
              </div>

              {/* Velocidades */}
              <div className="p-3 rounded-xl bg-[#161025] border border-purple-600/40 hover:border-purple-500/70 transition-all flex flex-col justify-start gap-0.5 shadow-sm">
                <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider font-mono flex items-center gap-1.5 leading-none">
                  <Zap className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>Velocidades</span>
                </span>
                <span className="text-lg sm:text-xl font-black text-purple-100 break-words leading-tight">
                  {data.speed || '9m (6 quadrados)'}
                </span>
              </div>

              {/* Modificadores (mesmo tamanho de fonte text-lg sm:text-xl dos demais) */}
              <div className="p-3 rounded-xl bg-[#1c140d] border border-amber-600/40 hover:border-amber-500/70 transition-all flex flex-col justify-start gap-0.5 shadow-sm">
                <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider font-mono flex items-center gap-1.5 leading-none">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Modificadores</span>
                </span>
                <div className="text-lg sm:text-xl font-black text-amber-100 break-words font-mono leading-tight">
                  {renderContentWithMentions(data.attributes || '+2 Des, +2 Int, +2 Livre, -2 For', onNavigate)}
                </div>
              </div>
            </div>

            {/* ESPECIFICAÇÕES SECUNDÁRIAS (Sentidos, Inato, Traços, Idiomas - texto acomodado na íntegra sem cortes) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1 text-xs">
              {/* Sentidos */}
              <div className="p-3 rounded-xl bg-[#0e0c18] border border-zinc-800 flex items-start gap-2.5 min-w-0">
                <Eye className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1 space-y-0.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-orange-300 font-mono block">
                    Sentidos
                  </span>
                  <div className="text-zinc-200 text-xs sm:text-sm font-medium break-words leading-relaxed">
                    {renderContentWithMentions(data.senses || 'Visão Padrão', onNavigate)}
                  </div>
                </div>
              </div>

              {/* Inatos */}
              <div className="p-3 rounded-xl bg-[#0e0c18] border border-zinc-800 flex items-start gap-2.5 min-w-0">
                <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1 space-y-0.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300 font-mono block">
                    Inatos & Habilidades
                  </span>
                  <div className="text-zinc-200 text-xs sm:text-sm font-medium break-words leading-relaxed">
                    {renderContentWithMentions(data.innate || '—', onNavigate)}
                  </div>
                </div>
              </div>

              {/* Traços */}
              <div className="p-3 rounded-xl bg-[#0e0c18] border border-zinc-800 flex items-start gap-2.5 min-w-0">
                <Tag className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 font-mono block">
                    Traços de Ancestralidade
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {sortTraitsHierarchically(
                      Array.isArray(data.traits)
                        ? data.traits
                        : (typeof data.traits === 'string' ? data.traits.split(',') : ['Humanoide']),
                      {
                        rarity: data.rarity || 'Comum',
                        size: data.size || 'Médio',
                      }
                    ).map((t, idx) => (
                      <TraitBadge
                        key={idx}
                        trait={typeof t === 'string' ? t.trim() : String(t)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Idiomas */}
              <div className="p-3 rounded-xl bg-[#0e0c18] border border-zinc-800 flex items-start gap-2.5 min-w-0">
                <Globe className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1 space-y-0.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-orange-300 font-mono block">
                    Idiomas
                  </span>
                  <div className="text-zinc-200 text-xs sm:text-sm font-medium break-words leading-relaxed">
                    {renderContentWithMentions(data.languages || 'Humani', onNavigate)}
                  </div>
                </div>
              </div>
            </div>
          </section>
          {/* HERANÇAS DE LINHAGEM */}
          <section className="p-5 rounded-2xl bg-[#0f0e18] border border-[#272438] space-y-4">
            <div className="flex items-center justify-between border-b border-[#272438] pb-3">
              <h3 className="text-lg font-black text-orange-300 flex items-center gap-2.5 font-serif">
                <Sparkles className="w-4 h-4 text-orange-400" />
                <span>Heranças de Linhagem</span>
              </h3>
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit('mechanics')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-orange-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Editar Heranças</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {visibleHeritages && visibleHeritages.length > 0 ? (
                visibleHeritages.map((h, i) => (
                  <div
                    key={h.id || i}
                    className="p-4 rounded-xl bg-[#131120] border border-[#272438] hover:border-orange-500/50 transition-all space-y-2 min-w-0 break-words"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-base font-bold text-orange-200 font-serif flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
                        <span>{h.name}</span>
                      </h4>
                      {isActualGm && h.visibility && h.visibility !== 'all' && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded border font-mono ${
                            h.visibility === 'gm'
                              ? 'bg-rose-950/80 text-rose-300 border-rose-600/50'
                              : 'bg-purple-950/80 text-purple-300 border-purple-600/50'
                          }`}
                        >
                          {h.visibility === 'gm' ? 'Apenas GM' : 'Compartilhado'}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-zinc-300 leading-relaxed min-w-0 break-words">
                      <RichContentRenderer content={h.description} onNavigate={onNavigate} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-zinc-500 col-span-2 italic py-2">
                  Nenhuma herança disponível com as permissões atuais.
                </div>
              )}
            </div>
          </section>

          {/* ARSENAL CULTURAL E EQUIPAMENTOS */}
          <section className="p-5 rounded-2xl bg-[#0f0e18] border border-[#272438] space-y-4">
            <div className="flex items-center justify-between border-b border-[#272438] pb-3">
              <h3 className="text-lg font-black text-amber-300 flex items-center gap-2.5 font-serif">
                <Shield className="w-4 h-4 text-amber-400" />
                <span>Arsenal Cultural & Equipamentos Tradicionais</span>
              </h3>
              {isActualGm && onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit('mechanics')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-amber-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Editar Arsenal</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="space-y-2 p-4 rounded-xl bg-[#131120] border border-[#272438] min-w-0 break-words">
                <h4 className="text-sm font-bold text-amber-200">
                  Proficiências e Armas Tradicionais
                </h4>
                <div className="text-sm text-zinc-300 leading-relaxed min-w-0 break-words">
                  <RichContentRenderer
                    content={data.culturalArsenal?.proficienciesAndWeapons || 'Consulte os armamentos tradicionais.'}
                    onNavigate={onNavigate}
                  />
                </div>
              </div>

              <div className="space-y-2 p-4 rounded-xl bg-[#131120] border border-[#272438] min-w-0 break-words">
                <h4 className="text-sm font-bold text-amber-200">
                  Itens Únicos e Arquétipos Recomendados
                </h4>
                <div className="text-sm text-zinc-300 leading-relaxed min-w-0 break-words">
                  <RichContentRenderer
                    content={data.culturalArsenal?.uniqueItemsAndArchetypes || 'Consulte os itens e arquétipos recomendados.'}
                    onNavigate={onNavigate}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* TALENTOS DE ANCESTRALIDADE */}
          <section className="p-5 rounded-2xl bg-[#0f0e18] border border-[#272438] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#272438] pb-3">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-black text-orange-300 flex items-center gap-2.5 font-serif">
                  <Zap className="w-4 h-4 text-orange-400" />
                  <span>Talentos de Ancestralidade</span>
                </h3>
                {isActualGm && onEdit && (
                  <button
                    type="button"
                    onClick={() => onEdit('mechanics')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-orange-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Editar Talentos</span>
                  </button>
                )}
              </div>

              {/* Filter Tabs by Rank */}
              <div className="flex flex-wrap items-center gap-1 bg-[#131120] p-1 rounded-xl border border-[#272438] text-xs">
                <button
                  type="button"
                  onClick={() => setActiveFeatRank('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    activeFeatRank === 'all'
                      ? 'bg-[#2a170a] text-orange-300 border border-orange-500/40'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Todos ({totalFeatsCount})
                </button>
                {([1, 5, 9, 13, 17] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setActiveFeatRank(r)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      activeFeatRank === r
                        ? 'bg-[#2a170a] text-orange-300 border border-orange-500/40'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Rank {r} ({getVisibleFeatsByRank(r).length})
                  </button>
                ))}
              </div>
            </div>

            {/* Feats List */}
            <div className="space-y-4 pt-1">
              {([1, 5, 9, 13, 17] as const)
                .filter((r) => activeFeatRank === 'all' || activeFeatRank === r)
                .map((r) => {
                  const feats = getVisibleFeatsByRank(r);
                  if (feats.length === 0 && activeFeatRank !== 'all') {
                    return (
                      <div key={r} className="text-center py-6 text-xs text-zinc-500">
                        Nenhum talento disponível no Rank {r} com as permissões atuais.
                      </div>
                    );
                  }
                  if (feats.length === 0) return null;

                  return (
                    <div key={r} className="space-y-3">
                      {activeFeatRank === 'all' && (
                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-orange-300 px-2.5 py-1 bg-[#24130a] rounded-lg border-l-4 border-orange-500 flex items-center justify-between">
                          <span>Talentos de Rank {r}</span>
                          <span className="text-[10px] text-zinc-400">{feats.length} talento(s)</span>
                        </h4>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 min-[1800px]:grid-cols-5 2xl:grid-cols-5 gap-3 sm:gap-3.5 items-stretch">
                        {feats.map((feat, idx) => {
                          const linkedEntity = feat.featEntityId
                            ? HecosStorage.getEntities().find((e) => e.id === feat.featEntityId)
                            : undefined;

                          return (
                            <FeatCard
                              key={feat.id || idx}
                              entity={linkedEntity}
                              id={feat.featEntityId || feat.id}
                              title={feat.name}
                              level={feat.rank}
                              featType="ancestry"
                              subcategories={[entity.title]}
                              traits={
                                feat.traits && feat.traits.length > 0
                                  ? feat.traits
                                  : ['Ancestralidade', entity.title]
                              }
                              actionCost={feat.actions}
                              prerequisites={feat.prerequisites}
                              description={feat.description}
                              visibility={feat.visibility}
                              allowedUserIds={feat.allowedUserIds}
                              onSelectEntity={(targetId) => {
                                const idToOpen = targetId || feat.featEntityId || feat.id || feat.name;
                                window.dispatchEvent(
                                  new CustomEvent('hecos:open-feat-drawer', {
                                    detail: { featId: idToOpen, id: idToOpen }
                                  })
                                );
                              }}
                              isGmMode={isActualGm}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* ABA DE LORE & CENÁRIO */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {activeMainTab === 'lore' && (
        <div className="space-y-6 animate-in fade-in duration-150 p-4 sm:p-6 rounded-b-2xl bg-[#09080e] border border-t-0 border-[#272438]">
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {/* 1. SUBCATEGORIA COLAPSÁVEL: ÁLBUM & GALERIA VISUAL DA ANCESTRALIDADE   */}
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          <section className="rounded-2xl bg-[#0f0e18] border-2 border-purple-500/30 overflow-hidden shadow-lg transition-all">
            {/* Header Colapsável */}
            <div
              onClick={() => setIsAlbumOpen(!isAlbumOpen)}
              className="flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-[#171226] via-[#120d20] to-[#1a132c] cursor-pointer hover:bg-[#1f1833] transition-colors select-none"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-950/80 text-purple-300 border border-purple-500/40">
                  <Images className="w-5 h-5 text-purple-300" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-purple-200 flex items-center gap-2 font-serif">
                    <span>Álbum & Galeria Visual</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-300 font-mono font-normal border border-purple-700/50">
                      {(data.album || []).length} {(data.album || []).length === 1 ? 'imagem' : 'imagens'}
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400 font-sans">
                    Galeria ilustrada com variações, retratos, vestimentas e cenas desta ancestralidade
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isActualGm && isAlbumOpen && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsBulkUploadOpen(!isBulkUploadOpen);
                        if (!isBulkUploadOpen) setIsAddingImage(false);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-900/80 hover:bg-purple-800 border border-purple-500/60 text-purple-200 text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Images className="w-3.5 h-3.5" />
                      <span>{isBulkUploadOpen ? 'Fechar Lote' : 'Upload Múltiplo'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsAddingImage(!isAddingImage);
                        if (!isAddingImage) setIsBulkUploadOpen(false);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-800/80 hover:bg-purple-700 border border-purple-500/60 text-purple-100 text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar Uma</span>
                    </button>
                  </>
                )}
                <div className="p-1 rounded-lg text-purple-400 hover:text-purple-200">
                  {isAlbumOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </div>
            </div>

            {/* Conteúdo do Álbum (quando expandido) */}
            {isAlbumOpen && (
              <div className="p-4 sm:p-5 border-t border-[#272438] space-y-4 bg-[#0a0912]">
                {/* Batch multi-image upload component */}
                {isBulkUploadOpen && isActualGm && (
                  <div className="mb-4 animate-in fade-in">
                    <MultiImageAlbumUploader
                      title="Upload em Lote de Imagens para o Álbum"
                      description="Selecione múltiplos arquivos de uma vez ou arraste várias imagens para salvar direto no artigo."
                      onImagesUploaded={handleAddMultipleImagesToAlbum}
                      onCancel={() => setIsBulkUploadOpen(false)}
                      themeColor="purple"
                      category="ancestralidade"
                      entityName={data.name || entity.title}
                      role="album"
                      startIndex={(data.album || []).length + 1}
                    />
                  </div>
                )}

                {/* Form para adicionar nova imagem ao Álbum (Apenas GM) */}
                {isAddingImage && isActualGm && (
                  <div className="p-4 rounded-xl bg-[#141022] border border-purple-500/50 space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5" />
                        <span>Nova Imagem no Álbum</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsAddingImage(false)}
                        className="text-zinc-400 hover:text-zinc-200 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                          URL da Imagem ou Upload Direto
                        </label>
                        <ImageUploadInput
                          value={newImageUrl}
                          onChange={(url) => setNewImageUrl(url)}
                          placeholder="https://exemplo.com/imagem-ancestralidade.jpg ou selecione um arquivo..."
                          category="ancestralidade"
                          entityName={data.name || entity.title}
                          role="album"
                          index={(data.album || []).length + 1}
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                          Legenda ou Descrição (opcional)
                        </label>
                        <input
                          type="text"
                          value={newImageCaption}
                          onChange={(e) => setNewImageCaption(e.target.value)}
                          placeholder="Ex: Guerreiro de elite com armadura cerimonial..."
                          className="w-full px-3 py-2 text-xs rounded-xl bg-[#0a0812] border border-zinc-700 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      {newImageUrl && (
                        <div className="h-32 w-full rounded-xl overflow-hidden bg-black/50 border border-zinc-800 flex items-center justify-center">
                          <img
                            src={newImageUrl}
                            alt="Pré-visualização"
                            className="max-h-full max-w-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingImage(false);
                            setNewImageUrl('');
                            setNewImageCaption('');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handleAddImageToAlbum}
                          disabled={!newImageUrl.trim()}
                          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-purple-100 text-xs font-bold shadow-md cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Salvar no Álbum</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Grid de Imagens do Álbum */}
                {(data.album || []).length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                    {(data.album || []).map((img, idx) => (
                      <div
                        key={img.id || idx}
                        onClick={() => setSelectedImageIndex(idx)}
                        className="group relative rounded-xl overflow-hidden bg-[#141122] border border-purple-500/20 hover:border-purple-400 transition-all duration-200 aspect-[3/4] flex flex-col cursor-pointer shadow-md hover:shadow-purple-500/10 hover:scale-[1.02]"
                      >
                        <div className="w-full flex-1 overflow-hidden relative bg-black/60">
                          <img
                            src={img.url}
                            alt={img.caption || `Imagem ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2">
                            <span className="text-[10px] text-purple-200 font-mono flex items-center gap-1">
                              <Maximize2 className="w-3 h-3" />
                              Ampliar
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  downloadImage(
                                    img.url,
                                    `ancestralidade-${slugify(entity.title)}-album-${String(idx + 1).padStart(2, '0')}.webp`
                                  );
                                }}
                                title="Baixar imagem (.webp)"
                                className="p-1 rounded-lg bg-black/80 text-cyan-300 hover:bg-cyan-900/80 border border-cyan-500/40 hover:text-white transition-colors cursor-pointer"
                              >
                                <Download className="w-3 h-3" />
                              </button>
                              {isActualGm && (
                                <button
                                  type="button"
                                  onClick={(e) => handleRemoveImageFromAlbum(img.id, e)}
                                  title="Remover imagem do álbum"
                                  className="p-1 rounded-lg bg-rose-950/90 text-rose-300 hover:bg-rose-900 border border-rose-600/50 hover:text-white transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {img.caption && (
                          <div className="p-2 bg-[#120f1f] border-t border-purple-950/60">
                            <p className="text-[11px] text-zinc-300 leading-snug font-sans break-words">
                              {img.caption}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 rounded-xl border border-dashed border-purple-900/40 text-center space-y-3 bg-[#0d0a17]/50">
                    <div className="w-12 h-12 rounded-2xl bg-purple-950/60 border border-purple-800/40 flex items-center justify-center mx-auto text-purple-400">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-zinc-300">
                        Nenhuma imagem no álbum desta ancestralidade
                      </p>
                      <p className="text-xs text-zinc-500 max-w-md mx-auto">
                        Adicione retratos, conceitos visuais, brasões, esquemas anatômicos e ilustrações da linhagem para enriquecer o artigo.
                      </p>
                    </div>
                    {isActualGm && !isAddingImage && (
                      <button
                        type="button"
                        onClick={() => setIsAddingImage(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-900/80 hover:bg-purple-800 border border-purple-600/60 text-purple-200 text-xs font-bold transition-all shadow cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar Primeira Imagem</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* FISIOLOGIA & ANATOMIA */}
          <section className="p-5 rounded-2xl bg-[#0f0e18] border border-[#272438] space-y-4">
            <div className="flex items-center justify-between border-b border-[#272438] pb-3">
              <h3 className="text-lg font-black text-[#b19ecc] flex items-center gap-2.5 font-serif">
                <Dna className="w-4 h-4 text-[#b19ecc]" />
                <span>Fisiologia & Anatomia Detalhada</span>
              </h3>
              {isActualGm && onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit('lore')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-purple-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Editar Lore</span>
                </button>
              )}
            </div>

            <div className="space-y-4 text-sm text-zinc-300 leading-relaxed">
              {data.physiology?.physicalDescription && (
                <div className="space-y-1 min-w-0 break-words">
                  <h4 className="text-xs font-bold text-[#b19ecc] uppercase font-mono">
                    Descrição Física e Dimorfismo
                  </h4>
                  <RichContentRenderer content={data.physiology.physicalDescription} onNavigate={onNavigate} />
                </div>
              )}

              {data.physiology?.functionalAnatomy && (
                <div className="space-y-1 min-w-0 break-words">
                  <h4 className="text-xs font-bold text-[#b19ecc] uppercase font-mono">
                    Anatomia Funcional
                  </h4>
                  <RichContentRenderer content={data.physiology.functionalAnatomy} onNavigate={onNavigate} />
                </div>
              )}

              {data.physiology?.bodyLanguage && (
                <div className="space-y-1 min-w-0 break-words">
                  <h4 className="text-xs font-bold text-[#b19ecc] uppercase font-mono">
                    Linguagem Corporal
                  </h4>
                  <RichContentRenderer content={data.physiology.bodyLanguage} onNavigate={onNavigate} />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {data.physiology?.lifeCycle && (
                  <div className="p-3 rounded-xl bg-[#131120] border border-[#272438] min-w-0 break-words">
                    <h4 className="text-xs font-bold text-[#b19ecc] uppercase font-mono mb-1">
                      Ciclo de Vida e Envelhecimento
                    </h4>
                    <RichContentRenderer content={data.physiology.lifeCycle} onNavigate={onNavigate} />
                  </div>
                )}

                {data.physiology?.dietAndMetabolism && (
                  <div className="p-3 rounded-xl bg-[#131120] border border-[#272438] min-w-0 break-words">
                    <h4 className="text-xs font-bold text-[#b19ecc] uppercase font-mono mb-1">
                      Dieta e Metabolismo
                    </h4>
                    <RichContentRenderer content={data.physiology.dietAndMetabolism} onNavigate={onNavigate} />
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* IDENTIDADE & PSICOLOGIA */}
          <section className="p-5 rounded-2xl bg-[#0f0e18] border border-[#272438] space-y-4">
            <div className="flex items-center justify-between border-b border-[#272438] pb-3">
              <h3 className="text-lg font-black text-orange-300 flex items-center gap-2.5 font-serif">
                <Compass className="w-4 h-4 text-orange-400" />
                <span>Identidade, Psicologia & Mentalidade</span>
              </h3>
              {isActualGm && onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit('lore')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-orange-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Editar Identidade</span>
                </button>
              )}
            </div>

            <div className="space-y-4 text-sm text-zinc-300 leading-relaxed">
              {data.identity?.narrativeHook && (
                <div className="p-4 rounded-xl bg-[#23140b] border border-orange-500/30 text-orange-200 font-medium italic min-w-0 break-words">
                  "{data.identity.narrativeHook}"
                </div>
              )}

              {data.identity?.psychologyAndPhilosophy && (
                <div className="space-y-1 min-w-0 break-words">
                  <h4 className="text-xs font-bold text-orange-300 uppercase font-mono">
                    Psicologia e Filosofia
                  </h4>
                  <RichContentRenderer content={data.identity.psychologyAndPhilosophy} onNavigate={onNavigate} />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.identity?.creationMyth && (
                  <div className="p-3 rounded-xl bg-[#131120] border border-[#272438] min-w-0 break-words">
                    <h4 className="text-xs font-bold text-orange-300 uppercase font-mono mb-1">
                      Mito da Criação
                    </h4>
                    <RichContentRenderer content={data.identity.creationMyth} onNavigate={onNavigate} />
                  </div>
                )}

                {data.identity?.epicsAndFigures && (
                  <div className="p-3 rounded-xl bg-[#131120] border border-[#272438] min-w-0 break-words">
                    <h4 className="text-xs font-bold text-orange-300 uppercase font-mono mb-1">
                      Épicos e Figuras Históricas
                    </h4>
                    <RichContentRenderer content={data.identity.epicsAndFigures} onNavigate={onNavigate} />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.identity?.purpose && (
                  <div className="p-3 rounded-xl bg-[#131120] border border-[#272438] min-w-0 break-words">
                    <h4 className="text-xs font-bold text-orange-300 uppercase font-mono mb-1">
                      Propósito Existencial
                    </h4>
                    <RichContentRenderer content={data.identity.purpose} onNavigate={onNavigate} />
                  </div>
                )}

                {data.identity?.theAdventurer && (
                  <div className="p-3 rounded-xl bg-[#131120] border border-[#272438] min-w-0 break-words">
                    <h4 className="text-xs font-bold text-orange-300 uppercase font-mono mb-1">
                      O Aventureiro
                    </h4>
                    <RichContentRenderer content={data.identity.theAdventurer} onNavigate={onNavigate} />
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* CULTURA & COTIDIANO */}
          <section className="p-5 rounded-2xl bg-[#0f0e18] border border-[#272438] space-y-4">
            <div className="flex items-center justify-between border-b border-[#272438] pb-3">
              <h3 className="text-lg font-black text-amber-300 flex items-center gap-2.5 font-serif">
                <Feather className="w-4 h-4 text-amber-400" />
                <span>Cultura, Tradições & Cotidiano</span>
              </h3>
              {isActualGm && onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit('lore')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-amber-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Editar Cultura</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-zinc-300 leading-relaxed">
              {data.culture?.etiquetteAndCustoms && (
                <div className="p-3 rounded-xl bg-[#131120] border border-[#272438] min-w-0 break-words">
                  <h4 className="text-xs font-bold text-amber-300 uppercase font-mono mb-1">
                    Etiqueta e Costumes
                  </h4>
                  <RichContentRenderer content={data.culture.etiquetteAndCustoms} onNavigate={onNavigate} />
                </div>
              )}

              {data.culture?.namesAndMeanings && (
                <div className="p-3 rounded-xl bg-[#131120] border border-[#272438] min-w-0 break-words">
                  <h4 className="text-xs font-bold text-amber-300 uppercase font-mono mb-1">
                    Nomes e Significados
                  </h4>
                  <RichContentRenderer content={data.culture.namesAndMeanings} onNavigate={onNavigate} />
                </div>
              )}

              {data.culture?.clothingAndFashion && (
                <div className="p-3 rounded-xl bg-[#131120] border border-[#272438] min-w-0 break-words">
                  <h4 className="text-xs font-bold text-amber-300 uppercase font-mono mb-1">
                    Vestimenta e Estética
                  </h4>
                  <RichContentRenderer content={data.culture.clothingAndFashion} onNavigate={onNavigate} />
                </div>
              )}

              {data.culture?.artisticExpressions && (
                <div className="p-3 rounded-xl bg-[#131120] border border-[#272438] min-w-0 break-words">
                  <h4 className="text-xs font-bold text-amber-300 uppercase font-mono mb-1">
                    Expressões Artísticas
                  </h4>
                  <RichContentRenderer content={data.culture.artisticExpressions} onNavigate={onNavigate} />
                </div>
              )}

              {data.culture?.gastronomy && (
                <div className="p-3 rounded-xl bg-[#131120] border border-[#272438] min-w-0 break-words">
                  <h4 className="text-xs font-bold text-amber-300 uppercase font-mono mb-1">
                    Gastronomia Tradicional
                  </h4>
                  <RichContentRenderer content={data.culture.gastronomy} onNavigate={onNavigate} />
                </div>
              )}

              {data.culture?.leisureAndSports && (
                <div className="p-3 rounded-xl bg-[#131120] border border-[#272438] min-w-0 break-words">
                  <h4 className="text-xs font-bold text-amber-300 uppercase font-mono mb-1">
                    Lazer e Competições
                  </h4>
                  <RichContentRenderer content={data.culture.leisureAndSports} onNavigate={onNavigate} />
                </div>
              )}
            </div>
          </section>

          {/* SOCIEDADE & ORGANIZAÇÃO */}
          <section className="p-5 rounded-2xl bg-[#0f0e18] border border-[#272438] space-y-4">
            <div className="flex items-center justify-between border-b border-[#272438] pb-3">
              <h3 className="text-lg font-black text-orange-300 flex items-center gap-2.5 font-serif">
                <Users className="w-4 h-4 text-orange-400" />
                <span>Sociedade, Política & Economia</span>
              </h3>
              {isActualGm && onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit('lore')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-orange-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Editar Sociedade</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-zinc-300 leading-relaxed">
              {data.society?.socialStructure && (
                <div className="p-3 rounded-xl bg-[#131120] border border-[#272438] min-w-0 break-words">
                  <h4 className="text-xs font-bold text-orange-300 uppercase font-mono mb-1">
                    Estrutura Social
                  </h4>
                  <RichContentRenderer content={data.society.socialStructure} onNavigate={onNavigate} />
                </div>
              )}

              {data.society?.lawsAndTaboos && (
                <div className="p-3 rounded-xl bg-[#131120] border border-[#272438] min-w-0 break-words">
                  <h4 className="text-xs font-bold text-orange-300 uppercase font-mono mb-1">
                    Leis, Justiça e Tabus
                  </h4>
                  <RichContentRenderer content={data.society.lawsAndTaboos} onNavigate={onNavigate} />
                </div>
              )}

              {data.society?.economyAndTrade && (
                <div className="p-3 rounded-xl bg-[#131120] border border-[#272438] min-w-0 break-words">
                  <h4 className="text-xs font-bold text-orange-300 uppercase font-mono mb-1">
                    Economia e Comércio
                  </h4>
                  <RichContentRenderer content={data.society.economyAndTrade} onNavigate={onNavigate} />
                </div>
              )}

              {data.society?.educationAndRites && (
                <div className="p-3 rounded-xl bg-[#131120] border border-[#272438] min-w-0 break-words">
                  <h4 className="text-xs font-bold text-orange-300 uppercase font-mono mb-1">
                    Educação e Ritos de Passagem
                  </h4>
                  <RichContentRenderer content={data.society.educationAndRites} onNavigate={onNavigate} />
                </div>
              )}
            </div>
          </section>

          {/* ESPIRITUALIDADE & MUNDO */}
          <section className="p-5 rounded-2xl bg-[#0f0e18] border border-[#272438] space-y-4">
            <div className="flex items-center justify-between border-b border-[#272438] pb-3">
              <h3 className="text-lg font-black text-amber-300 flex items-center gap-2.5 font-serif">
                <Globe className="w-4 h-4 text-amber-400" />
                <span>Espiritualidade & Relações no Mundo</span>
              </h3>
              {isActualGm && onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit('lore')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-amber-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Editar Relações</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-zinc-300 leading-relaxed">
              {data.spirituality?.nativePantheon && (
                <div className="p-3 rounded-xl bg-[#131120] border border-[#272438] min-w-0 break-words">
                  <h4 className="text-xs font-bold text-amber-300 uppercase font-mono mb-1">
                    Panteão e Divindades Nativas
                  </h4>
                  <RichContentRenderer content={data.spirituality.nativePantheon} onNavigate={onNavigate} />
                </div>
              )}

              {data.spirituality?.funeraryPractices && (
                <div className="p-3 rounded-xl bg-[#131120] border border-[#272438] min-w-0 break-words">
                  <h4 className="text-xs font-bold text-amber-300 uppercase font-mono mb-1">
                    Práticas Funerárias e Pós-Vida
                  </h4>
                  <RichContentRenderer content={data.spirituality.funeraryPractices} onNavigate={onNavigate} />
                </div>
              )}

              {data.world?.geographicalDistribution && (
                <div className="p-3 rounded-xl bg-[#131120] border border-[#272438] min-w-0 break-words">
                  <h4 className="text-xs font-bold text-orange-300 uppercase font-mono mb-1">
                    Distribuição Geográfica em Hecos
                  </h4>
                  <RichContentRenderer content={data.world.geographicalDistribution} onNavigate={onNavigate} />
                </div>
              )}

              {data.world?.diplomaticRelations && (
                <div className="p-3 rounded-xl bg-[#131120] border border-[#272438] min-w-0 break-words">
                  <h4 className="text-xs font-bold text-orange-300 uppercase font-mono mb-1">
                    Relações Diplomáticas
                  </h4>
                  <RichContentRenderer content={data.world.diplomaticRelations} onNavigate={onNavigate} />
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* ABA DO GM (EXCLUSIVA DO MESTRE: GRANDE EDITOR DE TEXTO & NOTAS AVULSAS) */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {isGmMode && activeMainTab === 'gm' && (
        <div className="space-y-6 animate-in fade-in duration-150 p-4 sm:p-6 rounded-b-2xl bg-[#0e0710] border border-t-0 border-rose-900/60 shadow-2xl">
          {/* GM Header & Scratchpad Controls */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/60 via-[#150a17] to-amber-950/40 border border-rose-600/50 flex flex-wrap items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-600/20 border border-rose-500/50 text-rose-400">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-rose-100 font-serif flex items-center gap-2">
                  <span>Caderno de Anotações do Mestre</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-900/80 text-rose-300 font-mono border border-rose-700/50">
                    Apenas GM
                  </span>
                </h3>
                <p className="text-xs text-rose-300/80">
                  Espaço livre e confidencial para anotações, segredos, ganchos de campanha e NPCs.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Toggle Mode: Edit vs Preview */}
              <div className="flex bg-black/50 p-1 rounded-xl border border-rose-900/40 text-xs">
                <button
                  type="button"
                  onClick={() => setGmEditorMode('edit')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    gmEditorMode === 'edit'
                      ? 'bg-rose-900 text-rose-100 border border-rose-600/60'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Editor
                </button>
                <button
                  type="button"
                  onClick={() => setGmEditorMode('preview')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    gmEditorMode === 'preview'
                      ? 'bg-rose-900 text-rose-100 border border-rose-600/60'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Visualizar
                </button>
              </div>

              {/* Save Button */}
              <button
                type="button"
                onClick={handleSaveGmNotes}
                disabled={isGmSaving}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs shadow-lg shadow-rose-900/40 transition-all cursor-pointer disabled:opacity-50"
              >
                {isGmSaving ? (
                  <span>Salvando...</span>
                ) : gmSaveSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Salvo!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Salvar Notas</span>
                  </>
                )}
              </button>

              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit('gm')}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-rose-300 text-xs font-semibold transition-colors cursor-pointer"
                  title="Abrir no editor estruturado completo"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Editor Geral</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Insert Snippet Chips */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-rose-400/80 font-mono text-[11px] font-bold">Inserir Rápido:</span>
            <button
              type="button"
              onClick={() => {
                setGmNotesText((prev) => `${prev}\n\n### 🎭 NPC Relevante\n- **Nome:** \n- **Papel:** \n- **Segredo:** `);
              }}
              className="px-2.5 py-1 rounded-lg bg-[#180e1a] hover:bg-[#251328] border border-rose-900/50 text-rose-300 hover:text-rose-100 transition-colors"
            >
              + Modelo de NPC
            </button>
            <button
              type="button"
              onClick={() => {
                setGmNotesText((prev) => `${prev}\n\n### 🧭 Gancho de Aventura\n- **Gatilho:** \n- **Recompensa:** \n- **Perigo Oculto:** `);
              }}
              className="px-2.5 py-1 rounded-lg bg-[#180e1a] hover:bg-[#251328] border border-rose-900/50 text-rose-300 hover:text-rose-100 transition-colors"
            >
              + Gancho de Missão
            </button>
            <button
              type="button"
              onClick={() => {
                setGmNotesText((prev) => `${prev}\n\n> 🔒 **Segredo Ancestral:** `);
              }}
              className="px-2.5 py-1 rounded-lg bg-[#180e1a] hover:bg-[#251328] border border-rose-900/50 text-rose-300 hover:text-rose-100 transition-colors"
            >
              + Caixa de Segredo
            </button>
            <button
              type="button"
              onClick={() => {
                setGmNotesText((prev) => `${prev}\n\n- [ ] Planejar encontro com facção ancestral\n- [ ] Revelar mistério da linhagem no nível 5`);
              }}
              className="px-2.5 py-1 rounded-lg bg-[#180e1a] hover:bg-[#251328] border border-rose-900/50 text-rose-300 hover:text-rose-100 transition-colors"
            >
              + Lista de Tarefas GM
            </button>
          </div>

          {/* Big Text Editor or Rich Preview */}
          {gmEditorMode === 'edit' ? (
            <div className="space-y-2">
              <textarea
                value={gmNotesText}
                onChange={(e) => setGmNotesText(e.target.value)}
                placeholder="Escreva aqui todas as notas confidenciais, tramas ocultas, estatísticas de NPCs e informações que apenas você (o Mestre) deve ter acesso... Suporta formatação completa de Markdown, @menções de artigos e callouts como > 🔒"
                rows={16}
                className="w-full p-4 rounded-2xl bg-[#08050c] border border-rose-900/60 focus:border-rose-500 text-zinc-100 text-sm font-mono leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-rose-500/20 shadow-inner"
              />
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>
                  {gmNotesText.length} caracteres • {gmNotesText.trim() ? gmNotesText.trim().split(/\s+/).length : 0} palavras
                </span>
                <span className="italic text-rose-400/80">
                  Dica: Clique em "Salvar Notas" ou use o modo "Visualizar" para ver a formatação.
                </span>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-[#08050c] border border-rose-900/60 min-h-[350px] space-y-4">
              {gmNotesText.trim() ? (
                <RichContentRenderer content={gmNotesText} onNavigate={onNavigate} />
              ) : (
                <p className="text-zinc-500 italic text-sm">
                  Nenhuma anotação registrada ainda. Alterne para o modo 'Editor' para escrever anotações do Mestre.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* MODAL LIGHTBOX PARA O ÁLBUM DE IMAGENS                                      */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {selectedImageIndex !== null && (data.album || [])[selectedImageIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in"
          onClick={() => setSelectedImageIndex(null)}
        >
          <div
            className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Fechar e Download */}
            <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  downloadImage(
                    (data.album || [])[selectedImageIndex].url,
                    `ancestralidade-${slugify(entity.title)}-album-${String(selectedImageIndex + 1).padStart(2, '0')}.webp`
                  )
                }
                className="px-3.5 py-2 rounded-full bg-black/80 text-cyan-300 hover:bg-cyan-900 border border-cyan-500/50 hover:text-white transition-colors shadow-lg cursor-pointer flex items-center gap-1.5"
                title="Baixar imagem (.webp)"
              >
                <Download className="w-4 h-4" />
                <span className="text-xs font-semibold hidden sm:inline">Baixar (.webp)</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedImageIndex(null)}
                className="p-2.5 rounded-full bg-black/80 text-white hover:bg-rose-600 transition-colors shadow-lg cursor-pointer"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navegação Anterior */}
            {(data.album || []).length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setSelectedImageIndex((prev) =>
                    prev !== null && prev > 0 ? prev - 1 : (data.album || []).length - 1
                  )
                }
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-black/80 text-white hover:bg-purple-600 transition-colors shadow-lg cursor-pointer"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Imagem Ampliada */}
            <div className="relative max-h-[75vh] w-full flex items-center justify-center overflow-hidden rounded-2xl border border-purple-500/30 bg-black/60 shadow-2xl">
              <img
                src={(data.album || [])[selectedImageIndex].url}
                alt={(data.album || [])[selectedImageIndex].caption || 'Imagem do Álbum'}
                className="max-h-[75vh] max-w-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Legenda e Contador */}
            <div className="mt-3 text-center space-y-1 max-w-2xl px-4">
              {((data.album || [])[selectedImageIndex].caption) && (
                <p className="text-sm text-purple-200 font-medium">
                  {(data.album || [])[selectedImageIndex].caption}
                </p>
              )}
              <p className="text-xs text-zinc-400 font-mono">
                {selectedImageIndex + 1} de {(data.album || []).length}
              </p>
            </div>

            {/* Navegação Próxima */}
            {(data.album || []).length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setSelectedImageIndex((prev) =>
                    prev !== null && prev < (data.album || []).length - 1 ? prev + 1 : 0
                  )
                }
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-black/80 text-white hover:bg-purple-600 transition-colors shadow-lg cursor-pointer"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
