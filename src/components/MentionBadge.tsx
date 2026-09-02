import React, { useState } from 'react';
import { HecosEntity } from '../types';
import { HecosStorage } from '../services/storage';
import { entityIndexService } from '../services/entityIndexService';
import { Skull, Sparkles, Gem, Compass, User, Users, Lock, BookOpen, ExternalLink, Shield, Trash2, Check, Copy } from 'lucide-react';
import { PF2eActionGlyph, ActionGlyphType } from './PF2eActionGlyph';
import { Tooltip } from './Tooltip';
import { PerilTooltipCard } from './PerilTooltipCard';
import { TraitBadge } from './TraitBadge';

export interface MentionBadgeProps {
  entityIdOrSlug: string;
  onNavigate?: (entityId: string) => void;
  displayText?: string;
  onRemove?: () => void;
  inEditor?: boolean;
  className?: string;
}

export const MentionBadge: React.FC<MentionBadgeProps> = ({
  entityIdOrSlug,
  onNavigate,
  displayText,
  onRemove,
  inEditor = false,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);
  const cleanIdOrSlug = String(entityIdOrSlug || '').replace(/^@/, '').trim();
  const cleanSlugLower = cleanIdOrSlug.toLowerCase();
  const allEntities = HecosStorage.getEntities();
  
  // Match by id, slug, or title
  let entity = allEntities.find(
    e => (e.id || '').toLowerCase() === cleanSlugLower ||
         (e.slug || '').toLowerCase() === cleanSlugLower ||
         (e.title || '').toLowerCase() === cleanSlugLower ||
         (e.title || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') === cleanSlugLower
  );

  // Fallback to indexed search
  if (!entity) {
    const indexed = entityIndexService.findBySlugOrTitle(cleanIdOrSlug) || (displayText ? entityIndexService.findBySlugOrTitle(displayText) : undefined);
    if (indexed) {
      entity = allEntities.find(e => e.id === indexed.id) || {
        id: indexed.id,
        slug: indexed.slug,
        title: indexed.title,
        category: indexed.category,
        subtitle: indexed.subtitle,
        summary: indexed.summary,
        tags: indexed.tags,
        icon: indexed.icon,
        isSecret: indexed.isSecret,
      } as HecosEntity;
    }
  }

  // Category styling
  const category = entity?.category || 'rule';
  const isCiano = ['pc', 'spell', 'ancestry', 'rule'].includes(category);
  const isMalva = ['npc', 'item', 'flora', 'class', 'feat', 'timeline'].includes(category);
  const isBordo = ['creature', 'fauna', 'organization', 'gm_note', 'archetype', 'session', 'peril'].includes(category);

  const themeClasses = isCiano
    ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/50 hover:bg-cyan-900/70 hover:border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.18)]'
    : isMalva
    ? 'bg-purple-950/60 text-purple-300 border-purple-500/50 hover:bg-purple-900/70 hover:border-purple-400 shadow-[0_0_10px_rgba(184,119,219,0.18)]'
    : 'bg-rose-950/60 text-rose-300 border-rose-600/50 hover:bg-rose-900/70 hover:border-rose-500 shadow-[0_0_10px_rgba(190,18,60,0.18)]';

  const getEntityIcon = (cat: string) => {
    switch (cat) {
      case 'peril':
      case 'creature': return <Skull className="w-3.5 h-3.5" />;
      case 'spell': return <Sparkles className="w-3.5 h-3.5" />;
      case 'item': return <Gem className="w-3.5 h-3.5" />;
      case 'location': return <Compass className="w-3.5 h-3.5" />;
      case 'pc': return <Users className="w-3.5 h-3.5" />;
      case 'npc': return <User className="w-3.5 h-3.5" />;
      case 'organization': return <Shield className="w-3.5 h-3.5" />;
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
    if (onNavigate && entity?.id) {
      onNavigate(entity.id);
    }
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const tag = entity ? `@[${entity.title}](${entity.id})` : `@[${displayText || cleanIdOrSlug}](${cleanIdOrSlug})`;
    navigator.clipboard.writeText(tag);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const titleToShow = displayText || entity?.title || cleanIdOrSlug;

  if (!entity) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 my-0.5 rounded-md bg-zinc-900/90 border border-zinc-700/80 text-zinc-300 text-xs sm:text-sm font-medium ${className}`}>
        <span className="text-cyan-400 font-bold text-xs">@</span>
        <span>{titleToShow}</span>
        {onRemove && inEditor && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove();
            }}
            title="Remover menção"
            className="ml-1 p-0.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-rose-400 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </span>
    );
  }

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
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 my-0.5 rounded-md border font-medium text-xs sm:text-sm transition-all duration-150 cursor-pointer select-none group/badge ${themeClasses} ${className}`}
    >
      <span className="opacity-80 shrink-0">{getEntityIcon(entity.category)}</span>
      <span className="truncate max-w-[220px]">{titleToShow}</span>
      <ExternalLink className="w-3 h-3 opacity-60 ml-0.5 shrink-0 group-hover/badge:opacity-100 transition-opacity" />
      {onRemove && inEditor && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          title="Remover menção"
          className="ml-0.5 p-0.5 hover:bg-black/40 rounded text-zinc-400 hover:text-rose-300 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </span>
  );

  // If this entity is a Peril or Creature, use the rich PerilTooltipCard
  if (entity.category === 'peril' || entity.category === 'creature' || entity.perilData) {
    return (
      <Tooltip
        as="span"
        content={<PerilTooltipCard peril={entity} onSelectEntity={onNavigate || (() => {})} />}
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

      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-zinc-800/80">
        <button
          type="button"
          onClick={handleBadgeClick}
          className="flex-1 py-1.5 px-2.5 text-xs font-semibold text-center rounded-lg bg-zinc-800 hover:bg-cyan-950 hover:text-cyan-200 border border-zinc-700 hover:border-cyan-500/50 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
        >
          <span>Abrir Painel Lateral</span>
          <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
        </button>
        <button
          type="button"
          onClick={handleCopyLink}
          title="Copiar tag de menção"
          className="p-1.5 text-xs rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
        </button>
        {onRemove && inEditor && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove();
            }}
            title="Remover menção do texto"
            className="p-1.5 text-xs rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <Tooltip
      as="span"
      content={genericPreviewCard}
      placement="top"
      delay={160}
    >
      {badgeTrigger}
    </Tooltip>
  );
};

