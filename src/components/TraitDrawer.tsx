import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Sparkles,
  BookOpen,
  Dna,
  Swords,
  Award,
  Wand2,
  Gem,
  Skull,
  Shield,
  Search,
  ExternalLink,
  Lock,
  Eye,
  Sliders,
  Check,
  Edit3,
  Layers,
  ArrowRight
} from 'lucide-react';
import { HecosEntity, ItemVisibility } from '../types';
import { HecosStorage } from '../services/storage';
import { EntityIcon } from './EntityIcon';
import { getCategoryMeta } from '../utils/categories';
import { TRAIT_CATEGORIES } from './TraitModal';
import { getTraitInfo, extractEntityAllTraits } from '../utils/traitUtils';

import { DrawerBreadcrumb } from '../types';
import { DrawerStackHeader } from './DrawerStackHeader';

interface TraitDrawerProps {
  trait: string | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (entityId: string) => void;
  isGmMode?: boolean;
  stackIndex?: number;
  stackTotal?: number;
  stackBreadcrumbs?: DrawerBreadcrumb[];
  onJumpToStackIndex?: (index: number) => void;
  onCloseAll?: () => void;
}

export const TraitDrawer: React.FC<TraitDrawerProps> = ({
  trait,
  isOpen,
  onClose,
  onNavigate,
  isGmMode = false,
  stackIndex = 0,
  stackTotal = 1,
  stackBreadcrumbs = [],
  onJumpToStackIndex,
  onCloseAll,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [isEditingCustomTrait, setIsEditingCustomTrait] = useState(false);
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [version, setVersion] = useState(0);

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

  useEffect(() => {
    const handleUpdate = () => setVersion((v) => v + 1);
    const unsub = HecosStorage.subscribeTraits(() => setVersion((v) => v + 1));
    window.addEventListener('hecos:traits-updated', handleUpdate);
    return () => {
      unsub();
      window.removeEventListener('hecos:traits-updated', handleUpdate);
    };
  }, []);

  const currentUser = HecosStorage.getCurrentUser();
  const effectiveIsGm = isGmMode || currentUser?.role === 'gm' || HecosStorage.getGmMode();

  const cleanTrait = trait ? trait.trim() : '';
  const normalizedKey = cleanTrait.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const traitInfo = useMemo(() => getTraitInfo(cleanTrait), [cleanTrait, version]);

  // Find all accessible entities that have this trait
  const matchingEntities = useMemo(() => {
    if (!cleanTrait) return [];
    const all = HecosStorage.getEntities();

    return all.filter((e) => {
      // 1. Permission Check (Strictly respect GM vs Player visibility)
      const hasAccess = HecosStorage.canUserAccess(
        e.visibility,
        e.allowedUserIds,
        currentUser,
        !e.isSecret
      );
      if (!hasAccess && !effectiveIsGm) return false;

      // 2. Trait matching across all possible trait containers
      const entityTraits = extractEntityAllTraits(e);

      // Check tags as secondary trait match
      if (e.tags && Array.isArray(e.tags)) {
        entityTraits.push(...e.tags);
      }

      // Normalized search match
      const target = cleanTrait.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return entityTraits.some((t) => {
        const norm = String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        return norm === target || norm.includes(target);
      });
    });
  }, [cleanTrait, currentUser, effectiveIsGm]);

  // Filtered by search within drawer
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
    setEditDescription(traitInfo.description);
    setEditCategory(traitInfo.category);
    setIsEditingCustomTrait(true);
  };

  const handleSaveCustomTrait = () => {
    if (!cleanTrait) return;
    HecosStorage.saveCustomTrait(cleanTrait, {
      category: editCategory.trim() || 'Mecânica Personalizada',
      description: editDescription.trim() || 'Sem descrição.',
      color: traitInfo.color || 'border-cyan-700 bg-cyan-950 text-cyan-300'
    });
    setIsEditingCustomTrait(false);
    setVersion((v) => v + 1);
  };

  if (!isOpen || !trait) return null;

  const zIndexVal = 50 + stackIndex * 10;

  const handleEntityClick = (entityId: string) => {
    window.dispatchEvent(
      new CustomEvent('hecos:open-entity-drawer', {
        detail: { entityId },
      })
    );
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 overflow-hidden flex justify-end"
        style={{ zIndex: zIndexVal }}
        id={`hecos-trait-drawer-layer-${stackIndex}`}
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

        {/* Drawer Panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className={`relative w-full max-w-xl bg-[#0b0814] border-l border-zinc-800 shadow-2xl z-10 flex flex-col h-full overflow-hidden ${
            stackIndex > 0 ? 'ring-1 ring-amber-500/30' : ''
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
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-amber-950/80 text-amber-300 border border-amber-800/80">
                  {traitInfo.category}
                </span>
                <span className="text-[11px] text-zinc-400 font-mono">
                  {matchingEntities.length} artigo{matchingEntities.length !== 1 ? 's' : ''} com este traço
                </span>
              </div>

              <h2 className="text-2xl font-black text-zinc-100 tracking-tight font-serif uppercase flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-[#cca862]" />
                <span className="text-[#cca862] drop-shadow-[0_0_12px_rgba(204,168,98,0.4)]">
                  {cleanTrait}
                </span>
              </h2>
            </div>

            <div className="flex items-center gap-1.5">
              {effectiveIsGm && !isEditingCustomTrait && (
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-amber-300 border border-zinc-800 transition-colors cursor-pointer"
                  title="Editar Descrição do Traço (GM)"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 border border-zinc-800 transition-colors cursor-pointer"
                title="Fechar (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Trait Definition / Description Box */}
          <div className="p-4 bg-[#140f24]/80 border-b border-zinc-800/80">
            {isEditingCustomTrait ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-300 uppercase">Categoria do Traço</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-black/70 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    {TRAIT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-300 uppercase">Regra / Descrição Mecânica</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 text-xs bg-black/70 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:border-amber-400 resize-none"
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingCustomTrait(false)}
                    className="px-3 py-1 text-xs rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCustomTrait}
                    className="px-4 py-1 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Salvar Traço
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
                {traitInfo.description}
              </p>
            )}
          </div>

          {/* Filter & Search Bar */}
          <div className="p-3 border-b border-zinc-800/80 bg-[#0e0a17] space-y-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Filtrar artigos com o traço ${cleanTrait}...`}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-black/60 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedCategoryFilter('all')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg shrink-0 transition-colors cursor-pointer ${
                  selectedCategoryFilter === 'all'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/80'
                    : 'bg-black/40 text-zinc-400 hover:bg-zinc-800 border border-zinc-800'
                }`}
              >
                Todos ({matchingEntities.length})
              </button>

              {categoriesPresent.map(({ category, count, meta }) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategoryFilter(category)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg shrink-0 transition-colors flex items-center gap-1 cursor-pointer ${
                    selectedCategoryFilter === category
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/80'
                      : 'bg-black/40 text-zinc-400 hover:bg-zinc-800 border border-zinc-800'
                  }`}
                >
                  <EntityIcon category={category} className="w-3 h-3" />
                  <span>{meta.name}</span>
                  <span className="opacity-70 text-[10px]">({count})</span>
                </button>
              ))}
            </div>
          </div>

          {/* List of Matching Articles */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar bg-[#090710]">
            {filteredEntities.length === 0 ? (
              <div className="text-center py-16 px-4 space-y-2">
                <BookOpen className="w-8 h-8 text-zinc-600 mx-auto" />
                <p className="text-xs text-zinc-400 font-medium">
                  {matchingEntities.length === 0
                    ? `Nenhum artigo acessível com o traço "${cleanTrait}" foi encontrado.`
                    : 'Nenhum resultado corresponde à busca ou filtro de categoria.'}
                </p>
                {!effectiveIsGm && (
                  <p className="text-[11px] text-zinc-500">
                    Artigos marcados como confidenciais (GM) permanecem ocultos conforme as permissões.
                  </p>
                )}
              </div>
            ) : (
              filteredEntities.map((ent) => {
                const meta = getCategoryMeta(ent.category);
                const isSecret = ent.visibility === 'gm' || (ent.isSecret && ent.visibility !== 'all');

                return (
                  <div
                    key={ent.id}
                    className="group flex items-center justify-between p-3 rounded-xl bg-[#110e1c] hover:bg-[#181326] border border-zinc-800/80 hover:border-cyan-500/50 transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Icon */}
                      <div className="w-9 h-9 rounded-xl bg-[#1a1429] border border-zinc-700/60 flex items-center justify-center text-cyan-300 shrink-0">
                        <EntityIcon
                          icon={ent.icon}
                          category={ent.category}
                          className="w-4 h-4"
                        />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleEntityClick(ent.id)}
                            className="text-left font-bold text-sm text-zinc-100 hover:text-cyan-300 transition-colors line-clamp-1 cursor-pointer hover:drop-shadow-[0_0_10px_rgba(6,182,212,0.8)] focus:outline-none"
                            title={`Abrir artigo ${ent.title} em painel sobreposto`}
                          >
                            <span className="hover:underline decoration-cyan-400/70 decoration-2 underline-offset-2">
                              {ent.title}
                            </span>
                          </button>

                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/60 border border-zinc-800 text-zinc-400 font-mono">
                            {meta.name}
                          </span>

                          {isSecret && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800 font-mono flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" /> GM
                            </span>
                          )}
                        </div>

                        {ent.subtitle && (
                          <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">
                            {ent.subtitle}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Open Button */}
                    <button
                      type="button"
                      onClick={() => handleEntityClick(ent.id)}
                      className="ml-3 p-2 rounded-lg bg-black/40 hover:bg-cyan-950 text-zinc-400 hover:text-cyan-300 border border-zinc-800 hover:border-cyan-700 transition-all shrink-0 cursor-pointer"
                      title="Abrir Artigo em Painel Sobreposto"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
