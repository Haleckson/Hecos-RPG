import React, { useState, useRef } from 'react';
import { HecosStorage } from '../services/storage';
import { Link, Sparkles, Bold, Italic, Eye, Edit3, X, Check } from 'lucide-react';
import { RichContentRenderer } from './RichContentRenderer';

interface ReferenceFieldProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
  multiline?: boolean;
  helpText?: string;
  icon?: React.ReactNode;
  onNavigate?: (id: string) => void;
}

export const ReferenceField: React.FC<ReferenceFieldProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  multiline = true,
  helpText,
  icon,
  onNavigate = () => {},
}) => {
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const allEntities = HecosStorage.getEntities();
  const filteredEntities = allEntities
    .filter(
      (e) =>
        (e.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.slug || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.tags || []).some((t) => (t || '').toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .slice(0, 7);

  const insertReference = (entityTitle: string) => {
    const mentionText = `[[${entityTitle}]]`;
    const el = inputRef.current;
    if (!el) {
      onChange(value ? `${value} ${mentionText}` : mentionText);
      setShowMentionMenu(false);
      return;
    }

    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const before = value.substring(0, start);
    const after = value.substring(end);
    const newVal = `${before}${mentionText}${after}`;
    onChange(newVal);
    setShowMentionMenu(false);

    setTimeout(() => {
      if (el) {
        el.focus();
        el.setSelectionRange(start + mentionText.length, start + mentionText.length);
      }
    }, 20);
  };

  const insertFormat = (prefix: string, suffix: string = prefix) => {
    const el = inputRef.current;
    if (!el) return;
    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const hasSelection = start !== end;
    const selected = value.substring(start, end);

    let newVal = '';
    let newStart = start;
    let newEnd = end;

    if (hasSelection) {
      // Toggle check: if already wrapped in prefix/suffix, unwrap
      if (selected.startsWith(prefix) && selected.endsWith(suffix) && selected.length >= prefix.length + suffix.length) {
        const unwrapped = selected.slice(prefix.length, selected.length - suffix.length);
        newVal = value.substring(0, start) + unwrapped + value.substring(end);
        newStart = start;
        newEnd = start + unwrapped.length;
      } else {
        newVal = value.substring(0, start) + prefix + selected + suffix + value.substring(end);
        newStart = start;
        newEnd = start + prefix.length + selected.length + suffix.length;
      }
    } else {
      const placeholder = 'texto';
      newVal = value.substring(0, start) + prefix + placeholder + suffix + value.substring(end);
      newStart = start + prefix.length;
      newEnd = newStart + placeholder.length;
    }

    onChange(newVal);
    setTimeout(() => {
      if (el) {
        el.focus();
        el.setSelectionRange(newStart, newEnd);
      }
    }, 20);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Keyboard shortcuts: Ctrl+B (Bold), Ctrl+I (Italic), Ctrl+U (Underline), Ctrl+K (Link/Mention)
    if (e.ctrlKey || e.metaKey) {
      const key = e.key.toLowerCase();
      if (key === 'b') {
        e.preventDefault();
        e.stopPropagation();
        insertFormat('**', '**');
        return;
      }
      if (key === 'i') {
        e.preventDefault();
        e.stopPropagation();
        insertFormat('*', '*');
        return;
      }
      if (key === 'u') {
        e.preventDefault();
        e.stopPropagation();
        insertFormat('<u>', '</u>');
        return;
      }
      if (key === 'k') {
        e.preventDefault();
        e.stopPropagation();
        setShowMentionMenu(true);
        setSearchQuery('');
        return;
      }
    }

    if (e.key === '@' || (e.key === '[' && value.endsWith('['))) {
      setShowMentionMenu(true);
      setSearchQuery('');
    }
  };

  return (
    <div className="space-y-1.5 w-full min-w-0 relative flex flex-col justify-start">
      {/* Field Label and Compact Quick Action Toolbar */}
      {label && (
        <div className="flex items-center justify-between gap-1.5 min-w-0 min-h-[22px]">
          <label
            htmlFor={id}
            title={label}
            className="text-xs font-bold text-zinc-300 flex items-center gap-1.5 min-w-0 truncate"
          >
            {icon}
            <span className="truncate">{label}</span>
          </label>

          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={() => insertFormat('**', '**')}
              className="p-1 rounded text-[11px] font-bold bg-[#14121b] hover:bg-[#1f1c2b] border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              title="Negrito (**texto**)"
            >
              <Bold className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => insertFormat('*', '*')}
              className="p-1 rounded text-[11px] font-bold bg-[#14121b] hover:bg-[#1f1c2b] border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              title="Itálico (*texto*)"
            >
              <Italic className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => {
                setShowMentionMenu(!showMentionMenu);
                setSearchQuery('');
              }}
              className={`p-1 rounded border transition-all cursor-pointer ${
                showMentionMenu
                  ? 'bg-[#1b2a32] text-[#74b6c2] border-[#2e4f5a]'
                  : 'bg-[#14121b] hover:bg-[#1b2a32] text-[#74b6c2]/80 hover:text-[#74b6c2] border-zinc-800 hover:border-[#2e4f5a]'
              }`}
              title="Inserir Hiperlink / Referência do Codex ([[Artigo]])"
            >
              <Link className="w-3 h-3" />
            </button>
            {value && (
              <button
                type="button"
                onClick={() => setPreviewMode(!previewMode)}
                className={`p-1 rounded border transition-colors cursor-pointer ${
                  previewMode
                    ? 'bg-[#241e33] text-[#b19ecc] border-[#493b61]'
                    : 'bg-[#14121b] text-zinc-400 hover:text-[#b19ecc] border-zinc-800'
                }`}
                title={previewMode ? 'Voltar para Edição' : 'Pré-visualizar Referências'}
              >
                {previewMode ? <Edit3 className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Input or Textarea or Preview */}
      {previewMode ? (
        <div className="p-3 rounded-xl bg-[#0f0e15] border border-[#493b61]/60 text-sm text-zinc-200 min-h-[42px] relative group w-full min-w-0 break-words">
          <RichContentRenderer content={value} onNavigate={onNavigate} />
          <button
            type="button"
            onClick={() => setPreviewMode(false)}
            className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded bg-[#181622] text-zinc-400 hover:text-zinc-200 border border-zinc-700 cursor-pointer"
          >
            Editar
          </button>
        </div>
      ) : multiline ? (
        <textarea
          id={id}
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-3 py-2 rounded-xl bg-[#0f0e15] border border-zinc-800/90 hover:border-zinc-700 focus:border-[#74b6c2] focus:ring-1 focus:ring-[#74b6c2]/40 text-sm text-zinc-100 placeholder-zinc-600 transition-colors resize-y leading-relaxed font-sans outline-none min-w-0"
        />
      ) : (
        <input
          id={id}
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-3 py-2 rounded-xl bg-[#0f0e15] border border-zinc-800/90 hover:border-zinc-700 focus:border-[#74b6c2] focus:ring-1 focus:ring-[#74b6c2]/40 text-sm text-zinc-100 placeholder-zinc-600 transition-colors outline-none min-w-0 h-[38px]"
        />
      )}

      {helpText && !previewMode && (
        <p className="text-[11px] text-zinc-500 leading-normal">{helpText}</p>
      )}

      {/* Floating Mention / Entity Reference Dropdown */}
      {showMentionMenu && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-[#15131e] border border-[#2e4f5a] rounded-xl shadow-xl p-2.5 space-y-2 backdrop-blur-md animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between pb-1 border-b border-zinc-800">
            <span className="text-[11px] font-bold text-[#74b6c2] flex items-center gap-1.5">
              <Link className="w-3.5 h-3.5" />
              <span>Inserir Hiperlink do Codex</span>
            </span>
            <button
              type="button"
              onClick={() => setShowMentionMenu(false)}
              className="text-zinc-400 hover:text-zinc-200 cursor-pointer p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <input
            type="text"
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar artigo ou regra..."
            className="w-full px-2.5 py-1.5 rounded-lg bg-[#0e0d14] border border-zinc-800 focus:border-[#74b6c2] text-xs text-zinc-100 placeholder-zinc-500 outline-none"
          />

          <div className="max-h-48 overflow-y-auto space-y-1">
            {filteredEntities.length > 0 ? (
              filteredEntities.map((ent) => (
                <button
                  key={ent.id}
                  type="button"
                  onClick={() => insertReference(ent.title)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#1b2a32] hover:border hover:border-[#2e4f5a] text-left text-xs transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#74b6c2]" />
                    <span className="font-semibold text-zinc-200 group-hover:text-[#74b6c2]">
                      {ent.title}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#0e0d14] border border-zinc-800 text-zinc-400">
                    {ent.category}
                  </span>
                </button>
              ))
            ) : (
              <div className="text-center py-2 text-xs text-zinc-500">
                Nenhum artigo encontrado com esse termo.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
