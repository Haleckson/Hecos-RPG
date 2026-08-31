import React from 'react';
import {
  ChevronRight,
  ArrowLeft,
  X,
  Layers,
  Sparkles,
  BookOpen,
  Tag,
  Award,
  Gem,
  ExternalLink
} from 'lucide-react';
import { DrawerBreadcrumb, DrawerType } from '../types';

interface DrawerStackHeaderProps {
  breadcrumbs?: DrawerBreadcrumb[];
  currentIndex: number;
  totalDrawers: number;
  onPop: () => void;
  onJumpToIndex?: (index: number) => void;
  onCloseAll?: () => void;
}

const getDrawerTypeIcon = (type: DrawerType) => {
  switch (type) {
    case 'trait':
      return <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
    case 'tag':
      return <Tag className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
    case 'feat':
      return <Award className="w-3.5 h-3.5 text-orange-400 shrink-0" />;
    case 'item':
      return <Gem className="w-3.5 h-3.5 text-amber-300 shrink-0" />;
    case 'entity':
    default:
      return <BookOpen className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
  }
};

export const DrawerStackHeader: React.FC<DrawerStackHeaderProps> = ({
  breadcrumbs = [],
  currentIndex,
  totalDrawers,
  onPop,
  onJumpToIndex,
  onCloseAll,
}) => {
  if (totalDrawers <= 1 && breadcrumbs.length <= 1) {
    return null;
  }

  const previousBreadcrumb = currentIndex > 0 && breadcrumbs[currentIndex - 1]
    ? breadcrumbs[currentIndex - 1]
    : null;

  return (
    <div
      className="w-full bg-[#0d0a17]/95 border-b border-purple-900/40 px-3 py-2 flex items-center justify-between gap-2 shrink-0 z-40 text-xs backdrop-blur-md shadow-inner"
      id={`drawer-stack-header-layer-${currentIndex}`}
    >
      {/* Left side: Back to previous drawer button & breadcrumbs */}
      <div className="flex items-center gap-2 min-w-0 flex-1 overflow-x-auto scrollbar-none py-0.5">
        {currentIndex > 0 && (
          <button
            type="button"
            onClick={onPop}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-950/70 hover:bg-purple-900/90 text-purple-200 hover:text-white border border-purple-700/60 transition-all shrink-0 cursor-pointer shadow-sm active:scale-95 group font-medium text-[11px]"
            title={`Voltar para ${previousBreadcrumb?.title || 'painel anterior'} (Esc)`}
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5 text-purple-300" />
            <span>Voltar {previousBreadcrumb ? `(${previousBreadcrumb.title.slice(0, 16)}${previousBreadcrumb.title.length > 16 ? '...' : ''})` : ''}</span>
          </button>
        )}

        {/* Breadcrumb Trail */}
        <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] min-w-0 flex-nowrap font-sans">
          {breadcrumbs.map((bc, idx) => {
            const isCurrent = idx === currentIndex;
            const isPast = idx < currentIndex;

            return (
              <React.Fragment key={bc.id || `${bc.type}-${bc.targetId}-${idx}`}>
                {idx > 0 && (
                  <ChevronRight className="w-3 h-3 text-zinc-600 shrink-0" />
                )}
                {isPast ? (
                  <button
                    type="button"
                    onClick={() => onJumpToIndex && onJumpToIndex(idx)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-900/80 hover:bg-purple-950 text-zinc-300 hover:text-purple-200 border border-zinc-800 hover:border-purple-600/50 transition-colors shrink-0 max-w-[140px] truncate cursor-pointer"
                    title={`Retornar para ${bc.title}`}
                  >
                    {getDrawerTypeIcon(bc.type)}
                    <span className="truncate">{bc.title}</span>
                  </button>
                ) : (
                  <div
                    className={`flex items-center gap-1 px-2.5 py-0.5 rounded-md font-semibold shrink-0 max-w-[180px] truncate ${
                      isCurrent
                        ? 'bg-purple-900/40 text-purple-100 border border-purple-500/50 shadow-sm'
                        : 'text-zinc-400'
                    }`}
                  >
                    {getDrawerTypeIcon(bc.type)}
                    <span className="truncate">{bc.title}</span>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Right side: Layer Counter & Close All Drawers button */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/50 border border-zinc-800 text-[10px] font-mono text-zinc-400">
          <Layers className="w-3 h-3 text-purple-400" />
          <span>
            {currentIndex + 1}/{totalDrawers}
          </span>
        </div>

        {totalDrawers > 1 && onCloseAll && (
          <button
            type="button"
            onClick={onCloseAll}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-900/90 hover:bg-rose-950/80 text-zinc-400 hover:text-rose-200 border border-zinc-800 hover:border-rose-700/60 transition-colors text-[11px] cursor-pointer shadow-sm"
            title="Fechar todos os painéis abertos de uma vez"
          >
            <X className="w-3 h-3" />
            <span className="hidden sm:inline">Fechar Tudo</span>
          </button>
        )}
      </div>
    </div>
  );
};
