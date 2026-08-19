import React, { useState, useMemo, useEffect } from 'react';
import { HecosEntity, AncestryAttributes } from '../types';
import { RichContentRenderer } from './RichContentRenderer';
import { renderContentWithMentions } from './MentionBadge';
import { PF2eActionGlyph } from './PF2eActionGlyph';
import { parseAncestryFromContent, serializeAncestryToHTML } from '../utils/ancestrySerializer';
import { HecosStorage } from '../services/storage';
import { VisibilityBadgeMenu } from './VisibilityBadgeMenu';
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
  Flame
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
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* CABEÇALHO DA ANCESTRALIDADE (ESTILIZADO, CONCISO & MODERNO PF2E) */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-[#110e1c] to-[#0a0910] border border-[#272338] shadow-xl relative overflow-hidden group">
        {/* Subtle accent corner glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#74b6c2]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#b19ecc]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-zinc-800/80">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#18262b] text-[#74b6c2] border border-[#74b6c2]/30 font-mono">
                Ancestralidade PF2e
              </span>
              {entity.isSecret && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-600/40 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Secreto GM
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 via-cyan-100 to-[#74b6c2] tracking-tight font-serif break-words">
              {entity.title || '[NOME DA ANCESTRALIDADE]'}
            </h2>
            {entity.subtitle && (
              <p className="text-xs sm:text-sm text-[#b19ecc] font-medium mt-1 break-words">
                {entity.subtitle}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
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
                  onClick={() => onEdit('mechanics')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-200 text-xs font-semibold transition-all cursor-pointer shadow-sm hover:shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                  title="Editar Cabeçalho e Atributos da Ancestralidade"
                >
                  <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Editar</span>
                </button>
              )}

            <button
              type="button"
              onClick={copyStatblockText}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141220] hover:bg-[#1c1830] border border-[#272338] hover:border-[#74b6c2]/50 text-zinc-300 hover:text-cyan-300 text-xs font-semibold transition-all cursor-pointer"
              title="Copiar cabeçalho da ficha para a área de transferência"
            >
              {copiedStatblock ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedStatblock ? 'Copiado!' : 'Copiar Ficha'}</span>
            </button>
          </div>
        </div>

        {/* Compact, High-Craft PF2e Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-4">
          {/* Card 1: HP */}
          <div className="p-3 rounded-xl bg-[#130f1d]/80 border border-rose-900/30 hover:border-rose-600/40 transition-colors flex flex-col justify-between">
            <span className="text-[11px] font-bold text-rose-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400/20" />
              <span>Pontos de Vida</span>
            </span>
            <span className="text-base sm:text-lg font-bold text-zinc-100 mt-1">
              {data.hp || '8 PV'}
            </span>
          </div>

          {/* Card 2: Tamanho */}
          <div className="p-3 rounded-xl bg-[#0f141a]/80 border border-cyan-900/30 hover:border-cyan-600/40 transition-colors flex flex-col justify-between">
            <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-cyan-400" />
              <span>Tamanho</span>
            </span>
            <span className="text-base sm:text-lg font-bold text-zinc-100 mt-1">
              {data.size || 'Médio'}
            </span>
          </div>

          {/* Card 3: Velocidade */}
          <div className="p-3 rounded-xl bg-[#14101e]/80 border border-purple-900/30 hover:border-purple-600/40 transition-colors flex flex-col justify-between">
            <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              <span>Velocidade</span>
            </span>
            <span className="text-base sm:text-lg font-bold text-zinc-100 mt-1">
              {data.speed || '25 pés (≈ 7,5 m)'}
            </span>
          </div>

          {/* Card 4: Sentidos */}
          <div className="p-3 rounded-xl bg-[#0f141a]/80 border border-cyan-900/30 hover:border-cyan-600/40 transition-colors flex flex-col justify-between">
            <span className="text-[11px] font-bold text-[#88c5d0] uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sentidos</span>
            </span>
            <span className="text-sm sm:text-base font-bold text-[#88c5d0] mt-1 truncate" title={data.senses || 'Visão na Penumbra'}>
              {data.senses || 'Visão na Penumbra'}
            </span>
          </div>
        </div>

        {/* Row 2: Secondary Attributes in clean bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2.5">
          {/* Atributos */}
          <div className="p-3 rounded-xl bg-[#14121a]/90 border border-amber-900/30 flex items-start gap-2.5">
            <span className="text-amber-400 font-bold text-xs shrink-0 font-mono mt-0.5">🧠 Modificadores:</span>
            <span className="text-xs sm:text-sm font-semibold text-amber-200 font-mono flex-1">
              {renderContentWithMentions(data.attributes || '+2 Des, +2 Int, +2 Livre, -2 For', onNavigate)}
            </span>
          </div>

          {/* Traços */}
          <div className="p-3 rounded-xl bg-[#14121a]/90 border border-purple-900/30 flex items-start gap-2.5">
            <span className="text-purple-300 font-bold text-xs shrink-0 font-mono mt-0.5">🏷️ Traços:</span>
            <div className="flex flex-wrap gap-1.5 flex-1">
              {(data.traits || 'Humanoide').split(',').map((t, idx) => (
                <span
                  key={idx}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-[#251e33] text-[#b19ecc] border border-[#b19ecc]/30 font-mono font-semibold"
                >
                  {t.trim()}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Row 3: Inato & Idiomas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2.5 text-xs text-zinc-300">
          <div className="p-2.5 rounded-lg bg-[#0e0c16] border border-zinc-800/80 flex items-baseline gap-2">
            <span className="text-cyan-400 font-bold font-mono shrink-0">🛠️ Inato:</span>
            <span className="text-zinc-300 flex-1 truncate" title={data.innate || '—'}>
              {renderContentWithMentions(data.innate || '—', onNavigate)}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-[#0e0c16] border border-zinc-800/80 flex items-baseline gap-2">
            <span className="text-[#b19ecc] font-bold font-mono shrink-0">🗣️ Idiomas:</span>
            <span className="text-zinc-300 flex-1 truncate" title={data.languages || 'Humani'}>
              {renderContentWithMentions(data.languages || 'Humani', onNavigate)}
            </span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* NAVEGAÇÃO DAS ABAS (MECÂNICAS, LORE, GM) */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center border-b border-[#272438] bg-[#0c0b14] rounded-t-2xl p-1.5 gap-1.5 shadow-lg">
        {/* Tab 1: Mecânicas */}
        <button
          type="button"
          onClick={() => setActiveMainTab('mechanics')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeMainTab === 'mechanics'
              ? 'bg-[#18262b] text-[#74b6c2] border border-[#74b6c2]/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#141220]'
          }`}
        >
          <Swords className="w-4 h-4 text-[#74b6c2]" />
          <span>Mecânicas</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#74b6c2]/20 text-[#74b6c2] font-mono">
            {totalFeatsCount + (data.heritages?.length || 0)}
          </span>
        </button>

        {/* Tab 2: Lore */}
        <button
          type="button"
          onClick={() => setActiveMainTab('lore')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeMainTab === 'lore'
              ? 'bg-[#251e33] text-[#b19ecc] border border-[#b19ecc]/50 shadow-[0_0_15px_rgba(177,158,204,0.15)]'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#141220]'
          }`}
        >
          <BookOpen className="w-4 h-4 text-[#b19ecc]" />
          <span>Lore</span>
        </button>

        {/* Tab 3: GM (Apenas visível para o Mestre!) */}
        {isGmMode && (
          <button
            type="button"
            onClick={() => setActiveMainTab('gm')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              activeMainTab === 'gm'
                ? 'bg-rose-950/80 text-rose-200 border border-rose-500/70 shadow-[0_0_20px_rgba(244,63,94,0.3)]'
                : 'text-rose-400/80 hover:text-rose-200 hover:bg-rose-950/30'
            }`}
          >
            <Crown className="w-4 h-4 text-rose-400" />
            <span>GM</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono font-bold">
              Segredos
            </span>
          </button>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* ABA DE MECÂNICAS */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {activeMainTab === 'mechanics' && (
        <div className="space-y-6 animate-in fade-in duration-150 p-4 sm:p-6 rounded-b-2xl bg-[#09080e] border border-t-0 border-[#272438]">
          {/* HERANÇAS DE LINHAGEM */}
          <section className="p-5 rounded-2xl bg-[#0f0e18] border border-[#272438] space-y-4">
            <div className="flex items-center justify-between border-b border-[#272438] pb-3">
              <h3 className="text-lg font-black text-[#74b6c2] flex items-center gap-2.5 font-serif">
                <Sparkles className="w-4 h-4 text-[#74b6c2]" />
                <span>Heranças de Linhagem</span>
              </h3>
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit('mechanics')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-cyan-300 text-xs font-semibold transition-colors cursor-pointer"
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
                    className="p-4 rounded-xl bg-[#131120] border border-[#272438] hover:border-[#74b6c2]/50 transition-all space-y-2 min-w-0 break-words"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-base font-bold text-[#b19ecc] font-serif flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#74b6c2] shrink-0" />
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
                <p className="text-xs text-zinc-500 col-span-2 italic py-2">
                  Nenhuma herança disponível com as permissões atuais.
                </p>
              )}
            </div>
          </section>

          {/* ARSENAL CULTURAL E EQUIPAMENTOS */}
          <section className="p-5 rounded-2xl bg-[#0f0e18] border border-[#272438] space-y-4">
            <div className="flex items-center justify-between border-b border-[#272438] pb-3">
              <h3 className="text-lg font-black text-[#b19ecc] flex items-center gap-2.5 font-serif">
                <Shield className="w-4 h-4 text-[#b19ecc]" />
                <span>Arsenal Cultural & Equipamentos Tradicionais</span>
              </h3>
              {isActualGm && onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit('mechanics')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-purple-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Editar Arsenal</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="space-y-2 p-4 rounded-xl bg-[#131120] border border-[#272438] min-w-0 break-words">
                <h4 className="text-sm font-bold text-[#b19ecc]">
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
                <h4 className="text-sm font-bold text-[#b19ecc]">
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
                <h3 className="text-lg font-black text-[#74b6c2] flex items-center gap-2.5 font-serif">
                  <Zap className="w-4 h-4 text-[#74b6c2]" />
                  <span>Talentos de Ancestralidade</span>
                </h3>
                {isActualGm && onEdit && (
                  <button
                    type="button"
                    onClick={() => onEdit('mechanics')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-cyan-300 text-xs font-semibold transition-colors cursor-pointer"
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
                      ? 'bg-[#18262b] text-[#74b6c2] border border-[#74b6c2]/40'
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
                        ? 'bg-[#251e33] text-[#b19ecc] border border-[#b19ecc]/40'
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
                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#74b6c2] px-2.5 py-1 bg-[#18262b] rounded-lg border-l-4 border-[#74b6c2] flex items-center justify-between">
                          <span>Talentos de Rank {r}</span>
                          <span className="text-[10px] text-zinc-400">{feats.length} talento(s)</span>
                        </h4>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {feats.map((feat, idx) => (
                          <div
                            key={feat.id || idx}
                            className="p-4 rounded-xl bg-[#131120] border border-[#272438] hover:border-[#74b6c2]/40 transition-all space-y-2 min-w-0 break-words"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#272438] pb-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-zinc-100 text-sm flex items-center gap-1.5">
                                  <span className="text-[#b19ecc]">◆</span>
                                  {feat.featEntityId && onNavigate ? (
                                    <button
                                      type="button"
                                      onClick={() => onNavigate(feat.featEntityId!)}
                                      className="hover:text-[#74b6c2] hover:underline transition-colors text-left font-bold cursor-pointer inline-flex items-center gap-1"
                                      title="Abrir página completa do talento"
                                    >
                                      <span>{feat.name}</span>
                                      <ExternalLink className="w-3 h-3 text-[#74b6c2] opacity-70" />
                                    </button>
                                  ) : (
                                    <span>{feat.name}</span>
                                  )}
                                </span>
                                {(() => {
                                  const eff = HecosStorage.getEffectiveItemPermission(feat);
                                  if (isActualGm && eff.visibility && eff.visibility !== 'all') {
                                    return (
                                      <span
                                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded border font-mono ${
                                          eff.visibility === 'gm'
                                            ? 'bg-rose-950/80 text-rose-300 border-rose-600/50'
                                            : 'bg-purple-950/80 text-purple-300 border-purple-600/50'
                                        }`}
                                      >
                                        {eff.visibility === 'gm' ? 'Apenas GM' : 'Compartilhado'}
                                      </span>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                              {feat.actions && (
                                <PF2eActionGlyph
                                  action={
                                    feat.actions === 'passive'
                                      ? 'passive'
                                      : feat.actions === 'free'
                                      ? 'free'
                                      : feat.actions === 'reaction'
                                      ? 'reaction'
                                      : (parseInt(feat.actions, 10) as 1 | 2 | 3) || 'passive'
                                  }
                                />
                              )}
                            </div>

                            {feat.traits && feat.traits.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {feat.traits.map((t, ti) => (
                                  <span
                                    key={ti}
                                    className="text-[10px] px-1.5 py-0.5 rounded bg-[#18262b] text-[#74b6c2] border border-[#2d3a42] font-mono"
                                  >
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}

                            {feat.prerequisites && (
                              <p className="text-xs text-[#cfb284] font-mono">
                                <strong>Pré-requisitos:</strong> {feat.prerequisites}
                              </p>
                            )}

                            <div className="text-xs sm:text-sm text-zinc-300 leading-relaxed min-w-0 break-words">
                              <RichContentRenderer content={feat.description} onNavigate={onNavigate} />
                            </div>
                          </div>
                        ))}
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
              <h3 className="text-lg font-black text-[#74b6c2] flex items-center gap-2.5 font-serif">
                <Compass className="w-4 h-4 text-[#74b6c2]" />
                <span>Identidade, Psicologia & Mentalidade</span>
              </h3>
              {isActualGm && onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit('lore')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-cyan-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Editar Identidade</span>
                </button>
              )}
            </div>

            <div className="space-y-4 text-sm text-zinc-300 leading-relaxed">
              {data.identity?.narrativeHook && (
                <div className="p-4 rounded-xl bg-[#18262b] border border-[#2d3a42] text-[#88c5d0] font-medium italic min-w-0 break-words">
                  "{data.identity.narrativeHook}"
                </div>
              )}

              {data.identity?.psychologyAndPhilosophy && (
                <div className="space-y-1 min-w-0 break-words">
                  <h4 className="text-xs font-bold text-[#74b6c2] uppercase font-mono">
                    Psicologia e Filosofia
                  </h4>
                  <RichContentRenderer content={data.identity.psychologyAndPhilosophy} onNavigate={onNavigate} />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.identity?.creationMyth && (
                  <div className="p-3 rounded-xl bg-[#131120] border border-[#272438] min-w-0 break-words">
                    <h4 className="text-xs font-bold text-[#74b6c2] uppercase font-mono mb-1">
                      Mito da Criação
                    </h4>
                    <RichContentRenderer content={data.identity.creationMyth} onNavigate={onNavigate} />
                  </div>
                )}

                {data.identity?.epicsAndFigures && (
                  <div className="p-3 rounded-xl bg-[#131120] border border-[#272438] min-w-0 break-words">
                    <h4 className="text-xs font-bold text-[#74b6c2] uppercase font-mono mb-1">
                      Épicos e Figuras Históricas
                    </h4>
                    <RichContentRenderer content={data.identity.epicsAndFigures} onNavigate={onNavigate} />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.identity?.purpose && (
                  <div className="p-3 rounded-xl bg-[#131120] border border-[#272438] min-w-0 break-words">
                    <h4 className="text-xs font-bold text-[#74b6c2] uppercase font-mono mb-1">
                      Propósito Existencial
                    </h4>
                    <RichContentRenderer content={data.identity.purpose} onNavigate={onNavigate} />
                  </div>
                )}

                {data.identity?.theAdventurer && (
                  <div className="p-3 rounded-xl bg-[#131120] border border-[#272438] min-w-0 break-words">
                    <h4 className="text-xs font-bold text-[#74b6c2] uppercase font-mono mb-1">
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
              <h3 className="text-lg font-black text-[#b19ecc] flex items-center gap-2.5 font-serif">
                <Feather className="w-4 h-4 text-[#b19ecc]" />
                <span>Cultura, Tradições & Cotidiano</span>
              </h3>
              {isActualGm && onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit('lore')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-purple-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Editar Cultura</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-zinc-300 leading-relaxed">
              {data.culture?.etiquetteAndCustoms && (
                <div className="p-3 rounded-xl bg-[#131120] border border-[#272438] min-w-0 break-words">
                  <h4 className="text-xs font-bold text-[#b19ecc] uppercase font-mono mb-1">
                    Etiqueta e Costumes
                  </h4>
                  <RichContentRenderer content={data.culture.etiquetteAndCustoms} onNavigate={onNavigate} />
                </div>
              )}

              {data.culture?.namesAndMeanings && (
                <div className="p-3 rounded-xl bg-[#131120] border border-[#272438] min-w-0 break-words">
                  <h4 className="text-xs font-bold text-[#b19ecc] uppercase font-mono mb-1">
                    Nomes e Significados
                  </h4>
                  <RichContentRenderer content={data.culture.namesAndMeanings} onNavigate={onNavigate} />
                </div>
              )}

              {data.culture?.clothingAndFashion && (
                <div className="p-3 rounded-xl bg-[#131120] border border-[#272438] min-w-0 break-words">
                  <h4 className="text-xs font-bold text-[#b19ecc] uppercase font-mono mb-1">
                    Vestimenta e Estética
                  </h4>
                  <RichContentRenderer content={data.culture.clothingAndFashion} onNavigate={onNavigate} />
                </div>
              )}

              {data.culture?.artisticExpressions && (
                <div className="p-3 rounded-xl bg-[#131120] border border-[#272438] min-w-0 break-words">
                  <h4 className="text-xs font-bold text-[#b19ecc] uppercase font-mono mb-1">
                    Expressões Artísticas
                  </h4>
                  <RichContentRenderer content={data.culture.artisticExpressions} onNavigate={onNavigate} />
                </div>
              )}

              {data.culture?.gastronomy && (
                <div className="p-3 rounded-xl bg-[#131120] border border-[#272438] min-w-0 break-words">
                  <h4 className="text-xs font-bold text-[#b19ecc] uppercase font-mono mb-1">
                    Gastronomia Tradicional
                  </h4>
                  <RichContentRenderer content={data.culture.gastronomy} onNavigate={onNavigate} />
                </div>
              )}

              {data.culture?.leisureAndSports && (
                <div className="p-3 rounded-xl bg-[#131120] border border-[#272438] min-w-0 break-words">
                  <h4 className="text-xs font-bold text-[#b19ecc] uppercase font-mono mb-1">
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
              <h3 className="text-lg font-black text-[#74b6c2] flex items-center gap-2.5 font-serif">
                <Users className="w-4 h-4 text-[#74b6c2]" />
                <span>Sociedade, Política & Economia</span>
              </h3>
              {isActualGm && onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit('lore')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-cyan-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Editar Sociedade</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-zinc-300 leading-relaxed">
              {data.society?.socialStructure && (
                <div className="p-3 rounded-xl bg-[#131120] border border-[#272438] min-w-0 break-words">
                  <h4 className="text-xs font-bold text-[#74b6c2] uppercase font-mono mb-1">
                    Estrutura Social
                  </h4>
                  <RichContentRenderer content={data.society.socialStructure} onNavigate={onNavigate} />
                </div>
              )}

              {data.society?.lawsAndTaboos && (
                <div className="p-3 rounded-xl bg-[#131120] border border-[#272438] min-w-0 break-words">
                  <h4 className="text-xs font-bold text-[#74b6c2] uppercase font-mono mb-1">
                    Leis, Justiça e Tabus
                  </h4>
                  <RichContentRenderer content={data.society.lawsAndTaboos} onNavigate={onNavigate} />
                </div>
              )}

              {data.society?.economyAndTrade && (
                <div className="p-3 rounded-xl bg-[#131120] border border-[#272438] min-w-0 break-words">
                  <h4 className="text-xs font-bold text-[#74b6c2] uppercase font-mono mb-1">
                    Economia e Comércio
                  </h4>
                  <RichContentRenderer content={data.society.economyAndTrade} onNavigate={onNavigate} />
                </div>
              )}

              {data.society?.educationAndRites && (
                <div className="p-3 rounded-xl bg-[#131120] border border-[#272438] min-w-0 break-words">
                  <h4 className="text-xs font-bold text-[#74b6c2] uppercase font-mono mb-1">
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
              <h3 className="text-lg font-black text-[#b19ecc] flex items-center gap-2.5 font-serif">
                <Globe className="w-4 h-4 text-[#b19ecc]" />
                <span>Espiritualidade & Relações no Mundo</span>
              </h3>
              {isActualGm && onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit('lore')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-purple-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Editar Relações</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-zinc-300 leading-relaxed">
              {data.spirituality?.nativePantheon && (
                <div className="p-3 rounded-xl bg-[#131120] border border-[#272438] min-w-0 break-words">
                  <h4 className="text-xs font-bold text-[#b19ecc] uppercase font-mono mb-1">
                    Panteão e Divindades Nativas
                  </h4>
                  <RichContentRenderer content={data.spirituality.nativePantheon} onNavigate={onNavigate} />
                </div>
              )}

              {data.spirituality?.funeraryPractices && (
                <div className="p-3 rounded-xl bg-[#131120] border border-[#272438] min-w-0 break-words">
                  <h4 className="text-xs font-bold text-[#b19ecc] uppercase font-mono mb-1">
                    Práticas Funerárias e Pós-Vida
                  </h4>
                  <RichContentRenderer content={data.spirituality.funeraryPractices} onNavigate={onNavigate} />
                </div>
              )}

              {data.world?.geographicalDistribution && (
                <div className="p-3 rounded-xl bg-[#131120] border border-[#272438] min-w-0 break-words">
                  <h4 className="text-xs font-bold text-[#74b6c2] uppercase font-mono mb-1">
                    Distribuição Geográfica em Hecos
                  </h4>
                  <RichContentRenderer content={data.world.geographicalDistribution} onNavigate={onNavigate} />
                </div>
              )}

              {data.world?.diplomaticRelations && (
                <div className="p-3 rounded-xl bg-[#131120] border border-[#272438] min-w-0 break-words">
                  <h4 className="text-xs font-bold text-[#74b6c2] uppercase font-mono mb-1">
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
    </div>
  );
};
