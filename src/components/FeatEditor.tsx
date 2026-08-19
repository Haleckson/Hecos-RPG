import React, { useState } from 'react';
import {
  HecosEntity,
  PF2eFeatAttributes,
  FeatActionCost,
  FeatCategoryType,
  FeatRarity,
  ItemVisibility,
} from '../types';
import {
  getEmptyFeatData,
  getDefaultFeatData,
  serializeFeatToHTML,
  parseFeatFromContent,
} from '../utils/featSerializer';
import { HecosStorage } from '../services/storage';
import { ReferenceField } from './ReferenceField';
import { PF2eActionGlyph, ActionGlyphType } from './PF2eActionGlyph';
import { ImageUploadInput } from './ImageUploadInput';
import { VisibilityBadgeMenu } from './VisibilityBadgeMenu';
import {
  Award,
  Sparkles,
  Save,
  X,
  Lock,
  Tag as TagIcon,
  Image as ImageIcon,
  Swords,
  Scroll,
  RotateCcw,
  FolderPlus,
  Folder,
  Plus,
  Check,
} from 'lucide-react';

interface FeatEditorProps {
  entity: HecosEntity;
  onSave: (updated: HecosEntity) => void;
  onCancel: () => void;
  onNavigate: (id: string) => void;
}

const COMMON_PF2E_TRAITS = [
  'Ataque',
  'Audácia',
  'Concentração',
  'Floreio',
  'Manipular',
  'Mental',
  'Postura',
  'Metamagia',
  'Dedicação',
  'Herança',
  'Geral',
  'Perícia',
  'Marcial',
  'Magia',
  'Transmutação',
  'Evocação',
  'Ilusão',
  'Oculto',
  'Divino',
  'Primal',
  'Arcano',
  'Movimento',
  'Furtividade',
  'Atletismo',
  'Acrobacia',
  'Medicina',
  'Sobrevivência',
  'Eclipse'
];

const COMMON_LEVELS = [1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20];

