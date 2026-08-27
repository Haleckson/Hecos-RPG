import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  HecosEntity,
  PF2eSpellAttributes,
  SpellTraditionType,
  SpellCategoryType,
  ItemVisibility,
} from '../types';
import { serializeSpellToHTML, parseSpellFromContent } from '../utils/spellSerializer';
import { getCanonicalTradition, isTraditionTrait } from '../utils/spellMigration';
import { HecosStorage } from '../services/storage';
import { VisibilityBadgeMenu } from './VisibilityBadgeMenu';
import { PF2eActionGlyph, ActionGlyphType } from './PF2eActionGlyph';
import { ColorPickerMenu } from './ColorPickerMenu';
import { TraitInputCombobox } from './TraitInputCombobox';
import { TraitBadge } from './TraitBadge';
import {
  X,
  Sparkles,
  Zap,
  Moon,
  Flame,
  Shield,
  Folder,
  Eye,
  Plus,
  Trash2,
  Check,
  Bold,
  Italic,
  Underline,
  Palette,
  Link as LinkIcon,
  HelpCircle,
  Award,
  Tag as TagIcon,
  Edit2,
} from 'lucide-react';

interface SpellCreateModalProps {
  isOpen: boolean;
  initialTradition?: string;
  initialSubcategory?: string;
  presetTradition?: string;
  presetCategory?: SpellCategoryType;
  presetSubcategory?: string;
  entityToEdit?: HecosEntity | null;
  onClose: () => void;
  onSave?: (newEntity: HecosEntity) => void;
  onSaveSpell?: (newEntity: HecosEntity) => void;
}

export const HECOS_SPELL_TRADITIONS = [
  {
    id: 'Cinética',
    label: 'Cinética',
    fullName: 'Cinética',
    icon: Zap,
    color: 'text-cyan-300',
    border: 'border-cyan-500/50',
    bg: 'bg-cyan-950/80',
    activeBg: 'bg-cyan-500 text-zinc-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]',
    desc: 'Manipulação de energia térmica, cinética, gravidade, eletricidade e forças físicas materiais.',
  },
  {
    id: 'Etérea',
    label: 'Etérea',
    fullName: 'Etérea',
    icon: Moon,
    color: 'text-purple-300',
    border: 'border-purple-500/50',
    bg: 'bg-purple-950/80',
    activeBg: 'bg-purple-500 text-zinc-950 shadow-[0_0_15px_rgba(168,85,247,0.4)]',
    desc: 'Manipulação do tempo, espaço, alma, ilusões e forças transcendentais.',
  },
  {
    id: 'Biológica',
    label: 'Biológica',
    fullName: 'Biológica',
    icon: Flame,
    color: 'text-emerald-300',
    border: 'border-emerald-500/50',
    bg: 'bg-emerald-950/80',
    activeBg: 'bg-emerald-500 text-zinc-950 shadow-[0_0_15px_rgba(16,185,129,0.4)]',
    desc: 'Manipulação e transmutação da carne, sangue, biomassa, flora, cura e organismos vivos.',
  },
  {
    id: 'Abiótica',
    label: 'Abiótica',
    fullName: 'Abiótica',
    icon: Shield,
    color: 'text-amber-300',
    border: 'border-amber-500/50',
    bg: 'bg-amber-950/80',
    activeBg: 'bg-amber-500 text-zinc-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]',
    desc: 'Manipulação de metais, cristais, pedra, terra, minerais telúricos, matéria inanimada.',
  },
  {
    id: 'Omni',
    label: 'Omni',
    fullName: 'Omni',
    icon: Sparkles,
    color: 'text-rose-300',
    border: 'border-rose-500/50',
    bg: 'bg-rose-950/80',
    activeBg: 'bg-rose-500 text-zinc-950 shadow-[0_0_15px_rgba(244,63,94,0.4)]',
    desc: 'Tradição magica universal que unifica todas as vertentes da energia e matéria de Hecos.',
  },
];

const COMMON_SPELL_TRAITS = [
  'Concentração',
  'Manipulação',
  'Evocação',
  'Abjuração',
  'Transmutação',
  'Ilusão',
  'Necromancia',
  'Adivinhação',
  'Encantamento',
  'Fogo',
  'Frio',
  'Eletricidade',
  'Ácido',
  'Sônico',
  'Força',
  'Trevas',
  'Luz',
  'Cura',
  'Morte',
  'Mente',
  'Espiritual',
  'Obsidiana',
  'Eclipse',
  'Ataque',
];

const getEmptySpellData = (): PF2eSpellAttributes => ({
  rank: 1,
  traditions: [],
  traits: [],
  castTime: '2 ações',
  range: '',
  area: '',
  targets: '',
  duration: '',
  savingThrow: '',
  description: '',
  rarity: 'Comum',
  spellType: 'spell',
  subcategories: [],
  hecosLore: '',
  gmNotes: '',
});

