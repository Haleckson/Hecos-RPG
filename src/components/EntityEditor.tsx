import React, { useState, useRef, useEffect } from 'react';
import { HecosEntity, EntityCategory, ItemVisibility } from '../types';
import { HecosStorage } from '../services/storage';
import { uploadToImgBB } from '../services/imgbb';
import { VisibilityBadgeMenu } from './VisibilityBadgeMenu';
import {
  Save,
  Image as ImageIcon,
  Sparkles,
  ShieldAlert,
  Youtube,
  Eye,
  EyeOff,
  Edit3,
  Columns,
  Tag as TagIcon,
  Loader2,
  CheckCircle2,
  Lock,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Palette,
  AtSign,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  ChevronRight,
  Quote,
  Table,
  Minus,
  Maximize2,
  Minimize2,
  Zap,
  HelpCircle,
  Clock,
  FileText,
  Trash2
} from 'lucide-react';
import { renderContentWithMentions } from './MentionBadge';
import { PF2eActionGlyph } from './PF2eActionGlyph';
import { RichContentRenderer } from './RichContentRenderer';
import { NotionSlashMenu } from './NotionSlashMenu';
import { ColorPickerMenu } from './ColorPickerMenu';
import { ImageUploadInput } from './ImageUploadInput';
import { ImgBBUploadModal } from './ImgBBUploadModal';
import { IconPicker } from './IconPicker';
import { TraitBadge } from './TraitBadge';
import { getFullAncestryTemplate } from '../utils/ancestryTemplate';
import { AncestryEditor } from './AncestryEditor';
import { FeatEditor } from './FeatEditor';
import { Dna, Sliders } from 'lucide-react';

interface EntityEditorProps {
  entity: HecosEntity;
  onSave: (updated: HecosEntity) => void;
  onCancel: () => void;
  onDelete?: () => void;
  onNavigate: (id: string) => void;
}

