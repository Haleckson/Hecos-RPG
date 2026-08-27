import React, { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Sparkles,
  ExternalLink,
  Edit3,
  Trash2,
  Scroll,
  ArrowRight,
  Maximize2,
  ChevronRight,
  Shield,
  Layers
} from 'lucide-react';
import { HecosEntity } from '../types';
import { HecosStorage } from '../services/storage';
import { SpellView } from './SpellView';
import { Tooltip } from './Tooltip';
import { VisibilityBadgeMenu } from './VisibilityBadgeMenu';

interface SpellDrawerProps {
  spellId: string | null;
  entities: HecosEntity[];
  isOpen: boolean;
  onClose: () => void;
  onNavigateFullPage: (entityId: string) => void;
  onEditSpell?: (entity: HecosEntity) => void;
  onDeleteSpell?: (entityId: string) => void;
  onTagClick?: (tag: string) => void;
  isGmMode?: boolean;
}

export const SpellDrawer: React.FC<SpellDrawerProps> = ({
  spellId,
  entities,
  isOpen,
  onClose,
  onNavigateFullPage,
  onEditSpell,
  onDeleteSpell,
  onTagClick,
  isGmMode = false,
}) => {
  const currentUser = HecosStorage.getCurrentUser();
  const effectiveIsGm = isGmMode || currentUser?.role === 'gm' || HecosStorage.getGmMode();

  // Find active entity in real-time
  const activeSpell = useMemo(() => {
    if (!spellId) return null;
    return entities.find((e) => e.id === spellId || e.slug === spellId) || HecosStorage.getEntityById(spellId) || null;
  }, [spellId, entities]);

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
      {isOpen && activeSpell && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end" id="hecos-spell-drawer-container">
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
            className="relative z-10 w-full sm:w-[580px] md:w-[700px] lg:w-[820px] max-w-full bg-[#08070d] border-l border-cyan-500/30 text-zinc-100 shadow-2xl flex flex-col h-full overflow-hidden"
          >
            {/* Top Fixed Drawer Header */}
            <div className="px-5 py-3.5 bg-gradient-to-r from-[#0c0a15] via-[#100d1c] to-[#0c0a15] border-b border-zinc-800/80 flex items-center justify-between gap-3 shrink-0 shadow-md">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 shadow-sm shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 font-bold">
                      {activeSpell.spellData?.rank === 0 ? 'Truque' : `${activeSpell.spellData?.rank || 1}º Círculo`}
                    </span>
                    <span className="text-xs text-zinc-400 font-mono hidden sm:inline">
                      Artigo de Feitiço
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-zinc-100 truncate flex items-center gap-1.5 mt-0.5">
                    <span className="truncate">{activeSpell.title}</span>
                  </h2>
                </div>
              </div>

              {/* Header Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Full Article Page Button */}
                <Tooltip
                  title="Abrir em Página Cheia"
                  description="Navegar diretamente para a página individual completa deste feitiço"
                >
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateFullPage(activeSpell.id);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 hover:text-cyan-100 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="hidden sm:inline">Página Completa</span>
                  </button>
                </Tooltip>

                {/* Edit Spell Button (GM Only) */}
                {effectiveIsGm && onEditSpell && (
                  <Tooltip
                    title="Editar Feitiço"
                    description="Modificar dados, estatísticas e descrição deste feitiço"
                  >
                    <button
                      type="button"
                      onClick={() => onEditSpell(activeSpell)}
                      className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 hover:border-cyan-500/50 text-zinc-300 hover:text-cyan-300 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </Tooltip>
                )}

                {/* Visibility Controls for GM */}
                {effectiveIsGm && (
                  <div className="hidden sm:block">
                    <VisibilityBadgeMenu
                      visibility={activeSpell.visibility}
                      allowedUserIds={activeSpell.allowedUserIds}
                      isSecret={activeSpell.isSecret}
                      onChange={(newVis, newAllowed) => {
                        HecosStorage.setEntityVisibility(activeSpell.id, newVis, newAllowed);
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

            {/* Scrollable Drawer Body with Full SpellView Formatting */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-7 space-y-6">
              <SpellView
                entity={activeSpell}
                onEdit={() => onEditSpell?.(activeSpell)}
                onDelete={() => {
                  if (onDeleteSpell) {
                    onDeleteSpell(activeSpell.id);
                    onClose();
                  }
                }}
                onNavigate={(navId) => {
                  // If navigation target is another spell or entity
                  onClose();
                  onNavigateFullPage(navId);
                }}
                onTagClick={handleTagClickInternal}
              />
            </div>

            {/* Bottom Drawer Footer */}
            <div className="px-5 py-3 bg-[#0a0812] border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-zinc-500">
                  {activeSpell.updatedAt
                    ? `Atualizado em ${new Date(activeSpell.updatedAt).toLocaleDateString('pt-BR')}`
                    : 'Artigo Hecos PF2e'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateFullPage(activeSpell.id);
                  }}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <span>Ir para página do feitiço</span>
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
