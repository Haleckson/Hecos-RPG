import React, { useState, useEffect } from 'react';
import { HecosEntity, AncestryAttributes } from '../types';
import { EntityIcon } from './EntityIcon';
import { VisibilityBadgeMenu } from './VisibilityBadgeMenu';
import { AdjustableImage } from './AdjustableImage';
import { TraitBadge } from './TraitBadge';
import { HecosStorage } from '../services/storage';
import { getCardVisibilityClasses } from '../utils/cardVisibility';
import {
  Heart,
  Maximize2,
  Zap,
  Brain,
  Eye,
  Shield,
  Award,
  Trash2,
  Edit3,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface AncestryCardProps {
  entity: HecosEntity;
  onSelect: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  isGmMode?: boolean;
  isGm?: boolean;
}

export const AncestryCard: React.FC<AncestryCardProps> = ({
  entity,
  onSelect,
  onEdit,
  onDelete,
  isGmMode,
  isGm
}) => {
  const [currentEntity, setCurrentEntity] = useState<HecosEntity>(entity);

  useEffect(() => {
    setCurrentEntity(entity);
  }, [entity]);

  // Subscribe to storage changes for instant reactive update
  useEffect(() => {
    const unsub = HecosStorage.subscribeEntities((entities) => {
      const updated = entities.find((e) => e.id === entity.id);
      if (updated) {
        setCurrentEntity(updated);
      }
    });
    return unsub;
  }, [entity.id]);

  const currentUser = HecosStorage.getCurrentUser();
  const effectiveIsGm = isGm || isGmMode || currentUser?.role === 'gm';

  const data: Partial<AncestryAttributes> = currentEntity.ancestryData || {};
  const hp = data.hp || currentEntity.statblock?.hp || '8 PV';
  const size = data.size || currentEntity.statblock?.size || 'Médio';
  const speed = data.speed || currentEntity.statblock?.speed || '9m (6q)';
  const senses = data.senses || currentEntity.statblock?.senses || 'Visão Padrão';
  const innate = data.innate || currentEntity.statblock?.innate || '—';
  const attributes = data.attributes || '+2 Atributos Livres';
  const traits = data.traits
    ? (Array.isArray(data.traits) ? data.traits : String(data.traits).split(',').map((t) => t.trim()).filter(Boolean))
    : currentEntity.statblock?.traits || ['Humanoide', currentEntity.title || ''];

  const totalHeritages = data.heritages?.length || 0;
  const totalFeats =
    (data.feats?.rank1?.length || 0) +
    (data.feats?.rank5?.length || 0) +
    (data.feats?.rank9?.length || 0) +
    (data.feats?.rank13?.length || 0) +
    (data.feats?.rank17?.length || 0);

  const coverImage = currentEntity.coverImage;

  // Visibility Card Borders & Glow based on target rule
  const visStyle = getCardVisibilityClasses(currentEntity.visibility, currentEntity.isSecret);

  return (
    <div
      id={`ancestry-card-${currentEntity.id}`}
      className={`group relative flex flex-col justify-between rounded-2xl bg-[#0e0a17] hover:bg-[#130d22] border ${visStyle.border} ${visStyle.shadow} transition-all duration-200 overflow-hidden h-full min-h-[460px] shadow-lg`}
    >
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* IMAGEM DO CARD (Proporção vertical clássica de card / códice)               */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      <div className="relative w-full h-40 sm:h-44 bg-[#18112b] overflow-hidden border-b border-zinc-800/60 select-none shrink-0">
        {coverImage ? (
          <AdjustableImage
            src={coverImage}
            alt={currentEntity.title || 'Ancestralidade'}
            imageKey={`ancestry-card-${currentEntity.id}`}
            isGm={effectiveIsGm}
            containerClassName="relative w-full h-full overflow-hidden bg-[#0c0915]"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#1b1236] via-[#100b21] to-[#0a0714] flex items-center justify-center p-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-950/30 border border-cyan-800/30 flex items-center justify-center text-cyan-400/50 group-hover:text-cyan-300 group-hover:scale-105 transition-all overflow-hidden">
              <EntityIcon
                icon={currentEntity.icon}
                category="ancestry"
                className="w-7 h-7"
                imageClassName="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0a17] via-[#0e0a17]/25 to-transparent pointer-events-none" />

        {/* Top Floating Elements */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
          {/* Identificador do tipo de artigo (Sempre Visível no canto superior esquerdo) */}
          <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-lg bg-black/85 text-cyan-300 border border-cyan-700/60 backdrop-blur-md flex items-center gap-1 shadow-md pointer-events-auto">
            <EntityIcon icon={currentEntity.icon} category="ancestry" className="w-2.5 h-2.5 text-cyan-400" />
            <span>Ancestralidade</span>
          </span>

          {/* Botões de Ação (Apenas visíveis ao fazer mouseover no card) */}
          {effectiveIsGm && (
            <div
              className="flex items-center gap-1 bg-black/85 backdrop-blur-md p-1 rounded-xl border border-zinc-700/80 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <VisibilityBadgeMenu
                visibility={currentEntity.visibility}
                allowedUserIds={currentEntity.allowedUserIds}
                isSecret={currentEntity.isSecret}
                onChange={(newVis, newAllowed) => {
                  HecosStorage.setEntityVisibility(currentEntity.id, newVis, newAllowed);
                }}
              />

              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(currentEntity.id)}
                  className="p-1 rounded-lg hover:bg-cyan-950 text-zinc-400 hover:text-cyan-300 transition-colors cursor-pointer"
                  title="Editar Artigo de Ancestralidade"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}

              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(currentEntity.id)}
                  className="p-1 rounded-lg hover:bg-rose-950 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
                  title="Excluir Ancestralidade"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* CORPO DO CARD (Verticalmente equilibrado: Ícone, Título, Matriz 2x2, Dados) */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          {/* ÍCONE, NOME (ÚNICA ÁREA CLICÁVEL DO CARD) E SUBTÍTULO */}
          <div className="flex items-start gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#1b1430] border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0 shadow-md mt-0.5 group-hover:border-cyan-400 group-hover:scale-105 transition-all overflow-hidden">
              <EntityIcon
                icon={currentEntity.icon}
                category="ancestry"
                className="w-4.5 h-4.5"
                imageClassName="w-full h-full object-cover rounded-xl"
              />
            </div>

            <div className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => onSelect(currentEntity.id)}
                className="text-left w-full group/title focus:outline-none cursor-pointer block transition-all"
                title={`Abrir ancestralidade ${currentEntity.title}`}
              >
                <h3 className="text-base sm:text-lg font-black text-zinc-100 group-hover/title:text-cyan-300 font-serif group-hover/title:drop-shadow-[0_0_15px_rgba(6,182,212,0.9)] flex items-center gap-1.5 leading-snug break-words transition-all">
                  <span className="group-hover/title:underline decoration-cyan-400 decoration-2 underline-offset-2">
                    {currentEntity.title || 'Sem Título'}
                  </span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover/title:opacity-100 text-cyan-400 group-hover/title:translate-x-0.5 transition-all shrink-0" />
                </h3>
              </button>

              {currentEntity.subtitle && (
                <p className="text-[11px] text-[#b19ecc] font-medium mt-0.5 break-words">
                  {currentEntity.subtitle}
                </p>
              )}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {/* DESTAQUE PRINCIPAL 2x2:                                               */}
          {/* Linha 1: [ PV ] [ Tamanho ]                                           */}
          {/* Linha 2: [ Desloc. ] [ Modif. ]                                       */}
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-2 gap-1.5 bg-[#140f24] p-2 rounded-xl border border-zinc-800/90 shadow-inner">
            {/* Linha 1, Coluna 1: PV */}
            <div className="flex items-start gap-1.5 min-w-0 p-1.5 rounded-lg bg-[#181023]/90 border border-rose-900/40">
              <Heart className="w-3.5 h-3.5 text-rose-400 shrink-0 fill-rose-400/20 mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="text-[9px] uppercase font-bold tracking-wider text-rose-300/90 font-mono">PV</div>
                <div className="font-black text-rose-100 text-sm sm:text-base leading-tight break-words">{hp}</div>
              </div>
            </div>

            {/* Linha 1, Coluna 2: Tamanho */}
            <div className="flex items-start gap-1.5 min-w-0 p-1.5 rounded-lg bg-[#0e1622]/90 border border-cyan-900/40">
              <Maximize2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="text-[9px] uppercase font-bold tracking-wider text-cyan-300/90 font-mono">Tamanho</div>
                <div className="font-black text-cyan-100 text-sm sm:text-base leading-tight break-words">{size}</div>
              </div>
            </div>

            {/* Linha 2, Coluna 1: Desloc. */}
            <div className="flex items-start gap-1.5 min-w-0 p-1.5 rounded-lg bg-[#181128]/90 border border-purple-900/40">
              <Zap className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="text-[9px] uppercase font-bold tracking-wider text-purple-300/90 font-mono">Desloc.</div>
                <div className="font-black text-purple-100 text-sm sm:text-base leading-tight break-words">{speed}</div>
              </div>
            </div>

            {/* Linha 2, Coluna 2: Modif. */}
            <div className="flex items-start gap-1.5 min-w-0 p-1.5 rounded-lg bg-[#1a130b]/90 border border-amber-900/40">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="text-[9px] uppercase font-bold tracking-wider text-amber-300/90 font-mono">Modif.</div>
                <div className="font-black text-amber-100 text-xs sm:text-sm font-mono leading-tight break-words">{attributes}</div>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {/* MENOR DESTAQUE (Texto integral acomodado): Sentidos & Inato           */}
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          <div className="space-y-1 text-xs text-zinc-300 bg-[#0d0a15] p-2 rounded-xl border border-zinc-800/60">
            <div className="flex items-start gap-1.5">
              <span className="text-cyan-400 font-bold font-mono text-[10px] shrink-0 flex items-center gap-1 mt-0.5">
                <Eye className="w-3 h-3 text-cyan-400 shrink-0" />
                <span>Sentidos:</span>
              </span>
              <span className="text-zinc-300 text-xs break-words flex-1 leading-snug font-medium">
                {senses}
              </span>
            </div>

            {innate && innate !== '—' && (
              <div className="flex items-start gap-1.5 pt-1 border-t border-zinc-800/50">
                <span className="text-purple-400 font-bold font-mono text-[10px] shrink-0 flex items-center gap-1 mt-0.5">
                  <Sparkles className="w-3 h-3 text-purple-400 shrink-0" />
                  <span>Inato:</span>
                </span>
                <span className="text-zinc-300 text-xs break-words flex-1 leading-snug font-medium">
                  {innate}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════════ */}
        {/* TRAÇOS (LOGO ABAIXO DE SENTIDOS E INATO) E CONTADORES                    */}
        {/* ═══════════════════════════════════════════════════════════════════════════ */}
        <div className="pt-2.5 border-t border-zinc-800/60 flex flex-col gap-1.5">
          {/* Traços com TraitBadge */}
          <div className="flex items-center gap-1 flex-wrap">
            {traits.map((trait, idx) => (
              <TraitBadge key={`${trait}-${idx}`} trait={trait} />
            ))}
          </div>

          {/* Badges de Heranças e Talentos vinculados */}
          {(totalHeritages > 0 || totalFeats > 0) && (
            <div className="flex items-center gap-1.5 text-zinc-400 font-mono text-[10px] pt-0.5">
              {totalHeritages > 0 && (
                <span className="flex items-center gap-1 text-purple-300 bg-purple-950/60 border border-purple-800/70 px-1.5 py-0.5 rounded-lg text-[10px]">
                  <Shield className="w-3 h-3 text-purple-400" />
                  <span>{totalHeritages} herança{totalHeritages > 1 ? 's' : ''}</span>
                </span>
              )}
              {totalFeats > 0 && (
                <span className="flex items-center gap-1 text-cyan-300 bg-cyan-950/60 border border-cyan-800/70 px-1.5 py-0.5 rounded-lg text-[10px]">
                  <Award className="w-3 h-3 text-cyan-400" />
                  <span>{totalFeats} talento{totalFeats > 1 ? 's' : ''}</span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

