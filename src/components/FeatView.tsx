import React, { useState } from 'react';
import { HecosEntity, PF2eFeatAttributes } from '../types';
import { parseFeatFromContent, getFeatTypeLabel } from '../utils/featSerializer';
import { PF2eActionGlyph, ActionGlyphType } from './PF2eActionGlyph';
import { RichContentRenderer } from './RichContentRenderer';
import { renderContentWithMentions } from './MentionBadge';
import { TraitBadge } from './TraitBadge';
import { sortTraitsHierarchically } from '../utils/traitUtils';
import {
  Copy,
  Check,
  Sparkles,
  Scroll,
  Crown,
  Clock,
  Folder,
} from 'lucide-react';

interface FeatViewProps {
  entity: HecosEntity;
  onEdit?: () => void;
  onDelete?: () => void;
  onNavigate: (id: string) => void;
  onTagClick: (tag: string) => void;
}

export const FeatView: React.FC<FeatViewProps> = ({
  entity,
  onEdit,
  onDelete,
  onNavigate,
  onTagClick,
}) => {
  const [copied, setCopied] = useState(false);
  const featData: PF2eFeatAttributes = parseFeatFromContent(
    entity.title,
    entity.content || '',
    entity.featData
  );

  const getRarityBadgeStyle = (rarity: string) => {
    switch (rarity?.toLowerCase()) {
      case 'incomum':
        return 'bg-amber-950/70 text-amber-300 border-amber-700/60';
      case 'raro':
        return 'bg-cyan-950/70 text-cyan-300 border-cyan-700/60';
      case 'único':
      case 'unico':
        return 'bg-purple-950/70 text-purple-300 border-purple-700/60';
      case 'comum':
      default:
        return 'bg-zinc-900/80 text-zinc-300 border-zinc-700/60';
    }
  };

  const getActionGlyphProp = (cost: string): { type: ActionGlyphType; show: boolean } => {
    switch (cost) {
      case '1':
        return { type: '1-action', show: true };
      case '2':
        return { type: '2-actions', show: true };
      case '3':
        return { type: '3-actions', show: true };
      case 'free':
        return { type: 'free-action', show: true };
      case 'reaction':
        return { type: 'reaction', show: true };
      case '1-to-2':
        return { type: '1-to-2-actions', show: true };
      case '1-to-3':
        return { type: '1-to-3-actions', show: true };
      default:
        return { type: '1-action', show: false };
    }
  };

  const actionGlyph = getActionGlyphProp(featData.actionCost);

  const handleCopyStatblock = () => {
    const lines = [
      `${entity.title.toUpperCase()} [TALENTO ${featData.level}]`,
      `Raridade: ${featData.rarity} | Tipo: ${getFeatTypeLabel(featData.featType)} | Traços: ${featData.traits.join(', ')}`,
      featData.actionCost !== 'passive' ? `Ações: ${featData.actionCost}` : '',
      featData.prerequisites ? `Pré-requisitos: ${featData.prerequisites}` : '',
      featData.frequency ? `Frequência: ${featData.frequency}` : '',
      featData.trigger ? `Gatilho: ${featData.trigger}` : '',
      featData.requirements ? `Requisitos: ${featData.requirements}` : '',
      `\n${featData.description}`,
      featData.criticalSuccess ? `\nSucesso Crítico: ${featData.criticalSuccess}` : '',
      featData.success ? `Sucesso: ${featData.success}` : '',
      featData.failure ? `Falha: ${featData.failure}` : '',
      featData.criticalFailure ? `Falha Crítica: ${featData.criticalFailure}` : '',
      featData.special ? `\nEspecial: ${featData.special}` : '',
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(lines);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const subcats = Array.from(
    new Set(
      [
        ...(featData.subcategories || []),
        ...(entity.subcategories || []),
        entity.subcategory,
      ].filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
    )
  );

  return (
    <div className="space-y-6">
      {/* CARD PRINCIPAL DO TALENTO PF2E */}
      <div className="rounded-2xl bg-[#0e0b17] border border-zinc-800 shadow-xl overflow-hidden">
        {/* CABEÇALHO DO STATBLOCK */}
        <div className="p-6 bg-gradient-to-r from-[#171124] via-[#120d1c] to-[#1a1220] border-b border-zinc-800/80 space-y-4">
          {/* Top Bar: Pastas/Subcategorias, Category & Copy Action */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Indicador de Pastas logo antes da Categoria */}
              {subcats.map((subcat) => (
                <button
                  key={subcat}
                  type="button"
                  onClick={() => onTagClick(subcat)}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-950/60 hover:bg-amber-900/70 text-amber-300 border border-amber-600/40 transition-colors shadow-sm cursor-pointer"
                  title={`Filtrar pela pasta ${subcat}`}
                >
                  <Folder className="w-3 h-3 text-amber-400" />
                  <span>{subcat}</span>
                </button>
              ))}

              <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase rounded-md bg-purple-950/60 text-purple-300 border border-purple-800/50">
                {getFeatTypeLabel(featData.featType)}
              </span>
              {featData.associatedClassOrAncestry && (
                <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-md bg-zinc-900 text-zinc-300 border border-zinc-700">
                  {featData.associatedClassOrAncestry}
                </span>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyStatblock}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
                title="Copiar texto do talento para área de transferência"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
                <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
              </button>
            </div>
          </div>

          {/* Title Row: Title & Action Glyphs on the Left, Nível X on the Extreme Right */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl sm:text-3xl font-black text-amber-200 tracking-tight flex items-center gap-3">
                <span>{entity.title}</span>
                {actionGlyph.show && (
                  <PF2eActionGlyph type={actionGlyph.type} size="lg" />
                )}
              </h2>
              {featData.actionCost === 'passive' && (
                <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                  Passivo
                </span>
              )}
              {featData.actionCost === 'activity' && (
                <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded bg-purple-950/70 text-purple-300 border border-purple-800/60 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Atividade</span>
                </span>
              )}
            </div>

            {/* Nível do Talento na Extrema Direita */}
            <div className="px-3.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold text-sm uppercase shadow-sm shrink-0">
              Nível {featData.level}
            </div>
          </div>

          {entity.subtitle && (
            <p className="text-sm text-zinc-400 font-medium italic">
              {entity.subtitle}
            </p>
          )}

          {/* Traços PF2e ([Raridade] + [Tradição] + [Tamanho] + [Outros Traits em Ordem Alfabética]) */}
          {(() => {
            const orderedTraits = sortTraitsHierarchically(featData.traits, {
              rarity: featData.rarity || 'Comum',
            });
            if (orderedTraits.length === 0) return null;
            return (
              <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-zinc-800/60">
                {orderedTraits.map((trait) => (
                  <TraitBadge
                    key={trait}
                    trait={trait}
                    onClick={() => {
                      window.dispatchEvent(
                        new CustomEvent('hecos:open-trait-drawer', { detail: { trait } })
                      );
                    }}
                  />
                ))}
              </div>
            );
          })()}
        </div>

        {/* METADADOS DE ATIVAÇÃO, PRÉ-REQUISITOS E REQUISITOS */}
        <div className="p-6 bg-[#0a0812] border-b border-zinc-800/80 space-y-2.5 text-sm text-zinc-300">
          {featData.prerequisites && (
            <div className="flex flex-wrap items-baseline gap-2 leading-relaxed">
              <strong className="text-zinc-400 font-bold uppercase text-xs font-mono tracking-wider shrink-0">
                Pré-requisitos:
              </strong>
              <span className="text-zinc-200">
                {renderContentWithMentions(featData.prerequisites, onNavigate)}
              </span>
            </div>
          )}

          {featData.frequency && (
            <div className="flex flex-wrap items-baseline gap-2 leading-relaxed">
              <strong className="text-zinc-400 font-bold uppercase text-xs font-mono tracking-wider shrink-0">
                Frequência:
              </strong>
              <span className="text-zinc-200 font-semibold">{featData.frequency}</span>
            </div>
          )}

          {featData.trigger && (
            <div className="flex flex-wrap items-baseline gap-2 leading-relaxed">
              <strong className="text-rose-400 font-bold uppercase text-xs font-mono tracking-wider shrink-0">
                Gatilho:
              </strong>
              <span className="text-rose-200">
                {renderContentWithMentions(featData.trigger, onNavigate)}
              </span>
            </div>
          )}

          {featData.requirements && (
            <div className="flex flex-wrap items-baseline gap-2 leading-relaxed">
              <strong className="text-zinc-400 font-bold uppercase text-xs font-mono tracking-wider shrink-0">
                Requisitos:
              </strong>
              <span className="text-zinc-200">
                {renderContentWithMentions(featData.requirements, onNavigate)}
              </span>
            </div>
          )}

          {featData.actionCostDetails && (
            <div className="flex flex-wrap items-baseline gap-2 leading-relaxed">
              <strong className="text-zinc-400 font-bold uppercase text-xs font-mono tracking-wider shrink-0">
                Tempo de Ativação:
              </strong>
              <span className="text-purple-300">{featData.actionCostDetails}</span>
            </div>
          )}
        </div>

        {/* CORPO / DESCRIÇÃO DO TALENTO */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="text-sm sm:text-base text-zinc-200 leading-relaxed break-words">
            {featData.description ? (
              <RichContentRenderer content={featData.description} onNavigate={onNavigate} />
            ) : (
              <p className="text-zinc-500 italic">Nenhuma descrição ou benefício cadastrado.</p>
            )}
          </div>

          {/* GRAUS DE SUCESSO (OPCIONAL) */}
          {(featData.criticalSuccess || featData.success || featData.failure || featData.criticalFailure) && (
            <div className="p-5 rounded-xl bg-black/40 border border-zinc-800 space-y-3">
              <h4 className="text-xs font-bold uppercase font-mono tracking-wider text-purple-300 border-b border-zinc-800 pb-1.5 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Graus de Sucesso</span>
              </h4>

              <div className="grid grid-cols-1 gap-2.5 text-xs sm:text-sm">
                {featData.criticalSuccess && (
                  <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-zinc-200">
                    <strong className="text-emerald-400 font-bold block mb-0.5">Sucesso Crítico:</strong>
                    <RichContentRenderer content={featData.criticalSuccess} onNavigate={onNavigate} />
                  </div>
                )}

                {featData.success && (
                  <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-800/40 text-zinc-200">
                    <strong className="text-cyan-400 font-bold block mb-0.5">Sucesso:</strong>
                    <RichContentRenderer content={featData.success} onNavigate={onNavigate} />
                  </div>
                )}

                {featData.failure && (
                  <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-800/40 text-zinc-200">
                    <strong className="text-amber-400 font-bold block mb-0.5">Falha:</strong>
                    <RichContentRenderer content={featData.failure} onNavigate={onNavigate} />
                  </div>
                )}

                {featData.criticalFailure && (
                  <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-800/40 text-zinc-200">
                    <strong className="text-rose-400 font-bold block mb-0.5">Falha Crítica:</strong>
                    <RichContentRenderer content={featData.criticalFailure} onNavigate={onNavigate} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* REGRAS ESPECIAIS */}
          {featData.special && (
            <div className="p-4 rounded-xl bg-[#140f22] border border-purple-500/30 text-xs sm:text-sm text-purple-200 space-y-1">
              <strong className="text-purple-300 font-bold uppercase font-mono text-[11px] block">
                Especial:
              </strong>
              <RichContentRenderer content={featData.special} onNavigate={onNavigate} />
            </div>
          )}
        </div>
      </div>

      {/* SEÇÃO DE LORE & CONTEXTO EM HECOS */}
      {(featData.hecosLore || featData.roleplayTips || featData.gmNotes) && (
        <div className="p-6 rounded-2xl bg-[#0b0914] border border-zinc-800 space-y-4">
          <h3 className="text-base font-bold text-[#74b6c2] flex items-center gap-2.5 font-serif border-b border-zinc-800 pb-2">
            <Scroll className="w-4 h-4 text-cyan-400" />
            <span>Contexto & Tradição no Mundo de Hecos</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm text-zinc-300">
            {featData.hecosLore && (
              <div className="p-4 rounded-xl bg-black/40 border border-zinc-800 space-y-1">
                <h4 className="text-[11px] font-bold text-amber-300 uppercase font-mono mb-1">
                  Origem e Linhagem da Técnica
                </h4>
                <RichContentRenderer content={featData.hecosLore} onNavigate={onNavigate} />
              </div>
            )}

            {featData.roleplayTips && (
              <div className="p-4 rounded-xl bg-black/40 border border-zinc-800 space-y-1">
                <h4 className="text-[11px] font-bold text-purple-300 uppercase font-mono mb-1">
                  Dicas de Interpretação e Visual
                </h4>
                <RichContentRenderer content={featData.roleplayTips} onNavigate={onNavigate} />
              </div>
            )}

            {featData.gmNotes && (
              <div className="md:col-span-2 p-4 rounded-xl bg-[#170e1a] border border-rose-800/40 text-rose-200 space-y-1">
                <h4 className="text-[11px] font-bold text-rose-400 uppercase font-mono mb-1 flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-rose-400" />
                  <span>Guia do Mestre / Balanceamento de Campanha</span>
                </h4>
                <RichContentRenderer content={featData.gmNotes} onNavigate={onNavigate} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
