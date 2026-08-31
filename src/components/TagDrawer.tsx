import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Tag as TagIcon,
  Search,
  ExternalLink,
  Lock,
  Eye,
  Sliders,
  Check,
  Edit3,
  Layers,
  ArrowRight,
  Sparkles,
  Award,
  BookOpen,
  Filter,
  Trash2,
  Edit2
} from 'lucide-react';
import { HecosEntity, ItemVisibility } from '../types';
import { HecosStorage } from '../services/storage';
import { EntityIcon } from './EntityIcon';
import { getCategoryMeta } from '../utils/categories';
import { TagModal } from './TagModal';

import { DrawerBreadcrumb } from '../types';
import { DrawerStackHeader } from './DrawerStackHeader';

interface TagDrawerProps {
  tag: string | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (entityId: string) => void;
  isGmMode?: boolean;
  onTagUpdated?: () => void;
  stackIndex?: number;
  stackTotal?: number;
  stackBreadcrumbs?: DrawerBreadcrumb[];
  onJumpToStackIndex?: (index: number) => void;
  onCloseAll?: () => void;
}

export const TagDrawer: React.FC<TagDrawerProps> = ({
  tag,
  isOpen,
  onClose,
  onNavigate,
  isGmMode = false,
  onTagUpdated,
  stackIndex = 0,
  stackTotal = 1,
  stackBreadcrumbs = [],
  onJumpToStackIndex,
  onCloseAll,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Handle ESC key only for the top-most active drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isTopDrawer = stackIndex === stackTotal - 1;
      if (e.key === 'Escape' && isOpen && isTopDrawer) {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onClose, stackIndex, stackTotal]);

  const currentUser = HecosStorage.getCurrentUser();
  const effectiveIsGm = isGmMode || currentUser?.role === 'gm' || HecosStorage.getGmMode();

  const cleanTag = tag ? tag.trim().replace(/^#/, '') : '';
  const normalizedKey = cleanTag.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const customTags = HecosStorage.getCustomTags();
  const tagInfo = customTags[normalizedKey] || {
    category: 'Campanha e Narrativa',
    description: `Tag de agrupamento temático, trama ou organização para artigos do mundo de Hecos.`,
    color: 'border-cyan-800/80 bg-cyan-950/80 text-cyan-300'
  };

  useEffect(() => {
    setIsEditingDescription(false);
    setSearchQuery('');
    setSelectedCategoryFilter('all');
  }, [tag, isOpen]);

  // Find all accessible entities that have this tag
  const matchingEntities = useMemo(() => {
    if (!cleanTag) return [];
    const all = HecosStorage.getEntities();
    const target = cleanTag.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    return all.filter((e) => {
      // 1. Permission check
      const hasAccess = HecosStorage.canUserAccess(
        e.visibility,
        e.allowedUserIds,
        currentUser,
        !e.isSecret
      );
      if (!hasAccess && !effectiveIsGm) return false;

      // 2. Tags matching
      const entityTags: string[] = [];
      if (e.tags && Array.isArray(e.tags)) {
        entityTags.push(...e.tags);
      }
      if (e.subcategory) {
        entityTags.push(e.subcategory);
      }
      if (e.subcategories && Array.isArray(e.subcategories)) {
        entityTags.push(...e.subcategories);
      }

      return entityTags.some((t) => {
        const norm = String(t).trim().replace(/^#/, '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return norm === target || norm.includes(target);
      });
    });
  }, [cleanTag, currentUser, effectiveIsGm, refreshKey]);

  // Filtered by search & category within drawer
  const filteredEntities = useMemo(() => {
    return matchingEntities.filter((e) => {
      if (selectedCategoryFilter !== 'all' && e.category !== selectedCategoryFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = e.title.toLowerCase().includes(q);
        const matchSubtitle = e.subtitle?.toLowerCase().includes(q);
        const matchSummary = e.summary?.toLowerCase().includes(q);
        return matchTitle || matchSubtitle || matchSummary;
      }
      return true;
    });
  }, [matchingEntities, selectedCategoryFilter, searchQuery]);

  // Group entities by category
  const categoriesPresent = useMemo(() => {
    const map = new Map<string, number>();
    matchingEntities.forEach((e) => {
      map.set(e.category, (map.get(e.category) || 0) + 1);
    });
    return Array.from(map.entries()).map(([cat, count]) => ({
      category: cat,
      count,
      meta: getCategoryMeta(cat as any)
    }));
  }, [matchingEntities]);

  const handleStartEdit = () => {
    setEditDescription(tagInfo.description || '');
    setEditCategory(tagInfo.category || 'Campanha e Narrativa');
    setIsEditingDescription(true);
  };

  const handleSaveCustomTag = () => {
    if (!normalizedKey) return;
    HecosStorage.saveCustomTag(cleanTag, {
      category: editCategory.trim() || 'Campanha e Narrativa',
      description: editDescription.trim() || 'Tag de organização em Hecos.',
      color: tagInfo.color || 'border-cyan-800/80 bg-cyan-950/80 text-cyan-300'
    });
    setIsEditingDescription(false);
    setRefreshKey((k) => k + 1);
    onTagUpdated?.();
  };

  if (!isOpen || !tag) return null;

  const zIndexVal = 50 + stackIndex * 10;

  const handleEntityClick = (entityId: string) => {
    window.dispatchEvent(
      new CustomEvent('hecos:open-entity-drawer', {
        detail: { entityId },
      })
    );
  };

  return (
    <>
      <AnimatePresence>
        <div
          className="fixed inset-0 overflow-hidden flex justify-end"
          style={{ zIndex: zIndexVal }}
          id={`hecos-tag-drawer-layer-${stackIndex}`}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className={`fixed inset-0 transition-opacity ${
              stackIndex > 0
                ? 'bg-black/60 backdrop-blur-[2px]'
                : 'bg-black/75 backdrop-blur-sm'
            }`}
          />

          {/* Lateral Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className={`relative w-full max-w-xl bg-[#0b0814] border-l border-zinc-800 shadow-2xl z-10 flex flex-col h-full overflow-hidden ${
              stackIndex > 0 ? 'ring-1 ring-cyan-500/30' : ''
            }`}
          >
            {/* Stack Breadcrumb Header Bar */}
            {stackTotal > 1 && (
              <DrawerStackHeader
                breadcrumbs={stackBreadcrumbs}
                currentIndex={stackIndex}
                totalDrawers={stackTotal}
                onPop={onClose}
                onJumpToIndex={onJumpToStackIndex}
                onCloseAll={onCloseAll}
              />
            )}

            {/* Header */}
            <div className="p-5 border-b border-zinc-800/90 bg-[#120d20] flex items-start justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-cyan-950/80 text-cyan-300 border border-cyan-800/80">
                    {tagInfo.category || 'Tag de Campanha'}
                  </span>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    {matchingEntities.length} artigo{matchingEntities.length !== 1 ? 's' : ''} com esta tag
                  </span>
                </div>

                <h2 className="text-2xl font-black text-cyan-300 tracking-tight font-serif flex items-center gap-2">
                  <TagIcon className="w-6 h-6 text-cyan-400 shrink-0" />
                  <span>#{cleanTag}</span>
                </h2>
              </div>

              <div className="flex items-center gap-1.5">
                {effectiveIsGm && (
                  <button
                    type="button"
                    onClick={() => setIsTagModalOpen(true)}
                    className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/70 text-zinc-300 hover:text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Renomear ou Excluir Tag Globalmente"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Gerenciar</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 transition-colors cursor-pointer"
                  title="Fechar Painel Lateral"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Description Card */}
              <div className="p-4 rounded-xl bg-[#140e24] border border-cyan-900/40 relative group">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400/80 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Descrição da Tag</span>
                  </span>
                  {effectiveIsGm && !isEditingDescription && (
                    <button
                      type="button"
                      onClick={handleStartEdit}
                      className="opacity-60 group-hover:opacity-100 hover:text-cyan-300 text-zinc-400 text-xs flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar Descrição</span>
                    </button>
                  )}
                </div>

                {isEditingDescription ? (
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="text-[10px] font-mono text-zinc-400 block mb-1">Categoria / Grupo da Tag:</label>
                      <input
                        type="text"
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-black/60 border border-zinc-700 rounded-lg text-xs text-zinc-200 outline-none focus:border-cyan-500 font-mono"
                        placeholder="Ex: Factions, Lugares, Arcos..."
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-zinc-400 block mb-1">Descrição / Notas de Lore:</label>
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={3}
                        className="w-full px-2.5 py-1.5 bg-black/60 border border-zinc-700 rounded-lg text-xs text-zinc-200 outline-none focus:border-cyan-500"
                        placeholder="Insira informações sobre como esta tag é usada na campanha..."
                      />
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingDescription(false)}
                        className="px-3 py-1 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveCustomTag}
                        className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-zinc-950 font-bold text-xs rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Salvar</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-200 leading-relaxed font-sans">
                    {tagInfo.description}
                  </p>
                )}
              </div>

              {/* Category Filter Badges */}
              {categoriesPresent.length > 1 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span className="font-mono text-[10px] uppercase font-bold text-zinc-400">Filtrar por Categoria:</span>
                    {selectedCategoryFilter !== 'all' && (
                      <button
                        type="button"
                        onClick={() => setSelectedCategoryFilter('all')}
                        className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                      >
                        Ver todas
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedCategoryFilter('all')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        selectedCategoryFilter === 'all'
                          ? 'bg-cyan-500 text-zinc-950 font-bold'
                          : 'bg-zinc-900/90 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                      }`}
                    >
                      Todos ({matchingEntities.length})
                    </button>
                    {categoriesPresent.map(({ category, count, meta }) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setSelectedCategoryFilter(category)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          selectedCategoryFilter === category
                            ? 'bg-cyan-500 text-zinc-950 font-bold'
                            : 'bg-zinc-900/90 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                        }`}
                      >
                        <span>{meta.name}</span>
                        <span className="text-[10px] opacity-75 font-mono">({count})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Inside Drawer */}
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar artigos nesta tag..."
                  className="w-full pl-9 pr-8 py-2 bg-zinc-900/90 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 outline-none focus:border-cyan-500 transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Matching Entities List */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-mono text-[10px] uppercase font-bold text-zinc-400">
                    Artigos vinculados ({filteredEntities.length}):
                  </span>
                </div>

                {filteredEntities.length === 0 ? (
                  <div className="p-8 text-center bg-black/40 rounded-xl border border-zinc-800/80 space-y-2">
                    <BookOpen className="w-8 h-8 text-zinc-600 mx-auto" />
                    <p className="text-xs text-zinc-400">
                      {searchQuery
                        ? `Nenhum artigo corresponde à busca "${searchQuery}".`
                        : `Nenhum artigo encontrado com a tag #${cleanTag}.`}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredEntities.map((ent) => {
                      const catMeta = getCategoryMeta(ent.category);
                      const perm = HecosStorage.getEntityPermission(ent.id);
                      const isGmOnly = perm.visibility === 'gm' || ent.isSecret;

                      return (
                        <div
                          key={ent.id}
                          onClick={() => handleEntityClick(ent.id)}
                          className="group p-3.5 rounded-xl bg-[#100c1d] hover:bg-[#18122c] border border-zinc-800/80 hover:border-cyan-500/50 transition-all cursor-pointer flex items-start gap-3 relative shadow-sm hover:shadow-md"
                        >
                          <div className="p-2 rounded-lg bg-black/60 border border-zinc-800 text-cyan-400 group-hover:text-cyan-300 group-hover:border-cyan-500/40 shrink-0 transition-colors">
                            <EntityIcon category={ent.category} iconName={ent.icon} className="w-4 h-4" />
                          </div>

                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-zinc-900 text-zinc-400 border border-zinc-800">
                                {catMeta.name}
                              </span>

                              {ent.statblock && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950/80 text-rose-300 border border-rose-800/60">
                                  Nv. {ent.statblock.level}
                                </span>
                              )}

                              {ent.spellData && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                                  {ent.spellData.rank === 0 ? 'Truque' : `${ent.spellData.rank}º Círculo`}
                                </span>
                              )}

                              {ent.itemData && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-800/60">
                                  Item {ent.itemData.level ?? 0}
                                </span>
                              )}

                              {isGmOnly && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950/90 text-rose-300 border border-rose-800 flex items-center gap-1">
                                  <Lock className="w-2.5 h-2.5" />
                                  <span>GM</span>
                                </span>
                              )}
                            </div>

                            <h4 className="text-sm font-bold text-zinc-100 group-hover:text-cyan-300 transition-colors truncate">
                              {ent.title}
                            </h4>

                            {ent.subtitle && (
                              <p className="text-xs text-zinc-400 truncate">
                                {ent.subtitle}
                              </p>
                            )}

                            {ent.summary && (
                              <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed pt-0.5">
                                {ent.summary}
                              </p>
                            )}
                          </div>

                          <div className="opacity-0 group-hover:opacity-100 transition-opacity self-center text-cyan-400 pr-1">
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Footer Bar */}
            <div className="p-4 border-t border-zinc-800/90 bg-[#120d20] flex items-center justify-between text-xs text-zinc-400">
              <span className="font-mono text-[11px]">Hecos Codex • Organização de Tags</span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-semibold transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Global Tag Modal for Rename/Delete */}
      {isTagModalOpen && (
        <TagModal
          isOpen={isTagModalOpen}
          onClose={() => setIsTagModalOpen(false)}
          tagName={cleanTag}
          onSuccess={() => {
            setIsTagModalOpen(false);
            setRefreshKey((k) => k + 1);
            onTagUpdated?.();
            onClose();
          }}
        />
      )}
    </>
  );
};
