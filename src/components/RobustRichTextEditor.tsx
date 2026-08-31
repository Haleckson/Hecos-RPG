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
  Table as TableIcon,
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
  BookOpen
} from 'lucide-react';
import { entityIndexService, IndexedEntity, CATEGORY_CONFIG } from '../services/entityIndexService';
import { ColorPickerMenu } from './ColorPickerMenu';
import { PF2eActionGlyph, ActionGlyphType } from './PF2eActionGlyph';
import { renderContentWithMentions } from './MentionBadge';
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

export const RobustRichTextEditor: React.FC<RobustRichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Escreva o conteúdo do artigo... Digite @ para indexar e linkar qualquer artigo do site.',
  minHeight = '220px',
  label,
  description,
  excludeEntityId,
  showToolbar = true,
  showPreviewToggle = true,
  className = '',
  onNavigate,
  compact = false,
  id,
}) => {
  const [viewMode, setViewMode] = useState<'edit' | 'split' | 'preview'>('edit');
  const [isColorMenuOpen, setIsColorMenuOpen] = useState(false);

  // @ Mention auto-complete state
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionResults, setMentionResults] = useState<IndexedEntity[]>([]);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [mentionCursorPos, setMentionCursorPos] = useState<number | null>(null);

  // Manual Mention Picker Modal state
  const [isMentionPickerModalOpen, setIsMentionPickerModalOpen] = useState(false);
  const [pickerSearchQuery, setPickerSearchQuery] = useState('');
  const [pickerSelectedCat, setPickerSelectedCat] = useState<string>('all');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Text Change detection for @
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const pos = e.target.selectionStart;
    onChange(val);

    const textBeforeCursor = val.slice(0, pos);

    // Look for @ followed by any word characters before cursor
    const atMatch = textBeforeCursor.match(/@([a-zA-Z0-9_\u00C0-\u00FF-]*)$/);
    if (atMatch && atMatch[1] !== undefined) {
      setMentionQuery(atMatch[1]);
      setShowMentionMenu(true);
      setMentionCursorPos(pos);
    } else {
      setShowMentionMenu(false);
      setMentionCursorPos(null);
    }
  };

  // Insert a selected entity mention
  const insertMentionEntity = useCallback(
    (entity: IndexedEntity) => {
      const el = textareaRef.current;
      const slugToUse = entity.slug || entity.id;
      const mentionTag = `@${slugToUse} `;

      if (!el) {
        onChange(value + ` ${mentionTag}`);
        setShowMentionMenu(false);
        return;
      }

      const curPos = el.selectionStart || 0;
      const textBefore = value.slice(0, curPos);
      const textAfter = value.slice(curPos);

      // Find the last @ index before the cursor
      const atIndex = textBefore.lastIndexOf('@');
      let newText = '';
      let targetPos = curPos;

      if (atIndex !== -1) {
        newText = textBefore.slice(0, atIndex) + mentionTag + textAfter;
        targetPos = atIndex + mentionTag.length;
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
    [value, onChange]
  );

  // Keyboard navigation for dropdown & shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const el = textareaRef.current;
    if (!el) return;

    // Handle @ Mention menu navigation
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

          {/* View Mode Toggle: Edit / Split / Preview */}
          {showPreviewToggle && (
            <div className="flex items-center gap-1 bg-zinc-900/90 border border-zinc-800 p-0.5 rounded-lg text-[11px]">
              <button
                type="button"
                onClick={() => setViewMode('edit')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                  viewMode === 'edit'
                    ? 'bg-purple-950 text-purple-300 font-semibold shadow-sm border border-purple-800/70'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Edit3 className="w-3 h-3" />
                <span>Editor</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('split')}
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
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-950/80 to-cyan-950/80 hover:from-purple-900/90 hover:to-cyan-900/90 text-cyan-300 border border-cyan-700/60 text-xs font-semibold shadow-sm transition-all hover:scale-105 active:scale-95"
              title="Indexar & Linkar Artigo do Site (@)"
            >
              <AtSign className="w-3.5 h-3.5 text-cyan-400" />
              <span>@ Menção</span>
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

      {/* Editor Body: Edit Mode / Split View / Preview Mode */}
      <div className="relative flex-1 flex flex-col md:flex-row" style={{ minHeight }}>
        {/* TEXTAREA WRAPPER (Hidden in preview mode) */}
        {viewMode !== 'preview' && (
          <div className={`relative flex-1 flex flex-col ${viewMode === 'split' ? 'md:w-1/2 border-r border-zinc-800/80' : 'w-full'}`}>
            <textarea
              id={id}
              ref={textareaRef}
              value={value}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full flex-1 p-4 bg-transparent text-zinc-100 placeholder-zinc-500 focus:outline-none font-mono text-sm leading-relaxed resize-none selection:bg-purple-900/50"
              style={{ minHeight }}
            />

            {/* ============================================================ */}
            {/* FLOATING @ MENTION AUTOCOMPLETE DROPDOWN                     */}
            {/* ============================================================ */}
            {showMentionMenu && (
              <div
                ref={dropdownRef}
                className="absolute left-4 top-3 z-[99999] w-88 sm:w-96 max-h-80 bg-[#0c0919]/98 border-2 border-cyan-400/90 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.95),0_0_40px_rgba(6,182,212,0.45)] overflow-hidden flex flex-col backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150 ring-2 ring-cyan-500/30"
              >
                {/* Dropdown Header */}
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

                {/* Dropdown Results List */}
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
                          {/* Category Icon */}
                          <div
                            className="p-1.5 rounded-lg shrink-0 mt-0.5 border shadow-inner"
                            style={{
                              backgroundColor: `${entity.categoryColor}25`,
                              borderColor: `${entity.categoryColor}70`,
                            }}
                          >
                            <CatIcon className="w-3.5 h-3.5" style={{ color: entity.categoryColor }} />
                          </div>

                          {/* Entity Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-zinc-100 truncate">
                                {entity.title}
                              </span>

                              {/* Category Badge */}
                              <span
                                className={`px-1.5 py-0.2 rounded text-[9px] font-semibold uppercase tracking-wider border ${catConf?.bgClass || 'bg-zinc-800'} ${catConf?.textClass || 'text-zinc-300'} ${catConf?.borderClass || 'border-zinc-700'}`}
                              >
                                {entity.categoryLabel}
                              </span>

                              {/* Level or Rank Badge */}
                              {entity.levelOrRank && (
                                <span className="px-1 py-0.2 rounded text-[9px] font-mono font-bold bg-zinc-900 text-cyan-300 border border-zinc-700">
                                  {entity.levelOrRank}
                                </span>
                              )}
                            </div>

                            {/* Subtitle or Tag line */}
                            {entity.subtitle ? (
                              <p className="text-[11px] text-zinc-400 truncate mt-0.5">{entity.subtitle}</p>
                            ) : entity.tags && entity.tags.length > 0 ? (
                              <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                                #{entity.tags.slice(0, 3).join(' #')}
                              </p>
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

                {/* Dropdown Footer Shortcuts */}
                <div className="px-3 py-1.5 bg-zinc-950 border-t border-zinc-900 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                  <span>↑↓ navegar</span>
                  <span>ENTER / TAB para inserir</span>
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
            style={{ minHeight }}
          >
            {value.trim() ? (
              <div className="prose prose-invert prose-purple max-w-none text-zinc-200 text-sm leading-relaxed">
                {renderContentWithMentions(value, onNavigate || (() => {}))}
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

      {/* Editor Bottom Bar: Word Count & Help Hint */}
      <div className="px-4 py-1.5 bg-zinc-950/90 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
        <div className="flex items-center gap-2">
          <span>
            {wordsCount} {wordsCount === 1 ? 'palavra' : 'palavras'}
          </span>
          <span>•</span>
          <span>{charsCount} caracteres</span>
        </div>

        <div className="flex items-center gap-2 text-zinc-400">
          <span className="hidden sm:inline">Dica: Digite <strong className="text-cyan-300">@nome</strong> para indexar qualquer artigo</span>
          <button
            type="button"
            onClick={() => setIsMentionPickerModalOpen(true)}
            className="hover:text-cyan-300 underline transition-colors"
          >
            Explorar Artigos
          </button>
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
                    Selecione qualquer artigo para inserir a @menção vinculada interativa
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
              <div className="relative">
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
                      onClick={() => insertMentionEntity(entity)}
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
              <span>Clique em qualquer artigo para inserir `@slug` automaticamente.</span>
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
