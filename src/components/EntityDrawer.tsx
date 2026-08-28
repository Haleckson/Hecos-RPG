import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ExternalLink,
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  Sparkles,
  BookOpen,
  User,
  Users,
  Compass,
  Gem,
  Skull,
  Lock,
  Eye,
  EyeOff,
  Edit3,
  Layers,
  ChevronRight,
  Shield,
  Heart,
  Zap,
  Coins,
  Clock,
  Tag as TagIcon
} from 'lucide-react';
import { HecosEntity } from '../types';
import { HecosStorage } from '../services/storage';
import { EntityIcon } from './EntityIcon';
import { getCategoryMeta } from '../utils/categories';
import { RichContentRenderer } from './RichContentRenderer';
import { TraitBadge } from './TraitBadge';
import { AdjustableImage } from './AdjustableImage';
import { PF2eActionGlyph, ActionGlyphType } from './PF2eActionGlyph';

// Specialized views for rich entities
import { AncestryView } from './AncestryView';
import { FeatView } from './FeatView';
import { PerilView } from './PerilView';
import { ClassView } from './ClassView';
import { SpellView } from './SpellView';
import { ItemView } from './ItemView';

interface EntityDrawerProps {
  entityId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToPage: (entityId: string) => void;
  onEditEntity?: (entityId: string) => void;
  isGmMode?: boolean;
}

