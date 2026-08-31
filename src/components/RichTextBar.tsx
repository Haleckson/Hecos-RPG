import React, { useState, useRef } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  AlertCircle,
  Lock,
  Palette,
  Minus,
  Sparkles,
  Link,
  Code,
  AtSign,
  Search,
  X
} from 'lucide-react';
import { ColorPickerMenu } from './ColorPickerMenu';
import { entityIndexService, IndexedEntity, CATEGORY_CONFIG } from '../services/entityIndexService';

interface RichTextBarProps {
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (newValue: string) => void;
  className?: string;
  compact?: boolean;
}

export const RichTextBar: React.FC<RichTextBarProps> = ({
  textareaRef,
  value,
  onChange,
  className = '',
  compact = false,
}) => {
  const [isColorMenuOpen, setIsColorMenuOpen] = useState(false);
  const [isMentionPickerOpen, setIsMentionPickerOpen] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');

  const insertText = (before: string, after: string = '', defaultText: string = '') => {
    const el = textareaRef?.current;
    if (!el) {
      onChange(value + before + defaultText + after);
      return;
    }

    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const selected = value.substring(start, end) || defaultText;

    const nextValue = value.substring(0, start) + before + selected + after + value.substring(end);
    onChange(nextValue);

    setTimeout(() => {
      el.focus();
      const newCursorPos = start + before.length + selected.length + after.length;
      el.setSelectionRange(newCursorPos, newCursorPos);
    }, 10);
  };

  const handleSelectMention = (entity: IndexedEntity) => {
    const slug = entity.slug || entity.id;
    insertText(`@${slug} `);
    setIsMentionPickerOpen(false);
    setMentionSearch('');
  };

  const searchResults = isMentionPickerOpen
    ? entityIndexService.search(mentionSearch, { limit: 10 })
    : [];

  const handleApplyTextColor = (colorHex: string) => {
    if (!colorHex) {
      insertText('', '', '');
    } else {
      insertText(`<span style="color: ${colorHex}">`, '</span>', 'texto colorido');
    }
    setIsColorMenuOpen(false);
  };

  const handleApplyHighlight = (bgRgba: string, borderHex?: string) => {
    if (!bgRgba) {
      insertText('', '', '');
    } else {
      const borderStyle = borderHex ? `border-left: 3px solid ${borderHex}; padding: 2px 6px;` : 'padding: 2px 4px;';
      insertText(`<span style="background-color: ${bgRgba}; ${borderStyle} border-radius: 4px;">`, '</span>', 'texto realçado');
    }
    setIsColorMenuOpen(false);
  };

  return (
    <div className={`relative flex flex-wrap items-center gap-1 p-1.5 bg-[#0e0a1a] border border-purple-900/40 rounded-lg text-zinc-300 shadow-sm select-none ${className}`}>
      {/* Bold, Italic, Underline, Strike */}
      <div className="flex items-center gap-0.5 border-r border-zinc-800 pr-1.5 mr-0.5">
        <button
          type="button"
          onClick={() => insertText('**', '**', 'negrito')}
          title="Negrito (Ctrl+B)"
          className="p-1 rounded hover:bg-purple-950/60 hover:text-purple-300 transition-colors text-zinc-400"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => insertText('*', '*', 'itálico')}
          title="Itálico (Ctrl+I)"
          className="p-1 rounded hover:bg-purple-950/60 hover:text-purple-300 transition-colors text-zinc-400"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => insertText('<u>', '</u>', 'sublinhado')}
          title="Sublinhado"
          className="p-1 rounded hover:bg-purple-950/60 hover:text-purple-300 transition-colors text-zinc-400"
        >
          <Underline className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => insertText('~~', '~~', 'tachado')}
          title="Tachado"
          className="p-1 rounded hover:bg-purple-950/60 hover:text-purple-300 transition-colors text-zinc-400"
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Headings */}
      {!compact && (
        <div className="flex items-center gap-0.5 border-r border-zinc-800 pr-1.5 mr-0.5">
          <button
            type="button"
            onClick={() => insertText('\n## ', '\n', 'Título Médio')}
            title="Título H2"
            className="p-1 rounded hover:bg-purple-950/60 hover:text-cyan-300 transition-colors text-zinc-400 text-xs font-bold"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => insertText('\n### ', '\n', 'Subtítulo H3')}
            title="Subtítulo H3"
            className="p-1 rounded hover:bg-purple-950/60 hover:text-cyan-300 transition-colors text-zinc-400 text-xs font-bold"
          >
            H3
          </button>
        </div>
      )}

      {/* Lists & Quotes */}
      <div className="flex items-center gap-0.5 border-r border-zinc-800 pr-1.5 mr-0.5">
        <button
          type="button"
          onClick={() => insertText('\n- ', '', 'Item da lista')}
          title="Lista com marcadores"
          className="p-1 rounded hover:bg-purple-950/60 hover:text-purple-300 transition-colors text-zinc-400"
        >
          <List className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => insertText('\n1. ', '', 'Primeiro passo')}
          title="Lista numerada"
          className="p-1 rounded hover:bg-purple-950/60 hover:text-purple-300 transition-colors text-zinc-400"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => insertText('\n> *"', '"*\n', 'Citação marcante')}
          title="Bloco de citação"
          className="p-1 rounded hover:bg-purple-950/60 hover:text-purple-300 transition-colors text-zinc-400"
        >
          <Quote className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* PF2e Action Glyphs */}
      <div className="flex items-center gap-1 border-r border-zinc-800 pr-1.5 mr-0.5">
        <button
          type="button"
          onClick={() => insertText(' [1-action] ')}
          title="1 Ação [1]"
          className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-cyan-900/60 hover:text-cyan-300 text-[10px] font-mono font-bold text-zinc-300 transition-colors"
        >
          [1]
        </button>
        <button
          type="button"
          onClick={() => insertText(' [2-actions] ')}
          title="2 Ações [2]"
          className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-cyan-900/60 hover:text-cyan-300 text-[10px] font-mono font-bold text-zinc-300 transition-colors"
        >
          [2]
        </button>
        <button
          type="button"
          onClick={() => insertText(' [3-actions] ')}
          title="3 Ações [3]"
          className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-cyan-900/60 hover:text-cyan-300 text-[10px] font-mono font-bold text-zinc-300 transition-colors"
        >
          [3]
        </button>
        <button
          type="button"
          onClick={() => insertText(' [reaction] ')}
          title="Reação [R]"
          className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-rose-900/60 hover:text-rose-300 text-[10px] font-mono font-bold text-zinc-300 transition-colors"
        >
          [R]
        </button>
        <button
          type="button"
          onClick={() => insertText(' [free-action] ')}
          title="Ação Livre [F]"
          className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-emerald-900/60 hover:text-emerald-300 text-[10px] font-mono font-bold text-zinc-300 transition-colors"
        >
          [F]
        </button>
      </div>

      {/* Callouts & Mentions */}
      <div className="flex items-center gap-0.5 border-r border-zinc-800 pr-1.5 mr-0.5">
        <button
          type="button"
          onClick={() => insertText('\n> [!NOTE]\n> ', '\n', 'Informação importante')}
          title="Caixa de Informação (Callout Ciano)"
          className="p-1 rounded hover:bg-cyan-950/60 hover:text-cyan-300 transition-colors text-zinc-400"
        >
          <AlertCircle className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => insertText('\n:::gm\n', '\n:::\n', 'Segredo exclusivo para o Mestre')}
          title="Bloco Confidencial do Mestre (:::gm ... :::)"
          className="p-1 rounded hover:bg-rose-950/60 hover:text-rose-300 transition-colors text-rose-400"
        >
          <Lock className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => insertText('[[', ']]', 'Nome do Artigo ou Personagem')}
          title="Vincular Artigo do Codex ([[Artigo]])"
          className="p-1 rounded hover:bg-purple-950/60 hover:text-purple-300 transition-colors text-zinc-400"
        >
          <Link className="w-3.5 h-3.5" />
        </button>

        {/* @ Mention Trigger */}
        <div className="relative inline-block">
          <button
            type="button"
            onClick={() => setIsMentionPickerOpen(!isMentionPickerOpen)}
            title="Indexar & Linkar Termo do Site (@)"
            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/60 text-cyan-300 text-[11px] font-bold transition-all shadow-sm"
          >
            <AtSign className="w-3 h-3 text-cyan-400" />
            <span>@ Menção</span>
          </button>

          {isMentionPickerOpen && (
            <div className="absolute left-0 top-full mt-2 z-[99999] w-72 sm:w-80 bg-[#0d0a1a]/98 border-2 border-cyan-400/90 rounded-xl shadow-[0_25px_60px_rgba(0,0,0,0.95),0_0_40px_rgba(6,182,212,0.45)] p-2 backdrop-blur-2xl animate-in fade-in zoom-in-95 ring-2 ring-cyan-500/30">
              <div className="flex items-center justify-between px-2 py-1 border-b border-zinc-800 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1">
                  <AtSign className="w-3 h-3" />
                  Indexador de Termos Hecos
                </span>
                <button
                  type="button"
                  onClick={() => setIsMentionPickerOpen(false)}
                  className="p-0.5 text-zinc-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Pesquisar NPC, item, magia..."
                  value={mentionSearch}
                  onChange={(e) => setMentionSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 bg-black/60 border border-zinc-700 rounded-lg text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="max-h-52 overflow-y-auto space-y-1">
                {searchResults.length === 0 ? (
                  <div className="p-3 text-center text-xs text-zinc-500">Nenhum termo encontrado.</div>
                ) : (
                  searchResults.map((item) => {
                    const catConf = CATEGORY_CONFIG[item.category];
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectMention(item)}
                        className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-zinc-800/80 text-left text-xs transition-colors group"
                      >
                        <span
                          className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded border ${catConf?.bgClass || 'bg-black/60'} ${catConf?.textClass || 'text-zinc-400'} ${catConf?.borderClass || 'border-zinc-800'}`}
                        >
                          {item.categoryLabel?.split(' / ')[0] || item.category}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-zinc-200 group-hover:text-white truncate">
                            {item.title}
                          </div>
                          {item.subtitle && (
                            <div className="text-[10px] text-zinc-400 truncate">{item.subtitle}</div>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Colors & Highlight Menu */}
      <div className="relative flex items-center">
        <button
          type="button"
          onClick={() => setIsColorMenuOpen(!isColorMenuOpen)}
          title="Cores do Texto e Realces"
          className="p-1 rounded hover:bg-purple-950/60 hover:text-amber-300 transition-colors text-zinc-400"
        >
          <Palette className="w-3.5 h-3.5" />
        </button>

        {isColorMenuOpen && (
          <ColorPickerMenu
            isOpen={isColorMenuOpen}
            onClose={() => setIsColorMenuOpen(false)}
            onApplyTextColor={handleApplyTextColor}
            onApplyHighlight={handleApplyHighlight}
          />
        )}
      </div>

      {/* Divider */}
      <button
        type="button"
        onClick={() => insertText('\n---\n')}
        title="Divisor de Linha"
        className="p-1 rounded hover:bg-purple-950/60 hover:text-purple-300 transition-colors text-zinc-400 ml-auto"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