export const EntityEditor: React.FC<EntityEditorProps> = ({
  entity,
  onSave,
  onCancel,
  onDelete,
  onNavigate,
}) => {
  const [title, setTitle] = useState(entity.title);
  const [subtitle, setSubtitle] = useState(entity.subtitle || '');
  const [category, setCategory] = useState<EntityCategory>(entity.category);
  const [summary, setSummary] = useState(entity.summary || '');
  const [content, setContent] = useState(entity.content || '');
  const [coverImage, setCoverImage] = useState(entity.coverImage || '');
  const [icon, setIcon] = useState(entity.icon || '');
  const [tagsString, setTagsString] = useState((entity.tags || []).join(', '));
  const [traitsString, setTraitsString] = useState((entity.traits || []).join(', '));
  const [isSecret, setIsSecret] = useState(entity.isSecret !== undefined ? entity.isSecret : true);
  const [visibility, setVisibility] = useState<ItemVisibility>(entity.visibility || (entity.isSecret ? 'gm' : 'public'));
  const [allowedUserIds, setAllowedUserIds] = useState<string[]>(entity.allowedUserIds || []);
  const [useStructuredAncestry, setUseStructuredAncestry] = useState(true);
  const [useStructuredFeat, setUseStructuredFeat] = useState(true);

  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [showImgBBModal, setShowImgBBModal] = useState(false);

  // @ Mention auto-complete state
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);

  // / Notion Slash Command Menu state
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const [slashStartPosition, setSlashStartPosition] = useState<number | null>(null);

  // Color Picker Menu state
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const allEntities = HecosStorage.getEntities();

  // Filter entities for mention dropdown
  const filteredEntities = allEntities
    .filter(
      (e) =>
        e.id !== entity.id &&
        (e.title.toLowerCase().includes(mentionQuery.toLowerCase()) ||
          e.slug.toLowerCase().includes(mentionQuery.toLowerCase()) ||
          e.tags.some((t) => t.toLowerCase().includes(mentionQuery.toLowerCase())))
    )
    .slice(0, 8);

  // Helper to wrap selected text with prefix & suffix (e.g. **bold**)
  const wrapSelection = (prefix: string, suffix: string = prefix, defaultPlaceholder: string = 'texto') => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selectedText = content.substring(start, end) || defaultPlaceholder;

    const newText =
      content.substring(0, start) +
      prefix +
      selectedText +
      suffix +
      content.substring(end);

    setContent(newText);

    setTimeout(() => {
      if (el) {
        el.focus();
        el.setSelectionRange(
          start + prefix.length,
          start + prefix.length + selectedText.length
        );
      }
    }, 20);
  };

  // Helper to apply Text Color
  const handleApplyTextColor = (colorHex: string) => {
    if (!colorHex) return;
    wrapSelection(`<span style="color: ${colorHex}">`, '</span>', 'texto colorido');
  };

  // Helper to apply Background Highlight
  const handleApplyHighlight = (bgRgba: string, borderHex?: string) => {
    if (!bgRgba) return;
    const borderStyle = borderHex ? ` border: 1px solid ${borderHex};` : '';
    wrapSelection(
      `<mark style="background-color: ${bgRgba};${borderStyle} padding: 2px 6px; border-radius: 4px; color: #f4f4f5;">`,
      '</mark>',
      'texto destacado'
    );
  };

  // Insert snippet at current cursor or append
  const insertSnippet = (snippet: string, replaceLength: number = 0) => {
    if (!textareaRef.current) {
      setContent((prev) => prev + '\n' + snippet);
      return;
    }

    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;

    // If replacing slash command or mention
    const actualStart = replaceLength > 0 ? Math.max(0, start - replaceLength) : start;

    const newText =
      content.substring(0, actualStart) +
      snippet +
      content.substring(end);

    setContent(newText);

    setTimeout(() => {
      if (el) {
        el.focus();
        const nextPos = actualStart + snippet.length;
        el.setSelectionRange(nextPos, nextPos);
      }
    }, 30);
  };

  // Handle Text Changes & Detect @ and /
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const pos = e.target.selectionStart;
    setContent(val);

    const textBeforeCursor = val.slice(0, pos);

    // 1. Check for @mention
    const atMatch = textBeforeCursor.match(/@([a-zA-Z0-9_-]*)$/);
    if (atMatch) {
      setMentionQuery(atMatch[1]);
      setShowMentionMenu(true);
      setShowSlashMenu(false);
      setMentionIndex(0);
    } else {
      setShowMentionMenu(false);
    }

    // 2. Check for /slash command
    const slashMatch = textBeforeCursor.match(/(?:^|\n|\s)\/([a-zA-Z0-9_-]*)$/);
    if (slashMatch) {
      const matchText = slashMatch[0];
      const slashIdx = textBeforeCursor.lastIndexOf('/');
      setSlashStartPosition(slashIdx);
      setSlashQuery(slashMatch[1]);
      setShowSlashMenu(true);
      setShowMentionMenu(false);
    } else {
      setShowSlashMenu(false);
      setSlashStartPosition(null);
    }
  };

  // Insert selected mention
  const insertMention = (selectedEntity: HecosEntity) => {
    if (!textareaRef.current) return;
    const textBeforeCursor = content.slice(0, textareaRef.current.selectionStart);
    const textAfterCursor = content.slice(textareaRef.current.selectionStart);

    const atIndex = textBeforeCursor.lastIndexOf('@');
    if (atIndex !== -1) {
      const newText =
        textBeforeCursor.slice(0, atIndex) +
        `@${selectedEntity.slug || selectedEntity.id} ` +
        textAfterCursor;
      setContent(newText);
      setShowMentionMenu(false);

      setTimeout(() => {
        if (textareaRef.current) {
          const nextPos = atIndex + (selectedEntity.slug || selectedEntity.id).length + 2;
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(nextPos, nextPos);
        }
      }, 50);
    }
  };

  // Smart Key Handling (Tab, Shift+Tab, Enter on lists, Ctrl+B, Ctrl+I, Ctrl+U)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const el = textareaRef.current;
    if (!el) return;

    // Handle @ Mention menu navigation
    if (showMentionMenu && filteredEntities.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex((prev) => (prev + 1) % filteredEntities.length);
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex(
          (prev) => (prev - 1 + filteredEntities.length) % filteredEntities.length
        );
        return;
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(filteredEntities[mentionIndex]);
        return;
      } else if (e.key === 'Escape') {
        setShowMentionMenu(false);
        return;
      }
    }

    // Handle / Slash menu dismissal
    if (showSlashMenu) {
      if (e.key === 'Escape') {
        setShowSlashMenu(false);
        return;
      }
    }

    // Keyboard Shortcuts: Ctrl+B (Bold), Ctrl+I (Italic), Ctrl+U (Underline)
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
        setShowMentionMenu(true);
        setMentionQuery('');
        return;
      }
    }

    // Tabulation & Indentation Support (Tab / Shift+Tab)
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = el.selectionStart;
      const end = el.selectionEnd;

      if (start === end) {
        // Single cursor -> insert 2 spaces
        if (e.shiftKey) {
          // Outdent line
          const lineStart = content.lastIndexOf('\n', start - 1) + 1;
          const currentLine = content.substring(lineStart, start);
          if (currentLine.startsWith('  ')) {
            const newContent = content.substring(0, lineStart) + content.substring(lineStart + 2);
            setContent(newContent);
            setTimeout(() => {
              el.setSelectionRange(start - 2, start - 2);
            }, 10);
          }
        } else {
          // Indent 2 spaces
          const newContent = content.substring(0, start) + '  ' + content.substring(end);
          setContent(newContent);
          setTimeout(() => {
            el.setSelectionRange(start + 2, start + 2);
          }, 10);
        }
      } else {
        // Multi-line selection -> Indent or Outdent all selected lines
        const lineStart = content.lastIndexOf('\n', start - 1) + 1;
        const lineEnd = content.indexOf('\n', end);
        const actualEnd = lineEnd === -1 ? content.length : lineEnd;
        const selectedBlock = content.substring(lineStart, actualEnd);
        const lines = selectedBlock.split('\n');

        let modifiedLines: string[];
        let deltaLength = 0;

        if (e.shiftKey) {
          // Outdent
          modifiedLines = lines.map((l) => {
            if (l.startsWith('  ')) {
              deltaLength -= 2;
              return l.substring(2);
            }
            if (l.startsWith(' ')) {
              deltaLength -= 1;
              return l.substring(1);
            }
            return l;
          });
        } else {
          // Indent
          modifiedLines = lines.map((l) => {
            deltaLength += 2;
            return '  ' + l;
          });
        }

        const newBlock = modifiedLines.join('\n');
        const newContent = content.substring(0, lineStart) + newBlock + content.substring(actualEnd);
        setContent(newContent);

        setTimeout(() => {
          el.setSelectionRange(lineStart, actualEnd + deltaLength);
        }, 10);
      }
      return;
    }

    // Auto-continue lists on Enter key
    if (e.key === 'Enter') {
      const pos = el.selectionStart;
      const textBefore = content.substring(0, pos);
      const lineStart = textBefore.lastIndexOf('\n') + 1;
      const currentLine = textBefore.substring(lineStart);

      // 1. Checklist item: - [ ] or - [x]
      const checklistMatch = currentLine.match(/^(\s*)-\s*\[([ xX])\]\s*(.*)$/);
      if (checklistMatch) {
        if (!checklistMatch[3].trim()) {
          // Empty checklist item -> exit list
          e.preventDefault();
          const newText = content.substring(0, lineStart) + content.substring(pos);
          setContent(newText);
          setTimeout(() => el.setSelectionRange(lineStart, lineStart), 10);
        } else {
          // Continue checklist
          e.preventDefault();
          const indent = checklistMatch[1];
          const insertStr = `\n${indent}- [ ] `;
          const newText = content.substring(0, pos) + insertStr + content.substring(pos);
          setContent(newText);
          setTimeout(() => {
            const nextPos = pos + insertStr.length;
            el.setSelectionRange(nextPos, nextPos);
          }, 10);
        }
        return;
      }

      // 2. Bullet list: - or *
      const bulletMatch = currentLine.match(/^(\s*)[-*+]\s+(.*)$/);
      if (bulletMatch) {
        if (!bulletMatch[2].trim()) {
          // Empty bullet -> exit list
          e.preventDefault();
          const newText = content.substring(0, lineStart) + content.substring(pos);
          setContent(newText);
          setTimeout(() => el.setSelectionRange(lineStart, lineStart), 10);
        } else {
          // Continue bullet
          e.preventDefault();
          const indent = bulletMatch[1];
          const insertStr = `\n${indent}- `;
          const newText = content.substring(0, pos) + insertStr + content.substring(pos);
          setContent(newText);
          setTimeout(() => {
            const nextPos = pos + insertStr.length;
            el.setSelectionRange(nextPos, nextPos);
          }, 10);
        }
        return;
      }

      // 3. Numbered list: 1. or 2.
      const numMatch = currentLine.match(/^(\s*)(\d+)\.\s+(.*)$/);
      if (numMatch) {
        if (!numMatch[3].trim()) {
          // Empty numbered item -> exit list
          e.preventDefault();
          const newText = content.substring(0, lineStart) + content.substring(pos);
          setContent(newText);
          setTimeout(() => el.setSelectionRange(lineStart, lineStart), 10);
        } else {
          // Continue with next number
          e.preventDefault();
          const indent = numMatch[1];
          const nextNum = parseInt(numMatch[2], 10) + 1;
          const insertStr = `\n${indent}${nextNum}. `;
          const newText = content.substring(0, pos) + insertStr + content.substring(pos);
          setContent(newText);
          setTimeout(() => {
            const nextPos = pos + insertStr.length;
            el.setSelectionRange(nextPos, nextPos);
          }, 10);
        }
        return;
      }
    }
  };

  // Image Insertion from Modal
  const handleInsertImageFromModal = (url: string, title?: string) => {
    const altText = title || 'Imagem de Hecos';
    const imgMarkdown = `\n\n![${altText}](${url})\n\n`;
    insertSnippet(imgMarkdown);
    if (!coverImage) {
      setCoverImage(url);
    }
  };

  // Textarea drag & drop image upload
  const handleTextareaDrop = async (e: React.DragEvent<HTMLTextAreaElement>) => {
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file && file.type.startsWith('image/')) {
      e.preventDefault();
      setIsUploading(true);
      setUploadMessage(`Enviando ${file.name} para o ImgBB...`);
      try {
        const res = await uploadToImgBB(file, file.name.replace(/\.[^/.]+$/, ''));
        if (res.success && res.url) {
          setUploadMessage('Imagem enviada com sucesso!');
          const imgMarkdown = `\n\n![${file.name.replace(/\.[^/.]+$/, '')}](${res.url})\n\n`;
          insertSnippet(imgMarkdown);
          if (!coverImage) {
            setCoverImage(res.url);
          }
        } else {
          setUploadMessage(res.error || 'Erro no upload.');
        }
      } catch {
        setUploadMessage('Falha ao enviar imagem.');
      } finally {
        setIsUploading(false);
        setTimeout(() => setUploadMessage(null), 4000);
      }
    }
  };

  // Textarea clipboard paste image upload
  const handleTextareaPaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          setIsUploading(true);
          setUploadMessage('Enviando imagem colada para o ImgBB...');
          try {
            const res = await uploadToImgBB(file, `screenshot-${Date.now()}`);
            if (res.success && res.url) {
              setUploadMessage('Imagem colada enviada com sucesso!');
              const imgMarkdown = `\n\n![Imagem Colada](${res.url})\n\n`;
              insertSnippet(imgMarkdown);
              if (!coverImage) {
                setCoverImage(res.url);
              }
            } else {
              setUploadMessage(res.error || 'Erro no upload.');
            }
          } catch {
            setUploadMessage('Falha ao enviar imagem.');
          } finally {
            setIsUploading(false);
            setTimeout(() => setUploadMessage(null), 4000);
          }
          break;
        }
      }
    }
  };

  // Image Upload via ImgBB
  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadMessage('Enviando imagem para ImgBB...');

    try {
      const res = await uploadToImgBB(file, file.name.replace(/\.[^/.]+$/, ''));
      if (res.success && res.url) {
        setUploadMessage('Imagem enviada com sucesso!');
        const imgMarkdown = `\n\n![${file.name}](${res.url})\n\n`;
        insertSnippet(imgMarkdown);
        if (!coverImage) {
          setCoverImage(res.url);
        }
      } else {
        setUploadMessage(res.error || 'Erro no upload.');
      }
    } catch (err: any) {
      setUploadMessage('Falha ao conectar com ImgBB.');
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadMessage(null), 4000);
    }
  };

  const handleSave = () => {
    const tags = tagsString
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const traits = traitsString
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const updated: HecosEntity = {
      ...entity,
      title: title.trim() || 'Sem Título',
      subtitle: subtitle.trim(),
      category,
      summary: summary.trim(),
      content,
      coverImage: coverImage.trim(),
      icon: icon.trim() || undefined,
      tags,
      traits,
      isSecret,
      visibility,
      allowedUserIds,
      updatedAt: new Date().toISOString(),
    };

    onSave(updated);
  };

  // Stats calculation
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;
  const readTimeMin = Math.max(1, Math.ceil(wordCount / 200));

  if (category === 'ancestry' && useStructuredAncestry) {
    const currentEntity: HecosEntity = {
      ...entity,
      title: title.trim() || 'Nova Ancestralidade',
      subtitle: subtitle.trim(),
      category: 'ancestry',
      summary: summary.trim(),
      content,
      coverImage: coverImage.trim(),
      icon: icon.trim() || undefined,
      tags: tagsString.split(',').map((t) => t.trim()).filter(Boolean),
      isSecret,
      ancestryData: entity.ancestryData,
    };

    return (
      <div className="space-y-4">
        {/* Toggle switch between Structured Ancestry Form and Raw Markdown Mode */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#120e1e] rounded-xl border border-zinc-800 text-xs">
          <div className="flex items-center gap-2 text-cyan-300 font-bold">
            <Sliders className="w-4 h-4" />
            <span>Modo de Edição Estruturado Ativo (Campos & Abas PF2e)</span>
          </div>
          <button
            type="button"
            onClick={() => setUseStructuredAncestry(false)}
            className="px-3 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            Mudar para Editor Markdown Livre
          </button>
        </div>

        <AncestryEditor
          entity={currentEntity}
          onSave={onSave}
          onCancel={onCancel}
          onNavigate={onNavigate}
        />
      </div>
    );
  }

  if (category === 'feat' && useStructuredFeat) {
    const currentEntity: HecosEntity = {
      ...entity,
      title: title.trim() || 'Novo Talento',
      subtitle: subtitle.trim(),
      category: 'feat',
      summary: summary.trim(),
      content,
      coverImage: coverImage.trim(),
      tags: tagsString.split(',').map((t) => t.trim()).filter(Boolean),
      isSecret,
      featData: entity.featData,
    };

    return (
      <div className="space-y-4">
        {/* Toggle switch between Structured Feat Form and Raw Markdown Mode */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#171120] rounded-xl border border-zinc-800 text-xs">
          <div className="flex items-center gap-2 text-amber-300 font-bold">
            <Sliders className="w-4 h-4" />
            <span>Modo de Criação de Talento PF2e Ativo (Estatísticas & Traços)</span>
          </div>
          <button
            type="button"
            onClick={() => setUseStructuredFeat(false)}
            className="px-3 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            Mudar para Editor Markdown Livre
          </button>
        </div>

        <FeatEditor
          entity={currentEntity}
          onSave={onSave}
          onCancel={onCancel}
          onNavigate={onNavigate}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col bg-[#08070d] text-zinc-100 rounded-2xl border border-zinc-800/90 shadow-2xl overflow-hidden transition-all duration-200 relative ${
        isFullscreen ? 'fixed inset-3 z-50 rounded-xl' : 'h-full min-h-[750px]'
      }`}
    >
      {/* Floating Save Button (Icon-only) */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          type="button"
          onClick={handleSave}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-zinc-950 font-black shadow-[0_4px_25px_rgba(6,182,212,0.45)] hover:shadow-[0_6px_30px_rgba(6,182,212,0.7)] hover:scale-110 active:scale-95 transition-all cursor-pointer border border-white/30"
          data-tooltip="Salvar no Codex (Ctrl+S)"
        >
          <Save className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      {/* Top Main Navigation & Save Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-[#110d1c] border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00f0ff]" />
          <h2 className="text-sm font-bold text-zinc-100 font-display tracking-wide">
            Editor Notion de <span className="text-cyan-300">Hecos</span>
          </h2>
          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800">
            {category}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center bg-black/60 rounded-lg p-0.5 border border-zinc-800 text-xs">
            <button
              onClick={() => setViewMode('edit')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                viewMode === 'edit' ? 'bg-purple-900/70 text-purple-200 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Apenas Editor de Código e Markdown"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editor</span>
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                viewMode === 'split' ? 'bg-cyan-950 text-cyan-300 font-semibold shadow-inner' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Editor e Pré-Visualização Lado a Lado"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Dividido</span>
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                viewMode === 'preview' ? 'bg-rose-950 text-rose-300 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Modo Leitura e Formatação Final"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Leitura</span>
            </button>
          </div>

          {/* Fullscreen toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-colors"
            title={isFullscreen ? 'Sair de Tela Cheia' : 'Expandir Tela Cheia'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="p-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 transition-colors"
              title="Excluir este artigo"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-zinc-950 shadow-[0_0_15px_rgba(6,182,212,0.35)] transition-all cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Salvar no Codex</span>
          </button>
        </div>
      </div>

      {/* Metadata Configuration Bar */}
      {/* Metadata Configuration Bar */}
      <div className="p-3.5 bg-[#0d0b14] border-b border-zinc-800/80 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
          <div className="md:col-span-1 flex items-center justify-start">
            <IconPicker
              value={icon}
              onChange={setIcon}
              category={category}
            />
          </div>

          <div className="md:col-span-7">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título da Entrada (Ex: O Salgueiro do Eclipse, Devorador Malva...)"
              className="w-full px-3 py-1.5 text-sm sm:text-base font-bold font-display bg-black/60 border border-zinc-700/70 rounded-lg text-zinc-100 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as EntityCategory)}
              className="w-full px-3 py-2 text-xs bg-black/60 border border-zinc-700/70 rounded-lg text-cyan-300 focus:outline-none focus:border-cyan-400 font-semibold"
            >
              <option value="pc">Personagens (PC)</option>
              <option value="npc">NPCs & Aliados</option>
              <option value="creature">Criaturas & Monstros</option>
              <option value="spell">Feitiços & Grimórios</option>
              <option value="item">Itens & Relíquias</option>
              <option value="location">Locais & Masmorras</option>
              <option value="fauna">Fauna de Hecos</option>
              <option value="flora">Flora de Hecos</option>
              <option value="organization">Organizações & Cultos</option>
              <option value="ancestry">Ancestralidades</option>
              <option value="class">Classes</option>
              <option value="archetype">Arquétipos</option>
              <option value="session">Diários de Sessão</option>
              <option value="gm_note">Notas Secretas do GM</option>
              <option value="feat">Talentos & Feats</option>
              <option value="rule">Regras da Casa</option>
              <option value="timeline">Linha do Tempo</option>
            </select>
          </div>

          <div className="md:col-span-1 flex items-center justify-end">
            <VisibilityBadgeMenu
              visibility={visibility}
              allowedUserIds={allowedUserIds}
              isSecret={isSecret}
              onChange={(newVis, newAllowed) => {
                setVisibility(newVis);
                setAllowedUserIds(newAllowed);
                setIsSecret(newVis === 'gm');
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
          <div className="md:col-span-3">
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Subtítulo (Ex: Criatura 5 • Aberração • Penumbra)"
              className="w-full px-3 py-1.5 text-xs bg-black/60 border border-zinc-700/70 rounded-lg text-zinc-200 focus:outline-none focus:border-purple-400"
            />
          </div>
          <div className="md:col-span-2">
            <input
              type="text"
              value={tagsString}
              onChange={(e) => setTagsString(e.target.value)}
              placeholder="Tags: #Eclipse, #Chefe..."
              className="w-full px-3 py-1.5 text-xs bg-black/60 border border-zinc-700/70 rounded-lg text-cyan-200 focus:outline-none focus:border-cyan-400"
              title="Tags de identificação e categorização"
            />
          </div>
          <div className="md:col-span-3">
            <input
              type="text"
              value={traitsString}
              onChange={(e) => setTraitsString(e.target.value)}
              placeholder="Traços PF2e: Humanoide, Incomum, Fogo..."
              className="w-full px-3 py-1.5 text-xs bg-black/60 border border-amber-800/60 rounded-lg text-amber-200 focus:outline-none focus:border-amber-400 font-mono"
              title="Traços de mecânica PF2e (Traits)"
            />
          </div>
          <div className="md:col-span-4">
            <ImageUploadInput
              value={coverImage}
              onChange={setCoverImage}
              placeholder="URL ou Upload ImgBB..."
              showPreview={false}
            />
          </div>
        </div>

        {/* Dynamic Trait Chips with deletion and quick suggestions */}
        {traitsString.trim() && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] text-amber-400/80 font-mono uppercase font-bold mr-1">Traços ativos:</span>
            {traitsString.split(',').map((t, idx) => {
              const clean = t.trim();
              if (!clean) return null;
              return (
                <span
                  key={`edit-trait-chip-${clean}-${idx}`}
                  className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-md text-[11px] font-mono font-bold tracking-wide uppercase bg-amber-950/80 border border-amber-800 text-amber-200 shadow-sm"
                >
                  <span>{clean}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const list = traitsString.split(',').map((s) => s.trim()).filter(Boolean);
                      list.splice(idx, 1);
                      setTraitsString(list.join(', '));
                    }}
                    className="p-0.5 rounded hover:bg-amber-900/80 text-amber-400/70 hover:text-amber-100 transition-colors cursor-pointer"
                    title={`Remover traço "${clean}"`}
                  >
                    <Trash2 className="w-3 h-3 text-amber-400 hover:text-rose-300" />
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Robust Notion-Style Floating & Top Formatting Toolbar */}
      <div className="relative flex flex-wrap items-center gap-1 px-3 py-1.5 bg-[#130f20] border-b border-zinc-800 text-xs select-none">
        {/* TEXT INLINE STYLES */}
        <div className="flex items-center gap-0.5 pr-2 border-r border-zinc-700/60">
          <button
            type="button"
            onClick={() => setShowImgBBModal(true)}
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-cyan-950/70 border border-cyan-700/60 hover:bg-cyan-900 text-cyan-200 hover:text-cyan-100 font-bold transition-all shadow-sm"
            title="Fazer Upload de Imagem Local para o ImgBB e inserir no texto"
          >
            <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span>Upload ImgBB</span>
          </button>
        </div>

        <div className="flex items-center gap-0.5 pr-2 border-r border-zinc-700/60">
          <button
            type="button"
            onClick={() => wrapSelection('**', '**', 'negrito')}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-300 hover:text-cyan-200 transition-colors"
            title="Negrito (Ctrl+B)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => wrapSelection('*', '*', 'itálico')}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-300 hover:text-cyan-200 transition-colors"
            title="Itálico (Ctrl+I)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => wrapSelection('<u>', '</u>', 'sublinhado')}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-300 hover:text-cyan-200 transition-colors"
            title="Sublinhado (Ctrl+U)"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => wrapSelection('~~', '~~', 'tachado')}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-300 hover:text-cyan-200 transition-colors"
            title="Tachado / Riscado"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => wrapSelection('`', '`', 'código')}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-300 hover:text-cyan-200 transition-colors font-mono"
            title="Código Inline"
          >
            <Code className="w-3.5 h-3.5" />
          </button>

          {/* Color & Highlight Palette Trigger */}
          <div className="relative inline-block">
            <button
              type="button"
              onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
              className="flex items-center gap-1 px-2 py-1 rounded hover:bg-zinc-800 text-cyan-300 hover:text-cyan-100 transition-colors border border-transparent hover:border-cyan-500/40"
              title="Cores do Texto e Realces (Estilo Notion)"
            >
              <Palette className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[11px] font-semibold">Cores</span>
            </button>

            <ColorPickerMenu
              isOpen={isColorPickerOpen}
              onClose={() => setIsColorPickerOpen(false)}
              onApplyTextColor={handleApplyTextColor}
              onApplyHighlight={handleApplyHighlight}
            />
          </div>
        </div>

        {/* HEADINGS & BLOCKS */}
        <div className="flex items-center gap-0.5 px-2 border-r border-zinc-700/60">
          <button
            type="button"
            onClick={() => insertSnippet('# Título Principal H1\n\n')}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-300 hover:text-cyan-200 transition-colors"
            title="Título 1 (H1)"
          >
            <Heading1 className="w-3.5 h-3.5 text-cyan-400" />
          </button>
          <button
            type="button"
            onClick={() => insertSnippet('## Subtítulo H2\n\n')}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-300 hover:text-purple-200 transition-colors"
            title="Título 2 (H2)"
          >
            <Heading2 className="w-3.5 h-3.5 text-purple-400" />
          </button>
          <button
            type="button"
            onClick={() => insertSnippet('### Tópico Menor H3\n\n')}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-300 hover:text-rose-200 transition-colors"
            title="Título 3 (H3)"
          >
            <Heading3 className="w-3.5 h-3.5 text-rose-400" />
          </button>
        </div>

        {/* LISTS, CHECKLISTS & TOGGLE */}
        <div className="flex items-center gap-0.5 px-2 border-r border-zinc-700/60">
          <button
            type="button"
            onClick={() => insertSnippet('- Item de lista\n- Próximo item\n')}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-300 hover:text-cyan-200 transition-colors"
            title="Lista com Marcadores"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertSnippet('1. Primeiro item\n2. Segundo item\n')}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-300 hover:text-cyan-200 transition-colors"
            title="Lista Numerada"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertSnippet('- [ ] Tarefa / Objetivo da Quest\n')}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-300 hover:text-emerald-300 transition-colors"
            title="Checklist / Tarefa Interativa"
          >
            <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
          </button>
          <button
            type="button"
            onClick={() =>
              insertSnippet(
                '<details>\n<summary><b>Título Expansível</b></summary>\n\nConteúdo retrátil aqui...\n\n</details>\n\n'
              )
            }
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-300 hover:text-purple-300 transition-colors"
            title="Lista Expansível (Toggle Notion)"
          >
            <ChevronRight className="w-3.5 h-3.5 text-purple-400" />
          </button>
          <button
            type="button"
            onClick={() => insertSnippet('> "Citação ou depoimento aqui."\n\n')}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100 transition-colors"
            title="Citação em Bloco"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() =>
              insertSnippet(
                '| Coluna 1 | Coluna 2 | Coluna 3 |\n|---|---|---|\n| Dado A | Dado B | Dado C |\n\n'
              )
            }
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-300 hover:text-cyan-300 transition-colors"
            title="Tabela Formatada"
          >
            <Table className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertSnippet('\n---\n\n')}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100 transition-colors"
            title="Divisor Horizontal"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* NOTION CALLOUT BOXES (CYAN, MAUVE, BORDEAUX, GOLD) */}
        <div className="flex items-center gap-1 px-2 border-r border-zinc-700/60">
          <button
            type="button"
            onClick={() => insertSnippet('> ℹ️ **LORE / INFORMAÇÃO:** Nota importante sobre o cenário.\n\n')}
            className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/80 hover:bg-cyan-900 text-cyan-200 text-[11px] font-semibold transition-colors"
            title="Caixa de Lore Ciano"
          >
            Info Ciano
          </button>
          <button
            type="button"
            onClick={() =>
              insertSnippet(
                '> 🩸 **PERIGO / COMBATE:** Terreno perigoso ou ameaça mortal (Fortitude CD 20).\n\n'
              )
            }
            className="px-2 py-0.5 rounded bg-rose-950/60 border border-rose-800/80 hover:bg-rose-900 text-rose-200 text-[11px] font-semibold transition-colors"
            title="Caixa de Alerta Bordô"
          >
            Alerta Bordô
          </button>
          <button
            type="button"
            onClick={() =>
              insertSnippet(
                '> 🌌 **PENUMBRA / ECLIPSE:** Efeito mágico ou ritual da Penumbra de Hecos.\n\n'
              )
            }
            className="px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800/80 hover:bg-purple-900 text-purple-200 text-[11px] font-semibold transition-colors"
            title="Caixa de Eclipse Malva"
          >
            Eclipse Malva
          </button>

          {/* GM Secret Line / Block Insert Button */}
          <button
            type="button"
            onClick={() => {
              if (textareaRef.current) {
                const start = textareaRef.current.selectionStart;
                const end = textareaRef.current.selectionEnd;
                const selected = content.substring(start, end);
                if (selected.trim()) {
                  wrapSelection('\n:::gm\n**Segredo do Mestre:** ', '\n:::\n', 'Texto confidencial');
                } else {
                  insertSnippet('\n:::gm\n**Segredo do Mestre:** [Escreva aqui informações confidenciais visíveis exclusivamente para o GM...]\n:::\n\n');
                }
              } else {
                insertSnippet('\n:::gm\n**Segredo do Mestre:** [Escreva aqui informações confidenciais visíveis exclusivamente para o GM...]\n:::\n\n');
              }
            }}
            className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-amber-950/90 border border-amber-500/80 hover:bg-amber-900 text-amber-300 text-[11px] font-bold transition-all shadow-[0_0_12px_rgba(245,158,11,0.25)]"
            title="Inserir Linha Secreta (Visível apenas para o GM independente da visibilidade da página)"
          >
            <EyeOff className="w-3.5 h-3.5 text-amber-400" />
            <span>+ Linha Secreta GM</span>
          </button>
        </div>

        {/* PATHFINDER 2E ACTION GLYPHS */}
        <div className="flex items-center gap-1 px-2">
          <span className="text-[10px] uppercase font-bold text-zinc-500 mr-0.5">PF2e:</span>
          <button
            type="button"
            onClick={() => insertSnippet('**[1-action] Ação:** Efeito')}
            className="p-1 rounded bg-black/40 hover:bg-zinc-800 border border-zinc-800 hover:border-cyan-500 transition-colors"
            title="Inserir 1 Ação [1-action]"
          >
            <PF2eActionGlyph type="1-action" size="sm" showTooltip={false} />
          </button>
          <button
            type="button"
            onClick={() => insertSnippet('**[2-actions] Ação:** Efeito')}
            className="p-1 rounded bg-black/40 hover:bg-zinc-800 border border-zinc-800 hover:border-cyan-500 transition-colors"
            title="Inserir 2 Ações [2-actions]"
          >
            <PF2eActionGlyph type="2-actions" size="sm" showTooltip={false} />
          </button>
          <button
            type="button"
            onClick={() => insertSnippet('**[3-actions] Ação:** Efeito')}
            className="p-1 rounded bg-black/40 hover:bg-zinc-800 border border-zinc-800 hover:border-cyan-500 transition-colors"
            title="Inserir 3 Ações [3-actions]"
          >
            <PF2eActionGlyph type="3-actions" size="sm" showTooltip={false} />
          </button>
          <button
            type="button"
            onClick={() => insertSnippet('**[free-action] Ação Livre:** Efeito')}
            className="p-1 rounded bg-black/40 hover:bg-zinc-800 border border-zinc-800 hover:border-cyan-500 transition-colors"
            title="Inserir Ação Livre [free-action]"
          >
            <PF2eActionGlyph type="free-action" size="sm" showTooltip={false} />
          </button>
          <button
            type="button"
            onClick={() => insertSnippet('**[reaction] Reação:** **Gatilho:** ... **Efeito:** ...')}
            className="p-1 rounded bg-black/40 hover:bg-zinc-800 border border-zinc-800 hover:border-rose-500 transition-colors"
            title="Inserir Reação [reaction]"
          >
            <PF2eActionGlyph type="reaction" size="sm" showTooltip={false} />
          </button>
        </div>

        {/* Quick Slash Commands and @ mention helper badge */}
        <div className="ml-auto flex items-center gap-2 text-[11px] text-zinc-400">
          {/* Ancestry Template Shortcut Button */}
          <button
            type="button"
            onClick={() => {
              const tmpl = getFullAncestryTemplate(title || 'Nova Ancestralidade');
              if (!content.trim() || window.confirm('Deseja inserir o template completo de Ancestralidade? O conteúdo atual será substituído ou preenchido.')) {
                setContent(tmpl);
                if (category !== 'ancestry') setCategory('ancestry');
              }
            }}
            className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-gradient-to-r from-cyan-950 to-purple-950 border border-cyan-500/50 hover:border-cyan-400 text-cyan-200 hover:text-cyan-100 transition-all font-bold shadow-sm"
            title="Inserir Template Completo de Ancestralidade (11 Seções, Statblock, Heranças e Talentos)"
          >
            <Dna className="w-3.5 h-3.5 text-cyan-400" />
            <span>Template Ancestralidade</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSlashMenu(true)}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-purple-950/70 border border-purple-700/60 hover:bg-purple-900 text-purple-200 transition-colors font-semibold"
          >
            <Zap className="w-3 h-3 text-purple-400" />
            <span>Comandos /</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setShowMentionMenu(true);
              setMentionQuery('');
            }}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950/70 border border-cyan-700/60 hover:bg-cyan-900 text-cyan-200 transition-colors font-semibold"
          >
            <AtSign className="w-3 h-3 text-cyan-400" />
            <span>Menção @</span>
          </button>
        </div>
      </div>

      {uploadMessage && (
        <div className="px-4 py-1.5 bg-cyan-950/80 border-b border-cyan-800 text-xs text-cyan-200 flex items-center gap-2">
          {isUploading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
          )}
          <span>{uploadMessage}</span>
        </div>
      )}

      {/* Editor & Preview Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Editor Pane */}
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div
            className={`flex flex-col h-full ${
              viewMode === 'split' ? 'w-1/2 border-r border-zinc-800/90' : 'w-full'
            } relative bg-[#09070f]`}
          >
            <div className="flex items-center justify-between px-3 py-1 bg-black/40 text-[10px] text-zinc-500 uppercase tracking-widest font-semibold border-b border-zinc-800/40">
              <span>Editor • Suporta Markdown, HTML e Comandos /</span>
              <span>Tab: Indentar • Shift+Tab: Desindentar</span>
            </div>

            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              onDrop={handleTextareaDrop}
              onPaste={handleTextareaPaste}
              placeholder="Escreva a lore, regras, histórico ou atributos de Hecos... Arraste imagens, cole prints do clipboard, digite '/' para o menu Notion ou '@' para linkar qualquer página."
              className="flex-1 p-5 bg-transparent text-zinc-200 font-mono text-xs sm:text-sm leading-relaxed resize-none focus:outline-none placeholder-zinc-600 custom-scroll selection:bg-cyan-500/30"
              spellCheck={false}
            />

            {/* Notion Slash Commands (/) Floating Menu */}
            <NotionSlashMenu
              isOpen={showSlashMenu}
              onClose={() => setShowSlashMenu(false)}
              query={slashQuery}
              onInsertSnippet={(snippet) => {
                const replaceLen = slashStartPosition !== null && textareaRef.current
                  ? textareaRef.current.selectionStart - slashStartPosition
                  : 1;
                insertSnippet(snippet, replaceLen);
              }}
              onOpenImgBBUpload={() => setShowImgBBModal(true)}
              onTriggerMention={() => {
                setShowMentionMenu(true);
                setMentionQuery('');
              }}
            />

            {/* Mention Autocomplete Dropdown Popup */}
            {showMentionMenu && filteredEntities.length > 0 && (
              <div className="absolute left-6 bottom-12 z-50 w-80 max-h-72 overflow-y-auto rounded-2xl bg-[#130f21]/95 backdrop-blur-xl border border-purple-500/50 shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase text-purple-300 border-b border-zinc-800/80 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <AtSign className="w-3 h-3 text-cyan-400" />
                    <span>Linkar Entidade do Codex</span>
                  </span>
                  <span className="text-zinc-500">{filteredEntities.length} resultados</span>
                </div>
                <div className="space-y-1">
                  {filteredEntities.map((item, idx) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => insertMention(item)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-xs transition-all ${
                        idx === mentionIndex
                          ? 'bg-gradient-to-r from-cyan-950 to-purple-950 text-cyan-200 border border-cyan-600/70 shadow-sm'
                          : 'hover:bg-zinc-800/60 text-zinc-300 border border-transparent'
                      }`}
                    >
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-black/60 border border-zinc-800 text-zinc-400 font-mono">
                        {item.category}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold truncate text-zinc-100">{item.title}</div>
                        {item.subtitle && (
                          <div className="text-[10px] text-zinc-400 truncate">{item.subtitle}</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Live Realtime Preview Pane */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div
            className={`flex flex-col h-full ${
              viewMode === 'split' ? 'w-1/2' : 'w-full'
            } bg-[#0b0912] overflow-y-auto custom-scroll`}
          >
            <div className="px-4 py-1.5 bg-black/40 text-[10px] text-zinc-500 uppercase tracking-widest font-semibold border-b border-zinc-800/40 flex items-center justify-between">
              <span>Pré-Visualização em Tempo Real (Hecos Engine)</span>
              <span className="text-cyan-400 font-bold">WYSIWYG Live</span>
            </div>

            <div className="p-6 sm:p-8 space-y-5">
              {/* Header Preview */}
              <div className="border-b border-zinc-800/80 pb-4">
                <span className="text-xs uppercase font-bold text-cyan-400 tracking-wider">
                  {category.toUpperCase()}
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-100 font-display mt-1 tracking-tight">
                  {title || 'Título da Entrada'}
                </h1>
                {subtitle && <p className="text-xs sm:text-sm text-zinc-400 mt-1 font-medium">{subtitle}</p>}

                {tagsString && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {tagsString
                      .split(',')
                      .map((t) => t.trim())
                      .filter(Boolean)
                      .map((t) => (
                        <span
                          key={t}
                          className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800"
                        >
                          #{t}
                        </span>
                      ))}
                  </div>
                )}
              </div>

              {/* Rich Content Renderer with Notion blocks & PF2e glyphs */}
              <RichContentRenderer content={content} onNavigate={onNavigate} />
            </div>
          </div>
        )}
      </div>

      {/* Editor Status Footer Bar */}
      <div className="px-4 py-2 bg-[#0c0915] border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-zinc-500" />
            <span>{wordCount} palavras</span>
          </span>
          <span className="text-zinc-600">•</span>
          <span>{charCount} caracteres</span>
          <span className="text-zinc-600">•</span>
          <span className="flex items-center gap-1 text-zinc-400">
            <Clock className="w-3 h-3 text-zinc-500" />
            <span>~{readTimeMin} min de leitura</span>
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-zinc-500">
          <span>Dica: Use <strong>Tab</strong> / <strong>Shift+Tab</strong> para indentar • <strong>/</strong> para o menu Notion</span>
        </div>
      </div>

      {/* Global ImgBB Upload Modal */}
      <ImgBBUploadModal
        isOpen={showImgBBModal}
        onClose={() => setShowImgBBModal(false)}
        onInsertImage={handleInsertImageFromModal}
      />
    </div>
  );
};
