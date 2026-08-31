import React, { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Package,
  ExternalLink,
  Edit3,
  Trash2,
  Maximize2,
  ChevronRight,
  Sparkles,
  Coins,
  Weight
} from 'lucide-react';
import { HecosEntity, DrawerBreadcrumb } from '../types';
import { HecosStorage } from '../services/storage';
import { ItemView } from './ItemView';
import { Tooltip } from './Tooltip';
import { VisibilityBadgeMenu } from './VisibilityBadgeMenu';
import { parseItemFromContent } from '../utils/itemSerializer';
import { DrawerStackHeader } from './DrawerStackHeader';

interface ItemDrawerProps {
  itemId: string | null;
  entities: HecosEntity[];
  isOpen: boolean;
  onClose: () => void;
  onNavigateFullPage: (entityId: string) => void;
  onEditItem?: (entity: HecosEntity) => void;
  onDeleteItem?: (entityId: string) => void;
  onTagClick?: (tag: string) => void;
  isGmMode?: boolean;
  stackIndex?: number;
  stackTotal?: number;
  stackBreadcrumbs?: DrawerBreadcrumb[];
  onJumpToStackIndex?: (index: number) => void;
  onCloseAll?: () => void;
}

export const ItemDrawer: React.FC<ItemDrawerProps> = ({
  itemId,
  entities,
  isOpen,
  onClose,
  onNavigateFullPage,
  onEditItem,
  onDeleteItem,
  onTagClick,
  isGmMode = false,
  stackIndex = 0,
  stackTotal = 1,
  stackBreadcrumbs = [],
  onJumpToStackIndex,
  onCloseAll,
}) => {
  const currentUser = HecosStorage.getCurrentUser();
  const effectiveIsGm = isGmMode || currentUser?.role === 'gm' || HecosStorage.getGmMode();

  // Find active item entity in real-time
  const activeItem = useMemo(() => {
    if (!itemId) return null;

    // 1. Direct entity match by ID or slug
    const direct =
      entities.find((e) => e.id === itemId || e.slug === itemId) ||
      HecosStorage.getEntityById(itemId);
    if (direct) return direct;

    // 2. Search if itemId matches by title (case-insensitive)
    const byTitle = entities.find(
      (e) =>
        (e.category === 'item' || Boolean(e.itemData)) &&
        e.title.toLowerCase() === itemId.toLowerCase()
    );
    if (byTitle) return byTitle;

    return null;
  }, [itemId, entities]);

  const itemData = useMemo(() => {
    if (!activeItem) return null;
    return parseItemFromContent(
      activeItem.content || '',
      activeItem.itemData
    );
  }, [activeItem]);

  // Keyboard shortcut: Escape to close top-most drawer
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

  if (!isOpen) return null;

  const zIndexVal = 50 + stackIndex * 10;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 overflow-hidden"
        style={{ zIndex: zIndexVal }}
        id={`hecos-item-drawer-layer-${stackIndex}`}
      >
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className={`absolute inset-0 cursor-pointer transition-opacity ${
            stackIndex > 0
              ? 'bg-black/60 backdrop-blur-[2px]'
              : 'bg-black/70 backdrop-blur-xs'
          }`}
        />

        {/* Sliding Drawer Container */}
        <div
          className={`absolute inset-y-0 right-0 max-w-full flex ${
            stackIndex === 0
              ? 'pl-6 sm:pl-10'
              : stackIndex === 1
              ? 'pl-8 sm:pl-14'
              : 'pl-10 sm:pl-18'
          }`}
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className={`w-screen max-w-3xl bg-[#09080e] border-l border-zinc-800 shadow-2xl flex flex-col h-full overflow-hidden text-zinc-100 ${
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

            {/* Top Sticky Header */}
            <div className="p-4 sm:px-6 bg-[#0e0a1a]/95 backdrop-blur-md border-b border-zinc-800/80 flex items-center justify-between gap-3 shrink-0 z-10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-amber-950/70 border border-amber-600/50 text-amber-300 shrink-0">
                  <Package className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-700/60 shrink-0">
                      Item {itemData?.level ?? 0}
                    </span>
                    {itemData?.rarity && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-700 shrink-0">
                        {itemData.rarity}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-zinc-100 truncate mt-0.5">
                    {activeItem?.title || itemId}
                  </h3>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                {activeItem && (
                  <Tooltip title="Abrir Página Inteira" description="Navegar para a visão expandida deste item">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigateFullPage(activeItem.id);
                      }}
                      className="p-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/50 text-zinc-400 hover:text-amber-300 transition-colors cursor-pointer"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </Tooltip>
                )}

                {effectiveIsGm && activeItem && onEditItem && (
                  <Tooltip title="Editar Item" description="Modificar estatísticas e descrição">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onEditItem(activeItem);
                      }}
                      className="p-2 rounded-xl bg-amber-950/50 hover:bg-amber-900/70 border border-amber-600/50 text-amber-300 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </Tooltip>
                )}

                {effectiveIsGm && activeItem && onDeleteItem && (
                  <Tooltip title="Mover para a Lixeira" description="Excluir este item com segurança">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onDeleteItem(activeItem.id);
                      }}
                      className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-rose-300 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </Tooltip>
                )}

                <div className="w-[1px] h-6 bg-zinc-800 mx-1" />

                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
                  title="Fechar Painel (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Drawer Body with Full ItemView Formatting */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {activeItem ? (
                <ItemView
                  entity={activeItem}
                  onEdit={
                    effectiveIsGm && onEditItem
                      ? () => {
                          onClose();
                          onEditItem(activeItem);
                        }
                      : undefined
                  }
                  onDelete={
                    effectiveIsGm && onDeleteItem
                      ? () => {
                          onClose();
                          onDeleteItem(activeItem.id);
                        }
                      : undefined
                  }
                  onNavigate={(targetId) => {
                    // Navigate within drawer or app
                    const targetEnt =
                      entities.find((e) => e.id === targetId || e.slug === targetId) ||
                      HecosStorage.getEntityById(targetId);
                    if (targetEnt && targetEnt.category === 'item') {
                      window.dispatchEvent(
                        new CustomEvent('hecos:open-item-drawer', { detail: { itemId: targetEnt.id } })
                      );
                    } else {
                      onClose();
                      onNavigateFullPage(targetId);
                    }
                  }}
                  onTagClick={onTagClick}
                />
              ) : (
                <div className="p-8 text-center space-y-4 rounded-2xl bg-zinc-950/40 border border-zinc-800">
                  <Package className="w-10 h-10 text-zinc-600 mx-auto" />
                  <p className="text-sm text-zinc-400">
                    O item solicitado (<strong className="text-zinc-200">{itemId}</strong>) não foi encontrado ou foi excluído.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};
