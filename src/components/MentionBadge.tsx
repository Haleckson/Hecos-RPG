import React from 'react';
import { HecosEntity } from '../types';
import { HecosStorage } from '../services/storage';
import { Skull, Sparkles, Gem, Compass, User, Users, Lock, BookOpen, ExternalLink, Shield } from 'lucide-react';
import { PF2eActionGlyph, ActionGlyphType } from './PF2eActionGlyph';
import { Tooltip } from './Tooltip';
import { PerilTooltipCard } from './PerilTooltipCard';

interface MentionBadgeProps {
  entityIdOrSlug: string;
  onNavigate: (entityId: string) => void;
  displayText?: string;
}

export const MentionBadge: React.FC<MentionBadgeProps> = ({ entityIdOrSlug, onNavigate, displayText }) => {
  const cleanSlug = String(entityIdOrSlug || '').replace(/^@/, '').toLowerCase().trim();
  const allEntities = HecosStorage.getEntities();
  
  // Match by id, slug, or title
  const entity = allEntities.find(
    e => (e.id || '').toLowerCase() === cleanSlug ||
         (e.slug || '').toLowerCase() === cleanSlug ||
         (e.title || '').toLowerCase() === cleanSlug ||
         (e.title || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') === cleanSlug
  );

  if (!entity) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 text-sm font-medium">
        @{displayText || entityIdOrSlug}
      </span>
    );
  }

  // Category styling
  const isCiano = ['pc', 'spell', 'ancestry', 'rule'].includes(entity.category);
  const isMalva = ['npc', 'item', 'flora', 'class', 'feat', 'timeline'].includes(entity.category);
  const isBordo = ['creature', 'fauna', 'organization', 'gm_note', 'archetype', 'session', 'peril'].includes(entity.category);

  const themeClasses = isCiano
    ? 'bg-cyan-950/40 text-cyan-300 border-cyan-500/40 hover:bg-cyan-900/60 hover:border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.15)]'
    : isMalva
    ? 'bg-purple-950/40 text-purple-300 border-purple-500/40 hover:bg-purple-900/60 hover:border-purple-400 shadow-[0_0_8px_rgba(184,119,219,0.15)]'
    : 'bg-rose-950/40 text-rose-300 border-rose-600/40 hover:bg-rose-900/60 hover:border-rose-500 shadow-[0_0_8px_rgba(190,18,60,0.15)]';

  const getEntityIcon = (cat: string) => {
    switch (cat) {
      case 'peril':
      case 'creature': return <Skull className="w-3.5 h-3.5" />;
      case 'spell': return <Sparkles className="w-3.5 h-3.5" />;
      case 'item': return <Gem className="w-3.5 h-3.5" />;
      case 'location': return <Compass className="w-3.5 h-3.5" />;
      case 'pc': return <Users className="w-3.5 h-3.5" />;
      case 'npc': return <User className="w-3.5 h-3.5" />;
      case 'gm_note': return <Lock className="w-3.5 h-3.5" />;
      default: return <BookOpen className="w-3.5 h-3.5" />;
    }
  };

  const handleBadgeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (entity) {
      window.dispatchEvent(
        new CustomEvent('hecos:open-entity-drawer', {
          detail: { entityId: entity.id, slug: entity.slug }
        })
      );
    }
  };

  const badgeTrigger = (
    <span
      role="button"
      tabIndex={0}
      onClick={handleBadgeClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleBadgeClick(e as unknown as React.MouseEvent);
        }
      }}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border font-medium text-xs sm:text-sm transition-all duration-150 cursor-pointer select-none ${themeClasses}`}
    >
      <span className="opacity-80">{getEntityIcon(entity.category)}</span>
      <span>{displayText || entity.title}</span>
      <ExternalLink className="w-3 h-3 opacity-60 ml-0.5" />
    </span>
  );

  // If this entity is a Peril or Creature, use the rich PerilTooltipCard
  if (entity.category === 'peril' || entity.category === 'creature' || entity.perilData) {
    return (
      <Tooltip
        content={<PerilTooltipCard peril={entity} onSelectEntity={onNavigate} />}
        placement="top"
        delay={160}
      >
        {badgeTrigger}
      </Tooltip>
    );
  }

  // Generic preview tooltip for spells, items, NPCs, locations, etc.
  const genericPreviewCard = (
    <div className="w-80 max-w-[90vw] p-3.5 rounded-xl bg-[#0e0c15] border border-zinc-800 shadow-2xl text-left pointer-events-auto">
      {/* Header with category and title */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${
            isCiano ? 'bg-cyan-950 text-cyan-300 border-cyan-800' :
            isMalva ? 'bg-purple-950 text-purple-300 border-purple-800' :
            'bg-rose-950 text-rose-300 border-rose-900'
          }`}>
            {entity.category.toUpperCase()} {entity.statblock ? `• Nível ${entity.statblock.level}` : ''}
          </span>
          <div className="text-sm font-semibold text-zinc-100 mt-1 line-clamp-1">{entity.title}</div>
          {entity.subtitle && (
            <div className="text-xs text-zinc-400 line-clamp-1">{entity.subtitle}</div>
          )}
        </div>
      </div>

      {entity.statblock && (
        <div className="grid grid-cols-4 gap-1 p-1.5 my-2 rounded bg-black/60 border border-zinc-800/80 text-center text-xs">
          <div>
            <span className="text-[10px] text-zinc-500 block">CA</span>
            <span className="font-bold text-cyan-400">{entity.statblock.ac}</span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 block">PV</span>
            <span className="font-bold text-rose-400">{entity.statblock.hp}</span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 block">VEL</span>
            <span className="font-bold text-purple-400">{entity.statblock.speed || '25 ft'}</span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 block">PER</span>
            <span className="font-bold text-zinc-300">+{entity.statblock.perception || 0}</span>
          </div>
        </div>
      )}

      {entity.spellData && (
        <div className="flex items-center gap-2 p-1.5 my-2 rounded bg-black/60 border border-cyan-900/40 text-xs">
          <span className="text-cyan-400 font-bold">Rank {entity.spellData.rank}</span>
          <span className="text-zinc-400">• {entity.spellData.castTime}</span>
          <span className="text-zinc-500 text-[10px] ml-auto">{(entity.spellData.traditions || []).join(', ')}</span>
        </div>
      )}

      {/* Summary */}
      <div className="text-xs text-zinc-300 line-clamp-2 my-2 leading-relaxed">
        {entity.summary || 'Sem resumo cadastrado.'}
      </div>

      {/* Tags */}
      {(entity.tags || []).length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-zinc-800/80">
          {(entity.tags || []).slice(0, 4).map(t => (
            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
              #{t}
            </span>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={handleBadgeClick}
        className="w-full mt-3 py-1.5 px-2.5 text-xs font-semibold text-center rounded-lg bg-zinc-800 hover:bg-cyan-950 hover:text-cyan-200 border border-zinc-700 hover:border-cyan-500/50 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
      >
        <span>Ver Artigo Completo no Painel</span>
        <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
      </button>
    </div>
  );

  return (
    <Tooltip
      content={genericPreviewCard}
      placement="top"
      delay={160}
    >
      {badgeTrigger}
    </Tooltip>
  );
};

/**
 * Helper to parse inline markdown formatting (**bold**, *italic*, ~~strike~~, `code`, <tag>)
 */
/**
 * Robust inline formatting parser for Markdown (**bold**, *italic*, ~~strike~~, ++underline++, `code`),
 * HTML tags (<span>, <mark>, <b>, <i>, <u>, <strong>, <em>, <font>), colors, traits, and action glyphs.
 */
function parseInlineFormatting(
  text: string,
  onNavigate?: (entityId: string) => void
): React.ReactNode {
  if (!text) return null;

  // Unified inline token regex covering:
  // 1. Action glyphs: [1-action], [2-actions], [3-actions], [free-action], [reaction], [1-acao], [2-acoes], etc.
  // 2. Wikilinks/traits: [[trait:Name]] or [[Article Name]]
  // 3. Trait shortcuts: [trait:Name] or [tr:Name]
  // 4. Mentions: @slug
  // 5. HTML tags: <span style="...">...</span>, <mark>...</mark>, <b/i/u/strong/em/del/code>...
  // 6. Markdown bold: **...** or __...__
  // 7. Markdown underline: ++...++
  // 8. Markdown strikethrough: ~~...~~
  // 9. Markdown inline code: `...`
  // 10. Markdown italic: *...* or _..._
  const tokenRegex = /(<span[^>]*>[\s\S]*?<\/span>|<mark[^>]*>[\s\S]*?<\/mark>|<(?:b|strong|i|em|u|del|s|code|font)[^>]*>[\s\S]*?<\/(?:b|strong|i|em|u|del|s|code|font)>|\[(?:1-action|2-actions|3-actions|1-to-2-actions|1-to-3-actions|one-action|two-actions|three-actions|one-to-two-actions|one-to-three-actions|free-action|reaction|1-acao|2-acoes|3-acoes|acao-livre|reacao|1|2|3|r|f)\]|\[\[(?:trait:|tr:)?[\s\S]+?\]\]|\[(?:trait:|tr:)[\s\S]+?\]|@[a-zA-Z0-9_-]+|\*\*(?:[^*]|\*(?!\*))+\*\*|__(?:[^_]|_(?!_))+__|(?:\+\+(?:[^+]|\+(?!\+))+\+\+)|~~(?:[^~]|~(?!~))+~~|`[^`]+`|\*(?:[^*\n])+\*|_(?:[^_\n])+_)/gi;

  const parts = text.split(tokenRegex);

  return parts.map((part, idx) => {
    if (!part) return null;

    // 1. PF2e Action Glyphs [1-action], [2-actions], etc.
    if (part.startsWith('[') && part.endsWith(']')) {
      const inner = part.slice(1, -1).trim().toLowerCase();
      
      let actionType: ActionGlyphType | null = null;
      if (['1-action', 'one-action', '1-acao', '1'].includes(inner)) actionType = '1-action';
      else if (['2-actions', 'two-actions', '2-acoes', '2'].includes(inner)) actionType = '2-actions';
      else if (['3-actions', 'three-actions', '3-acoes', '3'].includes(inner)) actionType = '3-actions';
      else if (['1-to-2-actions', 'one-to-two-actions', '1-to-2'].includes(inner)) actionType = '1-to-2-actions';
      else if (['1-to-3-actions', 'one-to-three-actions', '1-to-3'].includes(inner)) actionType = '1-to-3-actions';
      else if (['free-action', 'acao-livre', 'free', 'f'].includes(inner)) actionType = 'free-action';
      else if (['reaction', 'reacao', 'r'].includes(inner)) actionType = 'reaction';

      if (actionType) {
        return (
          <span key={idx} className="inline-flex mx-0.5 align-baseline">
            <PF2eActionGlyph type={actionType} size="sm" />
          </span>
        );
      }

      // Traits in [trait:Name] or [tr:Name]
      if (inner.startsWith('trait:') || inner.startsWith('tr:')) {
        const traitName = part.slice(1, -1).replace(/^(?:trait:|tr:)/i, '').trim();
        return (
          <span key={idx} className="inline-flex mx-0.5 align-baseline">
            <TraitBadge trait={traitName} />
          </span>
        );
      }
    }

    // 2. Wikilinks [[Article Name]] or [[trait:Name]]
    if (part.startsWith('[[') && part.endsWith(']]')) {
      const inner = part.slice(2, -2).trim();
      if (inner.toLowerCase().startsWith('trait:') || inner.toLowerCase().startsWith('tr:')) {
        const traitName = inner.replace(/^(?:trait:|tr:)/i, '').trim();
        return (
          <span key={idx} className="inline-flex mx-0.5 align-baseline">
            <TraitBadge trait={traitName} />
          </span>
        );
      }
      if (onNavigate) {
        return <MentionBadge key={idx} entityIdOrSlug={inner} onNavigate={onNavigate} displayText={inner} />;
      }
      return (
        <span key={idx} className="font-semibold text-cyan-300 underline decoration-cyan-500/40">
          {inner}
        </span>
      );
    }

    // 3. Mentions @slug
    if (part.startsWith('@') && part.length > 1) {
      const slug = part.substring(1);
      if (onNavigate) {
        return <MentionBadge key={idx} entityIdOrSlug={slug} onNavigate={onNavigate} />;
      }
      return (
        <span key={idx} className="font-semibold text-cyan-300">
          @{slug}
        </span>
      );
    }

    // 4. HTML tags (span with style, mark, u, b, strong, i, em, del, code, font)
    if (/^<(span|mark|b|strong|i|em|u|del|s|code|font)[^>]*>[\s\S]*<\/\1>$/i.test(part)) {
      return <span key={idx} dangerouslySetInnerHTML={{ __html: part }} />;
    }

    // 5. Markdown Bold: **text** or __text__
    if (
      (part.startsWith('**') && part.endsWith('**') && part.length >= 4) ||
      (part.startsWith('__') && part.endsWith('__') && part.length >= 4)
    ) {
      const inner = part.slice(2, -2);
      return (
        <strong key={idx} className="font-bold text-zinc-100 drop-shadow-sm">
          {parseInlineFormatting(inner, onNavigate)}
        </strong>
      );
    }

    // 6. Markdown Underline: ++text++
    if (part.startsWith('++') && part.endsWith('++') && part.length >= 4) {
      const inner = part.slice(2, -2);
      return (
        <u key={idx} className="underline decoration-zinc-400 decoration-1 underline-offset-2">
          {parseInlineFormatting(inner, onNavigate)}
        </u>
      );
    }

    // 7. Markdown Strikethrough: ~~text~~
    if (part.startsWith('~~') && part.endsWith('~~') && part.length >= 4) {
      const inner = part.slice(2, -2);
      return (
        <del key={idx} className="line-through text-zinc-500">
          {parseInlineFormatting(inner, onNavigate)}
        </del>
      );
    }

    // 8. Markdown Inline Code: `text`
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      const inner = part.slice(1, -1);
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 mx-0.5 rounded bg-black/60 border border-zinc-700/60 font-mono text-cyan-300 text-xs"
        >
          {inner}
        </code>
      );
    }

    // 9. Markdown Italic: *text* or _text_
    if (
      (part.startsWith('*') && part.endsWith('*') && part.length >= 2) ||
      (part.startsWith('_') && part.endsWith('_') && part.length >= 2)
    ) {
      const inner = part.slice(1, -1);
      return (
        <em key={idx} className="italic text-zinc-300">
          {parseInlineFormatting(inner, onNavigate)}
        </em>
      );
    }

    return part;
  });
}

import { TraitBadge } from './TraitBadge';

/**
 * Parser that formats markdown, @slug, [[slug]], [trait:Nome], HTML blocks, and [action] glyphs in text
 */
export function renderContentWithMentions(
  content: string,
  onNavigate: (entityId: string) => void
): React.ReactNode {
  if (!content) return null;
  return <>{parseInlineFormatting(content, onNavigate)}</>;
}