export const EntityDrawer: React.FC<EntityDrawerProps> = ({
  entityId,
  isOpen,
  onClose,
  onNavigateToPage,
  onEditEntity,
  isGmMode = false,
}) => {
  // Navigation history inside drawer so user can explore @mentions without leaving drawer
  const [history, setHistory] = useState<string[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(entityId);

  // Sync with prop change
  useEffect(() => {
    if (isOpen && entityId) {
      setCurrentId(entityId);
      setHistory([]);
    }
  }, [isOpen, entityId]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background body scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Listen to hecos:open-entity-drawer events while drawer is open
  useEffect(() => {
    const handleOpenEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ entityId?: string; slug?: string; id?: string }>;
      const targetId = customEvent.detail?.entityId || customEvent.detail?.slug || customEvent.detail?.id;
      if (targetId && targetId !== currentId) {
        if (currentId) {
          setHistory((prev) => [...prev, currentId]);
        }
        setCurrentId(targetId);
      }
    };
    window.addEventListener('hecos:open-entity-drawer', handleOpenEvent);
    return () => window.removeEventListener('hecos:open-entity-drawer', handleOpenEvent);
  }, [currentId]);

  const allEntities = HecosStorage.getEntities();
  
  // Find current entity (by id, slug or title)
  const currentEntity = useMemo(() => {
    if (!currentId) return null;
    const clean = currentId.toLowerCase().trim();
    return (
      allEntities.find(
        (e) =>
          e.id.toLowerCase() === clean ||
          (e.slug && e.slug.toLowerCase() === clean) ||
          e.title.toLowerCase() === clean
      ) || null
    );
  }, [currentId, allEntities]);

  // Internal navigation inside the drawer
  const handleInternalNavigate = (targetId: string) => {
    if (currentId && targetId !== currentId) {
      setHistory((prev) => [...prev, currentId]);
      setCurrentId(targetId);
    }
  };

  // Step back in drawer history
  const handleGoBack = () => {
    if (history.length > 0) {
      const prevId = history[history.length - 1];
      setHistory((prev) => prev.slice(0, prev.length - 1));
      setCurrentId(prevId);
    }
  };

  // Tag & Trait drawer triggers
  const handleTagClick = (tag: string) => {
    window.dispatchEvent(new CustomEvent('hecos:open-tag-drawer', { detail: { tag } }));
  };

  // Full page navigation: closes drawer and redirects the user
  const handleOpenFullPage = () => {
    if (currentEntity) {
      onClose();
      onNavigateToPage(currentEntity.id);
    }
  };

  if (!isOpen) return null;

  const isActualGm = isGmMode || HecosStorage.isUserGm();

  const isCiano = currentEntity ? ['pc', 'spell', 'ancestry', 'rule'].includes(currentEntity.category) : false;
  const isMalva = currentEntity ? ['npc', 'item', 'flora', 'class', 'feat', 'timeline'].includes(currentEntity.category) : false;
  const isBordo = currentEntity ? ['creature', 'fauna', 'organization', 'gm_note', 'archetype', 'session'].includes(currentEntity.category) : false;

  // Backlinks for current entity
  const backlinks = currentEntity
    ? allEntities.filter((other) => {
        if (other.id === currentEntity.id) return false;
        const cleanSlug = currentEntity.slug || currentEntity.id;
        return (
          other.content.includes(`@${cleanSlug}`) ||
          other.content.includes(`@${currentEntity.id}`) ||
          other.content.includes(`[[${currentEntity.title}]]`)
        );
      })
    : [];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden pointer-events-auto" id="hecos-entity-drawer-container">
        {/* Soft Dimmed Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        />

        {/* Slide-over Right Drawer Container */}
        <div className="fixed inset-y-0 right-0 max-w-full flex pl-4 sm:pl-10">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className={`w-screen ${
              currentEntity?.category === 'peril' || currentEntity?.category === 'creature' || currentEntity?.perilData
                ? 'max-w-[90vw] md:max-w-[90vw] lg:max-w-[90vw]'
                : 'max-w-2xl lg:max-w-3xl xl:max-w-4xl'
            } bg-[#09080e] border-l border-zinc-800 shadow-2xl flex flex-col h-full overflow-hidden text-zinc-100 relative`}
          >
            {/* 1. Header Toolbar */}
            <div className="px-5 py-3.5 bg-[#100d1b] border-b border-zinc-800/90 flex items-center justify-between gap-3 shrink-0 z-30 shadow-md">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {/* Back Button for Internal Drawer Navigation */}
                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={handleGoBack}
                    className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white transition-colors flex items-center gap-1 text-xs font-semibold shrink-0 cursor-pointer shadow-sm"
                    title="Voltar ao artigo anterior no painel lateral"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Voltar</span>
                  </button>
                )}

                {currentEntity && (
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded border shrink-0 flex items-center gap-1 ${
                        isCiano
                          ? 'bg-cyan-950/80 text-cyan-300 border-cyan-700/60'
                          : isMalva
                          ? 'bg-purple-950/80 text-purple-300 border-purple-700/60'
                          : 'bg-rose-950/80 text-rose-300 border-rose-700/60'
                      }`}
                    >
                      <EntityIcon icon={currentEntity.icon} category={currentEntity.category} className="w-3 h-3" />
                      <span>{getCategoryMeta(currentEntity.category).name}</span>
                    </span>

                    {/* CLICKABLE TITLE ON TOP OF DRAWER: Primary request of user! */}
                    <button
                      type="button"
                      onClick={handleOpenFullPage}
                      className="group/title flex items-center gap-1.5 min-w-0 text-left cursor-pointer transition-all truncate hover:opacity-90"
                      title="Clique no título para abrir a página completa deste artigo no Codex de Hecos"
                    >
                      <h3 className="text-sm sm:text-base font-serif font-bold text-zinc-100 group-hover/title:text-cyan-300 group-hover/title:underline underline-offset-4 decoration-cyan-400 transition-colors truncate">
                        {currentEntity.title}
                      </h3>
                      <ExternalLink className="w-3.5 h-3.5 text-cyan-400 opacity-60 group-hover/title:opacity-100 group-hover/title:scale-110 transition-all shrink-0 ml-0.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Button to navigate to full page */}
                {currentEntity && (
                  <button
                    type="button"
                    onClick={handleOpenFullPage}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-200 text-xs font-bold transition-all shadow-sm cursor-pointer hover:shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                    title="Abrir página completa no Codex de Hecos"
                  >
                    <span>Ir para Artigo</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Edit Shortcut (if GM) */}
                {isActualGm && currentEntity && onEditEntity && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onEditEntity(currentEntity.id);
                    }}
                    className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-cyan-300 transition-colors cursor-pointer"
                    title="Editar este artigo"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}

                {/* Close Button */}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-xl bg-zinc-900/80 hover:bg-rose-950/80 border border-zinc-800 hover:border-rose-700/60 text-zinc-400 hover:text-rose-200 transition-all cursor-pointer"
                  title="Fechar painel lateral (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 2. Scrollable Body with Full Article Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
              {!currentEntity ? (
                <div className="text-center py-16 text-zinc-400 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 mx-auto flex items-center justify-center text-zinc-500">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <p className="text-sm">Artigo não encontrado ou excluído.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Specialized Views for Ancestry, Feat, Peril, Class, and Spell */}
                  {currentEntity.category === 'ancestry' ? (
                    <div className="rounded-2xl overflow-hidden bg-[#0c0a14] border border-zinc-800/90 shadow-xl">
                      <AncestryView
                        entity={currentEntity}
                        onEdit={() => onEditEntity?.(currentEntity.id)}
                        onNavigate={handleInternalNavigate}
                        onTagClick={handleTagClick}
                      />
                    </div>
                  ) : currentEntity.category === 'feat' ? (
                    <div className="rounded-2xl overflow-hidden bg-[#0c0a14] border border-zinc-800/90 shadow-xl p-4 sm:p-6">
                      <FeatView
                        entity={currentEntity}
                        onEdit={() => onEditEntity?.(currentEntity.id)}
                        onDelete={() => {}}
                        onNavigate={handleInternalNavigate}
                        onTagClick={handleTagClick}
                      />
                    </div>
                  ) : currentEntity.category === 'creature' || currentEntity.category === 'peril' || currentEntity.perilData ? (
                    <div className="rounded-2xl overflow-hidden bg-[#0c0a14] border border-zinc-800/90 shadow-xl">
                      <PerilView
                        entity={currentEntity}
                        onEdit={() => onEditEntity?.(currentEntity.id)}
                        onNavigate={handleInternalNavigate}
                        onTagClick={handleTagClick}
                      />
                    </div>
                  ) : currentEntity.category === 'class' || currentEntity.category === 'archetype' || currentEntity.classData ? (
                    <div className="rounded-2xl overflow-hidden bg-[#0c0a14] border border-zinc-800/90 shadow-xl">
                      <ClassView
                        entity={currentEntity}
                        onEdit={() => onEditEntity?.(currentEntity.id)}
                        onNavigate={handleInternalNavigate}
                        onTagClick={handleTagClick}
                      />
                    </div>
                  ) : currentEntity.category === 'spell' || currentEntity.spellData ? (
                    <div className="rounded-2xl overflow-hidden bg-[#0c0a14] border border-zinc-800/90 shadow-xl p-4 sm:p-6">
                      <SpellView
                        entity={currentEntity}
                        onEdit={() => onEditEntity?.(currentEntity.id)}
                        onDelete={() => {}}
                        onNavigate={handleInternalNavigate}
                        onTagClick={handleTagClick}
                      />
                    </div>
                  ) : currentEntity.category === 'item' || currentEntity.itemData ? (
                    <div className="rounded-2xl overflow-hidden bg-[#0c0a14] border border-zinc-800/90 shadow-xl p-4 sm:p-6">
                      <ItemView
                        entity={currentEntity}
                        onEdit={() => onEditEntity?.(currentEntity.id)}
                        onDelete={() => {}}
                        onNavigate={handleInternalNavigate}
                        onTagClick={handleTagClick}
                      />
                    </div>
                  ) : (
                    /* Robust General Entity View Layout for all other categories (Lore, Item, NPC, PC, Fauna, Flora, Location, Faction, Rule, Session, etc.) */
                    <div className="space-y-6">
                      {/* Banner / Cover Header */}
                      <div className="relative rounded-2xl overflow-hidden bg-[#120e20] border border-zinc-800/80 shadow-lg">
                        {currentEntity.coverImage ? (
                          <div className="h-48 sm:h-56 w-full overflow-hidden relative">
                            <AdjustableImage
                              src={currentEntity.coverImage}
                              alt={currentEntity.title}
                              imageKey={`drawer-cover-${currentEntity.id}`}
                              isGm={false}
                              containerClassName="relative w-full h-full"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#09080e] via-[#09080e]/60 to-transparent pointer-events-none" />
                          </div>
                        ) : (
                          <div className="h-28 sm:h-32 w-full bg-[radial-gradient(circle_at_20%_50%,rgba(184,119,219,0.15),transparent_70%),radial-gradient(circle_at_80%_50%,rgba(0,240,255,0.12),transparent_70%)] relative flex items-center px-6">
                            <div className="absolute inset-0 bg-gradient-to-t from-[#09080e] to-transparent pointer-events-none" />
                          </div>
                        )}

                        <div className="p-5 relative z-10 -mt-10 sm:-mt-12">
                          <div className="flex items-start gap-3.5">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#171126] border-2 border-zinc-700/80 flex items-center justify-center shadow-xl shrink-0">
                              <EntityIcon icon={currentEntity.icon} category={currentEntity.category} className="w-6 h-6 text-cyan-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span
                                  className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded border ${
                                    isCiano
                                      ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                                      : isMalva
                                      ? 'bg-purple-950 text-purple-300 border-purple-800'
                                      : 'bg-rose-950 text-rose-300 border-rose-800'
                                  }`}
                                >
                                  {currentEntity.category.toUpperCase()}
                                </span>

                                {currentEntity.statblock && (
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800">
                                    Nível {currentEntity.statblock.level}
                                  </span>
                                )}

                                {currentEntity.isSecret ? (
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-700 flex items-center gap-1 font-mono">
                                    <EyeOff className="w-3 h-3 text-zinc-400" /> CONFIDENCIAL GM
                                  </span>
                                ) : (
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-700/50 flex items-center gap-1 font-mono">
                                    <Eye className="w-3 h-3 text-amber-400" /> PÚBLICO
                                  </span>
                                )}
                              </div>

                              {/* Big Clickable Title in Drawer Content */}
                              <button
                                type="button"
                                onClick={handleOpenFullPage}
                                className="group/main-title text-left block w-full cursor-pointer"
                                title="Clique para abrir a página completa deste artigo"
                              >
                                <h2 className="text-xl sm:text-2xl font-bold font-serif text-white group-hover/main-title:text-cyan-300 transition-colors flex items-center gap-2">
                                  <span>{currentEntity.title}</span>
                                  <ExternalLink className="w-4 h-4 text-cyan-400 opacity-60 group-hover/main-title:opacity-100 transition-opacity shrink-0" />
                                </h2>
                              </button>

                              {currentEntity.subtitle && (
                                <p className="text-xs sm:text-sm text-zinc-300 mt-1 font-medium italic">
                                  {currentEntity.subtitle}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Traits & Tags Bar */}
                          {((currentEntity.traits || []).length > 0 || (currentEntity.tags || []).length > 0) && (
                            <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-zinc-800/80">
                              {(currentEntity.traits || []).map((t) => (
                                <TraitBadge key={t} trait={t} size="sm" />
                              ))}
                              {(currentEntity.tags || []).map((t) => (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => handleTagClick(t)}
                                  className="px-2 py-0.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-cyan-300 transition-colors text-xs font-mono"
                                >
                                  #{t}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Summary Callout (if available) */}
                      {currentEntity.summary && (
                        <div className="p-4 rounded-xl bg-[#130f24] border border-purple-500/30 text-sm text-purple-100 leading-relaxed italic shadow-inner">
                          <RichContentRenderer
                            content={currentEntity.summary}
                            onNavigate={handleInternalNavigate}
                            isGmMode={isActualGm}
                          />
                        </div>
                      )}

                      {/* PF2e Statblock Quick Grid (Creature / NPC) */}
                      {currentEntity.statblock && (
                        <div className="p-4 rounded-xl bg-[#110e1f] border border-zinc-800 space-y-3">
                          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5" />
                            <span>Estatísticas de Combate PF2e</span>
                          </h4>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                            <div className="p-2 rounded-lg bg-black/50 border border-zinc-800">
                              <span className="text-[10px] font-mono text-zinc-500 block uppercase">Classe de Armadura</span>
                              <span className="text-base font-bold text-cyan-400 font-mono">{currentEntity.statblock.ac || '—'}</span>
                            </div>
                            <div className="p-2 rounded-lg bg-black/50 border border-zinc-800">
                              <span className="text-[10px] font-mono text-zinc-500 block uppercase">Pontos de Vida</span>
                              <span className="text-base font-bold text-rose-400 font-mono">{currentEntity.statblock.hp || '—'}</span>
                            </div>
                            <div className="p-2 rounded-lg bg-black/50 border border-zinc-800">
                              <span className="text-[10px] font-mono text-zinc-500 block uppercase">Velocidade</span>
                              <span className="text-base font-bold text-purple-400 font-mono">{currentEntity.statblock.speed || '25 ft'}</span>
                            </div>
                            <div className="p-2 rounded-lg bg-black/50 border border-zinc-800">
                              <span className="text-[10px] font-mono text-zinc-500 block uppercase">Percepção</span>
                              <span className="text-base font-bold text-amber-300 font-mono">+{currentEntity.statblock.perception || 0}</span>
                            </div>
                          </div>

                          {/* Saves */}
                          {currentEntity.statblock.saves && (
                            <div className="flex items-center justify-around gap-2 pt-2 border-t border-zinc-800/80 text-xs font-mono">
                              <span className="text-zinc-400">
                                Fort: <strong className="text-zinc-200">+{currentEntity.statblock.saves.fortitude || 0}</strong>
                              </span>
                              <span className="text-zinc-400">
                                Ref: <strong className="text-zinc-200">+{currentEntity.statblock.saves.reflex || 0}</strong>
                              </span>
                              <span className="text-zinc-400">
                                Vont: <strong className="text-zinc-200">+{currentEntity.statblock.saves.will || 0}</strong>
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Main Article Full Content Markdown */}
                      <div className="p-5 rounded-2xl bg-[#0e0c16] border border-zinc-800/80 shadow-md space-y-4">
                        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2 border-b border-zinc-800/80 pb-2">
                          <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Conteúdo do Artigo</span>
                        </h3>

                        <div className="prose prose-invert prose-sm max-w-none text-zinc-200 leading-relaxed font-sans">
                          <RichContentRenderer
                            content={currentEntity.content || 'Nenhum texto descritivo cadastrado.'}
                            onNavigate={handleInternalNavigate}
                            isGmMode={isActualGm}
                          />
                        </div>
                      </div>

                      {/* GM Notes Section (if GM mode) */}
                      {isActualGm && currentEntity.gmNotes && (
                        <div className="p-4 rounded-xl bg-[#170e1a] border-2 border-amber-500/70 shadow-lg space-y-2 text-xs">
                          <div className="flex items-center gap-2 text-amber-300 font-mono font-bold uppercase pb-1.5 border-b border-amber-500/30">
                            <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                            <span>Notas Secretas do Mestre (GM)</span>
                          </div>
                          <div className="text-zinc-200">
                            <RichContentRenderer
                              content={currentEntity.gmNotes}
                              onNavigate={handleInternalNavigate}
                              isGmMode={true}
                            />
                          </div>
                        </div>
                      )}

                      {/* Backlinks / Mentioned In */}
                      {backlinks.length > 0 && (
                        <div className="p-4 rounded-xl bg-[#0f0c18] border border-zinc-800 space-y-2.5">
                          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-purple-400" />
                            <span>Mencionado em ({backlinks.length} Páginas)</span>
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {backlinks.map((b) => (
                              <button
                                key={b.id}
                                type="button"
                                onClick={() => handleInternalNavigate(b.id)}
                                className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 hover:border-cyan-500/60 text-xs font-medium text-zinc-300 hover:text-cyan-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                              >
                                <EntityIcon icon={b.icon} category={b.category} className="w-3 h-3 text-cyan-400" />
                                <span>{b.title}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footer Action to open full page */}
                  <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between gap-3">
                    <span className="text-xs text-zinc-500">
                      ID: <span className="font-mono">{currentEntity.slug || currentEntity.id}</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleOpenFullPage}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-900 to-purple-900 hover:from-cyan-800 hover:to-purple-800 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer hover:shadow-cyan-500/20"
                    >
                      <span>Abrir Página Completa</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};
