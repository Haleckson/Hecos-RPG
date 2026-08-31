import React from 'react';
import { HecosEntity } from '../types';
import { HecosStorage } from '../services/storage';
import {
  Compass,
  MapPin,
  Users,
  ShieldAlert,
  Crown,
  Edit2,
  Trash2,
  Lock,
  Globe,
} from 'lucide-react';
import { VisibilityBadgeMenu } from './VisibilityBadgeMenu';
import { AdjustableImage } from './AdjustableImage';

interface LocationCardProps {
  entity: HecosEntity;
  onSelect: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  isGm?: boolean;
}

export const LocationCard: React.FC<LocationCardProps> = ({
  entity,
  onSelect,
  onEdit,
  onDelete,
  isGm = false,
}) => {
  const currentUser = HecosStorage.getCurrentUser();
  const effectiveIsGm = isGm || currentUser?.role === 'gm';
  const loc = entity.locationData;

  const mapImage = entity.coverImage || loc?.mapImage;
  const settlementType = loc?.settlementType || 'Local';
  const danger = loc?.dangerLevel || 'Moderado';
  const population = loc?.population;
  const ruler = loc?.ruler;
  const poiCount = loc?.pointsOfInterest?.length || 0;

  const getDangerColor = (d: string) => {
    switch (d) {
      case 'Seguro':
        return 'border-emerald-700/60 bg-emerald-950/80 text-emerald-300';
      case 'Baixo':
        return 'border-cyan-700/60 bg-cyan-950/80 text-cyan-300';
      case 'Moderado':
        return 'border-amber-700/60 bg-amber-950/80 text-amber-300';
      case 'Perigoso':
        return 'border-orange-700/60 bg-orange-950/80 text-orange-300';
      case 'Extremo':
      case 'Mortal':
        return 'border-rose-700/60 bg-rose-950/80 text-rose-300';
      default:
        return 'border-zinc-700 bg-zinc-900 text-zinc-300';
    }
  };

  return (
    <div
      className="group relative flex flex-col bg-[#0b0c16] border border-cyan-900/40 hover:border-cyan-500/70 rounded-2xl overflow-hidden shadow-lg hover:shadow-[0_0_25px_rgba(6,182,212,0.2)] transition-all duration-300"
    >
      {/* ────────────────── MAP / COVER BANNER ────────────────── */}
      <div className="relative w-full h-44 bg-[#080a14] overflow-hidden">
        {mapImage ? (
          <AdjustableImage
            src={mapImage}
            alt={entity.title}
            imageKey={`location-${entity.id}`}
            isGm={effectiveIsGm}
            containerClassName="relative w-full h-full overflow-hidden bg-[#080a14]"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#0c1c2a] via-[#09131e] to-[#060a12] flex items-center justify-center p-4">
            <div className="w-16 h-16 rounded-2xl bg-black/40 border border-cyan-800/50 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform shadow-inner">
              <Compass className="w-8 h-8" />
            </div>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c16] via-[#0b0c16]/50 to-transparent pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-auto z-10">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-md border border-cyan-700/60 bg-cyan-950/90 text-cyan-300 backdrop-blur-md flex items-center gap-1 shadow-sm">
              <Compass className="w-3 h-3 text-cyan-300" />
              <span>{settlementType}</span>
            </span>

            {danger && (
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border backdrop-blur-md ${getDangerColor(danger)}`}>
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
                  className="p-1 rounded bg-zinc-800/80 hover:bg-cyan-950 text-zinc-400 hover:text-cyan-300 transition-colors cursor-pointer"
                  title="Editar Local"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(entity.id)}
                  className="p-1 rounded bg-zinc-800/80 hover:bg-rose-950 text-zinc-400 hover:text-rose-300 transition-colors cursor-pointer"
                  title="Excluir Local"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
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
              <h3 className="text-sm sm:text-base font-bold text-zinc-100 group-hover/title:text-cyan-300 transition-all flex items-center gap-1.5 leading-snug group-hover/title:drop-shadow-[0_0_15px_rgba(6,182,212,0.9)]">
                <span className="group-hover/title:underline decoration-cyan-400 decoration-2 underline-offset-2">
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
            {loc?.planeOrRegion && (
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3 text-cyan-400" />
                <span className="truncate max-w-[130px]">{loc.planeOrRegion}</span>
              </span>
            )}
            {ruler && (
              <span className="flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-400" />
                <span className="truncate max-w-[130px]">{ruler}</span>
              </span>
            )}
            {population && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3 text-zinc-400" />
                <span>{population}</span>
              </span>
            )}
          </div>
        </div>

        {/* Bottom tags & subcategory */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-800/80 text-[10px]">
          {isGm && entity.subcategory ? (
            <span className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 font-mono" title="Pasta (Exclusivo GM)">
              {entity.subcategory}
            </span>
          ) : (
            <div />
          )}

          {poiCount > 0 && (
            <span className="flex items-center gap-1 text-cyan-400 font-mono">
              <MapPin className="w-3 h-3" />
              <span>{poiCount} {poiCount === 1 ? 'ponto' : 'pontos'}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
