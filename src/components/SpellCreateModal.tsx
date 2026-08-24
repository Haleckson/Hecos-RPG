import React, { useState, useMemo } from 'react';
import {
  HecosEntity,
  PF2eSpellAttributes,
  SpellCategoryType,
  ItemVisibility,
} from '../types';
import { getEmptySpellData, serializeSpellToHTML } from '../utils/spellSerializer';
import { HecosStorage } from '../services/storage';
import { PF2eActionGlyph, ActionGlyphType } from './PF2eActionGlyph';
import { VisibilityBadgeMenu } from './VisibilityBadgeMenu';
import { TraitBadge } from './TraitBadge';
import {
  Sparkles,
  X,
  Check,
  Plus,
  Layers,
  Flame,
  Sun,
  Moon,
  Zap,
  BookOpen,
  Eye,
  Folder,
  Shield,
  Clock,
  Target,
  Sparkle,
  SlidersHorizontal,
  ChevronDown,
  Info,
} from 'lucide-react';

interface SpellCreateModalProps {
  isOpen: boolean;
  initialTradition?: string;
  initialSubcategory?: string;
  presetTradition?: string;
  presetCategory?: SpellCategoryType;
  presetSubcategory?: string;
  onClose: () => void;
  onSave?: (newEntity: HecosEntity) => void;
  onSaveSpell?: (newEntity: HecosEntity) => void;
}

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

