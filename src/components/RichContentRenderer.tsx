import React from 'react';
import { renderContentWithMentions } from './MentionBadge';
import { PF2eActionGlyph, ActionGlyphType } from './PF2eActionGlyph';
import {
  Info,
  ShieldAlert,
  Sparkles,
  Coins,
  TreePine,
  Lock,
  ChevronRight,
  CheckSquare,
  Square,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';

interface RichContentRendererProps {
  content: string;
  onNavigate: (entityId: string) => void;
  className?: string;
}

/**
 * Robust Rich Markdown and HTML Renderer for Hecos Codex
 * Supports:
 * - Notion Callouts (Cyan Info, Mauve Mystical, Bordeaux Hazard, Gold Treasure, Emerald Wild, GM Secret)
 * - Accordion / Toggle lists (<details><summary>)
 * - Interactive-styled Checklists (- [ ] and - [x])
 * - Headers (H1-H4) with glowing accents and Cinzel display font
 * - Tables with sleek dark headers and borders
 * - Multi-column layout grids
 * - YouTube audio / video embeds
 * - PF2e action glyphs ([1-action], [2-actions], [3-actions], etc.)
 * - Entity @mentions and [[wikilinks]]
 * - Colored text and highlights
 * - Quotes, code blocks with copy button, dividers
 */
export const RichContentRenderer: React.FC<RichContentRendererProps> = ({
  content,
  onNavigate,
  className = '',
}) => {
  if (!content || !content.trim()) {
    return <p className="text-zinc-500 italic text-sm">Nenhum conteúdo adicionado ainda.</p>;
  }

  // Helper to parse line-by-line blocks
  const renderBlocks = () => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // 1. YouTube player block: <div class="youtube-player" data-video="VIDEO_ID">Title</div>
      if (line.includes('class="youtube-player"') || line.includes("class='youtube-player'")) {
        const match = line.match(/data-video=["']([a-zA-Z0-9_-]+)["']/);
        const titleMatch = line.match(/>([^<]+)<\/div>/);
        const videoId = match ? match[1] : null;
        const trackTitle = titleMatch ? titleMatch[1] : 'Trilha Sonora de Hecos';

        if (videoId) {
          elements.push(
            <div key={`yt-${i}`} className="my-4 p-3.5 rounded-xl bg-[#120e1c] border border-purple-500/40 shadow-lg">
              <div className="flex items-center justify-between gap-2 mb-2 text-xs font-semibold text-purple-200">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span>{trackTitle}</span>
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">YouTube Audio Player</span>
              </div>
              <div className="relative w-full aspect-video sm:aspect-[21/9] rounded-lg overflow-hidden border border-zinc-800 bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`}
                  title={trackTitle}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          );
          i++;
          continue;
        }
      }

      // 2. Collapsible Details / Toggle (<details><summary>Title</summary>...Content...</details>)
      if (line.trim().startsWith('<details') || line.trim().startsWith('<details open')) {
        let detailsHtml = line;
        let j = i + 1;
        while (j < lines.length && !lines[j].includes('</details>')) {
          detailsHtml += '\n' + lines[j];
          j++;
        }
        if (j < lines.length) {
          detailsHtml += '\n' + lines[j];
          j++;
        }

        // Extract summary and body
        const summaryMatch = detailsHtml.match(/<summary>([\s\S]*?)<\/summary>/i);
        const summaryText = summaryMatch ? summaryMatch[1].replace(/<[^>]+>/g, '').trim() : 'Alternar Detalhes';
        const bodyContent = detailsHtml
          .replace(/<details[^>]*>/i, '')
          .replace(/<summary>[\s\S]*?<\/summary>/i, '')
          .replace(/<\/details>/i, '')
          .trim();

        elements.push(
          <details
            key={`details-${i}`}
            className="my-3 group rounded-xl bg-[#0f0c18] border border-purple-900/40 hover:border-purple-600/60 transition-colors overflow-hidden"
          >
            <summary className="px-4 py-2.5 font-bold text-sm text-purple-200 cursor-pointer select-none flex items-center gap-2 hover:bg-purple-950/30 transition-colors list-none">
              <ChevronRight className="w-4 h-4 text-purple-400 group-open:rotate-90 transition-transform" />
              <span>{renderContentWithMentions(summaryText, onNavigate)}</span>
            </summary>
            <div className="px-5 py-3.5 border-t border-purple-900/30 bg-black/40 text-sm text-zinc-300 leading-relaxed space-y-2">
              <RichContentRenderer content={bodyContent} onNavigate={onNavigate} />
            </div>
          </details>
        );
        i = j;
        continue;
      }

      // 3. Notion Callout Boxes (> ℹ️, > 🩸, > 🌌, > 💰, > 🌿, > 🔒, or normal > blockquote)
      if (line.trim().startsWith('>')) {
        let calloutLines = [line.trim().substring(1).trim()];
        let j = i + 1;
        while (j < lines.length && lines[j].trim().startsWith('>')) {
          calloutLines.push(lines[j].trim().substring(1).trim());
          j++;
        }

        const fullCalloutText = calloutLines.join('\n');
        const firstLine = calloutLines[0];

        // Detect callout style based on lead icon / keyword
        let calloutType: 'info' | 'hazard' | 'eclipse' | 'treasure' | 'nature' | 'secret' | 'quote' = 'quote';

        if (firstLine.includes('ℹ️') || firstLine.toLowerCase().includes('[info]') || firstLine.toLowerCase().includes('[lore]')) {
          calloutType = 'info';
        } else if (firstLine.includes('🩸') || firstLine.toLowerCase().includes('[perigo]') || firstLine.toLowerCase().includes('[alerta]') || firstLine.toLowerCase().includes('[combate]')) {
          calloutType = 'hazard';
        } else if (firstLine.includes('🌌') || firstLine.toLowerCase().includes('[penumbra]') || firstLine.toLowerCase().includes('[eclipse]') || firstLine.toLowerCase().includes('[malva]')) {
          calloutType = 'eclipse';
        } else if (firstLine.includes('💰') || firstLine.includes('✨') || firstLine.toLowerCase().includes('[tesouro]') || firstLine.toLowerCase().includes('[item]')) {
          calloutType = 'treasure';
        } else if (firstLine.includes('🌿') || firstLine.toLowerCase().includes('[natureza]') || firstLine.toLowerCase().includes('[fauna]') || firstLine.toLowerCase().includes('[flora]')) {
          calloutType = 'nature';
        } else if (firstLine.includes('🔒') || firstLine.toLowerCase().includes('[segredo]') || firstLine.toLowerCase().includes('[gm]')) {
          calloutType = 'secret';
        }

        const calloutStyles = {
          info: {
            container: 'bg-[#09151e] border-cyan-500/50 text-cyan-100 shadow-[0_0_15px_rgba(6,182,212,0.1)]',
            icon: <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />,
            badge: 'INFO / LORE',
            badgeClass: 'bg-cyan-950 text-cyan-300 border-cyan-800'
          },
          hazard: {
            container: 'bg-[#1b0a11] border-rose-600/50 text-rose-100 shadow-[0_0_15px_rgba(225,29,72,0.1)]',
            icon: <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />,
            badge: 'PERIGO / COMBATE',
            badgeClass: 'bg-rose-950 text-rose-300 border-rose-800'
          },
          eclipse: {
            container: 'bg-[#150a1d] border-purple-500/50 text-purple-100 shadow-[0_0_15px_rgba(168,85,247,0.1)]',
            icon: <Sparkles className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />,
            badge: 'PENUMBRA / ECLIPSE',
            badgeClass: 'bg-purple-950 text-purple-300 border-purple-800'
          },
          treasure: {
            container: 'bg-[#1a1408] border-amber-500/50 text-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.1)]',
            icon: <Coins className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />,
            badge: 'TESOURO / RECOMPENSA',
            badgeClass: 'bg-amber-950 text-amber-300 border-amber-800'
          },
          nature: {
            container: 'bg-[#081a12] border-emerald-500/50 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.1)]',
            icon: <TreePine className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />,
            badge: 'ERMOS / NATUREZA',
            badgeClass: 'bg-emerald-950 text-emerald-300 border-emerald-800'
          },
          secret: {
            container: 'bg-[#180d0d] border-rose-500/60 text-zinc-200 border-dashed shadow-[0_0_15px_rgba(244,63,94,0.15)]',
            icon: <Lock className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />,
            badge: 'SEGREDO DO MESTRE',
            badgeClass: 'bg-rose-950 text-rose-300 border-rose-800'
          },
          quote: {
            container: 'bg-zinc-950/60 border-zinc-700 text-zinc-300 italic border-l-4',
            icon: null,
            badge: null,
            badgeClass: ''
          }
        };

        const config = calloutStyles[calloutType];

        elements.push(
          <div
            key={`callout-${i}`}
            className={`my-3.5 p-4 rounded-xl border ${config.container} flex gap-3 text-sm leading-relaxed`}
          >
            {config.icon}
            <div className="flex-1 space-y-1">
              {config.badge && (
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${config.badgeClass}`}>
                    {config.badge}
                  </span>
                </div>
              )}
              <div className="whitespace-pre-wrap">
                {renderContentWithMentions(fullCalloutText, onNavigate)}
              </div>
            </div>
          </div>
        );
        i = j;
        continue;
      }

      // 4. Code block (```lang ... ```)
      if (line.trim().startsWith('```')) {
        const lang = line.trim().substring(3);
        let codeLines: string[] = [];
        let j = i + 1;
        while (j < lines.length && !lines[j].trim().startsWith('```')) {
          codeLines.push(lines[j]);
          j++;
        }
        if (j < lines.length) j++; // Skip closing ```

        const codeString = codeLines.join('\n');
        elements.push(
          <CodeBlock key={`code-${i}`} code={codeString} language={lang} />
        );
        i = j;
        continue;
      }

      // 5. Markdown Tables (| Col 1 | Col 2 | ...)
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        let tableLines = [line.trim()];
        let j = i + 1;
        while (j < lines.length && lines[j].trim().startsWith('|') && lines[j].trim().endsWith('|')) {
          tableLines.push(lines[j].trim());
          j++;
        }

        if (tableLines.length >= 2) {
          const headerRow = tableLines[0];
          // Check if line 1 is separator |---|---|
          const isSep = tableLines[1].replace(/[\s|:-]/g, '').length === 0;
          const headers = headerRow
            .split('|')
            .slice(1, -1)
            .map((h) => h.trim());
          const dataRows = isSep ? tableLines.slice(2) : tableLines.slice(1);

          elements.push(
            <div key={`table-${i}`} className="my-4 overflow-x-auto rounded-xl border border-zinc-800/80 bg-[#0d0a14] shadow-md">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="bg-[#171224] border-b border-zinc-700/80 text-cyan-300 font-bold uppercase tracking-wider text-[11px]">
                    {headers.map((h, hIdx) => (
                      <th key={hIdx} className="p-3 border-r border-zinc-800/60 last:border-r-0">
                        {renderContentWithMentions(h, onNavigate)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  {dataRows.map((row, rIdx) => {
                    const cells = row
                      .split('|')
                      .slice(1, -1)
                      .map((c) => c.trim());
                    return (
                      <tr key={rIdx} className="hover:bg-zinc-900/40 transition-colors odd:bg-black/20">
                        {cells.map((cell, cIdx) => (
                          <td key={cIdx} className="p-3 border-r border-zinc-800/40 last:border-r-0">
                            {renderContentWithMentions(cell, onNavigate)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
          i = j;
          continue;
        }
      }

      // 6. Interactive Checklist Item (- [ ] or - [x])
      const checklistMatch = line.match(/^(\s*)-\s*\[([ xX])\]\s*(.*)$/);
      if (checklistMatch) {
        const indentLevel = Math.floor(checklistMatch[1].length / 2);
        const isChecked = checklistMatch[2].toLowerCase() === 'x';
        const taskText = checklistMatch[3];

        elements.push(
          <div
            key={`check-${i}`}
            className="flex items-start gap-2.5 my-1 text-sm leading-relaxed"
            style={{ paddingLeft: `${indentLevel * 1.25}rem` }}
          >
            <span className="mt-0.5 shrink-0 text-cyan-400">
              {isChecked ? (
                <CheckSquare className="w-4 h-4 text-cyan-400" />
              ) : (
                <Square className="w-4 h-4 text-zinc-600" />
              )}
            </span>
            <span className={isChecked ? 'line-through text-zinc-500' : 'text-zinc-200'}>
              {renderContentWithMentions(taskText, onNavigate)}
            </span>
          </div>
        );
        i++;
        continue;
      }

      // 7. Headings (# H1, ## H2, ### H3, #### H4)
      if (line.startsWith('# ')) {
        elements.push(
          <h1
            key={`h1-${i}`}
            className="text-2xl sm:text-3xl font-extrabold text-zinc-100 font-display mt-6 mb-3 pb-2 border-b border-zinc-800/80 flex items-center gap-2"
          >
            <span className="w-1.5 h-6 rounded-full bg-cyan-400 shrink-0" />
            <span>{renderContentWithMentions(line.substring(2), onNavigate)}</span>
          </h1>
        );
        i++;
        continue;
      }

      if (line.startsWith('## ')) {
        elements.push(
          <h2
            key={`h2-${i}`}
            className="text-xl sm:text-2xl font-bold text-zinc-100 font-display mt-5 mb-2.5 pb-1 border-b border-zinc-800/50 flex items-center gap-2"
          >
            <span className="w-1.5 h-5 rounded-full bg-purple-400 shrink-0" />
            <span>{renderContentWithMentions(line.substring(3), onNavigate)}</span>
          </h2>
        );
        i++;
        continue;
      }

      if (line.startsWith('### ')) {
        elements.push(
          <h3
            key={`h3-${i}`}
            className="text-base sm:text-lg font-bold text-cyan-200 font-display mt-4 mb-1.5 flex items-center gap-2"
          >
            <span className="w-1.5 h-4 rounded-full bg-rose-400 shrink-0" />
            <span>{renderContentWithMentions(line.substring(4), onNavigate)}</span>
          </h3>
        );
        i++;
        continue;
      }

      if (line.startsWith('#### ')) {
        elements.push(
          <h4
            key={`h4-${i}`}
            className="text-sm sm:text-base font-semibold text-purple-300 uppercase tracking-wider mt-3 mb-1"
          >
            {renderContentWithMentions(line.substring(5), onNavigate)}
          </h4>
        );
        i++;
        continue;
      }

      // 8. Horizontal Rule / Divider (--- or ***)
      if (line.trim() === '---' || line.trim() === '***' || line.trim() === '___') {
        elements.push(
          <hr
            key={`hr-${i}`}
            className="my-5 border-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-700 to-transparent"
          />
        );
        i++;
        continue;
      }

      // 9. Bullet & Numbered Lists with indentation support
      const bulletMatch = line.match(/^(\s*)[-*+]\s+(.*)$/);
      if (bulletMatch) {
        const indentLevel = Math.floor(bulletMatch[1].length / 2);
        const bulletText = bulletMatch[2];

        elements.push(
          <div
            key={`bullet-${i}`}
            className="flex items-start gap-2 my-1 text-sm text-zinc-200 leading-relaxed"
            style={{ paddingLeft: `${indentLevel * 1.25}rem` }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 shrink-0" />
            <div className="flex-1">{renderContentWithMentions(bulletText, onNavigate)}</div>
          </div>
        );
        i++;
        continue;
      }

      const numMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
      if (numMatch) {
        const indentLevel = Math.floor(numMatch[1].length / 2);
        const num = numMatch[2];
        const numText = numMatch[3];

        elements.push(
          <div
            key={`num-${i}`}
            className="flex items-start gap-2 my-1 text-sm text-zinc-200 leading-relaxed"
            style={{ paddingLeft: `${indentLevel * 1.25}rem` }}
          >
            <span className="font-mono font-bold text-xs text-purple-300 min-w-[1.25rem] text-right mt-0.5 shrink-0">
              {num}.
            </span>
            <div className="flex-1">{renderContentWithMentions(numText, onNavigate)}</div>
          </div>
        );
        i++;
        continue;
      }

      // 10. Image Markdown ![alt](url)
      const imgMatch = line.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (imgMatch) {
        const alt = imgMatch[1];
        const src = imgMatch[2];
        elements.push(
          <div key={`img-${i}`} className="my-4 rounded-xl overflow-hidden border border-zinc-800 bg-black/60 shadow-xl group">
            <img
              src={src}
              alt={alt}
              referrerPolicy="no-referrer"
              className="w-full max-h-[450px] object-cover object-center group-hover:scale-[1.01] transition-transform duration-300"
            />
            {alt && (
              <div className="p-2 bg-[#100d18] border-t border-zinc-800/80 text-center text-xs text-zinc-400 italic">
                {alt}
              </div>
            )}
          </div>
        );
        i++;
        continue;
      }

      // 11. Empty lines / Paragraph breaks
      if (!line.trim()) {
        elements.push(<div key={`empty-${i}`} className="h-2" />);
        i++;
        continue;
      }

      // 12. Standard Paragraph
      elements.push(
        <p key={`p-${i}`} className="text-zinc-200 text-sm leading-relaxed my-1">
          {renderContentWithMentions(line, onNavigate)}
        </p>
      );
      i++;
    }

    return elements;
  };

  return <div className={`space-y-1 ${className}`}>{renderBlocks()}</div>;
};

/**
 * Clean Code Block component with Copy button
 */
const CodeBlock: React.FC<{ code: string; language?: string }> = ({ code, language }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3.5 rounded-xl border border-zinc-800 bg-[#0c0914] overflow-hidden shadow-lg">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#140f21] border-b border-zinc-800 text-[11px] text-zinc-400 font-mono">
        <span>{language || 'code'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-black/40 hover:bg-zinc-800 text-zinc-300 hover:text-cyan-300 transition-colors"
        >
          {copied ? <Check className="w-3 h-3 text-cyan-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copiado!' : 'Copiar'}</span>
        </button>
      </div>
      <pre className="p-4 text-xs font-mono text-cyan-200 overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
};