export const FeatEditor: React.FC<FeatEditorProps> = ({
  entity,
  onSave,
  onCancel,
  onNavigate,
}) => {
  const [title, setTitle] = useState(
    entity.title === 'Novo Artigo de Hecos' || entity.title === 'Novo Talento'
      ? ''
      : entity.title || ''
  );
  const [subtitle, setSubtitle] = useState(entity.subtitle || '');
  const [coverImage, setCoverImage] = useState(entity.coverImage || '');
  const [tagsString, setTagsString] = useState(
    entity.tags.length > 0 ? entity.tags.join(', ') : 'talento, pf2e'
  );
  const [isSecret, setIsSecret] = useState(entity.isSecret || false);
  const [visibility, setVisibility] = useState<ItemVisibility>(entity.visibility || (entity.isSecret ? 'gm' : 'public'));
  const [allowedUserIds, setAllowedUserIds] = useState<string[]>(entity.allowedUserIds || []);

  // Parse or initialize blank structured Feat Attributes
  const [data, setData] = useState<PF2eFeatAttributes>(() => {
    const parsed = parseFeatFromContent(entity.title, entity.content || '', entity.featData);
    if (!parsed.subcategories || parsed.subcategories.length === 0) {
      if (entity.subcategories && entity.subcategories.length > 0) {
        parsed.subcategories = entity.subcategories;
      } else if (entity.subcategory) {
        parsed.subcategories = [entity.subcategory];
      } else {
        parsed.subcategories = [];
      }
    }
    return parsed;
  });

  const [activeMainTab, setActiveMainTab] = useState<'mechanics' | 'lore'>('mechanics');
  const [customTraitInput, setCustomTraitInput] = useState('');
  const [customSubcategoryInput, setCustomSubcategoryInput] = useState('');

  // Subcategories helpers
  const availableSubcategories = HecosStorage.getFeatSubcategories(data.featType);
  const allOtherSubcategories = HecosStorage.getFeatSubcategories('all').filter(
    (s) => !availableSubcategories.includes(s)
  );

  const toggleSubcategory = (subcat: string) => {
    setData((prev) => {
      const current = prev.subcategories || [];
      if (current.includes(subcat)) {
        return { ...prev, subcategories: current.filter((s) => s !== subcat) };
      } else {
        return { ...prev, subcategories: [...current, subcat] };
      }
    });
  };

  const addCustomSubcategory = () => {
    const trimmed = customSubcategoryInput.trim();
    if (!trimmed) return;
    HecosStorage.addFeatSubcategory(data.featType, trimmed);
    setData((prev) => {
      const current = prev.subcategories || [];
      if (!current.includes(trimmed)) {
        return { ...prev, subcategories: [...current, trimmed] };
      }
      return prev;
    });
    setCustomSubcategoryInput('');
  };

  // Update helper
  const updateField = <K extends keyof PF2eFeatAttributes>(
    field: K,
    val: PF2eFeatAttributes[K]
  ) => {
    setData((prev) => ({ ...prev, [field]: val }));
  };

  // Trait helpers
  const toggleTrait = (trait: string) => {
    setData((prev) => {
      const current = prev.traits || [];
      if (current.includes(trait)) {
        return { ...prev, traits: current.filter((t) => t !== trait) };
      } else {
        return { ...prev, traits: [...current, trait] };
      }
    });
  };

  const addCustomTrait = () => {
    const trimmed = customTraitInput.trim();
    if (!trimmed) return;
    if (!data.traits.includes(trimmed)) {
      setData((prev) => ({
        ...prev,
        traits: [...prev.traits, trimmed],
      }));
    }
    setCustomTraitInput('');
  };

  const removeTrait = (trait: string) => {
    setData((prev) => ({
      ...prev,
      traits: prev.traits.filter((t) => t !== trait),
    }));
  };

  const handleApplyTemplate = () => {
    if (
      window.confirm(
        'Deseja preencher com um exemplo padrão de talento PF2e de Hecos? Campos atuais serão substituídos.'
      )
    ) {
      const sample = getDefaultFeatData(title || 'Golpe do Eclipse');
      setData(sample);
      if (!title) setTitle('Golpe do Eclipse');
      if (!subtitle) setSubtitle('Técnica marcial com canalização de sombras');
    }
  };

  const handleResetBlank = () => {
    if (window.confirm('Limpar todos os campos deste talento?')) {
      setData(getEmptyFeatData());
    }
  };

  const handleSave = () => {
    const finalTitle = title.trim() || 'Novo Talento';
    const serializedContent = serializeFeatToHTML(finalTitle, data);

    const subcats = data.subcategories || [];
    const updatedTagsSet = new Set(
      tagsString
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    );
    subcats.forEach((s) => updatedTagsSet.add(s));

    const updatedEntity: HecosEntity = {
      ...entity,
      title: finalTitle,
      subtitle: subtitle.trim(),
      category: 'feat',
      subcategory: subcats[0] || entity.subcategory || '',
      subcategories: subcats,
      summary: data.description ? data.description.substring(0, 160) : '',
      content: serializedContent,
      featData: data,
      coverImage: coverImage.trim(),
      tags: Array.from(updatedTagsSet),
      isSecret: visibility === 'gm',
      visibility,
      allowedUserIds,
      updatedAt: new Date().toISOString(),
    };

    onSave(updatedEntity);
  };

  return (
    <div className="bg-[#08070d] text-zinc-100 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden flex flex-col relative">
      {/* Floating Save Button (Icon-only) */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          type="button"
          onClick={handleSave}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-black shadow-[0_4px_25px_rgba(245,158,11,0.45)] hover:shadow-[0_6px_30px_rgba(245,158,11,0.7)] hover:scale-110 active:scale-95 transition-all cursor-pointer border border-white/30"
          data-tooltip="Salvar Talento (Ctrl+S)"
        >
          <Save className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      {/* 1. TOP STICKY BAR: ACTIONS & TITLE */}
      <div className="sticky top-0 z-20 px-4 sm:px-6 py-3 bg-[#110d1c] border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3 backdrop-blur-md">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="p-2 rounded-xl bg-amber-950/50 border border-amber-500/40 text-amber-300">
            <Award className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome do Talento (ex: Golpe do Eclipse, Passo das Cinzas)..."
              className="w-full bg-transparent text-lg sm:text-xl font-black text-amber-200 placeholder-zinc-500 outline-none border-b border-transparent focus:border-amber-400 transition-colors"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleApplyTemplate}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Preencher com exemplo de talento"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Exemplo</span>
          </button>

          <button
            type="button"
            onClick={handleResetBlank}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Limpar campos"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Limpar</span>
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Cancelar</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black text-xs font-black flex items-center gap-1.5 shadow-lg shadow-amber-950/50 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Talento</span>
          </button>
        </div>
      </div>

      {/* 2. META DETAILS BAR */}
      <div className="px-6 py-3 bg-[#0d0a16] border-b border-zinc-800/80 grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs items-center">
        <div className="sm:col-span-3">
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="Subtítulo ou conceito curto..."
            className="w-full px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800 focus:border-amber-400 text-zinc-200 placeholder-zinc-500 outline-none text-xs"
          />
        </div>

        <div className="sm:col-span-5">
          <ImageUploadInput
            value={coverImage}
            onChange={setCoverImage}
            placeholder="URL ou Upload ImgBB..."
            showPreview={false}
          />
        </div>

        <div className="sm:col-span-3 flex items-center gap-2">
          <TagIcon className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          <input
            type="text"
            value={tagsString}
            onChange={(e) => setTagsString(e.target.value)}
            placeholder="Tags (separadas por vírgula)..."
            className="w-full px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800 focus:border-amber-400 text-zinc-200 placeholder-zinc-500 outline-none text-[11px]"
          />
        </div>

        <div className="sm:col-span-1 flex items-center justify-end">
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

      {/* 3. NAVIGATION TABS */}
      <div className="px-6 py-2.5 bg-[#0a0812] border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveMainTab('mechanics')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeMainTab === 'mechanics'
                ? 'bg-amber-950/70 text-amber-200 border border-amber-600/60 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>1. Estatísticas & Regras PF2e</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('lore')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeMainTab === 'lore'
                ? 'bg-[#181125] text-purple-200 border border-purple-600/60 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Scroll className="w-3.5 h-3.5" />
            <span>2. Contexto & Lore em Hecos</span>
          </button>
        </div>

        <div className="text-[11px] font-mono text-zinc-500">
          Padronizado para Pathfinder 2e Remaster
        </div>
      </div>

      {/* 4. TAB CONTENTS */}
      <div className="p-6 sm:p-8 space-y-8 flex-1 overflow-y-auto max-h-[75vh]">
        {activeMainTab === 'mechanics' && (
          <div className="space-y-6">
            {/* SEÇÃO 1: IDENTIFICAÇÃO E NÍVEL */}
            <section className="p-5 rounded-xl bg-black/40 border border-amber-500/30 space-y-4">
              <h3 className="text-sm font-black text-amber-300 uppercase tracking-wider font-mono flex items-center gap-2 border-b border-amber-500/30 pb-2">
                <span>1. Identificação Básica & Nível</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                {/* Nível do Talento */}
                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-bold uppercase font-mono block">
                    Nível / Rank (1 a 20)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={data.level}
                      onChange={(e) => updateField('level', parseInt(e.target.value, 10) || 1)}
                      className="w-20 px-3 py-2 rounded-lg bg-zinc-900/90 border border-zinc-700 text-amber-300 font-bold text-center text-sm outline-none focus:border-amber-400"
                    />
                    <div className="flex flex-wrap gap-1">
                      {COMMON_LEVELS.slice(0, 6).map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => updateField('level', lvl)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            data.level === lvl
                              ? 'bg-amber-500 text-black'
                              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tipo de Talento */}
                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-bold uppercase font-mono block">
                    Categoria do Talento
                  </label>
                  <select
                    value={data.featType}
                    onChange={(e) => updateField('featType', e.target.value as FeatCategoryType)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900/90 border border-zinc-700 text-zinc-200 font-semibold outline-none focus:border-amber-400"
                  >
                    <option value="general">Geral (General Feat)</option>
                    <option value="skill">Perícia (Skill Feat)</option>
                    <option value="class">Classe (Class Feat)</option>
                    <option value="archetype">Arquétipo / Dedicação</option>
                    <option value="ancestry">Ancestralidade (Ancestry Feat)</option>
                    <option value="extras">Extras & Homebrew</option>
                    <option value="hecos">Específico de Hecos</option>
                  </select>
                </div>

                {/* Raridade */}
                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-bold uppercase font-mono block">
                    Raridade
                  </label>
                  <select
                    value={data.rarity}
                    onChange={(e) => updateField('rarity', e.target.value as FeatRarity)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900/90 border border-zinc-700 text-zinc-200 font-semibold outline-none focus:border-amber-400"
                  >
                    <option value="Comum">Comum</option>
                    <option value="Incomum">Incomum</option>
                    <option value="Raro">Raro</option>
                    <option value="Único">Único</option>
                  </select>
                </div>

                {/* Classe ou Ancestralidade Vinculada */}
                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-bold uppercase font-mono block">
                    Classe / Linhagem Vinculada
                  </label>
                  <input
                    type="text"
                    value={data.associatedClassOrAncestry || ''}
                    onChange={(e) => updateField('associatedClassOrAncestry', e.target.value)}
                    placeholder="Ex: Guerreiro, Golen, Ladino..."
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900/90 border border-zinc-700 text-zinc-200 outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Subcategorias / Pastas (Suporta múltiplas) */}
              <div className="mt-4 pt-4 border-t border-zinc-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FolderPlus className="w-4 h-4 text-amber-400" />
                    <label className="text-xs text-zinc-300 font-bold uppercase font-mono">
                      Subcategorias / Pastas do Talento (Pode selecionar várias)
                    </label>
                  </div>
                  <span className="text-[11px] text-zinc-500 font-sans">
                    {data.subcategories && data.subcategories.length > 0
                      ? `${data.subcategories.length} subcategoria(s) selecionada(s)`
                      : 'Nenhuma subcategoria selecionada'}
                  </span>
                </div>

                {/* Subcategorias selecionadas ativas */}
                {data.subcategories && data.subcategories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-2.5 rounded-lg bg-zinc-950/60 border border-amber-500/20">
                    {data.subcategories.map((subcat) => (
                      <span
                        key={subcat}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-950/80 text-amber-200 border border-amber-600/50 shadow-sm"
                      >
                        <Folder className="w-3 h-3 text-amber-400" />
                        <span>{subcat}</span>
                        <button
                          type="button"
                          onClick={() => toggleSubcategory(subcat)}
                          className="hover:text-rose-300 transition-colors ml-0.5"
                          title="Remover subcategoria"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Subcategorias sugeridas da categoria atual */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-zinc-400 uppercase font-mono">
                    Subcategorias sugeridas ({data.featType}):
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {availableSubcategories.map((subcat) => {
                      const isSelected = data.subcategories?.includes(subcat);
                      return (
                        <button
                          key={subcat}
                          type="button"
                          onClick={() => toggleSubcategory(subcat)}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-amber-500 text-black font-bold shadow-sm'
                              : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          {isSelected ? (
                            <Check className="w-3 h-3 text-black stroke-[3]" />
                          ) : (
                            <Plus className="w-3 h-3 text-zinc-500" />
                          )}
                          <span>{subcat}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Criar nova subcategoria customizada */}
                <div className="flex items-center gap-2 pt-2">
                  <div className="relative flex-1 max-w-sm">
                    <input
                      type="text"
                      value={customSubcategoryInput}
                      onChange={(e) => setCustomSubcategoryInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCustomSubcategory();
                        }
                      }}
                      placeholder="Criar nova subcategoria manual..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-zinc-900/90 border border-zinc-700 text-zinc-200 placeholder-zinc-500 outline-none focus:border-amber-400"
                    />
                    <FolderPlus className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
                  </div>
                  <button
                    type="button"
                    onClick={addCustomSubcategory}
                    disabled={!customSubcategoryInput.trim()}
                    className="px-3 py-1.5 rounded-lg bg-amber-950/80 hover:bg-amber-900 border border-amber-600/50 text-amber-200 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar</span>
                  </button>
                </div>
              </div>
            </section>

            {/* SEÇÃO 2: ATIVAÇÃO, CUSTO DE AÇÕES E TRAÇOS */}
            <section className="p-5 rounded-xl bg-black/40 border border-cyan-500/30 space-y-4">
              <h3 className="text-sm font-black text-cyan-300 uppercase tracking-wider font-mono flex items-center gap-2 border-b border-cyan-500/30 pb-2">
                <span>2. Custo de Ações, Ativação & Traços PF2e</span>
              </h3>

              {/* Botões Visuais de Custo de Ações */}
              <div className="space-y-2">
                <label className="text-xs text-zinc-400 font-bold uppercase font-mono block">
                  Tipo de Ativação / Ações
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
                  {[
                    { val: '1', label: '1 Ação', glyph: '1-action' },
                    { val: '2', label: '2 Ações', glyph: '2-actions' },
                    { val: '3', label: '3 Ações', glyph: '3-actions' },
                    { val: 'free', label: 'Livre', glyph: 'free-action' },
                    { val: 'reaction', label: 'Reação', glyph: 'reaction' },
                    { val: '1-to-2', label: '1 ou 2', glyph: '1-to-2-actions' },
                    { val: '1-to-3', label: '1 a 3', glyph: '1-to-3-actions' },
                    { val: 'passive', label: 'Passivo', glyph: '' },
                  ].map((act) => (
                    <button
                      key={act.val}
                      type="button"
                      onClick={() => updateField('actionCost', act.val as FeatActionCost)}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold ${
                        data.actionCost === act.val
                          ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-950/50'
                          : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                      }`}
                    >
                      {act.glyph ? (
                        <PF2eActionGlyph type={act.glyph as ActionGlyphType} size="sm" />
                      ) : (
                        <span className="font-mono text-[11px] text-zinc-500">—</span>
                      )}
                      <span>{act.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tempo Detalhado (se for atividade ou tempo customizado) */}
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400 font-bold uppercase font-mono block">
                  Detalhes de Tempo / Ativação (Opcional)
                </label>
                <input
                  type="text"
                  value={data.actionCostDetails || ''}
                  onChange={(e) => updateField('actionCostDetails', e.target.value)}
                  placeholder="Ex: 10 minutos, 1 hora, Atividade de Exploração..."
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900/90 border border-zinc-700 text-zinc-200 text-xs outline-none focus:border-cyan-400"
                />
              </div>

              {/* Traços PF2e */}
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <label className="text-xs text-zinc-400 font-bold uppercase font-mono block">
                  Traços PF2e (Traits)
                </label>

                {/* Selected traits chips */}
                <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                  {data.traits && data.traits.length > 0 ? (
                    data.traits.map((trait) => (
                      <span
                        key={trait}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-[#1c2230] text-[#74b6c2] border border-[#74b6c2]/40"
                      >
                        <span>{trait}</span>
                        <button
                          type="button"
                          onClick={() => removeTrait(trait)}
                          className="hover:text-rose-400 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-zinc-500 italic">Nenhum traço selecionado.</span>
                  )}
                </div>

                {/* Common traits quick selection */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {COMMON_PF2E_TRAITS.map((trait) => {
                    const isSelected = data.traits?.includes(trait);
                    return (
                      <button
                        key={trait}
                        type="button"
                        onClick={() => toggleTrait(trait)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                          isSelected
                            ? 'bg-[#74b6c2] text-black'
                            : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {trait}
                      </button>
                    );
                  })}
                </div>

                {/* Custom trait adder */}
                <div className="flex items-center gap-2 pt-1 max-w-sm">
                  <input
                    type="text"
                    value={customTraitInput}
                    onChange={(e) => setCustomTraitInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomTrait();
                      }
                    }}
                    placeholder="Adicionar traço personalizado..."
                    className="flex-1 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 outline-none focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={addCustomTrait}
                    className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-200 text-xs font-semibold"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            </section>

            {/* SEÇÃO 3: REQUISITOS, GATILHOS E FREQUÊNCIA */}
            <section className="p-5 rounded-xl bg-black/40 border border-purple-500/30 space-y-4">
              <h3 className="text-sm font-black text-purple-300 uppercase tracking-wider font-mono flex items-center gap-2 border-b border-purple-500/30 pb-2">
                <span>3. Condições, Pré-requisitos & Gatilhos</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ReferenceField
                  label="Pré-requisitos"
                  value={data.prerequisites}
                  onChange={(val) => updateField('prerequisites', val)}
                  placeholder="Ex: Treinado em Atletismo, Força +2, Especialista em Escudos..."
                  rows={2}
                  multiline={false}
                  onNavigate={onNavigate}
                  helpText="Use @ para vincular outras perícias ou talentos"
                />

                <ReferenceField
                  label="Frequência (se houver)"
                  value={data.frequency || ''}
                  onChange={(val) => updateField('frequency', val)}
                  placeholder="Ex: 1 vez por dia, 1 vez por rodada, 1 vez a cada 10 minutos..."
                  rows={1}
                  multiline={false}
                  onNavigate={onNavigate}
                />

                <ReferenceField
                  label="Gatilho (Trigger - para Reações/Livres)"
                  value={data.trigger || ''}
                  onChange={(val) => updateField('trigger', val)}
                  placeholder="Ex: Um inimigo adjacente atinge você com um ataque corpo a corpo..."
                  rows={2}
                  multiline={true}
                  onNavigate={onNavigate}
                />

                <ReferenceField
                  label="Requisitos de Condição"
                  value={data.requirements || ''}
                  onChange={(val) => updateField('requirements', val)}
                  placeholder="Ex: Você está empunhando um escudo, você está em Postura do Dragão..."
                  rows={2}
                  multiline={true}
                  onNavigate={onNavigate}
                />
              </div>
            </section>

            {/* SEÇÃO 4: DESCRIÇÃO, BENEFÍCIO E GRAUS DE SUCESSO */}
            <section className="p-5 rounded-xl bg-black/40 border border-amber-500/30 space-y-4">
              <h3 className="text-sm font-black text-amber-300 uppercase tracking-wider font-mono flex items-center gap-2 border-b border-amber-500/30 pb-2">
                <span>4. Efeito Principal, Benefício & Graus de Sucesso</span>
              </h3>

              <ReferenceField
                label="Descrição & Benefício Principal *"
                value={data.description}
                onChange={(val) => updateField('description', val)}
                placeholder="Escreva as regras do talento, o que ele faz e quais modificadores aplica..."
                rows={6}
                multiline={true}
                onNavigate={onNavigate}
                helpText="Suporta Markdown completo e menções com @"
              />

              {/* Graus de Sucesso */}
              <div className="space-y-3 pt-2 border-t border-zinc-800">
                <label className="text-xs text-purple-300 font-bold uppercase font-mono block">
                  Graus de Sucesso (Opcional - para testes de perícia ou ataques especiais)
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <span className="text-emerald-400 font-bold block">Sucesso Crítico</span>
                    <textarea
                      rows={2}
                      value={data.criticalSuccess || ''}
                      onChange={(e) => updateField('criticalSuccess', e.target.value)}
                      placeholder="Efeito no sucesso crítico..."
                      className="w-full p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 focus:border-emerald-500 text-zinc-200 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-cyan-400 font-bold block">Sucesso</span>
                    <textarea
                      rows={2}
                      value={data.success || ''}
                      onChange={(e) => updateField('success', e.target.value)}
                      placeholder="Efeito no sucesso regular..."
                      className="w-full p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 focus:border-cyan-500 text-zinc-200 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-amber-400 font-bold block">Falha</span>
                    <textarea
                      rows={2}
                      value={data.failure || ''}
                      onChange={(e) => updateField('failure', e.target.value)}
                      placeholder="Efeito na falha..."
                      className="w-full p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 focus:border-amber-500 text-zinc-200 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-rose-400 font-bold block">Falha Crítica</span>
                    <textarea
                      rows={2}
                      value={data.criticalFailure || ''}
                      onChange={(e) => updateField('criticalFailure', e.target.value)}
                      placeholder="Efeito na falha crítica..."
                      className="w-full p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 focus:border-rose-500 text-zinc-200 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Especial */}
              <div className="pt-2">
                <ReferenceField
                  label="Regras Especiais (Special)"
                  value={data.special || ''}
                  onChange={(val) => updateField('special', val)}
                  placeholder="Ex: Você pode selecionar este talento mais de uma vez..."
                  rows={2}
                  multiline={true}
                  onNavigate={onNavigate}
                />
              </div>
            </section>
          </div>
        )}

        {activeMainTab === 'lore' && (
          <div className="space-y-6">
            {/* SEÇÃO 5: CONTEXTO E TRADIÇÃO EM HECOS */}
            <section className="p-5 rounded-xl bg-black/40 border border-purple-500/30 space-y-4">
              <h3 className="text-sm font-black text-purple-300 uppercase tracking-wider font-mono flex items-center gap-2 border-b border-purple-500/30 pb-2">
                <span>5. Tradição, Origem & Guia do Mestre em Hecos</span>
              </h3>

              <div className="space-y-4">
                <ReferenceField
                  label="Origem e Linhagem da Técnica em Hecos"
                  value={data.hecosLore || ''}
                  onChange={(val) => updateField('hecosLore', val)}
                  placeholder="Qual ordem marcial, escola de magia ou linhagem desenvolveu esta técnica no mundo de Hecos?"
                  rows={4}
                  multiline={true}
                  onNavigate={onNavigate}
                />

                <ReferenceField
                  label="Dicas de Interpretação e Visual"
                  value={data.roleplayTips || ''}
                  onChange={(val) => updateField('roleplayTips', val)}
                  placeholder="Como este talento é visualizado na cena? Sons, reflexos de sombra, postura corporal..."
                  rows={3}
                  multiline={true}
                  onNavigate={onNavigate}
                />

                <ReferenceField
                  label="Guia do Mestre & Dicas de Balanceamento"
                  value={data.gmNotes || ''}
                  onChange={(val) => updateField('gmNotes', val)}
                  placeholder="Ideias de recompensas de treino, missões para desbloquear este talento ou considerações de balanceamento..."
                  rows={3}
                  multiline={true}
                  onNavigate={onNavigate}
                />
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};
