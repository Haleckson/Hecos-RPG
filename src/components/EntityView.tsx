import React from 'react';
import { HecosEntity } from '../types';
import { HecosStorage } from '../services/storage';
import { getCategoryMeta } from '../utils/categories';
import { renderContentWithMentions } from './MentionBadge';
import { RichContentRenderer } from './RichContentRenderer';
import { AncestryView } from './AncestryView';
import { FeatView } from './FeatView';
import { VisibilityBadgeMenu } from './VisibilityBadgeMenu';
import {
  Edit3,
  Trash2,
  Share2,
  Calendar,
  Tag as TagIcon,
  Skull,
  Sparkles,
  Shield,
  Heart,
  Zap,
  Lock,
  Eye,
  EyeOff,
  Compass,
  ArrowUpRight,
  Printer
} from 'lucide-react';

interface EntityViewProps {
  entity: HecosEntity;
  onEdit: () => void;
  onDelete: () => void;
  onNavigate: (id: string) => void;
  onTagClick: (tag: string) => void;
}

export const EntityView: React.FC<EntityViewProps> = ({
  entity,
  onEdit,
  onDelete,
  onNavigate,
  onTagClick,
}) => {
  const allEntities = HecosStorage.getEntities();

  // Find all backlinks (entities that mention this entity in their content)
  const backlinks = allEntities.filter((other) => {
    if (other.id === entity.id) return false;
    const cleanSlug = entity.slug || entity.id;
    return (
      other.content.includes(`@${cleanSlug}`) ||
      other.content.includes(`@${entity.id}`) ||
      other.content.includes(`[[${entity.title}]]`)
    );
  });

  const isCiano = ['pc', 'spell', 'ancestry', 'rule'].includes(entity.category);
  const isMalva = ['npc', 'item', 'flora', 'class', 'feat', 'timeline'].includes(entity.category);
  const isBordo = ['creature', 'fauna', 'organization', 'gm_note', 'archetype', 'session'].includes(entity.category);

  return (
    <div className="bg-[#09080d] text-zinc-100 rounded-2xl border border-zinc-800/80 shadow-2xl overflow-hidden">
      {/* Cover / Header Banner */}
      <div className="relative h-48 sm:h-64 w-full overflow-hidden bg-gradient-to-r from-[#170e24] via-[#09070f] to-[#200a12]">
        {entity.coverImage ? (
          <img
            src={entity.coverImage}
            alt={entity.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center opacity-40 mix-blend-luminosity hover:opacity-60 transition-opacity duration-300"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(184,119,219,0.15),transparent_60%),radial-gradient(circle_at_70%_50%,rgba(0,240,255,0.12),transparent_60%)]" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#09080d] via-[#09080d]/60 to-transparent" />

        {/* Action buttons on top of banner */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {/* 3-Level Granular Visibility Menu (Apenas GM, Todos, Compartilhamento Seletivo) */}
          <VisibilityBadgeMenu
            visibility={entity.visibility}
            allowedUserIds={entity.allowedUserIds}
            isSecret={entity.isSecret}
            onChange={(newVis, newAllowed) => {
              HecosStorage.setEntityVisibility(entity.id, newVis, newAllowed);
            }}
          />

          <button
            onClick={() => window.print()}
            className="p-2 rounded-lg bg-black/60 backdrop-blur-md border border-zinc-700/60 hover:bg-zinc-800 text-zinc-300 transition-colors"
            title="Imprimir / Exportar PDF"
          >
            <Printer className="w-4 h-4" />
          </button>
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/80 backdrop-blur-md border border-cyan-500/50 hover:bg-cyan-900 text-cyan-200 text-xs font-semibold shadow-lg transition-all"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Editar</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/90 backdrop-blur-md border border-rose-600/60 hover:bg-rose-900 text-rose-200 text-xs font-semibold shadow-lg transition-all"
            title={`Excluir "${entity.title}" do Codex`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Excluir</span>
          </button>
        </div>

        {/* Title area over banner */}
        <div className="absolute bottom-4 left-6 right-6">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span
              className={`px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-md border shadow-sm ${
                isCiano
                  ? 'bg-cyan-950/90 text-cyan-300 border-cyan-700/80'
                  : isMalva
                  ? 'bg-purple-950/90 text-purple-300 border-purple-700/80'
                  : 'bg-rose-950/90 text-rose-300 border-rose-700/80'
              }`}
            >
              {getCategoryMeta(entity.category).name.toUpperCase()}
            </span>

            {entity.isSecret ? (
              <span className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold bg-zinc-900/90 text-zinc-400 border border-zinc-700 rounded-md">
                <EyeOff className="w-3.5 h-3.5 text-zinc-400" />
                <span>CONFIDENCIAL (APENAS GM)</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold bg-amber-950/70 text-amber-300 border border-amber-600/60 rounded-md shadow-sm">
                <Eye className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                <span>PÚBLICO</span>
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-100 tracking-tight">
            {entity.title}
          </h1>
          {entity.subtitle && (
            <p className="text-sm sm:text-base text-zinc-300/90 mt-1 font-medium">
              {entity.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Meta Bar */}
      <div className="px-6 py-3 bg-[#100d18] border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
            <span>Atualizado: {new Date(entity.updatedAt).toLocaleDateString('pt-BR')}</span>
          </span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-1.5">
          <TagIcon className="w-3.5 h-3.5 text-zinc-500 mr-1" />
          {entity.tags.map((tag) => (
            <button
              key={tag}
              onClick={() => onTagClick(tag)}
              className="px-2 py-0.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-cyan-300 transition-colors"
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="p-6 sm:p-8 space-y-6">
        {/* Specialized Views for Ancestry and Feat */}
        {entity.category === 'ancestry' ? (
          <AncestryView entity={entity} onEdit={onEdit} onNavigate={onNavigate} onTagClick={onTagClick} />
        ) : entity.category === 'feat' ? (
          <FeatView
            entity={entity}
            onEdit={onEdit}
            onDelete={onDelete}
            onNavigate={onNavigate}
            onTagClick={onTagClick}
          />
        ) : (
          <>
            {/* Pathfinder 2e Statblock (if available) */}
            {entity.statblock && (
              <div className="p-5 rounded-xl bg-[#110d1a] border-2 border-purple-900/60 shadow-lg space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                      <Skull className="w-5 h-5 text-rose-500" />
                      <span>{entity.title}</span>
                      <span className="text-sm font-semibold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                        Criatura {entity.statblock.level}
                      </span>
                    </h3>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {entity.statblock.traits.map((tr) => (
                        <span
                          key={tr}
                          className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300"
                        >
                          {tr}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Core Stats Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-black/60 border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 uppercase block font-semibold">Classe de Armadura</span>
                    <span className="text-base font-extrabold text-cyan-400">{entity.statblock.ac}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-black/60 border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 uppercase block font-semibold">Pontos de Vida</span>
                    <span className="text-base font-extrabold text-rose-400">{entity.statblock.hp} PV</span>
                  </div>
                  <div className="p-2 rounded-lg bg-black/60 border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 uppercase block font-semibold">Salvamentos</span>
                    <span className="text-xs font-bold text-zinc-200">
                      F +{entity.statblock.fort} | R +{entity.statblock.ref} | V +{entity.statblock.will}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-black/60 border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 uppercase block font-semibold">Deslocamento</span>
                    <span className="text-xs font-bold text-purple-300">{entity.statblock.speed}</span>
                  </div>
                </div>

                {/* Actions List */}
                {entity.statblock.actions && entity.statblock.actions.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Ações de Combate</h4>
                    <div className="space-y-2">
                      {entity.statblock.actions.map((act) => (
                        <div
                          key={act.id}
                          className="p-3 rounded-lg bg-black/40 border border-zinc-800/80 hover:border-zinc-700 transition-colors"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 text-[11px] font-bold">
                              {act.cost === 1 ? '⬡ 1 Ação' : act.cost === 2 ? '⬢ 2 Ações' : act.cost === 3 ? '⬣ 3 Ações' : '⮌ Reação'}
                            </span>
                            <span className="text-sm font-bold text-zinc-100">{act.name}</span>
                            {act.traits && (
                              <span className="text-[10px] text-zinc-500 font-mono">({act.traits.join(', ')})</span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-300 leading-relaxed">{act.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Spell Data Box */}
            {entity.spellData && (
              <div className="p-5 rounded-xl bg-[#0b121b] border-2 border-cyan-900/60 shadow-lg space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <span className="text-sm font-bold text-cyan-300 uppercase tracking-wide flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>Grimório • Rank {entity.spellData.rank}</span>
                  </span>
                  <span className="text-xs text-zinc-400">Tradições: {entity.spellData.traditions.join(', ')}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 rounded bg-black/40 border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 block">Tempo de Conjuração</span>
                    <span className="font-semibold text-zinc-200">{entity.spellData.castTime}</span>
                  </div>
                  <div className="p-2 rounded bg-black/40 border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 block">Alcance / Área</span>
                    <span className="font-semibold text-zinc-200">{entity.spellData.range || 'Toque'}</span>
                  </div>
                  <div className="p-2 rounded bg-black/40 border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 block">Salvamento</span>
                    <span className="font-semibold text-zinc-200">{entity.spellData.savingThrow || 'Nenhum'}</span>
                  </div>
                  <div className="p-2 rounded bg-black/40 border border-zinc-800">
                    <span className="text-[10px] text-zinc-500 block">Traços</span>
                    <span className="font-semibold text-cyan-400">{entity.spellData.traits.join(', ')}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Main Markdown / HTML Content with Mentions & Notion blocks */}
            <div className="pt-2">
              <RichContentRenderer content={entity.content} onNavigate={onNavigate} />
            </div>
          </>
        )}

        {/* Backlinks Section (Notion / Obsidian / World Anvil style) */}
        {backlinks.length > 0 && (
          <div className="mt-8 pt-6 border-t border-zinc-800/80">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-purple-400" />
              <span>Conexões no Mundo ({backlinks.length} Páginas Citam Esta Entrada)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {backlinks.map((b) => (
                <button
                  key={b.id}
                  onClick={() => onNavigate(b.id)}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-[#110e19] hover:bg-[#191425] border border-zinc-800/80 hover:border-purple-500/50 text-left transition-all group"
                >
                  <div className="p-1.5 rounded-lg bg-black/50 border border-zinc-800 text-purple-400 group-hover:text-cyan-300">
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
    </div>
  );
};
