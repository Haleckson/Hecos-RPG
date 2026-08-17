import React, { useState } from 'react';
import { HecosEntity } from '../types';
import { HecosStorage } from '../services/storage';
import { Skull, Sparkles, Gem, Compass, User, Users, Lock, BookOpen, ExternalLink, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PF2eActionGlyph, ActionGlyphType } from './PF2eActionGlyph';

interface MentionBadgeProps {
  entityIdOrSlug: string;
  onNavigate: (entityId: string) => void;
  displayText?: string;
}

export const MentionBadge: React.FC<MentionBadgeProps> = ({ entityIdOrSlug, onNavigate, displayText }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

  const cleanSlug = entityIdOrSlug.replace(/^@/, '').toLowerCase().trim();
  const allEntities = HecosStorage.getEntities();
  
  // Match by id, slug, or title
  const entity = allEntities.find(
    e => e.id.toLowerCase() === cleanSlug ||
         e.slug.toLowerCase() === cleanSlug ||
         e.title.toLowerCase() === cleanSlug ||
         e.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') === cleanSlug
  );

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoverPos({
      x: rect.left,
      y: rect.bottom + 8
    });
    setIsHovered(true);
  };

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
  const isBordo = ['creature', 'fauna', 'organization', 'gm_note', 'archetype', 'session'].includes(entity.category);

  const themeClasses = isCiano
    ? 'bg-cyan-950/40 text-cyan-300 border-cyan-500/40 hover:bg-cyan-900/60 hover:border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.15)]'
    : isMalva
    ? 'bg-purple-950/40 text-purple-300 border-purple-500/40 hover:bg-purple-900/60 hover:border-purple-400 shadow-[0_0_8px_rgba(184,119,219,0.15)]'
    : 'bg-rose-950/40 text-rose-300 border-rose-600/40 hover:bg-rose-900/60 hover:border-rose-500 shadow-[0_0_8px_rgba(190,18,60,0.15)]';

  const getEntityIcon = (cat: string) => {
    switch (cat) {
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

  return (
    <span className="relative inline-block my-0.5">
      <button
        type="button"
        onClick={() => onNavigate(entity.id)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsHovered(false)}
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border font-medium text-xs sm:text-sm transition-all duration-150 cursor-pointer ${themeClasses}`}
      >
        <span className="opacity-80">{getEntityIcon(entity.category)}</span>
        <span>{displayText || entity.title}</span>
        <ExternalLink className="w-3 h-3 opacity-60 ml-0.5" />
      </button>

      {/* Hover Preview Card Popup */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="fixed z-50 w-80 max-w-[90vw] p-3.5 rounded-xl bg-[#0e0c15]/95 backdrop-blur-md border border-zinc-800 shadow-2xl text-left pointer-events-auto"
            style={{
              top: Math.min(hoverPos.y, window.innerHeight - 300),
              left: Math.min(hoverPos.x, window.innerWidth - 330)
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Header with cover or icon */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${
                  isCiano ? 'bg-cyan-950 text-cyan-300 border-cyan-800' :
                  isMalva ? 'bg-purple-950 text-purple-300 border-purple-800' :
                  'bg-rose-950 text-rose-300 border-rose-900'
                }`}>
                  {entity.category.toUpperCase()} {entity.statblock ? `• Nível ${entity.statblock.level}` : ''}
                </span>
                <h4 className="text-sm font-semibold text-zinc-100 mt-1 line-clamp-1">{entity.title}</h4>
                {entity.subtitle && (
                  <p className="text-xs text-zinc-400 line-clamp-1">{entity.subtitle}</p>
                )}
              </div>
            </div>

            {/* Quick Stat Bar */}
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
                <span className="text-zinc-500 text-[10px] ml-auto">{entity.spellData.traditions.join(', ')}</span>
              </div>
            )}

            {/* Summary */}
            <p className="text-xs text-zinc-300 line-clamp-2 my-2 leading-relaxed">
              {entity.summary || 'Sem resumo cadastrado.'}
            </p>

            {/* Tags */}
            {entity.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-zinc-800/80">
                {entity.tags.slice(0, 4).map(t => (
                  <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                    #{t}
                  </span>
                ))}
              </div>
            )}

            <button
              onClick={() => onNavigate(entity.id)}
              className="w-full mt-3 py-1 px-2 text-xs font-semibold text-center rounded bg-zinc-800 hover:bg-cyan-900 hover:text-cyan-200 transition-colors flex items-center justify-center gap-1"
            >
              <span>Abrir Artigo de Hecos</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
};

/**
 * Helper to parse inline markdown formatting (**bold**, *italic*, ~~strike~~, `code`, <tag>)
 */
