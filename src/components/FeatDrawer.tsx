import React, { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Award,
  ExternalLink,
  Edit3,
  Trash2,
  Scroll,
  ArrowRight,
  Maximize2,
  ChevronRight,
  Shield,
  Layers,
  Sparkles
} from 'lucide-react';
import { HecosEntity } from '../types';
import { HecosStorage } from '../services/storage';
import { FeatView } from './FeatView';
import { Tooltip } from './Tooltip';
import { VisibilityBadgeMenu } from './VisibilityBadgeMenu';
import { parseFeatFromContent, getFeatTypeLabel } from '../utils/featSerializer';

interface FeatDrawerProps {
  featId: string | null;
  entities: HecosEntity[];
  isOpen: boolean;
  onClose: () => void;
  onNavigateFullPage: (entityId: string) => void;
  onEditFeat?: (entity: HecosEntity) => void;
  onDeleteFeat?: (entityId: string) => void;
  onTagClick?: (tag: string) => void;
  isGmMode?: boolean;
}

export const FeatDrawer: React.FC<FeatDrawerProps> = ({
  featId,
  entities,
  isOpen,
  onClose,
  onNavigateFullPage,
  onEditFeat,
  onDeleteFeat,
  onTagClick,
  isGmMode = false,
}) => {
  const currentUser = HecosStorage.getCurrentUser();
  const effectiveIsGm = isGmMode || currentUser?.role === 'gm' || HecosStorage.getGmMode();

  // Find active entity in real-time
  const activeFeat = useMemo(() => {
    if (!featId) return null;

    // 1. Direct entity match by ID or slug
    const direct =
      entities.find((e) => e.id === featId || e.slug === featId) ||
      HecosStorage.getEntityById(featId);
    if (direct) return direct;

    // 2. Search if featId matches by title (case-insensitive)
    const byTitle = entities.find(
      (e) =>
        (e.category === 'feat' || Boolean(e.featData)) &&
        e.title.toLowerCase() === featId.toLowerCase()
    );
    if (byTitle) return byTitle;

    // 3. Search embedded feats inside ancestries or other entities
    for (const ent of entities) {
      if (ent.ancestryData?.feats) {
        const rawFeats = ent.ancestryData.feats as any;
        let allAncestryFeats: any[] = [];
        if (Array.isArray(rawFeats)) {
          allAncestryFeats = rawFeats;
        } else if (typeof rawFeats === 'object' && rawFeats !== null) {
          allAncestryFeats = [
            ...(rawFeats.rank1 || []),
            ...(rawFeats.rank5 || []),
            ...(rawFeats.rank9 || []),
            ...(rawFeats.rank13 || []),
            ...(rawFeats.rank17 || []),
          ];
        }

        const found = allAncestryFeats.find(
          (f) =>
            f.id === featId ||
            f.featEntityId === featId ||
            f.slug === featId ||
            f.name?.toLowerCase() === featId.toLowerCase()
        );

        if (found) {
          // If this feat is linked to a standalone entity that exists, prefer it
          if (found.featEntityId) {
            const standalone =
              entities.find((e) => e.id === found.featEntityId) ||
              HecosStorage.getEntityById(found.featEntityId);
            if (standalone) return standalone;
          }

          // Return synthetic entity for FeatView
          return {
            id: found.featEntityId || found.id || `embedded-${found.name}`,
            title: found.name,
            category: 'feat',
            subtitle: `Talento de Ancestralidade (${ent.title})`,
            content: found.description || '',
            summary: found.description || '',
            tags: ['Ancestralidade', ent.title, ...(found.traits || [])],
            traits: found.traits && found.traits.length > 0 ? found.traits : ['Ancestralidade', ent.title],
            visibility: found.visibility || 'all',
            allowedUserIds: found.allowedUserIds,
            featData: {
              level: found.rank || 1,
              featType: 'ancestry',
              rarity: found.rarity || 'Comum',
              actionCost: found.actions || '1',
              prerequisites: found.prerequisites || '',
              description: found.description || '',
              traits: found.traits && found.traits.length > 0 ? found.traits : ['Ancestralidade', ent.title],
              subcategories: [ent.title],
            },
            createdAt: ent.createdAt || new Date().toISOString(),
            updatedAt: ent.updatedAt || new Date().toISOString(),
          } as HecosEntity;
        }
      }
    }

    return null;
  }, [featId, entities]);

  const featData = useMemo(() => {
    if (!activeFeat) return null;
    return parseFeatFromContent(
      activeFeat.title,
      activeFeat.content || '',
      activeFeat.featData
    );
  }, [activeFeat]);

  // Handle ESC key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scrolling when open
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

  const handleTagClickInternal = (tag: string) => {
    if (onTagClick) {
      onTagClick(tag);
    } else {
      window.dispatchEvent(
        new CustomEvent('hecos:open-tag-drawer', { detail: { tag } })
      );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && activeFeat && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end" id="hecos-feat-drawer-container">
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Sliding Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative z-10 w-full sm:w-[580px] md:w-[700px] lg:w-[820px] max-w-full bg-[#090710] border-l border-amber-500/30 text-zinc-100 shadow-2xl flex flex-col h-full overflow-hidden"
          >
            {/* Top Fixed Drawer Header */}
            <div className="px-5 py-3.5 bg-gradient-to-r from-[#120e1f] via-[#171228] to-[#120e1f] border-b border-zinc-800/80 flex items-center justify-between gap-3 shrink-0 shadow-md">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-300 shadow-sm shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold">
                      Nível {featData?.level ?? 1}
                    </span>
                    <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-purple-950/60 border border-purple-800/60 text-purple-300 font-bold">
                      {getFeatTypeLabel(featData?.featType || 'ancestry')}
                    </span>
                    <span className="text-xs text-zinc-400 font-mono hidden sm:inline">
                      Artigo de Talento
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-zinc-100 truncate flex items-center gap-1.5 mt-0.5">
                    <span className="truncate">{activeFeat.title}</span>
                  </h2>
                </div>
              </div>

              {/* Header Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Full Article Page Button */}
                <Tooltip
                  title="Abrir em Página Cheia"
                  description="Navegar diretamente para a página individual completa deste talento"
                >
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateFullPage(activeFeat.id);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-950/70 hover:bg-amber-900 border border-amber-500/40 hover:border-amber-400 text-amber-300 hover:text-amber-100 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">Página Completa</span>
                  </button>
                </Tooltip>

                {/* Edit Feat Button (GM Only) */}
                {effectiveIsGm && onEditFeat && (
                  <Tooltip
                    title="Editar Talento"
                    description="Modificar dados, estatísticas e descrição deste talento"
                  >
                    <button
                      type="button"
                      onClick={() => onEditFeat(activeFeat)}
                      className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 hover:border-amber-500/50 text-zinc-300 hover:text-amber-300 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </Tooltip>
                )}

                {/* Visibility Controls for GM */}
                {effectiveIsGm && (
                  <div className="hidden sm:block">
                    <VisibilityBadgeMenu
                      visibility={activeFeat.visibility}
                      allowedUserIds={activeFeat.allowedUserIds}
                      isSecret={activeFeat.isSecret}
                      onChange={(newVis, newAllowed) => {
                        HecosStorage.setEntityVisibility(activeFeat.id, newVis, newAllowed);
                      }}
                    />
                  </div>
                )}

                {/* Close Button */}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-colors cursor-pointer ml-1"
                  title="Fechar Painel (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Drawer Body with Full FeatView Formatting */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-7 space-y-6">
              <FeatView
                entity={activeFeat}
                onEdit={() => onEditFeat?.(activeFeat)}
                onDelete={() => {
                  if (onDeleteFeat) {
                    onDeleteFeat(activeFeat.id);
                    onClose();
                  }
                }}
                onNavigate={(navId) => {
                  onClose();
                  onNavigateFullPage(navId);
                }}
                onTagClick={handleTagClickInternal}
              />
            </div>

            {/* Bottom Drawer Footer */}
            <div className="px-5 py-3 bg-[#0c0915] border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-zinc-500">
                  {activeFeat.updatedAt
                    ? `Atualizado em ${new Date(activeFeat.updatedAt).toLocaleDateString('pt-BR')}`
                    : 'Artigo Hecos PF2e'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateFullPage(activeFeat.id);
                  }}
                  className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <span>Ir para página do talento</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
