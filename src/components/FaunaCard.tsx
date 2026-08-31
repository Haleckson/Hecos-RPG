import React from 'react';
import { HecosEntity } from '../types';
import { HecosStorage } from '../services/storage';
import {
  TreePine,
  ShieldAlert,
  Compass,
  Heart,
  Scissors,
  Edit2,
  Trash2,
  Lock,
} from 'lucide-react';
import { VisibilityBadgeMenu } from './VisibilityBadgeMenu';
import { AdjustableImage } from './AdjustableImage';

interface FaunaCardProps {
  entity: HecosEntity;
  onSelect: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  isGm?: boolean;
}

export const FaunaCard: React.FC<FaunaCardProps> = ({
  entity,
  onSelect,
  onEdit,
  onDelete,
  isGm = false,
}) => {
  const currentUser = HecosStorage.getCurrentUser();
  const effectiveIsGm = isGm || currentUser?.role === 'gm';
  const fauna = entity.faunaData;

  const portrait = entity.coverImage || fauna?.portraitImage;
  const token = fauna?.tokenImage;
  const danger = fauna?.dangerLevel || 'Baixo';
  const diet = fauna?.diet || 'Onívoro';
  const size = fauna?.size || 'Médio';
  const harvestCount = fauna?.harvestableParts?.length || 0;

  const getDangerBadge = (d: string) => {
    switch (d) {
      case 'Inofensivo':
      case 'Baixo':
        return 'border-emerald-700/60 bg-emerald-950/80 text-emerald-300';
      case 'Médio':
        return 'border-amber-700/60 bg-amber-950/80 text-amber-300';
      case 'Perigoso':
      case 'Mortal':
        return 'border-rose-700/60 bg-rose-950/80 text-rose-300';
      default:
        return 'border-zinc-700 bg-zinc-900 text-zinc-300';
    }
  };

  return (
    <div
      className="group relative flex flex-col bg-[#09100c] border border-emerald-900/40 hover:border-emerald-500/70 rounded-2xl overflow-hidden shadow-lg hover:shadow-[0_0_25px_rgba(16,185,129,0.2)] transition-all duration-300"
    >
      {/* ────────────────── PORTRAIT BANNER ────────────────── */}
      <div
        className="relative w-full h-44 bg-[#060b08] overflow-hidden cursor-pointer"
        onClick={() => onSelect(entity.id)}
      >
        {portrait ? (
          <AdjustableImage
            src={portrait}
            alt={entity.title}
            imageKey={`fauna-${entity.id}`}
            isGm={effectiveIsGm}
            containerClassName="relative w-full h-full overflow-hidden bg-[#060b08]"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#0c2417] via-[#08170f] to-[#040a06] flex items-center justify-center p-4">
            <div className="w-16 h-16 rounded-2xl bg-black/40 border border-emerald-800/50 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform shadow-inner">
              <TreePine className="w-8 h-8" />
            </div>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#09100c] via-[#09100c]/50 to-transparent pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-auto z-10">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-md border border-emerald-700/60 bg-emerald-950/90 text-emerald-300 backdrop-blur-md flex items-center gap-1 shadow-sm">
              <TreePine className="w-3 h-3 text-emerald-300" />
              <span>Fauna</span>
            </span>

            {danger && (
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border backdrop-blur-md ${getDangerBadge(danger)}`}>
                {danger}
              </span>
            )}
          </div>

          {effectiveIsGm && (
            <div
              className="flex items-center gap-1 bg-black/75 backdrop-blur-md p-1 rounded-lg border border-zinc-800 shadow-md"
              onClick={(e) => e.stopPropagation()}
            >
              <VisibilityBadgeMenu
                visibility={entity.visibility}
                allowedUserIds={entity.allowedUserIds}
                isSecret={entity.isSecret}
                onChange={(newVis, newAllowed) => {
                  HecosStorage.setEntityVisibility(entity.id, newVis, newAllowed);
                }}
              />
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(entity.id)}
                  className="p-1 rounded bg-zinc-800/80 hover:bg-emerald-950 text-zinc-400 hover:text-emerald-300 transition-colors cursor-pointer"
                  title="Editar Fauna"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(entity.id)}
                  className="p-1 rounded bg-zinc-800/80 hover:bg-rose-950 text-zinc-400 hover:text-rose-300 transition-colors cursor-pointer"
                  title="Excluir Fauna"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Token Overlay */}
        {token && (
          <div
            className="absolute bottom-2.5 right-2.5 w-12 h-12 rounded-full border-2 border-emerald-400 bg-zinc-950/90 shadow-[0_0_12px_rgba(16,185,129,0.4)] overflow-hidden z-10"
            title="Token de Batalha"
          >
            <img
              src={token}
              alt="Token"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
      </div>

      {/* ────────────────── CARD BODY ────────────────── */}
      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <button
              type="button"
              onClick={() => onSelect(entity.id)}
              className="text-left w-full group/title focus:outline-none cursor-pointer block transition-all"
              title={`Abrir ${entity.title}`}
            >
              <h3 className="text-sm sm:text-base font-bold text-zinc-100 group-hover/title:text-emerald-300 transition-all flex items-center gap-1.5 leading-snug group-hover/title:drop-shadow-[0_0_15px_rgba(16,185,129,0.9)]">
                <span className="group-hover/title:underline decoration-emerald-400 decoration-2 underline-offset-2">
                  {entity.title}
                </span>
                {entity.isSecret && (
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800 shrink-0">
                    GM
                  </span>
                )}
              </h3>
            </button>
          </div>

          {entity.subtitle && (
            <p className="text-xs text-zinc-400 italic line-clamp-1">
              {entity.subtitle}
            </p>
          )}

          {/* Quick meta row */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-400 pt-1">
            {diet && (
              <span className="text-emerald-300/90 font-mono text-[10px]">
                {diet}
              </span>
            )}
            {size && (
              <span className="text-zinc-400 font-mono text-[10px]">
                {size}
              </span>
            )}
            {fauna?.habitat && (
              <span className="truncate max-w-[140px] text-[10px] text-zinc-400">
                {fauna.habitat}
              </span>
            )}
          </div>
        </div>

        {/* Bottom tags & subcategory */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-800/80 text-[10px]">
          {isGm && entity.subcategory ? (
            <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 font-mono" title="Pasta (Exclusivo GM)">
              {entity.subcategory}
            </span>
          ) : (
            <div />
          )}

          {harvestCount > 0 && (
            <span className="flex items-center gap-1 text-emerald-400 font-mono">
              <Scissors className="w-3 h-3" />
              <span>{harvestCount} {harvestCount === 1 ? 'espólio' : 'espólios'}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