export const SpellCreateModal: React.FC<SpellCreateModalProps> = ({
  isOpen,
  initialTradition,
  initialSubcategory,
  presetTradition,
  presetCategory,
  presetSubcategory,
  onClose,
  onSave,
  onSaveSpell,
}) => {
  const finalInitialTrad = presetTradition || initialTradition;
  const finalInitialSub = presetSubcategory || initialSubcategory;

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'mechanics' | 'preview'>('details');

  // Spell data attributes
  const [spellData, setSpellData] = useState<PF2eSpellAttributes>(() => {
    const empty = getEmptySpellData();
    if (finalInitialTrad) {
      if (['arcano', 'divino', 'oculto', 'primal', 'outras'].includes(finalInitialTrad.toLowerCase())) {
        empty.traditions = [finalInitialTrad.toLowerCase()];
      }
    }
    if (presetCategory) {
      empty.spellType = presetCategory;
    }
    if (finalInitialSub) {
      empty.subcategories = [finalInitialSub];
    }
    return empty;
  });

  // Selected folders / subcategories
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>(
    finalInitialSub ? [finalInitialSub] : []
  );
  const [newSubcategoryInput, setNewSubcategoryInput] = useState('');

  // Visibility state
  const [visibility, setVisibility] = useState<ItemVisibility>('all');
  const [allowedUserIds, setAllowedUserIds] = useState<string[]>([]);

  // Traits management
  const [traitInput, setTraitInput] = useState('');

  // Available spell folders from storage
  const spellConfig = useMemo(() => HecosStorage.getAllSpellSubcategoriesConfig(), []);
  const allExistingFolders = useMemo(() => {
    const set = new Set<string>();
    (Object.values(spellConfig) as string[][]).forEach((list) => {
      (list || []).forEach((sub) => set.add(sub));
    });
    return Array.from(set).sort();
  }, [spellConfig]);

  if (!isOpen) return null;

  const handleTraditionToggle = (tradition: string) => {
    setSpellData((prev) => {
      const current = prev.traditions || [];
      const exists = current.includes(tradition);
      return {
        ...prev,
        traditions: exists ? current.filter((t) => t !== tradition) : [...current, tradition],
      };
    });
  };

  const handleAddTrait = (traitToAdd: string) => {
    const clean = traitToAdd.trim();
    if (!clean) return;
    if (!spellData.traits.includes(clean)) {
      setSpellData((prev) => ({
        ...prev,
        traits: [...prev.traits, clean],
      }));
    }
    setTraitInput('');
  };

  const handleRemoveTrait = (traitToRemove: string) => {
    setSpellData((prev) => ({
      ...prev,
      traits: prev.traits.filter((t) => t !== traitToRemove),
    }));
  };

  const handleAddSubcategory = () => {
    const trimmed = newSubcategoryInput.trim();
    if (trimmed && !selectedSubcategories.includes(trimmed)) {
      setSelectedSubcategories([...selectedSubcategories, trimmed]);
      setNewSubcategoryInput('');
    }
  };

  const handleRemoveSubcategory = (subcat: string) => {
    setSelectedSubcategories(selectedSubcategories.filter((s) => s !== subcat));
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert('Por favor, informe o nome do feitiço.');
      return;
    }

    const finalSpellData: PF2eSpellAttributes = {
      ...spellData,
      subcategories: selectedSubcategories,
    };

    const newId = 'entity-spell-' + Date.now();
    const primarySub = selectedSubcategories[0] || '';

    const newEntity: HecosEntity = {
      id: newId,
      slug:
        title
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
      summary: summary.trim() || spellData.description.slice(0, 140),
      content: serializeSpellToHTML(title.trim(), finalSpellData),
      spellData: finalSpellData,
      tags: [
        'feitiço',
        'magia',
        'pf2e',
        ...spellData.traditions,
        ...spellData.traits.map((t) => t.toLowerCase()),
        ...selectedSubcategories,
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isSecret: visibility === 'gm',
      visibility,
      allowedUserIds: visibility === 'specific' ? allowedUserIds : [],
    };

    HecosStorage.saveEntity(newEntity);
    if (onSave) onSave(newEntity);
    if (onSaveSpell) onSaveSpell(newEntity);
    onClose();
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
                  Criar Novo Feitiço & Grimório PF2e
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800/60 uppercase">
                  Pathfinder 2e
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Preencha os campos estruturados de feitiço com dados de conjuração e graus de sucesso.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Visibility Selector Menu */}
            <VisibilityBadgeMenu
              visibility={visibility}
              allowedUserIds={allowedUserIds}
              onVisibilityChange={(newVis, newAllowed) => {
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
            1. Dados Gerais & Tradições
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
            2. Conjuração, Efeitos & Sucessos
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
                    placeholder="Ex: Raio de Gelo, Bola de Fogo, Escudo da Penumbra..."
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

              {/* Row 2: Spell Type and Traditions */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-4 space-y-1">
                  <label className="text-xs font-bold text-zinc-300">Tipo de Feitiço</label>
                  <select
                    value={spellData.spellType || 'spell'}
                    onChange={(e) =>
                      setSpellData({ ...spellData, spellType: e.target.value as any })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 outline-none focus:border-cyan-400 font-semibold"
                  >
                    <option value="spell">Feitiço</option>
                    <option value="focus">Focus</option>
                    <option value="ritual">Ritual</option>
                    <option value="other">Outro</option>
                  </select>
                </div>

                <div className="sm:col-span-8 space-y-1">
                  <label className="text-xs font-bold text-zinc-300">
                    Tradições Mágicas (Selecione uma ou mais)
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { id: 'arcano', label: 'Arcano', icon: BookOpen, color: 'text-cyan-400' },
                      { id: 'divino', label: 'Divino', icon: Sun, color: 'text-amber-400' },
                      { id: 'oculto', label: 'Oculto', icon: Moon, color: 'text-purple-400' },
                      { id: 'primal', label: 'Primal', icon: Flame, color: 'text-emerald-400' },
                      { id: 'outras', label: 'Outras', icon: Sparkle, color: 'text-rose-400' },
                    ].map((trad) => {
                      const isSelected = (spellData.traditions || []).includes(trad.id);
                      return (
                        <button
                          key={trad.id}
                          type="button"
                          onClick={() => handleTraditionToggle(trad.id)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-cyan-950 text-cyan-200 border border-cyan-500 shadow-md ring-1 ring-cyan-500/50'
                              : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                          }`}
                        >
                          <trad.icon className={`w-3.5 h-3.5 ${trad.color}`} />
                          <span>{trad.label}</span>
                          {isSelected && <Check className="w-3 h-3 text-cyan-300" />}
                        </button>
                      );
                    })}
                  </div>
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
                      Selecionado: <strong className="text-white">{spellData.castTime || '2 ações'}</strong>
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
                        <PF2eActionGlyph action={act.glyph as ActionGlyphType} size="sm" />
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
                        <PF2eActionGlyph action={act.glyph as ActionGlyphType} size="sm" />
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
                    placeholder="Ou digite tempo personalizado (ex: 2 rodadas, 1 semana, ativação sob gatilho)..."
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

              {/* Row 4: Traits Management */}
              <div className="space-y-1.5 p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <label className="text-xs font-bold text-zinc-300 flex items-center justify-between">
                  <span>Descritores & Traços (Traits):</span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {spellData.traits.length} selecionados
                  </span>
                </label>

                {/* Selected traits chips */}
                <div className="flex items-center gap-1.5 flex-wrap min-h-[32px]">
                  {spellData.traits.map((trait) => (
                    <span
                      key={trait}
                      className="px-2.5 py-1 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-200 text-xs font-bold flex items-center gap-1 shadow-sm"
                    >
                      <span>{trait}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTrait(trait)}
                        className="hover:text-rose-400 text-cyan-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                {/* Add trait custom or preset */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={traitInput}
                    onChange={(e) => setTraitInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTrait(traitInput);
                      }
                    }}
                    placeholder="Adicionar traço (ex: Fogo, Mente, Teleporte)..."
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 placeholder-zinc-500 outline-none focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddTrait(traitInput)}
                    disabled={!traitInput.trim()}
                    className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-zinc-950 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar</span>
                  </button>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1 flex-wrap pt-1">
                  <span className="text-[10px] text-zinc-500 mr-1">Sugestões:</span>
                  {COMMON_SPELL_TRAITS.slice(0, 10).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleAddTrait(preset)}
                      className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-cyan-300 text-[10px] border border-zinc-800 transition-colors"
                    >
                      +{preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 5: Subcategories / Folders */}
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
                        className="hover:text-rose-400 text-purple-400"
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
                      + Selecionar Pasta Existente...
                    </option>
                    {allExistingFolders.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={newSubcategoryInput}
                    onChange={(e) => setNewSubcategoryInput(e.target.value)}
                    placeholder="Ou criar nova pasta..."
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 placeholder-zinc-500 outline-none focus:border-cyan-400"
                  />

                  <button
                    type="button"
                    onClick={handleAddSubcategory}
                    disabled={!newSubcategoryInput.trim()}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    + Adicionar
                  </button>
                </div>
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
                    placeholder="Ex: instantânea, sustentada até 1 min, 1 hora..."
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

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300">
                  Descrição & Efeitos da Magia <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={5}
                  value={spellData.description}
                  onChange={(e) => setSpellData({ ...spellData, description: e.target.value })}
                  placeholder="Descreva detalhadamente a conjuração, danos, condições aplicadas e regras..."
                  className="w-full p-3 text-xs rounded-xl bg-zinc-900/90 border border-zinc-700/80 text-zinc-200 placeholder-zinc-500 outline-none focus:border-cyan-400 leading-relaxed"
                />
              </div>

              {/* Degree of Success (Expandable) */}
              <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-3">
                <h4 className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Graus de Sucesso (Salvamento):</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-emerald-400">
                      Sucesso Crítico:
                    </label>
                    <input
                      type="text"
                      value={spellData.criticalSuccess || ''}
                      onChange={(e) =>
                        setSpellData({ ...spellData, criticalSuccess: e.target.value })
                      }
                      placeholder="Ex: O alvo não sofre efeito ou dano."
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-zinc-900 border border-zinc-700/80 text-zinc-200 placeholder-zinc-600 outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-cyan-400">Sucesso:</label>
                    <input
                      type="text"
                      value={spellData.success || ''}
                      onChange={(e) => setSpellData({ ...spellData, success: e.target.value })}
                      placeholder="Ex: O alvo sofre metade do dano."
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-zinc-900 border border-zinc-700/80 text-zinc-200 placeholder-zinc-600 outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-amber-400">Falha:</label>
                    <input
                      type="text"
                      value={spellData.failure || ''}
                      onChange={(e) => setSpellData({ ...spellData, failure: e.target.value })}
                      placeholder="Ex: O alvo sofre o dano total."
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-zinc-900 border border-zinc-700/80 text-zinc-200 placeholder-zinc-600 outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-rose-400">
                      Falha Crítica:
                    </label>
                    <input
                      type="text"
                      value={spellData.criticalFailure || ''}
                      onChange={(e) =>
                        setSpellData({ ...spellData, criticalFailure: e.target.value })
                      }
                      placeholder="Ex: O alvo sofre dano dobrado e condição Frightened 2."
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-zinc-900 border border-zinc-700/80 text-zinc-200 placeholder-zinc-600 outline-none focus:border-rose-500"
                    />
                  </div>
                </div>
              </div>

              {/* Heightened & Lore */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300">
                    Intensificado (Heightened)
                  </label>
                  <textarea
                    rows={2}
                    value={spellData.heightened || ''}
                    onChange={(e) => setSpellData({ ...spellData, heightened: e.target.value })}
                    placeholder="Ex: (+1) O dano aumenta em 1d6.\n(4º) Você pode escolher até 2 alvos."
                    className="w-full p-2.5 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 placeholder-zinc-500 outline-none focus:border-cyan-400 leading-relaxed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-300">
                    História / Lore de Hecos
                  </label>
                  <textarea
                    rows={2}
                    value={spellData.hecosLore || ''}
                    onChange={(e) => setSpellData({ ...spellData, hecosLore: e.target.value })}
                    placeholder="Notas históricas de quem desenvolveu este feitiço no cenário..."
                    className="w-full p-2.5 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 placeholder-zinc-500 outline-none focus:border-cyan-400 leading-relaxed"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="p-4 rounded-2xl bg-[#090710] border border-cyan-500/30 space-y-4 shadow-xl">
              <div className="border-b border-zinc-800 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-cyan-300 flex items-center gap-2">
                    <span>{title || '[Nome do Feitiço]'}</span>
                  </h3>
                  <div className="text-xs text-purple-300 font-mono">
                    {spellData.rank === 0 ? 'Truque (Cantrip)' : `Magia ${spellData.rank}º Círculo`}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <TraitBadge trait={spellData.rarity || 'Comum'} />
                  {(spellData.traditions || []).map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-cyan-950 text-cyan-300 border border-cyan-800"
                    >
                      {t}
                    </span>
                  ))}
                  {(spellData.traits || []).map((tr) => (
                    <span
                      key={tr}
                      className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-zinc-900 text-zinc-400 border border-zinc-800"
                    >
                      {tr}
                    </span>
                  ))}
                </div>
              </div>

              {/* Cast Meta */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-zinc-300">
                {spellData.castTime && (
                  <div>
                    <strong className="text-zinc-400">Conjuração:</strong> {spellData.castTime}
                  </div>
                )}
                {spellData.range && (
                  <div>
                    <strong className="text-zinc-400">Alcance:</strong> {spellData.range}
                  </div>
                )}
                {spellData.area && (
                  <div>
                    <strong className="text-zinc-400">Área:</strong> {spellData.area}
                  </div>
                )}
                {spellData.targets && (
                  <div>
                    <strong className="text-zinc-400">Alvos:</strong> {spellData.targets}
                  </div>
                )}
                {spellData.savingThrow && (
                  <div>
                    <strong className="text-zinc-400">Salvamento:</strong> {spellData.savingThrow}
                  </div>
                )}
                {spellData.duration && (
                  <div>
                    <strong className="text-zinc-400">Duração:</strong> {spellData.duration}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="text-xs leading-relaxed text-zinc-200 border-t border-zinc-800/80 pt-3 whitespace-pre-line">
                {spellData.description || (
                  <span className="text-zinc-600 italic">Nenhuma descrição informada ainda.</span>
                )}
              </div>

              {/* Degree of Success if provided */}
              {(spellData.criticalSuccess ||
                spellData.success ||
                spellData.failure ||
                spellData.criticalFailure) && (
                <div className="text-xs space-y-1 pt-2 border-t border-zinc-800/60">
                  {spellData.criticalSuccess && (
                    <div>
                      <strong className="text-emerald-400">Sucesso Crítico:</strong>{' '}
                      {spellData.criticalSuccess}
                    </div>
                  )}
                  {spellData.success && (
                    <div>
                      <strong className="text-cyan-400">Sucesso:</strong> {spellData.success}
                    </div>
                  )}
                  {spellData.failure && (
                    <div>
                      <strong className="text-amber-400">Falha:</strong> {spellData.failure}
                    </div>
                  )}
                  {spellData.criticalFailure && (
                    <div>
                      <strong className="text-rose-400">Falha Crítica:</strong>{' '}
                      {spellData.criticalFailure}
                    </div>
                  )}
                </div>
              )}

              {/* Heightened */}
              {spellData.heightened && (
                <div className="text-xs pt-2 border-t border-zinc-800/60">
                  <strong className="text-amber-300">Intensificado:</strong> {spellData.heightened}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#090710] border-t border-zinc-800/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 text-xs font-bold transition-all cursor-pointer"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-2">
            {activeTab !== 'preview' && (
              <button
                type="button"
                onClick={() =>
                  setActiveTab(activeTab === 'details' ? 'mechanics' : 'preview')
                }
                className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-all cursor-pointer"
              >
                Próximo Passo →
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-zinc-950 text-xs font-black shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Salvar Feitiço no Grimório</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
