import React from 'react';
import { HecosEntity } from '../types';
import { HecosStorage } from '../services/storage';
import {
  Flower2,
  Sparkles,
  FlaskConical,
  Clock,
  Edit2,
  Trash2,
  Lock,
} from 'lucide-react';
import { VisibilityBadgeMenu } from './VisibilityBadgeMenu';
import { AdjustableImage } from './AdjustableImage';

interface FloraCardProps {
  entity: HecosEntity;
  onSelect: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  isGm?: boolean;
}

export const FloraCard: React.FC<FloraCardProps> = ({
  entity,
  onSelect,
  onEdit,
  onDelete,
  isGm = false,
}) => {
  const currentUser = HecosStorage.getCurrentUser();
  const effectiveIsGm = isGm || currentUser?.role === 'gm';
  const flora = entity.floraData;

  const portrait = entity.coverImage || flora?.portraitImage;
  const token = flora?.tokenImage;
  const rarity = flora?.rarity || 'Comum';
  const properties = flora?.properties || [];
  const season = flora?.harvestSeason;

  const getRarityBadge = (r: string) => {
    switch (r) {
      case 'Comum':
        return 'border-zinc-700 bg-zinc-900 text-zinc-300';
      case 'Incomum':
        return 'border-emerald-700/60 bg-emerald-950/80 text-emerald-300';
      case 'Raro':
        return 'border-cyan-700/60 bg-cyan-950/80 text-cyan-300';
      case 'Único':
        return 'border-amber-700/60 bg-amber-950/80 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]';
      default:
        return 'border-zinc-700 bg-zinc-900 text-zinc-300';
    }
  };

  return (
    <div
      className="group relative flex flex-col bg-[#08110b] border border-emerald-900/40 hover:border-emerald-500/70 rounded-2xl overflow-hidden shadow-lg hover:shadow-[0_0_25px_rgba(16,185,129,0.2)] transition-all duration-300"
    >
      {/* ────────────────── PORTRAIT BANNER ────────────────── */}
      <div className="relative w-full h-44 bg-[#050b07] overflow-hidden">
        {portrait ? (
          <AdjustableImage
            src={portrait}
            alt={entity.title}
            imageKey={`flora-${entity.id}`}
            isGm={effectiveIsGm}
            containerClassName="relative w-full h-full overflow-hidden bg-[#050b07]"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#0b2216] via-[#07170e] to-[#030a06] flex items-center justify-center p-4">
            <div className="w-16 h-16 rounded-2xl bg-black/40 border border-emerald-800/50 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform shadow-inner">
              <Flower2 className="w-8 h-8" />
            </div>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#08110b] via-[#08110b]/50 to-transparent pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-auto z-10">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-md border border-emerald-700/60 bg-emerald-950/90 text-emerald-300 backdrop-blur-md flex items-center gap-1 shadow-sm">
              <Flower2 className="w-3 h-3 text-emerald-300" />
              <span>Flora</span>
            </span>

            {rarity && (
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border backdrop-blur-md ${getRarityBadge(rarity)}`}>
                {rarity}
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
                  title="Editar Flora"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(entity.id)}
                  className="p-1 rounded bg-zinc-800/80 hover:bg-rose-950 text-zinc-400 hover:text-rose-300 transition-colors cursor-pointer"
                  title="Excluir Flora"
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
            title="Token de Mesa"
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

          {/* Properties pills */}
          {properties.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {properties.slice(0, 3).map((prop) => (
                <span
                  key={prop}
                  className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-300"
                >
                  {prop}
                </span>
              ))}
              {properties.length > 3 && (
                <span className="text-[9px] px-1 py-0.5 text-zinc-500">
                  +{properties.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Habitat / Season */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-400 pt-1">
            {season && (
              <span className="flex items-center gap-1 text-[10px] text-zinc-400">
                <Clock className="w-3 h-3 text-emerald-400" />
                <span className="truncate max-w-[130px]">{season}</span>
              </span>
            )}
            {flora?.habitat && (
              <span className="truncate max-w-[140px] text-[10px] text-zinc-400">
                {flora.habitat}
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

          {flora?.preparationAndEffects && (
            <span className="flex items-center gap-1 text-emerald-400 font-mono text-[10px]">
              <FlaskConical className="w-3 h-3" />
              <span>Receita</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