/**
 * Robust inline formatting parser for Markdown (**bold**, *italic*, ~~strike~~, ++underline++, `code`),
 * HTML tags (<span>, <mark>, <b>, <i>, <u>, <strong>, <em>, <font>), colors, traits, action glyphs,
 * and mentions ( @[Title](id), [[Title]], and @slug ).
 */
export function parseInlineFormatting(
  text: string,
  onNavigate?: (entityId: string) => void,
  options?: { inEditor?: boolean; onRemoveMention?: (rawMatch: string) => void }
): React.ReactNode {
  if (!text) return null;

  // Unified inline token regex covering:
  // 1. Action glyphs: [1-action], [2-actions], [3-actions], etc.
  // 2. Mention markdown: @[Title](id) -> @\[[^\]\n]+\]\([^)\n]+\)
  // 3. Wikilinks/traits: [[trait:Name]] or [[Article Name]]
  // 4. Trait shortcuts: [trait:Name] or [tr:Name]
  // 5. Short mentions: @slug
  // 6. HTML tags
  // 7. Markdown bold, underline, strikethrough, code, italic
  const tokenRegex = /(<p\b[^>]*>[\s\S]*?<\/p>|<div\b[^>]*>[\s\S]*?<\/div>|<span[^>]*>[\s\S]*?<\/span>|<mark[^>]*>[\s\S]*?<\/mark>|<(?:b|strong|i|em|u|del|s|code|font)[^>]*>[\s\S]*?<\/(?:b|strong|i|em|u|del|s|code|font)>|<br\s*\/?>|<\/p>|<p\b[^>]*>|\[(?:1-action|2-actions|3-actions|1-to-2-actions|1-to-3-actions|one-action|two-actions|three-actions|one-to-two-actions|one-to-three-actions|free-action|reaction|1-acao|2-acoes|3-acoes|acao-livre|reacao|1|2|3|r|f)\]|@\[[^\]\n]+\]\([^)\n]+\)|\[\[(?:trait:|tr:)?[\s\S]+?\]\]|\[(?:trait:|tr:)[\s\S]+?\]|@[a-zA-Z0-9_-]+|\*\*(?:[^*]|\*(?!\*))+\*\*|__(?:[^_]|_(?!_))+__|(?:\+\+(?:[^+]|\+(?!\+))+\+\+)|~~(?:[^~]|~(?!~))+~~|`[^`]+`|\*(?:[^*\n])+\*|_(?:[^_\n])+_)/gi;

  const parts = text.split(tokenRegex);

  return parts.map((part, idx) => {
    if (!part) return null;

    // 0. Standalone HTML paragraph or break tags
    if (/^<br\s*\/?>$/i.test(part)) {
      return <br key={idx} />;
    }
    if (/^<\/?p\b[^>]*>$/i.test(part)) {
      return null;
    }

    // 1. Explicit mention format: @[Nome do Artigo](id_do_artigo)
    const atBracketMatch = part.match(/^@\[([^\]]+)\]\(([^)]+)\)$/);
    if (atBracketMatch) {
      const displayText = atBracketMatch[1];
      const entityIdOrSlug = atBracketMatch[2];
      return (
        <MentionBadge
          key={idx}
          entityIdOrSlug={entityIdOrSlug}
          displayText={displayText}
          onNavigate={onNavigate}
          inEditor={options?.inEditor}
          onRemove={options?.onRemoveMention ? () => options.onRemoveMention!(part) : undefined}
        />
      );
    }

    // 2. PF2e Action Glyphs [1-action], [2-actions], etc.
    if (part.startsWith('[') && part.endsWith(']') && !part.startsWith('[[')) {
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

    // 3. Wikilinks [[Article Name]] or [[trait:Name]]
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
      return (
        <MentionBadge
          key={idx}
          entityIdOrSlug={inner}
          displayText={inner}
          onNavigate={onNavigate}
          inEditor={options?.inEditor}
          onRemove={options?.onRemoveMention ? () => options.onRemoveMention!(part) : undefined}
        />
      );
    }

    // 4. Short Mentions: @slug
    if (part.startsWith('@') && part.length > 1 && !part.startsWith('@[') && !part.includes('(')) {
      const slug = part.substring(1);
      return (
        <MentionBadge
          key={idx}
          entityIdOrSlug={slug}
          onNavigate={onNavigate}
          inEditor={options?.inEditor}
          onRemove={options?.onRemoveMention ? () => options.onRemoveMention!(part) : undefined}
        />
      );
    }

    // 5. HTML tags (p, div, span with style, mark, u, b, strong, i, em, del, code, font)
    if (/^<(p|div|span|mark|b|strong|i|em|u|del|s|code|font)[^>]*>[\s\S]*<\/\1>$/i.test(part)) {
      return <span key={idx} dangerouslySetInnerHTML={{ __html: part }} />;
    }

    // 6. Markdown Bold: **text** or __text__
    if (
      (part.startsWith('**') && part.endsWith('**') && part.length >= 4) ||
      (part.startsWith('__') && part.endsWith('__') && part.length >= 4)
    ) {
      const inner = part.slice(2, -2);
      return (
        <strong key={idx} className="font-bold text-zinc-100 drop-shadow-sm">
          {parseInlineFormatting(inner, onNavigate, options)}
        </strong>
      );
    }

    // 7. Markdown Underline: ++text++
    if (part.startsWith('++') && part.endsWith('++') && part.length >= 4) {
      const inner = part.slice(2, -2);
      return (
        <u key={idx} className="underline decoration-zinc-400 decoration-1 underline-offset-2">
          {parseInlineFormatting(inner, onNavigate, options)}
        </u>
      );
    }

    // 8. Markdown Strikethrough: ~~text~~
    if (part.startsWith('~~') && part.endsWith('~~') && part.length >= 4) {
      const inner = part.slice(2, -2);
      return (
        <del key={idx} className="line-through text-zinc-500">
          {parseInlineFormatting(inner, onNavigate, options)}
        </del>
      );
    }

    // 9. Markdown Inline Code: `text`
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

    // 10. Markdown Italic: *text* or _text_
    if (
      (part.startsWith('*') && part.endsWith('*') && part.length >= 2) ||
      (part.startsWith('_') && part.endsWith('_') && part.length >= 2)
    ) {
      const inner = part.slice(1, -1);
      return (
        <em key={idx} className="italic text-zinc-300">
          {parseInlineFormatting(inner, onNavigate, options)}
        </em>
      );
    }

    return part;
  });
}

/**
 * Parser that formats markdown, @[Title](id), [[slug]], @slug, [trait:Nome], HTML blocks, and [action] glyphs in text
 */
export function renderContentWithMentions(
  content: string,
  onNavigate?: (entityId: string) => void,
  options?: { inEditor?: boolean; onRemoveMention?: (rawMatch: string) => void }
): React.ReactNode {
  if (!content) return null;
  return <>{parseInlineFormatting(content, onNavigate, options)}</>;
}
