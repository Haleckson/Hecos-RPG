import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Minus,
  Palette,
  Sparkles,
  Search,
  ExternalLink,
  Eye,
  Columns,
  Edit3,
  Layers,
  AtSign,
  HelpCircle,
  X,
  User,
  Users,
  Shield,
  Compass,
  Gem,
  Skull,
  Flower2,
  PawPrint,
  ShieldAlert,
  Dna,
  Swords,
  Award,
  Scroll,
  History,
  Lock,
  BookOpen,
  Trash2,
  Plus,
  FileCode,
  Check,
  Copy
} from 'lucide-react';
import { entityIndexService, IndexedEntity, CATEGORY_CONFIG } from '../services/entityIndexService';
import { ColorPickerMenu } from './ColorPickerMenu';
import { PF2eActionGlyph, ActionGlyphType } from './PF2eActionGlyph';
import { renderContentWithMentions, MentionBadge } from './MentionBadge';
import { TraitBadge } from './TraitBadge';
import { EntityCategory } from '../types';

export interface RobustRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  label?: string;
  description?: string;
  excludeEntityId?: string;
  showToolbar?: boolean;
  showPreviewToggle?: boolean;
  className?: string;
  allowSlashCommands?: boolean;
  onNavigate?: (id: string) => void;
  compact?: boolean;
  id?: string;
  defaultViewMode?: 'visual' | 'code' | 'split' | 'preview';
}

// Icon resolver helper for mention items
const getCategoryIconComponent = (cat: EntityCategory) => {
  switch (cat) {
    case 'npc': return User;
    case 'pc': return Users;
    case 'creature': return Skull;
    case 'peril': return ShieldAlert;
    case 'spell': return Sparkles;
    case 'item': return Gem;
    case 'location': return Compass;
    case 'organization': return Shield;
    case 'fauna': return PawPrint;
    case 'flora': return Flower2;
    case 'ancestry': return Dna;
    case 'class': return Swords;
    case 'feat': return Award;
    case 'rule': return Scroll;
    case 'timeline': return History;
    case 'quest': return CheckSquare;
    case 'gm_note': return Lock;
    default: return BookOpen;
  }
};

export interface ExtractedMention {
  raw: string;
  title: string;
  idOrSlug: string;
  type: 'bracket' | 'wikilink' | 'slug';
}

/**
 * Extracts all active mentions from markdown/text:
 * - @[Title](id)
 * - [[Title]]
 * - @slug
 */
export function extractMentions(text: string): ExtractedMention[] {
  if (!text) return [];
  const list: ExtractedMention[] = [];
  const seenRaws = new Set<string>();

  // 1. @[Title](id)
  const bracketRegex = /@\[([^\]\n]+)\]\(([^)\n]+)\)/g;
  let match;
  while ((match = bracketRegex.exec(text)) !== null) {
    if (!seenRaws.has(match[0])) {
      seenRaws.add(match[0]);
      list.push({
        raw: match[0],
        title: match[1],
        idOrSlug: match[2],
        type: 'bracket',
      });
    }
  }

  // 2. [[Title]]
  const wikiRegex = /\[\[(?:trait:|tr:)?([^\]\n]+)\]\]/g;
  while ((match = wikiRegex.exec(text)) !== null) {
    if (!seenRaws.has(match[0]) && !match[0].toLowerCase().includes('trait:') && !match[0].toLowerCase().includes('tr:')) {
      seenRaws.add(match[0]);
      list.push({
        raw: match[0],
        title: match[1],
        idOrSlug: match[1],
        type: 'wikilink',
      });
    }
  }

  // 3. @slug (isolated word)
  const slugRegex = /(?:^|\s)@([a-zA-Z0-9_-]+)(?=[^a-zA-Z0-9_-]|$)/g;
  while ((match = slugRegex.exec(text)) !== null) {
    const raw = `@${match[1]}`;
    if (!seenRaws.has(raw)) {
      seenRaws.add(raw);
      list.push({
        raw: raw,
        title: match[1],
        idOrSlug: match[1],
        type: 'slug',
      });
    }
  }

  return list;
}

