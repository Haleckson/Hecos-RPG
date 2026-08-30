import React from 'react';
import { HecosEntity } from '../types';
import { HecosStorage } from '../services/storage';
import {
  Building2,
  Crown,
  MapPin,
  Users,
  Shield,
  Edit2,
  Trash2,
  Lock,
  Swords,
  Globe,
} from 'lucide-react';
import { VisibilityBadgeMenu } from './VisibilityBadgeMenu';
import { AdjustableImage } from './AdjustableImage';

interface OrganizationCardProps {
  entity: HecosEntity;
  onSelect: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  isGm?: boolean;
}

export const OrganizationCard: React.FC<OrganizationCardProps> = ({
  entity,
  onSelect,
  onEdit,
  onDelete,
  isGm = false,
}) => {
  const currentUser = HecosStorage.getCurrentUser();
  const effectiveIsGm = isGm || currentUser?.role === 'gm';
  const org = entity.organizationData;

  const symbolImage = entity.coverImage || org?.symbolImage;
  const orgType = org?.type || 'Facção';
  const scope = org?.scope || 'Regional';
  const influence = org?.influence || 'Média';
  const leader = org?.leader;
  const hq = org?.headquarters;
  const ranksCount = org?.ranks?.length || 0;

  const getInfluenceBadge = (inf: string) => {
    switch (inf) {
      case 'Baixa':
        return 'border-zinc-700 bg-zinc-900/80 text-zinc-300';
      case 'Média':
        return 'border-cyan-800/80 bg-cyan-950/80 text-cyan-300';
      case 'Alta':
        return 'border-amber-800/80 bg-amber-950/80 text-amber-300';
      case 'Dominante':
        return 'border-rose-700/80 bg-rose-950/90 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.3)]';
      default:
        return 'border-zinc-700 bg-zinc-900 text-zinc-300';
    }
  };

  return (
    <div
      className="group relative flex flex-col bg-[#0d0714] border border-rose-900/40 hover:border-rose-500/70 rounded-2xl overflow-hidden shadow-lg hover:shadow-[0_0_25px_rgba(244,63,94,0.2)] transition-all duration-300"
    >
      {/* ────────────────── SYMBOL / COVER BANNER ────────────────── */}
      <div className="relative w-full h-44 bg-[#09050d] overflow-hidden">
        {symbolImage ? (
          <AdjustableImage
            src={symbolImage}
            alt={entity.title}
            imageKey={`organization-${entity.id}`}
            isGm={effectiveIsGm}
            containerClassName="relative w-full h-full overflow-hidden bg-[#09050d]"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#250d24] via-[#160817] to-[#09030b] flex items-center justify-center p-4">
            <div className="w-16 h-16 rounded-2xl bg-black/40 border border-rose-800/50 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform shadow-inner">
              <Building2 className="w-8 h-8" />
            </div>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0714] via-[#0d0714]/50 to-transparent pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-auto z-10">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-md border border-rose-700/60 bg-rose-950/90 text-rose-300 backdrop-blur-md flex items-center gap-1 shadow-sm">
              <Building2 className="w-3 h-3 text-rose-300" />
              <span>{orgType}</span>
            </span>

            {influence && (
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border backdrop-blur-md ${getInfluenceBadge(influence)}`}>
                {influence}
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
                  className="p-1 rounded bg-zinc-800/80 hover:bg-rose-950 text-zinc-400 hover:text-rose-300 transition-colors cursor-pointer"
                  title="Editar Facção"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(entity.id)}
                  className="p-1 rounded bg-zinc-800/80 hover:bg-rose-950 text-zinc-400 hover:text-rose-300 transition-colors cursor-pointer"
                  title="Excluir Facção"
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
              <h3 className="text-sm sm:text-base font-bold text-zinc-100 group-hover/title:text-rose-300 transition-all flex items-center gap-1.5 leading-snug group-hover/title:drop-shadow-[0_0_15px_rgba(244,63,94,0.9)]">
                <span className="group-hover/title:underline decoration-rose-400 decoration-2 underline-offset-2">
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

          {org?.motto ? (
            <p className="text-xs text-rose-300/80 italic font-serif line-clamp-1">
              "{org.motto}"
            </p>
          ) : entity.subtitle ? (
            <p className="text-xs text-zinc-400 italic line-clamp-1">
              {entity.subtitle}
            </p>
          ) : null}

          {/* Quick meta row */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-400 pt-1">
            {leader && (
              <span className="flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-400" />
                <span className="truncate max-w-[130px]">{leader}</span>
              </span>
            )}
            {hq && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-cyan-400" />
                <span className="truncate max-w-[130px]">{hq}</span>
              </span>
            )}
            {scope && (
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3 text-zinc-400" />
                <span>{scope}</span>
              </span>
            )}
          </div>
        </div>

        {/* Bottom tags & subcategory */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-800/80 text-[10px]">
          {entity.subcategory ? (
            <span className="px-2 py-0.5 rounded bg-rose-950/60 border border-rose-800/60 text-rose-300 font-mono">
              {entity.subcategory}
            </span>
          ) : (
            <span className="text-zinc-500 italic">Geral</span>
          )}

          {ranksCount > 0 && (
            <span className="flex items-center gap-1 text-rose-400 font-mono">
              <Shield className="w-3 h-3" />
              <span>{ranksCount} {ranksCount === 1 ? 'rank' : 'ranks'}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
