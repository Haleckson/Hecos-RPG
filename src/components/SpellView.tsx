import React, { useState } from 'react';
import { HecosEntity, PF2eSpellAttributes } from '../types';
import { parseSpellFromContent } from '../utils/spellSerializer';
import { PF2eActionGlyph, ActionGlyphType } from './PF2eActionGlyph';
import { RichContentRenderer } from './RichContentRenderer';
import { TraitBadge } from './TraitBadge';
import { VisibilityBadgeMenu } from './VisibilityBadgeMenu';
import { AdjustableImage } from './AdjustableImage';
import { HecosStorage } from '../services/storage';
import {
  Copy,
  Check,
  Sparkles,
  Scroll,
  Crown,
  Clock,
  Folder,
  Edit3,
  Trash2,
  Printer,
  Compass,
  ArrowUpRight,
  Shield,
  Target,
  Zap,
} from 'lucide-react';

interface SpellViewProps {
  entity: HecosEntity;
  onEdit?: () => void;
  onDelete?: () => void;
  onNavigate: (id: string) => void;
  onTagClick: (tag: string) => void;
}

export const SpellView: React.FC<SpellViewProps> = ({
  entity,
  onEdit,
  onDelete,
  onNavigate,
  onTagClick,
}) => {
  const [copied, setCopied] = useState(false);
  const isActualGm = HecosStorage.isUserGm();

  const spellData: PF2eSpellAttributes = parseSpellFromContent(
    entity.content || '',
    entity.spellData
  );

  const getActionGlyphProp = (castTime: string): { type: ActionGlyphType; show: boolean } => {
    const ct = (castTime || '').toLowerCase();
    if (ct.includes('1 a 3') || ct.includes('1 ou 2 ou 3')) return { type: '1-to-3-actions', show: true };
    if (ct.includes('1 ou 2') || ct.includes('1 a 2')) return { type: '1-to-2-actions', show: true };
    if (ct.includes('2 a 3') || ct.includes('2 ou 3')) return { type: '2-to-3-actions', show: true };
    if (ct.startsWith('1') || ct.includes('1 ação') || ct.includes('1 acao')) return { type: '1-action', show: true };
    if (ct.startsWith('2') || ct.includes('2 ações') || ct.includes('2 acoes')) return { type: '2-actions', show: true };
    if (ct.startsWith('3') || ct.includes('3 ações') || ct.includes('3 acoes')) return { type: '3-actions', show: true };
    if (ct.includes('reação') || ct.includes('reacao') || ct.includes('reaction')) return { type: 'reaction', show: true };
    if (ct.includes('livre') || ct.includes('free')) return { type: 'free-action', show: true };
    return { type: '1-action', show: false };
  };

  const actionGlyph = getActionGlyphProp(spellData.castTime);

  const handleCopyStatblock = () => {
    const rankLabel = spellData.rank === 0 ? 'TRUQUE (CANTRIP)' : `MAGIA ${spellData.rank}º CÍRCULO`;
    const lines = [
      `${entity.title.toUpperCase()} [${rankLabel}]`,
      `Raridade: ${spellData.rarity || 'Comum'} | Tradições: ${(spellData.traditions || []).join(', ')} | Traços: ${(spellData.traits || []).join(', ')}`,
      spellData.castTime ? `Conjuração: ${spellData.castTime}` : '',
      spellData.range ? `Alcance: ${spellData.range}` : '',
      spellData.area ? `Área: ${spellData.area}` : '',
      spellData.targets ? `Alvos: ${spellData.targets}` : '',
      spellData.savingThrow ? `Salvamento: ${spellData.savingThrow}` : '',
      spellData.duration ? `Duração: ${spellData.duration}` : '',
      `\n${spellData.description}`,
      spellData.criticalSuccess ? `\nSucesso Crítico: ${spellData.criticalSuccess}` : '',
      spellData.success ? `Sucesso: ${spellData.success}` : '',
      spellData.failure ? `Falha: ${spellData.failure}` : '',
      spellData.criticalFailure ? `Falha Crítica: ${spellData.criticalFailure}` : '',
      spellData.heightened ? `\nIntensificado: ${spellData.heightened}` : '',
      spellData.hecosLore ? `\nLore de Hecos: ${spellData.hecosLore}` : '',
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(lines);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const subcats = Array.from(
    new Set(
      [
        ...(spellData.subcategories || []),
        ...(entity.subcategories || []),
        entity.subcategory,
      ].filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
    )
  );

  // Backlinks
  const allEntities = HecosStorage.getEntities();
  const backlinks = allEntities.filter((other) => {
    if (other.id === entity.id) return false;
    const cleanSlug = entity.slug || entity.id;
    return (
      other.content?.includes(`@${cleanSlug}`) ||
      other.content?.includes(`@${entity.id}`) ||
      other.content?.includes(`[[${entity.title}]]`)
    );
  });

  const getSpellTypeLabel = (st?: string) => {
    switch (st) {
      case 'focus':
        return 'Feitiço de Foco';
      case 'ritual':
        return 'Ritual';
      case 'cantrip':
        return 'Truque';
      case 'other':
        return 'Magia Especial';
      case 'spell':
      default:
        return spellData.rank === 0 ? 'Truque' : 'Feitiço';
    }
  };

  return (
    <div className="space-y-6">
      {/* Cover Image banner if present */}
      {entity.coverImage && (
        <div className="relative h-48 sm:h-64 w-full rounded-2xl overflow-hidden bg-[#0c0915] border border-zinc-800 shadow-xl">
          <AdjustableImage
            src={entity.coverImage}
            alt={entity.title}
            imageKey={`spell-cover-${entity.id}`}
            isGm={isActualGm}
            containerClassName="relative w-full h-full overflow-hidden bg-[#0c0915]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#09080d] via-[#09080d]/40 to-transparent pointer-events-none" />
        </div>
      )}

      {/* CARD PRINCIPAL DO FEITIÇO PF2E */}
      <div className="rounded-2xl bg-[#09080e] border border-zinc-800 shadow-2xl overflow-hidden">
        {/* CABEÇALHO DO STATBLOCK */}
        <div className="p-6 bg-gradient-to-r from-[#0c131d] via-[#0a1018] to-[#120d1c] border-b border-zinc-800/80 space-y-4">
          {/* Top Bar: Pastas/Subcategorias, Category & Quick Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Indicador de Pastas antes da Categoria */}
              {subcats.map((subcat) => (
                <button
                  key={subcat}
                  type="button"
                  onClick={() => onTagClick(subcat)}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-cyan-950/60 hover:bg-cyan-900/70 text-cyan-300 border border-cyan-700/40 transition-colors shadow-sm cursor-pointer"
                  title={`Filtrar pela pasta ${subcat}`}
                >
                  <Folder className="w-3 h-3 text-cyan-400" />
                  <span>{subcat}</span>
                </button>
              ))}

              <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase rounded-md bg-purple-950/60 text-purple-300 border border-purple-800/50">
                {getSpellTypeLabel(spellData.spellType)}
              </span>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              {isActualGm && (
                <VisibilityBadgeMenu
                  visibility={entity.visibility}
                  allowedUserIds={entity.allowedUserIds}
                  isSecret={entity.isSecret}
                  onChange={(newVis, newAllowed) => {
                    HecosStorage.setEntityVisibility(entity.id, newVis, newAllowed);
                  }}
                />
              )}

              <button
                type="button"
                onClick={handleCopyStatblock}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
                title="Copiar texto do feitiço para área de transferência"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
                <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
              </button>

              <button
                onClick={() => window.print()}
                className="p-2 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 transition-colors cursor-pointer"
                title="Imprimir / Exportar PDF"
              >
                <Printer className="w-3.5 h-3.5" />
              </button>

              {isActualGm && (
                <>
                  <button
                    onClick={onEdit}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-600/60 text-cyan-200 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                  {onDelete && (
                    <button
                      onClick={onDelete}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/90 hover:bg-rose-900 border border-rose-600/60 text-rose-200 text-xs font-bold transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Excluir</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Title Row: Title & Action Glyphs on the Left, Círculo/Rank na Extrema Direita */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl sm:text-3xl font-black text-cyan-300 tracking-tight flex items-center gap-3">
                <span>{entity.title}</span>
                {actionGlyph.show && (
                  <PF2eActionGlyph type={actionGlyph.type} size="lg" />
                )}
              </h2>
            </div>

            {/* Círculo da Magia na Extrema Direita */}
            <div className="px-3.5 py-1 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono font-bold text-sm uppercase shadow-sm shrink-0">
              {spellData.rank === 0 ? 'Truque (Rank 0)' : `${spellData.rank}º Círculo`}
            </div>
          </div>

          {entity.subtitle && (
            <p className="text-sm text-zinc-400 font-medium italic">
              {entity.subtitle}
            </p>
          )}

          {/* Traços PF2e (Iniciando pela Raridade, Tradições como Traits e outros Descritores) */}
          <div className="space-y-2 mt-3 pt-3 border-t border-zinc-800/60">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400/80 mr-1 shrink-0">
                TRAÇOS:
              </span>

              {/* Raridade */}
              <TraitBadge trait={spellData.rarity || 'Comum'} />

              {/* Tradições como Traits com Tooltip e Drawer */}
              {(spellData.traditions || []).map((trad) => (
                <TraitBadge
                  key={`trad-${trad}`}
                  trait={trad}
                />
              ))}

              {/* Outros Traços do Feitiço */}
              {(spellData.traits || [])
                .filter((t) => {
                  const low = t.toLowerCase();
                  const isRarity = low === (spellData.rarity || 'comum').toLowerCase();
                  const isTrad = (spellData.traditions || []).some((trad) => trad.toLowerCase() === low);
                  return !isRarity && !isTrad;
                })
                .map((trait) => (
                  <TraitBadge
                    key={`trait-${trait}`}
                    trait={trait}
                  />
                ))}
            </div>

            {/* Tags Temáticas / Narrativas separadas de Traits */}
            {((spellData.tags && spellData.tags.length > 0) || (entity.tags && entity.tags.length > 0)) && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 mr-1 shrink-0">
                  TAGS:
                </span>
                {Array.from(new Set([...(spellData.tags || []), ...(entity.tags || [])])).map((tag) => (
                  <button
                    key={`tag-${tag}`}
                    type="button"
                    onClick={() => onTagClick(tag)}
                    className="px-2 py-0.5 rounded-md bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/60 hover:border-purple-500/50 text-zinc-400 hover:text-purple-300 text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* METADADOS DE LANÇAMENTO (CONJURAÇÃO, ALCANCE, ALVOS, SALVAMENTO, DURAÇÃO) COM ÍNDICE DESTACADO, IDENTAÇÃO E SIMETRIA */}
        <div className="p-6 bg-[#06090e] border-b border-zinc-800/80">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2.5 text-xs sm:text-sm font-sans">
            {spellData.castTime && (
              <div className="flex items-center gap-2.5 py-1 px-2.5 rounded-lg bg-zinc-950/40 border border-zinc-800/50">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                <strong className="text-zinc-400 font-bold uppercase text-[11px] font-mono tracking-wider min-w-[90px]">
                  Conjuração:
                </strong>
                <div className="flex items-center gap-1.5 text-zinc-100 font-semibold">
                  {actionGlyph.show && (
                    <PF2eActionGlyph type={actionGlyph.type} size="sm" />
                  )}
                  <span>{spellData.castTime}</span>
                </div>
              </div>
            )}

            {spellData.range && (
              <div className="flex items-center gap-2.5 py-1 px-2.5 rounded-lg bg-zinc-950/40 border border-zinc-800/50">
                <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
                <strong className="text-zinc-400 font-bold uppercase text-[11px] font-mono tracking-wider min-w-[90px]">
                  Alcance:
                </strong>
                <span className="text-zinc-200 font-medium">{spellData.range}</span>
              </div>
            )}

            {spellData.area && (
              <div className="flex items-center gap-2.5 py-1 px-2.5 rounded-lg bg-zinc-950/40 border border-zinc-800/50">
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                <strong className="text-zinc-400 font-bold uppercase text-[11px] font-mono tracking-wider min-w-[90px]">
                  Área:
                </strong>
                <span className="text-zinc-200 font-medium">{spellData.area}</span>
              </div>
            )}

            {spellData.targets && (
              <div className="flex items-center gap-2.5 py-1 px-2.5 rounded-lg bg-zinc-950/40 border border-zinc-800/50 md:col-span-2">
                <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
                <strong className="text-zinc-400 font-bold uppercase text-[11px] font-mono tracking-wider min-w-[90px]">
                  Alvos:
                </strong>
                <span className="text-zinc-200 font-medium">{spellData.targets}</span>
              </div>
            )}

            {spellData.trigger && (
              <div className="flex items-center gap-2.5 py-1 px-2.5 rounded-lg bg-zinc-950/40 border border-yellow-800/40 md:col-span-2">
                <span className="w-2 h-2 rounded-full bg-yellow-400 shrink-0" />
                <strong className="text-zinc-400 font-bold uppercase text-[11px] font-mono tracking-wider min-w-[90px]">
                  Gatilho:
                </strong>
                <span className="text-yellow-200/90 font-medium">{spellData.trigger}</span>
              </div>
            )}

            {spellData.savingThrow && (
              <div className="flex items-center gap-2.5 py-1 px-2.5 rounded-lg bg-zinc-950/40 border border-zinc-800/50">
                <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                <strong className="text-zinc-400 font-bold uppercase text-[11px] font-mono tracking-wider min-w-[90px]">
                  Salvamento:
                </strong>
                <span className="text-rose-300 font-bold">{spellData.savingThrow}</span>
              </div>
            )}

            {spellData.duration && (
              <div className="flex items-center gap-2.5 py-1 px-2.5 rounded-lg bg-zinc-950/40 border border-zinc-800/50">
                <span className="w-2 h-2 rounded-full bg-teal-400 shrink-0" />
                <strong className="text-zinc-400 font-bold uppercase text-[11px] font-mono tracking-wider min-w-[90px]">
                  Duração:
                </strong>
                <span className="text-zinc-200 font-medium">{spellData.duration}</span>
              </div>
            )}
          </div>
        </div>

        {/* CORPO / DESCRIÇÃO DO FEITIÇO (COM RENDERIZADOR RICO) */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="text-sm sm:text-base text-zinc-200 leading-relaxed break-words">
            {spellData.description ? (
              <RichContentRenderer content={spellData.description} onNavigate={onNavigate} />
            ) : (
              <p className="text-zinc-500 italic">Nenhum efeito ou descrição cadastrada para este feitiço.</p>
            )}
          </div>

          {/* GRAUS DE SUCESSO (OPCIONAL) */}
          {(spellData.criticalSuccess || spellData.success || spellData.failure || spellData.criticalFailure) && (
            <div className="p-5 rounded-xl bg-black/40 border border-zinc-800 space-y-3">
              <h4 className="text-xs font-bold uppercase font-mono tracking-wider text-cyan-300 border-b border-zinc-800 pb-1.5 flex items-center gap-2">
                <Target className="w-4 h-4 text-cyan-400" />
                <span>Graus de Sucesso</span>
              </h4>

              <div className="grid grid-cols-1 gap-2.5 text-xs sm:text-sm">
                {spellData.criticalSuccess && (
                  <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-zinc-200">
                    <strong className="text-emerald-400 font-bold block mb-0.5">Sucesso Crítico:</strong>
                    <RichContentRenderer content={spellData.criticalSuccess} onNavigate={onNavigate} />
                  </div>
                )}

                {spellData.success && (
                  <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-800/40 text-zinc-200">
                    <strong className="text-cyan-400 font-bold block mb-0.5">Sucesso:</strong>
                    <RichContentRenderer content={spellData.success} onNavigate={onNavigate} />
                  </div>
                )}

                {spellData.failure && (
                  <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-800/40 text-zinc-200">
                    <strong className="text-amber-400 font-bold block mb-0.5">Falha:</strong>
                    <RichContentRenderer content={spellData.failure} onNavigate={onNavigate} />
                  </div>
                )}

                {spellData.criticalFailure && (
                  <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-800/40 text-zinc-200">
                    <strong className="text-rose-400 font-bold block mb-0.5">Falha Crítica:</strong>
                    <RichContentRenderer content={spellData.criticalFailure} onNavigate={onNavigate} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* INTENSIFICADO / AMPLIAÇÃO (HEIGHTENED) */}
          {spellData.heightened && (
            <div className="p-4 rounded-xl bg-[#09141c] border border-cyan-500/30 text-xs sm:text-sm text-cyan-200 space-y-2">
              <strong className="text-cyan-300 font-bold uppercase font-mono text-[11px] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Intensificado (Heightened):</span>
              </strong>
              <div className="space-y-2 pl-1 text-zinc-200">
                {(spellData.heightened.includes('\n')
                  ? spellData.heightened.split('\n')
                  : spellData.heightened.split(/(?=(?:Intensificado\s*\([^)]+\)|\(\+\d+\)|\(\d+[ºª]\)))/gi)
                )
                  .map((l) => l.trim())
                  .filter(Boolean)
                  .map((line, idx) => (
                    <div key={`view-heightened-${idx}`} className="flex items-start gap-2 text-xs sm:text-sm text-zinc-200 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 shrink-0" />
                      <div className="flex-1">
                        <RichContentRenderer content={line} onNavigate={onNavigate} />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SEÇÃO DE LORE & SEGREDO DO MESTRE EM HECOS */}
      {(spellData.hecosLore || spellData.gmNotes) && (
        <div className="p-6 rounded-2xl bg-[#09080e] border border-zinc-800 space-y-4">
          <h3 className="text-base font-bold text-[#74b6c2] flex items-center gap-2.5 font-serif border-b border-zinc-800 pb-2">
            <Scroll className="w-4 h-4 text-cyan-400" />
            <span>Contexto & Tradição no Mundo de Hecos</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm text-zinc-300">
            {spellData.hecosLore && (
              <div className="p-4 rounded-xl bg-black/40 border border-zinc-800 space-y-1">
                <h4 className="text-[11px] font-bold text-cyan-300 uppercase font-mono mb-1">
                  Origem do Encantamento
                </h4>
                <RichContentRenderer content={spellData.hecosLore} onNavigate={onNavigate} />
              </div>
            )}

            {spellData.gmNotes && (
              <div className="p-4 rounded-xl bg-[#170e1a] border border-rose-800/40 text-rose-200 space-y-1">
                <h4 className="text-[11px] font-bold text-rose-400 uppercase font-mono mb-1 flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-rose-400" />
                  <span>Segredo do Mestre / Lore Oculta</span>
                </h4>
                <RichContentRenderer content={spellData.gmNotes} onNavigate={onNavigate} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* BACKLINKS SECTION */}
      {backlinks.length > 0 && (
        <div className="pt-6 border-t border-zinc-800/80">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-cyan-400" />
            <span>Conexões no Mundo ({backlinks.length} Páginas Citam Este Feitiço)</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {backlinks.map((b) => (
              <button
                key={b.id}
                onClick={() => onNavigate(b.id)}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-[#09080e] hover:bg-[#11131c] border border-zinc-800/80 hover:border-cyan-500/50 text-left transition-all group cursor-pointer"
              >
                <div className="p-1.5 rounded-lg bg-black/50 border border-zinc-800 text-cyan-400 group-hover:text-cyan-300">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-200 group-hover:text-cyan-300 line-clamp-1">
                    {b.title}
                  </h4>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{b.category}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