export const RobustRichTextEditor: React.FC<RobustRichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Escreva o conteúdo do artigo... Digite @ para indexar e linkar qualquer artigo do site com badges visuais.',
  minHeight = '280px',
  label,
  description,
  excludeEntityId,
  showToolbar = true,
  showPreviewToggle = true,
  className = '',
  onNavigate,
  compact = false,
  id,
  defaultViewMode = 'visual',
}) => {
  const [viewMode, setViewMode] = useState<'visual' | 'code' | 'split' | 'preview'>(defaultViewMode);
  const [isColorMenuOpen, setIsColorMenuOpen] = useState(false);

  // Dynamic Editor Height & Interactive Resizing for Entire Outer Container
  const parsedMinHeight = parseInt(minHeight, 10) || 280;
  const [editorHeight, setEditorHeight] = useState<number>(parsedMinHeight);
  const isResizingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);

  // Dynamic Input Box Height (The interactive typing textarea where the user writes and types text)
  const defaultInputBoxHeight = compact ? 130 : 200;
  const [inputBoxHeight, setInputBoxHeight] = useState<number>(defaultInputBoxHeight);
  const isResizingInputRef = useRef(false);
  const startInputYRef = useRef(0);
  const startInputHeightRef = useRef(0);

  useEffect(() => {
    const parsed = parseInt(minHeight, 10);
    if (parsed && parsed > 0) {
      setEditorHeight((prev) => Math.max(prev, parsed));
    }
  }, [minHeight]);

  const handleResizeMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isResizingRef.current = true;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    startYRef.current = clientY;
    startHeightRef.current = editorHeight;

    const handleMouseMove = (moveEvent: MouseEvent | TouchEvent) => {
      if (!isResizingRef.current) return;
      const currentY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;
      const deltaY = currentY - startYRef.current;
      const newH = Math.max(140, Math.min(1600, startHeightRef.current + deltaY));
      setEditorHeight(newH);
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleMouseMove, { passive: false });
    window.addEventListener('touchend', handleMouseUp);
  };

  const handleInputResizeMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isResizingInputRef.current = true;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    startInputYRef.current = clientY;
    startInputHeightRef.current = inputBoxHeight;

    const handleMouseMove = (moveEvent: MouseEvent | TouchEvent) => {
      if (!isResizingInputRef.current) return;
      const currentY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;
      const deltaY = currentY - startInputYRef.current;
      const newH = Math.max(90, Math.min(1000, startInputHeightRef.current + deltaY));
      setInputBoxHeight(newH);
    };

    const handleMouseUp = () => {
      isResizingInputRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleMouseMove, { passive: false });
    window.addEventListener('touchend', handleMouseUp);
  };

  const handleExpandHeight = () => {
    setEditorHeight((prev) => Math.min(1600, prev + 120));
  };

  const handleShrinkHeight = () => {
    setEditorHeight((prev) => Math.max(140, prev - 120));
  };

  const handleResetHeight = () => {
    setEditorHeight(parsedMinHeight);
  };

  // @ Mention auto-complete state
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionResults, setMentionResults] = useState<IndexedEntity[]>([]);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [mentionTriggerType, setMentionTriggerType] = useState<'@' | '[['>('@');

  // Manual Mention Picker Modal state
  const [isMentionPickerModalOpen, setIsMentionPickerModalOpen] = useState(false);
  const [pickerSearchQuery, setPickerSearchQuery] = useState('');
  const [pickerSelectedCat, setPickerSelectedCat] = useState<string>('all');
  const [insertionFormat, setInsertionFormat] = useState<'bracket' | 'wikilink'>('bracket');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Extracted mentions in current content
  const activeMentions = extractMentions(value);

  // Update mention query results instantly via indexed service
  useEffect(() => {
    if (showMentionMenu) {
      const results = entityIndexService.search(mentionQuery, {
        excludeId: excludeEntityId,
        limit: 10,
      });
      setMentionResults(results);
      setSelectedMentionIndex(0);
    }
  }, [mentionQuery, showMentionMenu, excludeEntityId]);

  // Insert formatting wrap or snippet
  const wrapSelection = useCallback(
    (prefix: string, suffix: string = prefix, defaultPlaceholder: string = 'texto') => {
      const el = textareaRef.current;
      if (!el) {
        onChange(value + prefix + defaultPlaceholder + suffix);
        return;
      }

      const start = el.selectionStart || 0;
      const end = el.selectionEnd || 0;
      const selected = value.substring(start, end) || defaultPlaceholder;

      const newValue =
        value.substring(0, start) +
        prefix +
        selected +
        suffix +
        value.substring(end);

      onChange(newValue);

      setTimeout(() => {
        el.focus();
        const selStart = start + prefix.length;
        const selEnd = selStart + selected.length;
        el.setSelectionRange(selStart, selEnd);
      }, 15);
    },
    [value, onChange]
  );

  const insertSnippet = useCallback(
    (snippet: string) => {
      const el = textareaRef.current;
      if (!el) {
        onChange(value + '\n' + snippet);
        return;
      }

      const start = el.selectionStart || 0;
      const end = el.selectionEnd || 0;

      const newValue = value.substring(0, start) + snippet + value.substring(end);
      onChange(newValue);

      setTimeout(() => {
        el.focus();
        const nextPos = start + snippet.length;
        el.setSelectionRange(nextPos, nextPos);
      }, 15);
    },
    [value, onChange]
  );

  // Text color & Highlight handlers
  const handleApplyTextColor = (colorHex: string) => {
    if (!colorHex) return;
    wrapSelection(`<span style="color: ${colorHex}">`, '</span>', 'texto colorido');
    setIsColorMenuOpen(false);
  };

  const handleApplyHighlight = (bgRgba: string, borderHex?: string) => {
    if (!bgRgba) return;
    const borderStyle = borderHex ? ` border: 1px solid ${borderHex};` : '';
    wrapSelection(
      `<mark style="background-color: ${bgRgba};${borderStyle} padding: 2px 6px; border-radius: 4px; color: #f4f4f5;">`,
      '</mark>',
      'texto destacado'
    );
    setIsColorMenuOpen(false);
  };

  // Text Change detection for @ and [[
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const pos = e.target.selectionStart;
    onChange(val);

    const textBeforeCursor = val.slice(0, pos);

    // 1. Look for @ followed by any word characters before cursor
    const atMatch = textBeforeCursor.match(/@([a-zA-Z0-9_\u00C0-\u00FF-]*)$/);
    if (atMatch && atMatch[1] !== undefined) {
      setMentionTriggerType('@');
      setMentionQuery(atMatch[1]);
      setShowMentionMenu(true);
      return;
    }

    // 2. Look for [[ followed by any characters before cursor
    const wikiMatch = textBeforeCursor.match(/\[\[([^\]\n]*)$/);
    if (wikiMatch && wikiMatch[1] !== undefined) {
      setMentionTriggerType('[[');
      setMentionQuery(wikiMatch[1]);
      setShowMentionMenu(true);
      return;
    }

    setShowMentionMenu(false);
  };

  // Remove a specific mention raw tag from the text
  const handleRemoveMention = useCallback(
    (rawTag: string) => {
      const escaped = rawTag.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(escaped, 'g');
      const newText = value.replace(regex, '').replace(/[ ]{2,}/g, ' ');
      onChange(newText);
    },
    [value, onChange]
  );

  // Insert a selected entity mention as @[Title](id) or [[Title]]
  const insertMentionEntity = useCallback(
    (entity: IndexedEntity, formatOverride?: 'bracket' | 'wikilink') => {
      const el = textareaRef.current;
      const targetFormat = formatOverride || (mentionTriggerType === '[[' ? 'wikilink' : 'bracket');
      
      const mentionTag = targetFormat === 'wikilink'
        ? `[[${entity.title}]] `
        : `@[${entity.title}](${entity.id || entity.slug}) `;

      if (!el) {
        onChange(value + (value.endsWith(' ') || value.length === 0 ? '' : ' ') + mentionTag);
        setShowMentionMenu(false);
        setIsMentionPickerModalOpen(false);
        return;
      }

      const curPos = el.selectionStart || 0;
      const textBefore = value.slice(0, curPos);
      const textAfter = value.slice(curPos);

      // Find trigger pos
      let triggerIndex = -1;
      if (mentionTriggerType === '[[') {
        triggerIndex = textBefore.lastIndexOf('[[');
      } else {
        triggerIndex = textBefore.lastIndexOf('@');
      }

      let newText = '';
      let targetPos = curPos;

      if (triggerIndex !== -1) {
        newText = textBefore.slice(0, triggerIndex) + mentionTag + textAfter;
        targetPos = triggerIndex + mentionTag.length;
      } else {
        newText = textBefore + mentionTag + textAfter;
        targetPos = curPos + mentionTag.length;
      }

      onChange(newText);
      setShowMentionMenu(false);
      setIsMentionPickerModalOpen(false);

      setTimeout(() => {
        el.focus();
        el.setSelectionRange(targetPos, targetPos);
      }, 30);
    },
    [value, onChange, mentionTriggerType]
  );

  // Keyboard navigation for dropdown & shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const el = textareaRef.current;
    if (!el) return;

    // Handle @ / [[ Mention menu navigation
    if (showMentionMenu && mentionResults.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIndex((prev) => (prev + 1) % mentionResults.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex((prev) => (prev - 1 + mentionResults.length) % mentionResults.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMentionEntity(mentionResults[selectedMentionIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowMentionMenu(false);
        return;
      }
    }

    // Standard Keyboard Shortcuts: Ctrl+B, Ctrl+I, Ctrl+U, Ctrl+K
    if (e.ctrlKey || e.metaKey) {
      if (e.key.toLowerCase() === 'b') {
        e.preventDefault();
        wrapSelection('**', '**', 'negrito');
        return;
      }
      if (e.key.toLowerCase() === 'i') {
        e.preventDefault();
        wrapSelection('*', '*', 'itálico');
        return;
      }
      if (e.key.toLowerCase() === 'u') {
        e.preventDefault();
        wrapSelection('<u>', '</u>', 'sublinhado');
        return;
      }
      if (e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsMentionPickerModalOpen(true);
        return;
      }
    }

    // Tab indentation
    if (e.key === 'Tab' && !showMentionMenu) {
      e.preventDefault();
      const start = el.selectionStart;
      const end = el.selectionEnd;

      if (start === end) {
        const newText = value.substring(0, start) + '  ' + value.substring(end);
        onChange(newText);
        setTimeout(() => {
          el.setSelectionRange(start + 2, start + 2);
        }, 10);
      }
    }
  };

  // Word & Char Count
  const wordsCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const charsCount = value.length;

  // Filtered list for the modal picker
  const pickerResults = entityIndexService.search(pickerSearchQuery, {
    excludeId: excludeEntityId,
    category: pickerSelectedCat !== 'all' ? (pickerSelectedCat as EntityCategory) : undefined,
    limit: 24,
  });

  return (
    <div className={`relative flex flex-col rounded-2xl border border-zinc-800 bg-[#090812] shadow-xl ${className}`}>
      {/* Header Label if provided */}
      {(label || showPreviewToggle) && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-950/80 border-b border-zinc-800/80 text-xs">
          <div className="flex items-center gap-2">
            {label && <span className="font-semibold uppercase tracking-wider text-zinc-200">{label}</span>}
            {description && <span className="text-zinc-500 text-[11px] hidden sm:inline">• {description}</span>}
          </div>

          {/* View Mode Toggle: Visual Badges / Code / Split / Preview */}
          {showPreviewToggle && (
            <div className="flex items-center gap-1 bg-zinc-900/90 border border-zinc-800 p-0.5 rounded-lg text-[11px]">
              <button
                type="button"
                onClick={() => setViewMode('visual')}
                title="Editor Visual com Badges & Menções Interativas"
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                  viewMode === 'visual'
                    ? 'bg-gradient-to-r from-purple-950 to-cyan-950 text-cyan-300 font-semibold shadow-sm border border-cyan-700/60'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>Visual (Badges)</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('code')}
                title="Editor de Código Markdown Bruto"
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                  viewMode === 'code'
                    ? 'bg-zinc-800 text-zinc-200 font-semibold shadow-sm border border-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FileCode className="w-3 h-3" />
                <span>Markdown</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('split')}
                title="Visualização Dividida (Editor + Prévia)"
                className={`hidden md:flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                  viewMode === 'split'
                    ? 'bg-purple-950 text-purple-300 font-semibold shadow-sm border border-purple-800/70'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Columns className="w-3 h-3" />
                <span>Dividido</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('preview')}
                title="Prévia do Conteúdo Renderizado"
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                  viewMode === 'preview'
                    ? 'bg-purple-950 text-purple-300 font-semibold shadow-sm border border-purple-800/70'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Eye className="w-3 h-3" />
                <span>Prévia</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Robust Toolbar */}
      {showToolbar && viewMode !== 'preview' && (
        <div className="flex flex-wrap items-center gap-1 p-2 bg-[#0d0a1a] border-b border-zinc-800/80 text-zinc-300 select-none">
          {/* Headings */}
          <div className="flex items-center gap-0.5 pr-1.5 border-r border-zinc-800/80">
            <button
              type="button"
              onClick={() => wrapSelection('# ', '', 'Título 1')}
              title="Título 1 (# )"
              className="p-1.5 rounded-lg hover:bg-zinc-800/80 hover:text-white text-zinc-400 transition-colors"
            >
              <Heading1 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => wrapSelection('## ', '', 'Título 2')}
              title="Título 2 (## )"
              className="p-1.5 rounded-lg hover:bg-zinc-800/80 hover:text-white text-zinc-400 transition-colors"
            >
              <Heading2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => wrapSelection('### ', '', 'Título 3')}
              title="Título 3 (### )"
              className="p-1.5 rounded-lg hover:bg-zinc-800/80 hover:text-white text-zinc-400 transition-colors"
            >
              <Heading3 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Basic Formatting */}
          <div className="flex items-center gap-0.5 px-1.5 border-r border-zinc-800/80">
            <button
              type="button"
              onClick={() => wrapSelection('**', '**', 'negrito')}
              title="Negrito (Ctrl+B)"
              className="p-1.5 rounded-lg hover:bg-zinc-800/80 hover:text-white text-zinc-400 transition-colors font-bold text-xs"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => wrapSelection('*', '*', 'itálico')}
              title="Itálico (Ctrl+I)"
              className="p-1.5 rounded-lg hover:bg-zinc-800/80 hover:text-white text-zinc-400 transition-colors"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => wrapSelection('<u>', '</u>', 'sublinhado')}
              title="Sublinhado (Ctrl+U)"
              className="p-1.5 rounded-lg hover:bg-zinc-800/80 hover:text-white text-zinc-400 transition-colors"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => wrapSelection('~~', '~~', 'tachado')}
              title="Tachado"
              className="p-1.5 rounded-lg hover:bg-zinc-800/80 hover:text-white text-zinc-400 transition-colors"
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => wrapSelection('`', '`', 'código')}
              title="Código em Linha"
              className="p-1.5 rounded-lg hover:bg-zinc-800/80 hover:text-white text-zinc-400 transition-colors"
            >
              <Code className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Lists & Quotes */}
          <div className="flex items-center gap-0.5 px-1.5 border-r border-zinc-800/80">
            <button
              type="button"
              onClick={() => insertSnippet('\n- Item da lista\n- Outro item')}
              title="Lista com Marcadores"
              className="p-1.5 rounded-lg hover:bg-zinc-800/80 hover:text-white text-zinc-400 transition-colors"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertSnippet('\n1. Primeiro passo\n2. Segundo passo')}
              title="Lista Numerada"
              className="p-1.5 rounded-lg hover:bg-zinc-800/80 hover:text-white text-zinc-400 transition-colors"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertSnippet('\n- [ ] Tarefa pendente\n- [x] Tarefa concluída')}
              title="Checklist / Tarefas"
              className="p-1.5 rounded-lg hover:bg-zinc-800/80 hover:text-white text-zinc-400 transition-colors"
            >
              <CheckSquare className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => wrapSelection('> ', '', 'Citação em destaque')}
              title="Citação"
              className="p-1.5 rounded-lg hover:bg-zinc-800/80 hover:text-white text-zinc-400 transition-colors"
            >
              <Quote className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* PF2e Action Glyphs */}
          <div className="flex items-center gap-1 px-1.5 border-r border-zinc-800/80">
            <button
              type="button"
              onClick={() => insertSnippet('[1-action] ')}
              title="1 Ação [1-action]"
              className="px-1.5 py-0.5 rounded-md hover:bg-zinc-800 text-xs font-bold transition-colors text-zinc-300"
            >
              <PF2eActionGlyph type="1-action" size="sm" />
            </button>
            <button
              type="button"
              onClick={() => insertSnippet('[2-actions] ')}
              title="2 Ações [2-actions]"
              className="px-1.5 py-0.5 rounded-md hover:bg-zinc-800 text-xs font-bold transition-colors text-zinc-300"
            >
              <PF2eActionGlyph type="2-actions" size="sm" />
            </button>
            <button
              type="button"
              onClick={() => insertSnippet('[3-actions] ')}
              title="3 Ações [3-actions]"
              className="px-1.5 py-0.5 rounded-md hover:bg-zinc-800 text-xs font-bold transition-colors text-zinc-300"
            >
              <PF2eActionGlyph type="3-actions" size="sm" />
            </button>
            <button
              type="button"
              onClick={() => insertSnippet('[reaction] ')}
              title="Reação [reaction]"
              className="px-1.5 py-0.5 rounded-md hover:bg-zinc-800 text-xs font-bold transition-colors text-zinc-300"
            >
              <PF2eActionGlyph type="reaction" size="sm" />
            </button>
            <button
              type="button"
              onClick={() => insertSnippet('[free-action] ')}
              title="Ação Livre [free-action]"
              className="px-1.5 py-0.5 rounded-md hover:bg-zinc-800 text-xs font-bold transition-colors text-zinc-300"
            >
              <PF2eActionGlyph type="free-action" size="sm" />
            </button>
          </div>

          {/* Colors & Highlight Menu */}
          <div className="relative flex items-center gap-0.5 px-1.5 border-r border-zinc-800/80">
            <button
              type="button"
              onClick={() => setIsColorMenuOpen(!isColorMenuOpen)}
              title="Cores & Realce"
              className={`p-1.5 rounded-lg transition-colors ${
                isColorMenuOpen ? 'bg-purple-950 text-purple-300 border border-purple-700/60' : 'hover:bg-zinc-800/80 text-zinc-400'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
            </button>

            {isColorMenuOpen && (
              <div className="absolute left-0 top-full mt-1.5 z-40">
                <ColorPickerMenu
                  isOpen={isColorMenuOpen}
                  onApplyTextColor={handleApplyTextColor}
                  onApplyHighlight={handleApplyHighlight}
                  onClose={() => setIsColorMenuOpen(false)}
                />
              </div>
            )}
          </div>

          {/* Powerful Direct @ Mention Button */}
          <div className="flex items-center gap-1 pl-1.5">
            <button
              type="button"
              onClick={() => setIsMentionPickerModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-950/90 to-cyan-950/90 hover:from-purple-900 hover:to-cyan-900 text-cyan-300 border border-cyan-500/60 text-xs font-semibold shadow-sm transition-all hover:scale-105 active:scale-95"
              title="Indexar & Linkar Artigo com Badge Visual (@)"
            >
              <AtSign className="w-3.5 h-3.5 text-cyan-400" />
              <span>@ Menção Badge</span>
            </button>

            {/* Trait snippet */}
            <button
              type="button"
              onClick={() => wrapSelection('[trait:', ']', 'Mágico')}
              className="px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60 text-[11px] font-medium transition-colors"
              title="Inserir Traço [trait:Nome]"
            >
              [tr:Traço]
            </button>
          </div>
        </div>
      )}

      {/* ACTIVE MENTIONS PILL BAR (Displays interactive pills directly on top of the editor) */}
      {activeMentions.length > 0 && viewMode !== 'preview' && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0b0817] border-b border-zinc-800/80 overflow-x-auto text-xs">
          <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-400 uppercase tracking-wider shrink-0 mr-1">
            <AtSign className="w-3 h-3 text-cyan-400" />
            <span>Menções no Artigo ({activeMentions.length}):</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {activeMentions.map((m, idx) => (
              <MentionBadge
                key={`${m.raw}-${idx}`}
                entityIdOrSlug={m.idOrSlug}
                displayText={m.title}
                onNavigate={onNavigate}
                inEditor={true}
                onRemove={() => handleRemoveMention(m.raw)}
                className="text-xs"
              />
            ))}
          </div>
        </div>
      )}

      {/* Editor Body: Visual Mode / Code Mode / Split View / Preview Mode */}
      <div
        className="relative flex-1 flex flex-col md:flex-row transition-[height] duration-75"
        style={{ minHeight: `${editorHeight}px` }}
      >
        {/* ============================================================ */}
        {/* VISUAL MODE WITH LIVE BADGES DIRECTLY IN EDITOR             */}
        {/* ============================================================ */}
        {viewMode === 'visual' && (
          <div className="relative flex-1 flex flex-col w-full">
            {/* Visual Live Interactive Editing Area */}
            <div className="relative flex-1 flex flex-col">
              {/* Backing Visual Badges Rendering Layer */}
              <div
                className="p-4 overflow-y-auto bg-transparent text-zinc-100 font-sans text-sm leading-relaxed"
                style={{ minHeight: `${Math.max(120, editorHeight - 170)}px` }}
              >
                {value.trim() ? (
                  <div className="space-y-3">
                    <div className="text-zinc-200">
                      {renderContentWithMentions(value, onNavigate, {
                        inEditor: true,
                        onRemoveMention: handleRemoveMention,
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-zinc-500 italic text-xs py-2">
                    {placeholder}
                  </div>
                )}
              </div>

              {/* Direct Quick Input Bar with Autocomplete */}
              <div className="p-3 bg-zinc-950/95 border-t border-zinc-800/80 flex flex-col gap-2">
                {/* Header of Interactive Typing Area */}
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 font-semibold text-zinc-200 text-xs">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                      Caixa de Digitação Interativa
                    </span>
                    <span className="hidden sm:inline text-[11px] text-zinc-500">
                      (digite <strong className="text-cyan-300 font-mono">@</strong> ou <strong className="text-purple-300 font-mono">[[</strong> para menções com badges)
                    </span>
                  </div>

                  <div className="flex items-center gap-1 bg-zinc-900/90 border border-zinc-800 rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => setInputBoxHeight((prev) => Math.max(90, prev - 80))}
                      title="Diminuir altura da caixa de digitação (-80px)"
                      className="px-1.5 py-0.5 rounded hover:bg-zinc-800 hover:text-white text-zinc-400 transition-colors text-[10px] font-mono font-bold"
                    >
                      -80px
                    </button>
                    <span className="text-zinc-600 text-[9px]">•</span>
                    <button
                      type="button"
                      onClick={() => setInputBoxHeight((prev) => Math.min(1000, prev + 100))}
                      title="Aumentar altura da caixa de digitação (+100px)"
                      className="px-1.5 py-0.5 rounded hover:bg-cyan-950 hover:text-cyan-300 text-cyan-400 transition-colors text-[10px] font-mono font-bold"
                    >
                      +100px
                    </button>
                    <span className="text-zinc-600 text-[9px]">•</span>
                    <button
                      type="button"
                      onClick={() => setInputBoxHeight(defaultInputBoxHeight)}
                      title="Redefinir altura padrão da caixa de digitação"
                      className="px-1.5 py-0.5 rounded hover:bg-zinc-800 hover:text-zinc-200 text-zinc-500 transition-colors text-[10px]"
                    >
                      Padrão
                    </button>
                  </div>
                </div>

                {/* Textarea container with prominent corner drag handle */}
                <div className="relative group">
                  <textarea
                    id={id}
                    ref={textareaRef}
                    value={value}
                    onChange={handleTextChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Digite aqui para editar texto ou digite @ ou [[ para inserir novas menções com badges..."
                    style={{ minHeight: `${inputBoxHeight}px`, height: `${inputBoxHeight}px` }}
                    className="w-full p-3.5 pr-12 pb-8 bg-zinc-900/95 border-2 border-zinc-700/80 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 rounded-xl text-zinc-100 placeholder-zinc-500 font-mono text-xs leading-relaxed resize-y selection:bg-purple-900/50 shadow-inner transition-colors"
                  />

                  {/* Accessible prominent corner drag handle right on the interactive typing box */}
                  <div
                    onMouseDown={handleInputResizeMouseDown}
                    onTouchStart={handleInputResizeMouseDown}
                    onDoubleClick={() => setInputBoxHeight((prev) => (prev > 260 ? defaultInputBoxHeight : 380))}
                    title="Atalho de Redimensionamento: Arraste para ajustar a altura da caixa de digitação (ou duplo clique para expandir/recolher)"
                    className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-[#0e0a1c] border-2 border-cyan-500/80 hover:border-cyan-300 active:border-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.5)] hover:shadow-[0_0_20px_rgba(6,182,212,0.8)] cursor-ns-resize select-none z-10 transition-all hover:scale-105"
                  >
                    <span className="text-[9px] font-mono font-bold text-cyan-300 tracking-tighter uppercase mr-0.5">
                      Redimensionar
                    </span>
                    <div className="flex flex-col gap-0.5 items-end">
                      <div className="w-3.5 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-cyan-300 rounded-full" />
                      <div className="w-2.5 h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-cyan-400 rounded-full" />
                      <div className="w-1.5 h-0.5 bg-cyan-400 rounded-full" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span>Modo Visual: As menções <strong className="text-cyan-300">@[Nome](id)</strong> e <strong className="text-purple-300">[[Nome]]</strong> viram badges interativos automaticamente.</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsMentionPickerModalOpen(true)}
                    className="px-2.5 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Adicionar Menção</span>
                  </button>
                </div>
              </div>
            </div>

            {/* FLOATING @ MENTION AUTOCOMPLETE DROPDOWN */}
            {showMentionMenu && (
              <div
                ref={dropdownRef}
                className="absolute left-4 bottom-24 z-[99999] w-88 sm:w-96 max-h-80 bg-[#0c0919]/98 border-2 border-cyan-400/90 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.95),0_0_40px_rgba(6,182,212,0.45)] overflow-hidden flex flex-col backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150 ring-2 ring-cyan-500/30"
              >
                <div className="flex items-center justify-between px-3.5 py-2 bg-gradient-to-r from-cyan-950/90 via-purple-950/90 to-zinc-950 border-b border-zinc-800">
                  <div className="flex items-center gap-1.5">
                    <AtSign className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-200">
                      Indexador de Artigos Hecos
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {mentionResults.length} {mentionResults.length === 1 ? 'resultado' : 'resultados'}
                  </span>
                </div>

                <div className="p-1.5 overflow-y-auto max-h-60 space-y-1 divide-y divide-zinc-900">
                  {mentionResults.length === 0 ? (
                    <div className="p-4 text-center text-xs text-zinc-500">
                      Nenhum artigo encontrado para "<span className="text-cyan-400 font-semibold">{mentionQuery}</span>".
                    </div>
                  ) : (
                    mentionResults.map((entity, idx) => {
                      const isSelected = idx === selectedMentionIndex;
                      const CatIcon = getCategoryIconComponent(entity.category);
                      const catConf = CATEGORY_CONFIG[entity.category];

                      return (
                        <div
                          key={entity.id}
                          onClick={() => insertMentionEntity(entity)}
                          onMouseEnter={() => setSelectedMentionIndex(idx)}
                          className={`flex items-start gap-2.5 p-2 rounded-xl cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-gradient-to-r from-purple-950/90 to-cyan-950/90 border border-cyan-500/70 shadow-md ring-1 ring-cyan-500/30'
                              : 'hover:bg-zinc-900/60 border border-transparent'
                          }`}
                        >
                          <div
                            className="p-1.5 rounded-lg shrink-0 mt-0.5 border shadow-inner"
                            style={{
                              backgroundColor: `${entity.categoryColor}25`,
                              borderColor: `${entity.categoryColor}70`,
                            }}
                          >
                            <CatIcon className="w-3.5 h-3.5" style={{ color: entity.categoryColor }} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-zinc-100 truncate">
                                {entity.title}
                              </span>

                              <span
                                className={`px-1.5 py-0.2 rounded text-[9px] font-semibold uppercase tracking-wider border ${catConf?.bgClass || 'bg-zinc-800'} ${catConf?.textClass || 'text-zinc-300'} ${catConf?.borderClass || 'border-zinc-700'}`}
                              >
                                {entity.categoryLabel}
                              </span>

                              {entity.levelOrRank && (
                                <span className="px-1 py-0.2 rounded text-[9px] font-mono font-bold bg-zinc-900 text-cyan-300 border border-zinc-700">
                                  {entity.levelOrRank}
                                </span>
                              )}
                            </div>

                            {entity.subtitle ? (
                              <p className="text-[11px] text-zinc-400 truncate mt-0.5">{entity.subtitle}</p>
                            ) : (
                              <p className="text-[10px] text-zinc-500 font-mono truncate mt-0.5">
                                @{entity.slug}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="px-3 py-1.5 bg-zinc-950 border-t border-zinc-900 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                  <span>↑↓ navegar</span>
                  <span>ENTER / TAB para inserir Badge</span>
                  <span>ESC fechar</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* CODE / MARKDOWN & SPLIT TEXTAREA MODE                        */}
        {/* ============================================================ */}
        {(viewMode === 'code' || viewMode === 'split') && (
          <div className={`relative flex-1 flex flex-col ${viewMode === 'split' ? 'md:w-1/2 border-r border-zinc-800/80' : 'w-full'}`}>
            <div className="relative flex-1 flex flex-col">
              <textarea
                id={id}
                ref={textareaRef}
                value={value}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="w-full flex-1 p-4 pr-12 pb-9 bg-transparent text-zinc-100 placeholder-zinc-500 focus:outline-none font-mono text-sm leading-relaxed resize-y selection:bg-purple-900/50"
                style={{ minHeight: `${editorHeight}px` }}
              />

              {/* Accessible corner drag handle on code editor */}
              <div
                onMouseDown={handleResizeMouseDown}
                onTouchStart={handleResizeMouseDown}
                onDoubleClick={() => setEditorHeight((prev) => (prev > 380 ? parsedMinHeight : 540))}
                title="Atalho de Redimensionamento: Arraste para ajustar a altura do editor (ou duplo clique para expandir/recolher)"
                className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-[#0e0a1c] border-2 border-cyan-500/80 hover:border-cyan-300 active:border-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.5)] hover:shadow-[0_0_20px_rgba(6,182,212,0.8)] cursor-ns-resize select-none z-10 transition-all hover:scale-105"
              >
                <span className="text-[9px] font-mono font-bold text-cyan-300 tracking-tighter uppercase mr-0.5">
                  Redimensionar
                </span>
                <div className="flex flex-col gap-0.5 items-end">
                  <div className="w-3.5 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-cyan-300 rounded-full" />
                  <div className="w-2.5 h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-cyan-400 rounded-full" />
                  <div className="w-1.5 h-0.5 bg-cyan-400 rounded-full" />
                </div>
              </div>
            </div>

            {/* FLOATING @ MENTION AUTOCOMPLETE DROPDOWN */}
            {showMentionMenu && (
              <div
                ref={dropdownRef}
                className="absolute left-4 top-3 z-[99999] w-88 sm:w-96 max-h-80 bg-[#0c0919]/98 border-2 border-cyan-400/90 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.95),0_0_40px_rgba(6,182,212,0.45)] overflow-hidden flex flex-col backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150 ring-2 ring-cyan-500/30"
              >
                <div className="flex items-center justify-between px-3.5 py-2 bg-gradient-to-r from-cyan-950/90 via-purple-950/90 to-zinc-950 border-b border-zinc-800">
                  <div className="flex items-center gap-1.5">
                    <AtSign className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-200">
                      Indexador de Artigos Hecos
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {mentionResults.length} {mentionResults.length === 1 ? 'resultado' : 'resultados'}
                  </span>
                </div>

                <div className="p-1.5 overflow-y-auto max-h-60 space-y-1 divide-y divide-zinc-900">
                  {mentionResults.length === 0 ? (
                    <div className="p-4 text-center text-xs text-zinc-500">
                      Nenhum artigo encontrado para "<span className="text-cyan-400 font-semibold">{mentionQuery}</span>".
                    </div>
                  ) : (
                    mentionResults.map((entity, idx) => {
                      const isSelected = idx === selectedMentionIndex;
                      const CatIcon = getCategoryIconComponent(entity.category);
                      const catConf = CATEGORY_CONFIG[entity.category];

                      return (
                        <div
                          key={entity.id}
                          onClick={() => insertMentionEntity(entity)}
                          onMouseEnter={() => setSelectedMentionIndex(idx)}
                          className={`flex items-start gap-2.5 p-2 rounded-xl cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-gradient-to-r from-purple-950/90 to-cyan-950/90 border border-cyan-500/70 shadow-md ring-1 ring-cyan-500/30'
                              : 'hover:bg-zinc-900/60 border border-transparent'
                          }`}
                        >
                          <div
                            className="p-1.5 rounded-lg shrink-0 mt-0.5 border shadow-inner"
                            style={{
                              backgroundColor: `${entity.categoryColor}25`,
                              borderColor: `${entity.categoryColor}70`,
                            }}
                          >
                            <CatIcon className="w-3.5 h-3.5" style={{ color: entity.categoryColor }} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-zinc-100 truncate">
                                {entity.title}
                              </span>

                              <span
                                className={`px-1.5 py-0.2 rounded text-[9px] font-semibold uppercase tracking-wider border ${catConf?.bgClass || 'bg-zinc-800'} ${catConf?.textClass || 'text-zinc-300'} ${catConf?.borderClass || 'border-zinc-700'}`}
                              >
                                {entity.categoryLabel}
                              </span>

                              {entity.levelOrRank && (
                                <span className="px-1 py-0.2 rounded text-[9px] font-mono font-bold bg-zinc-900 text-cyan-300 border border-zinc-700">
                                  {entity.levelOrRank}
                                </span>
                              )}
                            </div>

                            {entity.subtitle ? (
                              <p className="text-[11px] text-zinc-400 truncate mt-0.5">{entity.subtitle}</p>
                            ) : (
                              <p className="text-[10px] text-zinc-500 font-mono truncate mt-0.5">
                                @{entity.slug}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="px-3 py-1.5 bg-zinc-950 border-t border-zinc-900 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                  <span>↑↓ navegar</span>
                  <span>ENTER / TAB para inserir Badge</span>
                  <span>ESC fechar</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* LIVE PREVIEW (Split view right side OR Full Preview mode) */}
        {(viewMode === 'split' || viewMode === 'preview') && (
          <div
            className={`flex-1 p-5 overflow-y-auto bg-[#07050f]/80 ${
              viewMode === 'split' ? 'md:w-1/2' : 'w-full'
            }`}
            style={{ minHeight: `${editorHeight}px` }}
          >
            {value.trim() ? (
              <div className="prose prose-invert prose-purple max-w-none text-zinc-200 text-sm leading-relaxed">
                {renderContentWithMentions(value, onNavigate || (() => {}), { inEditor: false })}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-600 text-xs italic p-8 text-center">
                <Eye className="w-8 h-8 text-zinc-700 mb-2" />
                A prévia formatada em tempo real com @menções e badges interativos aparecerá aqui.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Editor Bottom Bar: Word Count, Height Adjusters & Accessible Resize Handle */}
      <div className="px-3 sm:px-4 py-1.5 bg-zinc-950/95 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500 font-mono select-none">
        <div className="flex items-center gap-2">
          <span>
            {wordsCount} {wordsCount === 1 ? 'palavra' : 'palavras'}
          </span>
          <span>•</span>
          <span>{charsCount} caracteres</span>
        </div>

        <div className="flex items-center gap-2 text-zinc-400">
          <div className="flex items-center gap-1 bg-zinc-900/90 border border-zinc-800 rounded-lg p-0.5">
            <button
              type="button"
              onClick={handleShrinkHeight}
              title="Diminuir altura da caixa de texto (-120px)"
              className="px-1.5 py-0.5 rounded hover:bg-zinc-800 hover:text-white text-zinc-400 transition-colors text-[10px] font-bold"
            >
              -120px
            </button>
            <span className="text-zinc-600 text-[9px]">•</span>
            <button
              type="button"
              onClick={handleExpandHeight}
              title="Aumentar altura da caixa de texto (+120px)"
              className="px-1.5 py-0.5 rounded hover:bg-cyan-950 hover:text-cyan-300 text-zinc-300 transition-colors text-[10px] font-bold"
            >
              +120px
            </button>
            <span className="text-zinc-600 text-[9px]">•</span>
            <button
              type="button"
              onClick={handleResetHeight}
              title="Redefinir altura padrão da caixa de texto"
              className="px-1.5 py-0.5 rounded hover:bg-zinc-800 hover:text-zinc-200 text-zinc-500 transition-colors text-[10px]"
            >
              Padrão
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsMentionPickerModalOpen(true)}
            className="hidden sm:inline hover:text-cyan-300 underline transition-colors ml-1"
          >
            Explorar Artigos
          </button>

          {/* Accessible Direct Corner Drag Handle */}
          <div
            onMouseDown={handleResizeMouseDown}
            onTouchStart={handleResizeMouseDown}
            onDoubleClick={() => setEditorHeight((prev) => (prev > 450 ? parsedMinHeight : 560))}
            title="Atalho de Redimensionamento: Clique e arraste para redimensionar a altura da caixa de texto (ou duplo-clique para expandir/recolher)"
            className="hecos-resize-handle group flex items-center justify-center p-1.5 -mr-1.5 rounded-md hover:bg-cyan-950/80 active:bg-cyan-900 border border-transparent hover:border-cyan-500/60 transition-all cursor-ns-resize"
          >
            <div className="flex flex-col gap-0.5 items-end opacity-75 group-hover:opacity-100 group-hover:scale-110 transition-all">
              <div className="w-4 h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-cyan-400 rounded-full shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
              <div className="w-3 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-cyan-300 rounded-full shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
              <div className="w-1.5 h-0.5 bg-cyan-400 rounded-full shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* FULL MODAL: EXPLORE & INSERT INDEXED ARTICLES                */}
      {/* ============================================================ */}
      {isMentionPickerModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-2xl bg-[#0c0919] border border-cyan-500/70 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.3)] overflow-hidden flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-gradient-to-r from-purple-950/80 via-zinc-900 to-cyan-950/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-950/90 border border-cyan-500/60 shadow-inner">
                  <AtSign className="w-5 h-5 text-cyan-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Indexador Universal de Artigos Hecos
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Selecione qualquer artigo para inserir a menção com Badge/Pill visual interativo
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMentionPickerModalOpen(false)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/80 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search and Category Filter Header */}
            <div className="p-4 bg-zinc-950/80 border-b border-zinc-800/80 space-y-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Buscar pelo nome do NPC, feitiço, item, local, perigo, criatura..."
                    value={pickerSearchQuery}
                    onChange={(e) => setPickerSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-zinc-900/90 border border-zinc-700/80 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                  />
                </div>

                {/* Format selection */}
                <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-0.5 text-[11px] shrink-0">
                  <button
                    type="button"
                    onClick={() => setInsertionFormat('bracket')}
                    className={`px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                      insertionFormat === 'bracket'
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-semibold'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    @[Nome](id)
                  </button>
                  <button
                    type="button"
                    onClick={() => setInsertionFormat('wikilink')}
                    className={`px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                      insertionFormat === 'wikilink'
                        ? 'bg-purple-950 text-purple-300 border border-purple-700/60 font-semibold'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    [[Nome]]
                  </button>
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <button
                  type="button"
                  onClick={() => setPickerSelectedCat('all')}
                  className={`px-3 py-1 rounded-lg whitespace-nowrap text-xs font-semibold transition-all ${
                    pickerSelectedCat === 'all'
                      ? 'bg-white text-black shadow-md'
                      : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                  }`}
                >
                  Todos
                </button>
                {Object.entries(CATEGORY_CONFIG).map(([catKey, conf]) => (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => setPickerSelectedCat(catKey)}
                    className={`px-2.5 py-1 rounded-lg whitespace-nowrap text-xs font-medium border transition-all ${
                      pickerSelectedCat === catKey
                        ? `${conf.bgClass} ${conf.textClass} ${conf.borderClass} font-semibold shadow-sm ring-1`
                        : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border-zinc-800'
                    }`}
                  >
                    {conf.label.split(' / ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Grid */}
            <div className="p-4 overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {pickerResults.length === 0 ? (
                <div className="col-span-full py-12 text-center text-xs text-zinc-500">
                  Nenhum artigo encontrado. Tente outro termo de busca.
                </div>
              ) : (
                pickerResults.map((entity) => {
                  const CatIcon = getCategoryIconComponent(entity.category);
                  const catConf = CATEGORY_CONFIG[entity.category];

                  return (
                    <div
                      key={entity.id}
                      onClick={() => insertMentionEntity(entity, insertionFormat)}
                      className="flex items-start gap-3 p-3 rounded-xl bg-zinc-900/50 hover:bg-zinc-800/80 border border-zinc-800 hover:border-cyan-500/70 shadow-sm hover:shadow-cyan-950/40 transition-all cursor-pointer group"
                    >
                      <div
                        className="p-2 rounded-xl shrink-0 mt-0.5 border shadow-inner"
                        style={{
                          backgroundColor: `${entity.categoryColor}25`,
                          borderColor: `${entity.categoryColor}70`,
                        }}
                      >
                        <CatIcon className="w-4 h-4" style={{ color: entity.categoryColor }} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-zinc-100 group-hover:text-white truncate">
                            {entity.title}
                          </span>
                          {entity.levelOrRank && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-zinc-950 text-cyan-300 border border-zinc-700">
                              {entity.levelOrRank}
                            </span>
                          )}
                        </div>

                        <span
                          className={`inline-block mt-1 px-1.5 py-0.2 rounded text-[9px] font-semibold uppercase tracking-wider border ${catConf?.bgClass} ${catConf?.textClass} ${catConf?.borderClass}`}
                        >
                          {entity.categoryLabel}
                        </span>

                        {entity.subtitle && (
                          <p className="text-[11px] text-zinc-400 line-clamp-1 mt-1">{entity.subtitle}</p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-zinc-950 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
              <span>Clique no artigo para inserir como badge visual interativo.</span>
              <button
                type="button"
                onClick={() => setIsMentionPickerModalOpen(false)}
                className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl transition-colors font-medium"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