export const SpellCreateModal: React.FC<SpellCreateModalProps> = ({
  isOpen,
  initialTradition,
  initialSubcategory,
  presetTradition,
  presetCategory,
  presetSubcategory,
  entityToEdit,
  onClose,
  onSave,
  onSaveSpell,
}) => {
  const finalInitialTrad = presetTradition || initialTradition;
  const finalInitialSub = presetSubcategory || initialSubcategory;

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'mechanics' | 'preview'>('details');

  // Rich Text Active Field Ref & Color Picker State
  const [activeRichField, setActiveRichField] = useState<string | null>(null);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const descRef = useRef<HTMLTextAreaElement | null>(null);
  const heightenedRef = useRef<HTMLTextAreaElement | null>(null);
  const loreRef = useRef<HTMLTextAreaElement | null>(null);
  const gmNotesRef = useRef<HTMLTextAreaElement | null>(null);

  // Initialize or populate spellData
  const [spellData, setSpellData] = useState<PF2eSpellAttributes>(() => getEmptySpellData());

  // Selected folders / subcategories
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [newSubcategoryInput, setNewSubcategoryInput] = useState('');

  // Narrative Tags (Distinct from mechanical rules traits)
  const [tagsInput, setTagsInput] = useState('');
  const [tagsList, setTagsList] = useState<string[]>([]);
  const [editingTagIndex, setEditingTagIndex] = useState<number | null>(null);
  const [editingTagValue, setEditingTagValue] = useState('');

  // Visibility state
  const [visibility, setVisibility] = useState<ItemVisibility>('all');
  const [allowedUserIds, setAllowedUserIds] = useState<string[]>([]);

  // Sync state when entityToEdit or modal opens
  useEffect(() => {
    if (isOpen) {
      if (entityToEdit) {
        setTitle(entityToEdit.title || '');
        setSummary(entityToEdit.summary || '');
        setVisibility(entityToEdit.visibility || 'all');
        setAllowedUserIds(entityToEdit.allowedUserIds || []);

        const parsed = parseSpellFromContent(entityToEdit.content || '', entityToEdit.spellData);
        
        // Canonical traditions and clean traits
        const canonTraditions: string[] = Array.from(
          new Set(
            (parsed.traditions || [])
              .map((t) => getCanonicalTradition(t))
              .filter(Boolean) as string[]
          )
        );
        const canonTraits: string[] = (parsed.traits || []).filter(
          (t) => !isTraditionTrait(t) && !canonTraditions.some((ct) => ct.toLowerCase().trim() === t.toLowerCase().trim())
        );

        parsed.traditions = canonTraditions.length > 0 ? canonTraditions : ['Cinética'];
        parsed.traits = canonTraits;
        setSpellData(parsed);

        const subcats = Array.from(
          new Set(
            [
              ...(parsed.subcategories || []),
              ...(entityToEdit.subcategories || []),
              entityToEdit.subcategory,
            ].filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
          )
        );
        setSelectedSubcategories(subcats);

        // Tags excluding rule traits and subcats (pure user tags)
        const rawTags = entityToEdit.tags || parsed.tags || [];
        const existingTags = rawTags.filter((t) => {
          const lower = t.toLowerCase().trim();
          return (
            lower !== 'feitiço' &&
            lower !== 'magia' &&
            lower !== 'pf2e' &&
            !subcats.includes(t) &&
            !(parsed.traditions || []).some((trad) => trad.toLowerCase() === lower) &&
            !(parsed.traits || []).some((tr) => tr.toLowerCase() === lower)
          );
        });
        setTagsList(existingTags);
      } else {
        // New spell blank state
        setTitle('');
        setSummary('');
        setVisibility('all');
        setAllowedUserIds([]);
        const empty = getEmptySpellData();
        if (finalInitialTrad) {
          empty.traditions = [finalInitialTrad];
        }
        if (presetCategory && presetCategory !== 'all') {
          empty.spellType = presetCategory as any;
        }
        if (finalInitialSub) {
          empty.subcategories = [finalInitialSub];
        }
        setSpellData(empty);
        setSelectedSubcategories(finalInitialSub ? [finalInitialSub] : []);
        setTagsList([]);
      }
      setEditingTagIndex(null);
      setEditingTagValue('');
      setActiveTab('details');
    }
  }, [isOpen, entityToEdit, finalInitialTrad, presetCategory, finalInitialSub]);

  // Available spell folders from storage with full reactivity
  const [spellConfig, setSpellConfig] = useState<Record<string, string[]>>(() =>
    HecosStorage.getAllSpellSubcategoriesConfig()
  );

  useEffect(() => {
    if (isOpen) {
      setSpellConfig(HecosStorage.getAllSpellSubcategoriesConfig());
    }
  }, [isOpen]);

  useEffect(() => {
    const unsub = HecosStorage.subscribeSpellCategories((cfg) => {
      setSpellConfig(cfg);
    });
    return () => unsub();
  }, []);

  const allExistingFolders = useMemo(() => {
    const set = new Set<string>();
    
    // 1. Valid folders from spell subcategories config
    (Object.values(spellConfig) as string[][]).forEach((list) => {
      (list || []).forEach((sub) => {
        if (typeof sub === 'string' && sub.trim()) {
          set.add(sub.trim());
        }
      });
    });

    // 2. Current selected subcategories in this editor session
    selectedSubcategories.forEach((s) => s && set.add(s.trim()));

    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [spellConfig, selectedSubcategories]);

  if (!isOpen) return null;

  const handleTraditionToggle = (traditionName: string) => {
    setSpellData((prev) => {
      const current = prev.traditions || [];
      const exists = current.includes(traditionName);
      return {
        ...prev,
        traditions: exists
          ? current.filter((t) => t !== traditionName)
          : [...current, traditionName],
      };
    });
  };

  const handleAddSubcategory = () => {
    const trimmed = newSubcategoryInput.trim();
    if (trimmed) {
      if (!selectedSubcategories.includes(trimmed)) {
        setSelectedSubcategories([...selectedSubcategories, trimmed]);
      }
      HecosStorage.addScopeSubcategory('spell', 'all', trimmed);
      setSpellConfig(HecosStorage.getAllSpellSubcategoriesConfig());
      setNewSubcategoryInput('');
    }
  };

  const handleRemoveSubcategory = (subcat: string) => {
    setSelectedSubcategories(selectedSubcategories.filter((s) => s !== subcat));
  };

  const handleAddNarrativeTag = (tagToAdd: string) => {
    const clean = tagToAdd.trim().replace(/^#/, '');
    if (!clean) return;
    const lower = clean.toLowerCase();
    if (!tagsList.some((t) => t.toLowerCase() === lower)) {
      setTagsList([...tagsList, clean]);
    }
    setTagsInput('');
  };

  const handleStartEditTag = (index: number, currentTag: string) => {
    setEditingTagIndex(index);
    setEditingTagValue(currentTag);
  };

  const handleSaveEditedTag = () => {
    if (editingTagIndex === null) return;
    const clean = editingTagValue.trim().replace(/^#/, '');
    if (!clean) {
      setTagsList(tagsList.filter((_, i) => i !== editingTagIndex));
    } else {
      const updated = [...tagsList];
      updated[editingTagIndex] = clean;
      setTagsList(Array.from(new Set(updated)));
    }
    setEditingTagIndex(null);
    setEditingTagValue('');
  };

  const handleCancelEditTag = () => {
    setEditingTagIndex(null);
    setEditingTagValue('');
  };

  const handleRemoveNarrativeTag = (tagToRemove: string) => {
    setTagsList(tagsList.filter((t) => t.toLowerCase() !== tagToRemove.toLowerCase()));
  };

  // Rich Text Insertion Helper
  const insertRichFormatting = (
    field: 'description' | 'heightened' | 'hecosLore' | 'gmNotes',
    ref: React.RefObject<HTMLTextAreaElement | null>,
    prefix: string,
    suffix: string = prefix
  ) => {
    const el = ref.current;
    const currentVal = spellData[field] || '';
    if (!el) {
      setSpellData({ ...spellData, [field]: `${currentVal}${prefix}texto${suffix}` });
      return;
    }

    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const selected = currentVal.substring(start, end);
    const hasSelection = start !== end;

    let newVal = '';
    let newStart = start;
    let newEnd = end;

    if (hasSelection) {
      if (
        selected.startsWith(prefix) &&
        selected.endsWith(suffix) &&
        selected.length >= prefix.length + suffix.length
      ) {
        const unwrapped = selected.slice(prefix.length, selected.length - suffix.length);
        newVal = currentVal.substring(0, start) + unwrapped + currentVal.substring(end);
        newStart = start;
        newEnd = start + unwrapped.length;
      } else {
        newVal = currentVal.substring(0, start) + prefix + selected + suffix + currentVal.substring(end);
        newStart = start;
        newEnd = start + prefix.length + selected.length + suffix.length;
      }
    } else {
      const placeholder = 'texto';
      newVal = currentVal.substring(0, start) + prefix + placeholder + suffix + currentVal.substring(end);
      newStart = start + prefix.length;
      newEnd = newStart + placeholder.length;
    }

    setSpellData({ ...spellData, [field]: newVal });

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(newStart, newEnd);
    }, 10);
  };

  const handleSaveSpellRecord = () => {
    if (!title.trim()) {
      alert('Por favor, informe o Nome do Feitiço.');
      return;
    }

    // Clean user tags without auto-injected system clutter
    const distinctTags: string[] = Array.from(
      new Set(tagsList.map((t) => t.trim().replace(/^#/, '')).filter(Boolean))
    );

    // Ensure traditions are canonical and traits do not contain traditions
    const canonTraditions: string[] = Array.from(
      new Set(
        (spellData.traditions || [])
          .map((t) => getCanonicalTradition(t))
          .filter(Boolean) as string[]
      )
    );
    const canonTraits: string[] = (spellData.traits || []).filter(
      (t) => !isTraditionTrait(t) && !canonTraditions.some((ct) => ct.toLowerCase().trim() === t.toLowerCase().trim())
    );

    const finalSpellData: PF2eSpellAttributes = {
      ...spellData,
      traditions: canonTraditions.length > 0 ? canonTraditions : ['Cinética'],
      traits: canonTraits,
      subcategories: selectedSubcategories,
      tags: distinctTags,
    };

    const targetId = entityToEdit ? entityToEdit.id : 'entity-spell-' + Date.now();
    const primarySub = (selectedSubcategories && selectedSubcategories[0]) || '';

    const savedEntity: HecosEntity = {
      id: targetId,
      slug: entityToEdit
        ? entityToEdit.slug
        : title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-') +
          '-' +
          Date.now(),
      title: title.trim(),
      subtitle: spellData.rank === 0 ? 'Truque (Cantrip)' : `Magia de ${spellData.rank}º Círculo`,
      category: 'spell',
      subcategory: primarySub,
      subcategories: selectedSubcategories,
      summary: summary.trim() || (spellData.description ? spellData.description.slice(0, 140) : ''),
      content: serializeSpellToHTML(title.trim(), finalSpellData),
      spellData: finalSpellData,
      tags: distinctTags,
      coverImage: entityToEdit?.coverImage,
      createdAt: entityToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isSecret: visibility === 'gm',
      visibility,
      allowedUserIds: visibility === 'specific' ? allowedUserIds : [],
    };

    HecosStorage.saveEntity(savedEntity);
    if (onSave) onSave(savedEntity);
    if (onSaveSpell) onSaveSpell(savedEntity);
    onClose();
  };

  // Mini toolbar for rich fields
  const renderRichToolbar = (
    field: 'description' | 'heightened' | 'hecosLore' | 'gmNotes',
    ref: React.RefObject<HTMLTextAreaElement | null>
  ) => {
    return (
      <div className="flex items-center gap-1 py-1 px-1.5 bg-[#14121b] border border-zinc-800 rounded-lg text-xs">
        <button
          type="button"
          onClick={() => insertRichFormatting(field, ref, '**', '**')}
          className="p-1 rounded hover:bg-zinc-800 text-zinc-300 hover:text-cyan-300 transition-colors"
          title="Negrito (**texto**)"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => insertRichFormatting(field, ref, '*', '*')}
          className="p-1 rounded hover:bg-zinc-800 text-zinc-300 hover:text-cyan-300 transition-colors"
          title="Itálico (*texto*)"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => insertRichFormatting(field, ref, '<u>', '</u>')}
          className="p-1 rounded hover:bg-zinc-800 text-zinc-300 hover:text-cyan-300 transition-colors"
          title="Sublinhado"
        >
          <Underline className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => insertRichFormatting(field, ref, '[[', ']]')}
          className="p-1 rounded hover:bg-zinc-800 text-[#74b6c2] hover:text-cyan-300 transition-colors flex items-center gap-0.5"
          title="Link para Artigo do Codex ([[Artigo]])"
        >
          <LinkIcon className="w-3.5 h-3.5" />
        </button>

        <span className="text-zinc-700 text-xs mx-0.5">|</span>

        {/* Action Glyphs shortcuts */}
        <button
          type="button"
          onClick={() => insertRichFormatting(field, ref, '[1-action]', '')}
          className="px-1 py-0.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-cyan-300 text-[10px] font-mono"
          title="Inserir Glifo 1 Ação"
        >
          [1A]
        </button>
        <button
          type="button"
          onClick={() => insertRichFormatting(field, ref, '[2-actions]', '')}
          className="px-1 py-0.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-cyan-300 text-[10px] font-mono"
          title="Inserir Glifo 2 Ações"
        >
          [2A]
        </button>
        <button
          type="button"
          onClick={() => insertRichFormatting(field, ref, '[3-actions]', '')}
          className="px-1 py-0.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-cyan-300 text-[10px] font-mono"
          title="Inserir Glifo 3 Ações"
        >
          [3A]
        </button>
        <button
          type="button"
          onClick={() => insertRichFormatting(field, ref, '[reaction]', '')}
          className="px-1 py-0.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-cyan-300 text-[10px] font-mono"
          title="Inserir Glifo Reação"
        >
          [Reação]
        </button>

        <span className="text-zinc-700 text-xs mx-0.5">|</span>

        {/* Color / Highlight trigger */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setActiveRichField(field);
              setIsColorPickerOpen(!isColorPickerOpen);
            }}
            className="p-1 rounded hover:bg-zinc-800 text-amber-300 hover:text-amber-200 transition-colors flex items-center gap-1 cursor-pointer"
            title="Adicionar Cores ou Destaques"
          >
            <Palette className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold hidden sm:inline">Cores</span>
          </button>

          {isColorPickerOpen && activeRichField === field && (
            <ColorPickerMenu
              isOpen={isColorPickerOpen}
              onClose={() => setIsColorPickerOpen(false)}
              onApplyTextColor={(colorHex) => {
                if (colorHex) {
                  insertRichFormatting(field, ref, `<span style="color: ${colorHex}">`, '</span>');
                }
              }}
              onApplyHighlight={(bgRgba) => {
                if (bgRgba) {
                  insertRichFormatting(field, ref, `<mark style="background-color: ${bgRgba}; color: inherit; padding: 2px 4px; border-radius: 4px;">`, '</mark>');
                }
              }}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[99980] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0c0915] border border-cyan-900/40 rounded-2xl w-full max-w-4xl shadow-[0_0_60px_rgba(6,182,212,0.15)] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-cyan-950/70 via-[#130e22] to-[#0c0915] border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-zinc-100">
                  {entityToEdit ? 'Editar Feitiço & Grimório' : 'Criar Novo Feitiço & Grimório de Hecos'}
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800/60 uppercase">
                  Sistema Hecos • PF2e
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Preencha os dados do feitiço, tradições de Hecos, traços funcionais e regras estruturadas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Visibility Selector Menu */}
            <VisibilityBadgeMenu
              visibility={visibility}
              allowedUserIds={allowedUserIds}
              onChange={(newVis, newAllowed) => {
                setVisibility(newVis);
                setAllowedUserIds(newAllowed);
              }}
            />

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 pt-3 bg-[#0e0a1b] border-b border-zinc-800/80 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'details'
                ? 'border-cyan-400 text-cyan-200 font-black'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            1. Dados Gerais, Tradições & Traços
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('mechanics')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'mechanics'
                ? 'border-cyan-400 text-cyan-200 font-black'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            2. Conjuração, Efeitos Ricos & Graus
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'preview'
                ? 'border-cyan-400 text-cyan-200 font-black'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            3. Visualização do Grimório
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5">
          {activeTab === 'details' && (
            <div className="space-y-4">
              {/* Row 1: Name and Rank */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-8 space-y-1">
                  <label className="text-xs font-bold text-zinc-300">
                    Nome do Feitiço <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Pulso Cinético, Tecelagem Dimensional, Biomorfismo..."
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-zinc-900/90 border border-zinc-700/80 text-zinc-100 placeholder-zinc-500 outline-none focus:border-cyan-400 shadow-inner"
                  />
                </div>

                <div className="sm:col-span-4 space-y-1">
                  <label className="text-xs font-bold text-zinc-300">
                    Círculo / Nível (Rank)
                  </label>
                  <select
                    value={spellData.rank}
                    onChange={(e) =>
                      setSpellData({ ...spellData, rank: parseInt(e.target.value, 10) })
                    }
                    className="w-full px-3 py-2.5 text-xs rounded-xl bg-zinc-900/90 border border-zinc-700/80 text-zinc-200 outline-none focus:border-cyan-400"
                  >
                    <option value={0}>Truque (Cantrip - Círculo 0)</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <option key={num} value={num}>
                        {num}º Círculo
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Tradições de Hecos */}
              <div className="space-y-1.5 p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Tradições Mágicas de Hecos (Traits Primários):</span>
                  </label>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {(spellData.traditions || []).length} selecionada(s)
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                  {HECOS_SPELL_TRADITIONS.map((trad) => {
                    const isSelected = (spellData.traditions || []).includes(trad.id);
                    return (
                      <button
                        key={trad.id}
                        type="button"
                        onClick={() => handleTraditionToggle(trad.id)}
                        className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          isSelected
                            ? trad.activeBg
                            : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                        }`}
                        title={trad.desc}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-1.5">
                            <trad.icon className="w-3.5 h-3.5 shrink-0" />
                            <span className="font-extrabold">{trad.label}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <span
                          className={`text-[9px] line-clamp-1 opacity-80 ${
                            isSelected ? 'text-zinc-900 font-semibold' : 'text-zinc-400'
                          }`}
                        >
                          {trad.fullName}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 3: Action Cast Cost & Rarity */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-8 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-300">
                      Ações / Tempo de Conjuração
                    </label>
                    <span className="text-[11px] font-mono text-cyan-400">
                      Selecionado: <strong className="text-white">{spellData.castTime || '—'}</strong>
                    </span>
                  </div>

                  {/* Standard & Variable Action Glyphs */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                    {[
                      { id: '1 ação', glyph: '1-action', label: '1 Ação' },
                      { id: '2 ações', glyph: '2-actions', label: '2 Ações' },
                      { id: '3 ações', glyph: '3-actions', label: '3 Ações' },
                      { id: '1 ou 2 ações', glyph: '1-to-2-actions', label: '1 ou 2' },
                      { id: '1 a 3 ações', glyph: '1-to-3-actions', label: '1 a 3' },
                      { id: '2 a 3 ações', glyph: '2-to-3-actions', label: '2 a 3' },
                    ].map((act) => (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => setSpellData({ ...spellData, castTime: act.id })}
                        className={`p-1.5 rounded-xl border text-center flex flex-col items-center justify-center transition-all cursor-pointer ${
                          spellData.castTime === act.id
                            ? 'bg-cyan-950/90 border-cyan-400 text-cyan-200 shadow-sm ring-1 ring-cyan-500/50'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                        }`}
                      >
                        <PF2eActionGlyph type={act.glyph as ActionGlyphType} size="sm" />
                        <span className="text-[10px] font-bold mt-0.5 truncate">{act.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Reaction, Free, Passive and Extended Time Presets */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { id: 'Reação', glyph: 'reaction', label: 'Reação' },
                      { id: 'Ação Livre', glyph: 'free-action', label: 'Ação Livre' },
                      { id: 'Passiva', glyph: 'passive', label: 'Passiva' },
                    ].map((act) => (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => setSpellData({ ...spellData, castTime: act.id })}
                        className={`px-2 py-1 rounded-lg border text-center flex items-center gap-1 text-xs font-bold transition-all cursor-pointer ${
                          spellData.castTime === act.id
                            ? 'bg-cyan-950 border-cyan-400 text-cyan-200 shadow-sm'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <PF2eActionGlyph type={act.glyph as ActionGlyphType} size="sm" />
                        <span>{act.label}</span>
                      </button>
                    ))}

                    <span className="text-zinc-600 text-xs">|</span>

                    {/* Extended Cast Time Quick Presets */}
                    {['1 rodada', '1 minuto', '10 minutos', '1 hora', '8 horas', '1 dia'].map((timePreset) => (
                      <button
                        key={timePreset}
                        type="button"
                        onClick={() => setSpellData({ ...spellData, castTime: timePreset })}
                        className={`px-2 py-0.5 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer ${
                          spellData.castTime === timePreset
                            ? 'bg-purple-950 border-purple-400 text-purple-200 shadow-sm'
                            : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {timePreset}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    value={spellData.castTime}
                    onChange={(e) => setSpellData({ ...spellData, castTime: e.target.value })}
                    placeholder="Ou digite tempo personalizado..."
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-zinc-900/90 border border-zinc-800 text-zinc-200 placeholder-zinc-500 outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="sm:col-span-4 space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">Raridade PF2e</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['Comum', 'Incomum', 'Raro', 'Único'] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setSpellData({ ...spellData, rarity: r })}
                        className={`py-2 px-1.5 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                          spellData.rarity === r
                            ? r === 'Comum'
                              ? 'bg-zinc-800 border-zinc-500 text-zinc-100'
                              : r === 'Incomum'
                              ? 'bg-amber-950/80 border-amber-500 text-amber-200 shadow-sm'
                              : r === 'Raro'
                              ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 shadow-sm'
                              : 'bg-purple-950/80 border-purple-500 text-purple-200 shadow-sm'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 4: Unified Traits Management with TraitInputCombobox */}
              <div className="space-y-1.5 p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <label className="text-xs font-bold text-zinc-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Traços de Regras PF2e (Traits Funcionais):</span>
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {(spellData.traits || []).length} traço(s) mecânico(s)
                  </span>
                </label>

                <TraitInputCombobox
                  selectedTraits={spellData.traits || []}
                  onChange={(newTraits) => setSpellData({ ...spellData, traits: newTraits })}
                  placeholder="Buscar traço de regras ou criar novo (ex: Fogo, Mente, Abjuração)..."
                  defaultCategory="Feitiços e Magia"
                  quickSuggestions={COMMON_SPELL_TRAITS}
                />
              </div>

              {/* Row 5: Narrative Tags (Diferenciação clara entre Tags e Traits) */}
              <div className="space-y-1.5 p-3.5 rounded-xl bg-[#110d1e] border border-purple-900/40">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                    <TagIcon className="w-3.5 h-3.5 text-purple-400" />
                    <span>Tags Narrativas & Tópicos de Lore:</span>
                  </label>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {tagsList.length} tag(s) temática(s)
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Palavras-chave de indexação narrativa (ex: <em>#astral, #ruinas, #arcano-perdido, #faccao</em>). Diferentes dos traços de regras mecânicas.
                </p>

                {/* Selected tags chips with full CRUD (Add, Edit, Delete) */}
                <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2.5 rounded-xl bg-black/40 border border-zinc-900 items-center">
                  {tagsList.length === 0 ? (
                    <span className="text-xs text-zinc-500 italic px-1">
                      Nenhuma tag narrativa atribuída. (Tags nunca são preenchidas automaticamente).
                    </span>
                  ) : (
                    tagsList.map((tag, idx) => {
                      const isEditing = editingTagIndex === idx;
                      if (isEditing) {
                        return (
                          <div
                            key={`editing-tag-${idx}`}
                            className="inline-flex items-center gap-1.5 p-1 rounded-lg bg-purple-950 border border-purple-400 shadow-md"
                          >
                            <input
                              type="text"
                              autoFocus
                              value={editingTagValue}
                              onChange={(e) => setEditingTagValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSaveEditedTag();
                                } else if (e.key === 'Escape') {
                                  e.preventDefault();
                                  handleCancelEditTag();
                                }
                              }}
                              className="px-2 py-0.5 text-xs bg-black/60 border border-purple-600 rounded text-purple-100 outline-none w-28"
                            />
                            <button
                              type="button"
                              onClick={handleSaveEditedTag}
                              className="p-1 rounded hover:bg-purple-800 text-purple-200"
                              title="Salvar alteração da tag"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEditTag}
                              className="p-1 rounded hover:bg-zinc-800 text-zinc-400"
                              title="Cancelar edição"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      }

                      return (
                        <span
                          key={`tag-${tag}-${idx}`}
                          className="group inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-950/80 text-purple-200 border border-purple-800/60 shadow-sm transition-all hover:border-purple-600"
                        >
                          <span>#{tag}</span>
                          <button
                            type="button"
                            onClick={() => handleStartEditTag(idx, tag)}
                            className="hover:text-amber-300 text-purple-400 cursor-pointer ml-1 p-0.5 rounded transition-colors"
                            title="Editar esta tag"
                          >
                            <Edit2 className="w-2.5 h-2.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveNarrativeTag(tag)}
                            className="hover:text-rose-300 text-purple-400 cursor-pointer p-0.5 rounded transition-colors"
                            title="Excluir esta tag"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddNarrativeTag(tagsInput);
                      }
                    }}
                    placeholder="Adicionar tag narrativa (ex: #necromancia-antiga, #culto)..."
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-zinc-900 border border-zinc-700/80 text-zinc-200 placeholder-zinc-500 outline-none focus:border-purple-400"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddNarrativeTag(tagsInput)}
                    disabled={!tagsInput.trim()}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-900/80 hover:bg-purple-800 border border-purple-700/60 text-purple-200 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tag</span>
                  </button>
                </div>
              </div>

              {/* Row 6: Subcategories / Folders */}
              <div className="space-y-1.5 p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Folder className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Pastas & Subcategorias de Grimório:</span>
                </label>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {selectedSubcategories.map((subcat) => (
                    <span
                      key={subcat}
                      className="px-2.5 py-1 rounded-lg bg-purple-950 border border-purple-800 text-purple-200 text-xs font-bold flex items-center gap-1"
                    >
                      <span>{subcat}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubcategory(subcat)}
                        className="hover:text-rose-400 text-purple-400 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <select
                    onChange={(e) => {
                      if (e.target.value && !selectedSubcategories.includes(e.target.value)) {
                        setSelectedSubcategories([...selectedSubcategories, e.target.value]);
                      }
                      e.target.value = '';
                    }}
                    defaultValue=""
                    className="px-3 py-1.5 text-xs rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-300 outline-none focus:border-cyan-400"
                  >
                    <option value="" disabled>
                      + Selecionar Pasta ({allExistingFolders.length} disponíveis)...
                    </option>
                    {allExistingFolders.map((f) => (
                      <option key={f} value={f} disabled={selectedSubcategories.includes(f)}>
                        {f} {selectedSubcategories.includes(f) ? '(já adicionada)' : ''}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={newSubcategoryInput}
                    onChange={(e) => setNewSubcategoryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubcategory();
                      }
                    }}
                    placeholder="Ou criar nova pasta..."
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 placeholder-zinc-500 outline-none focus:border-cyan-400"
                  />

                  <button
                    type="button"
                    onClick={handleAddSubcategory}
                    disabled={!newSubcategoryInput.trim()}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    + Adicionar
                  </button>
                </div>

                {/* Available Quick Suggestion Chips */}
                {allExistingFolders.filter((f) => !selectedSubcategories.includes(f)).length > 0 && (
                  <div className="pt-2 flex items-center gap-1.5 flex-wrap border-t border-zinc-800/60 mt-2">
                    <span className="text-[11px] text-zinc-500 font-medium mr-1">Sugestões rápidas:</span>
                    {allExistingFolders
                      .filter((f) => !selectedSubcategories.includes(f))
                      .map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setSelectedSubcategories([...selectedSubcategories, f])}
                          className="px-2 py-0.5 rounded-md bg-zinc-900 hover:bg-purple-950/80 border border-zinc-800 hover:border-purple-600/60 text-zinc-400 hover:text-purple-200 text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1"
                          title={`Adicionar pasta "${f}"`}
                        >
                          <Plus className="w-2.5 h-2.5 text-cyan-400" />
                          <span>{f}</span>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'mechanics' && (
            <div className="space-y-4">
              {/* Range, Area, Targets, Saving Throw */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300">Alcance (Range)</label>
                  <input
                    type="text"
                    value={spellData.range || ''}
                    onChange={(e) => setSpellData({ ...spellData, range: e.target.value })}
                    placeholder="Ex: Toque, 9 metros, 18 metros..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 placeholder-zinc-500 outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300">Área (Area)</label>
                  <input
                    type="text"
                    value={spellData.area || ''}
                    onChange={(e) => setSpellData({ ...spellData, area: e.target.value })}
                    placeholder="Ex: Cone de 4.5m, explosão de 6m..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 placeholder-zinc-500 outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300">Alvo(s) (Targets)</label>
                  <input
                    type="text"
                    value={spellData.targets || ''}
                    onChange={(e) => setSpellData({ ...spellData, targets: e.target.value })}
                    placeholder="Ex: 1 criatura, você, até 4 alvos..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 placeholder-zinc-500 outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-amber-300 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Gatilho (Trigger)</span>
                  </label>
                  <input
                    type="text"
                    value={spellData.trigger || ''}
                    onChange={(e) => setSpellData({ ...spellData, trigger: e.target.value })}
                    placeholder="Ex: Uma criatura se move adjacente a você, você sofre dano..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-amber-900/60 text-amber-200 placeholder-zinc-500 outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300">Salvamento / Defesa</label>
                  <select
                    value={spellData.savingThrow || ''}
                    onChange={(e) => setSpellData({ ...spellData, savingThrow: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 outline-none focus:border-cyan-400"
                  >
                    <option value="">Nenhum (Efeito Automático)</option>
                    <option value="Reflexos básico">Reflexos básico</option>
                    <option value="Reflexos">Reflexos</option>
                    <option value="Fortitude básica">Fortitude básica</option>
                    <option value="Fortitude">Fortitude</option>
                    <option value="Vontade básica">Vontade básica</option>
                    <option value="Vontade">Vontade</option>
                    <option value="Ataque Mágico vs CA">Ataque Mágico vs CA</option>
                  </select>
                </div>
              </div>

              {/* Duration and Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-4 space-y-1">
                  <label className="text-xs font-bold text-zinc-300">Duração</label>
                  <input
                    type="text"
                    value={spellData.duration || ''}
                    onChange={(e) => setSpellData({ ...spellData, duration: e.target.value })}
                    placeholder="Ex: instantânea, sustentada até 1 min..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 placeholder-zinc-500 outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="sm:col-span-8 space-y-1">
                  <label className="text-xs font-bold text-zinc-300">Resumo Rápido</label>
                  <input
                    type="text"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Breve resumo de 1 linha para listagens..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 placeholder-zinc-500 outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Rich Description */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-300">
                    Descrição & Efeitos da Magia <span className="text-rose-400">*</span>
                  </label>
                  {renderRichToolbar('description', descRef)}
                </div>
                <textarea
                  ref={descRef}
                  value={spellData.description}
                  onChange={(e) => setSpellData({ ...spellData, description: e.target.value })}
                  placeholder="Descreva o efeito mágico detalhado..."
                  rows={6}
                  className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl bg-zinc-900/90 border border-zinc-700/80 text-zinc-100 placeholder-zinc-500 outline-none focus:border-cyan-400 leading-relaxed shadow-inner"
                />
              </div>

              {/* Degrees of Success */}
              <div className="p-3.5 rounded-xl bg-[#090b14] border border-cyan-900/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-cyan-300">
                    Graus de Sucesso (Opcional - PF2e)
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-emerald-400">Sucesso Crítico:</label>
                    <input
                      type="text"
                      value={spellData.criticalSuccess || ''}
                      onChange={(e) => setSpellData({ ...spellData, criticalSuccess: e.target.value })}
                      placeholder="Efeito no sucesso crítico..."
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-cyan-400">Sucesso:</label>
                    <input
                      type="text"
                      value={spellData.success || ''}
                      onChange={(e) => setSpellData({ ...spellData, success: e.target.value })}
                      placeholder="Efeito no sucesso regular..."
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-amber-400">Falha:</label>
                    <input
                      type="text"
                      value={spellData.failure || ''}
                      onChange={(e) => setSpellData({ ...spellData, failure: e.target.value })}
                      placeholder="Efeito na falha..."
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 outline-none focus:border-amber-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-rose-400">Falha Crítica:</label>
                    <input
                      type="text"
                      value={spellData.criticalFailure || ''}
                      onChange={(e) => setSpellData({ ...spellData, criticalFailure: e.target.value })}
                      placeholder="Efeito na falha crítica..."
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 outline-none focus:border-rose-400"
                    />
                  </div>
                </div>
              </div>

              {/* Heightened & Lore */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-300">
                      Intensificado (Heightened)
                    </label>
                    {renderRichToolbar('heightened', heightenedRef)}
                  </div>
                  <textarea
                    ref={heightenedRef}
                    value={spellData.heightened || ''}
                    onChange={(e) => setSpellData({ ...spellData, heightened: e.target.value })}
                    placeholder="Ex: (+1) O dano aumenta em 1d6..."
                    rows={3}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-300">
                      Origem & Lore de Hecos
                    </label>
                    {renderRichToolbar('hecosLore', loreRef)}
                  </div>
                  <textarea
                    ref={loreRef}
                    value={spellData.hecosLore || ''}
                    onChange={(e) => setSpellData({ ...spellData, hecosLore: e.target.value })}
                    placeholder="Histórico deste feitiço em Hecos..."
                    rows={3}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="p-5 rounded-2xl bg-[#09080e] border border-cyan-500/30 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div>
                  <h3 className="text-lg font-black text-cyan-300">
                    {title.trim() || 'Nome do Feitiço'}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {spellData.rank === 0 ? 'Truque (Cantrip)' : `Magia de ${spellData.rank}º Círculo`}
                  </p>
                </div>
                <div className="px-3 py-1 rounded-xl bg-cyan-950 text-cyan-300 border border-cyan-700 font-mono text-xs font-bold">
                  {spellData.castTime || '2 ações'}
                </div>
              </div>

              {/* Traits & Traditions Chips */}
              <div className="flex flex-wrap gap-1.5">
                <TraitBadge trait={spellData.rarity || 'Comum'} />
                {spellData.traditions.map((trad) => (
                  <TraitBadge key={trad} trait={trad} />
                ))}
                {spellData.traits.map((tr) => (
                  <TraitBadge key={tr} trait={tr} />
                ))}
              </div>

              {/* Properties */}
              <div className="text-xs space-y-1 text-zinc-300">
                {spellData.range && (
                  <p>
                    <strong className="text-zinc-400">Alcance:</strong> {spellData.range}
                  </p>
                )}
                {spellData.area && (
                  <p>
                    <strong className="text-zinc-400">Área:</strong> {spellData.area}
                  </p>
                )}
                {spellData.targets && (
                  <p>
                    <strong className="text-zinc-400">Alvos:</strong> {spellData.targets}
                  </p>
                )}
                {spellData.savingThrow && (
                  <p>
                    <strong className="text-zinc-400">Salvamento:</strong> {spellData.savingThrow}
                  </p>
                )}
                {spellData.duration && (
                  <p>
                    <strong className="text-zinc-400">Duração:</strong> {spellData.duration}
                  </p>
                )}
              </div>

              {/* Description preview */}
              <div className="pt-3 border-t border-zinc-800/80 text-xs text-zinc-200 whitespace-pre-wrap font-sans leading-relaxed">
                {spellData.description || (
                  <span className="italic text-zinc-600">Nenhuma descrição informada.</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#0b0816] border-t border-zinc-800/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold transition-all cursor-pointer"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveSpellRecord}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-zinc-950 text-xs font-black shadow-lg transition-all cursor-pointer"
            >
              {entityToEdit ? 'Salvar Alterações' : 'Criar Feitiço'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