function parseInlineFormatting(text: string): React.ReactNode {
  if (!text) return null;

  // If contains HTML tags like <span>, <mark>, <u>, <b>, <i>, <strong>, <em>, <font>
  if (/<(span|mark|u|b|i|strong|em|font|del|sub|sup|code)[^>]*>.*?<\/\1>/i.test(text)) {
    return <span dangerouslySetInnerHTML={{ __html: text }} />;
  }

  // Regex to split by **bold**, *italic*, ~~strike~~, and `code`
  const inlineRegex = /(\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~|`[^`]+`)/g;
  const chunks = text.split(inlineRegex);

  return chunks.map((chunk, idx) => {
    if (chunk.startsWith('**') && chunk.endsWith('**') && chunk.length >= 4) {
      return (
        <strong key={idx} className="font-bold text-zinc-100">
          {chunk.slice(2, -2)}
        </strong>
      );
    }
    if (chunk.startsWith('*') && chunk.endsWith('*') && chunk.length >= 2) {
      return (
        <em key={idx} className="italic text-zinc-300">
          {chunk.slice(1, -1)}
        </em>
      );
    }
    if (chunk.startsWith('~~') && chunk.endsWith('~~') && chunk.length >= 4) {
      return (
        <del key={idx} className="line-through text-zinc-500">
          {chunk.slice(2, -2)}
        </del>
      );
    }
    if (chunk.startsWith('`') && chunk.endsWith('`') && chunk.length >= 2) {
      return (
        <code key={idx} className="px-1.5 py-0.5 mx-0.5 rounded bg-black/60 border border-zinc-700/60 font-mono text-cyan-300 text-xs">
          {chunk.slice(1, -1)}
        </code>
      );
    }
    return chunk;
  });
}

/**
 * Parser that replaces @slug, [[slug]] mentions, HTML blocks, and [action] glyphs in text
 */
export function renderContentWithMentions(
  content: string,
  onNavigate: (entityId: string) => void
): React.ReactNode[] {
  if (!content) return [];

  // Match mentions: @slug, [[slug]], and action glyphs: [1-action], [2-actions], [3-actions], [1-to-2-actions], [1-to-3-actions], [free-action], [reaction], etc.
  const patternRegex = /(@[a-zA-Z0-9_-]+|\[\[[a-zA-Z0-9\s_-]+\]\]|\[(?:1-action|2-actions|3-actions|1-to-2-actions|1-to-3-actions|one-action|two-actions|three-actions|one-to-two-actions|one-to-three-actions|free-action|reaction|1-acao|2-acoes|3-acoes|acao-livre|reacao)\])/gi;
  const parts = content.split(patternRegex);

  return parts.map((part, index) => {
    if (part.startsWith('@')) {
      const slug = part.substring(1);
      return <MentionBadge key={index} entityIdOrSlug={slug} onNavigate={onNavigate} />;
    } else if (part.startsWith('[[') && part.endsWith(']]')) {
      const slug = part.substring(2, part.length - 2).trim();
      return <MentionBadge key={index} entityIdOrSlug={slug} onNavigate={onNavigate} displayText={slug} />;
    }

    // Check for PF2e Action tag [1-action], [2-actions], etc.
    if (part.startsWith('[') && part.endsWith(']')) {
      const rawAction = part.substring(1, part.length - 1).toLowerCase();
      let actionType: ActionGlyphType | null = null;
      if (rawAction === '1-action' || rawAction === 'one-action' || rawAction === '1-acao') actionType = '1-action';
      else if (rawAction === '2-actions' || rawAction === 'two-actions' || rawAction === '2-acoes') actionType = '2-actions';
      else if (rawAction === '3-actions' || rawAction === 'three-actions' || rawAction === '3-acoes') actionType = '3-actions';
      else if (rawAction === '1-to-2-actions' || rawAction === 'one-to-two-actions') actionType = '1-to-2-actions';
      else if (rawAction === '1-to-3-actions' || rawAction === 'one-to-three-actions') actionType = '1-to-3-actions';
      else if (rawAction === 'free-action' || rawAction === 'acao-livre') actionType = 'free-action';
      else if (rawAction === 'reaction' || rawAction === 'reacao') actionType = 'reaction';

      if (actionType) {
        return (
          <span key={index} className="inline-flex mx-1 align-baseline">
            <PF2eActionGlyph type={actionType} size="md" />
          </span>
        );
      }
    }

    if (part.includes('<') && part.includes('>')) {
      return (
        <span
          key={index}
          dangerouslySetInnerHTML={{ __html: part }}
        />
      );
    }

    return <React.Fragment key={index}>{parseInlineFormatting(part)}</React.Fragment>;
  });
}
