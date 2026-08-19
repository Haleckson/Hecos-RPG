import React, { useState, useMemo } from 'react';
import { AncestryAttributes, AncestryFeat, AncestryHeritage, HecosEntity, ItemVisibility } from '../types';
import { getEmptyAncestryData, serializeAncestryToHTML, parseAncestryFromContent } from '../utils/ancestrySerializer';
import { ReferenceField } from './ReferenceField';
import { PF2eActionGlyph, ActionGlyphType } from './PF2eActionGlyph';
import { ImageUploadInput } from './ImageUploadInput';
import { FeatPickerModal } from './FeatPickerModal';
import { VisibilityBadgeMenu } from './VisibilityBadgeMenu';
import { HecosStorage } from '../services/storage';
import { parseFeatFromContent } from '../utils/featSerializer';
import {
  Swords,
  Dna,
  Sparkles,
  Shield,
  Compass,
  Heart,
  Eye,
  Activity,
  Layers,
  Globe,
  Users,
  Feather,
  Plus,
  Trash2,
  Save,
  X,
  Zap,
  BookOpen,
  Scale,
  ShieldAlert,
  Crown,
  Lock,
  Tag as TagIcon,
  Image as ImageIcon,
  Search,
  Link2,
  ExternalLink,
  RefreshCw,
  Unlink
} from 'lucide-react';

interface AncestryEditorProps {
  entity: HecosEntity;
  onSave: (updated: HecosEntity) => void;
  onCancel: () => void;
  onNavigate: (id: string) => void;
}

export const AncestryEditor: React.FC<AncestryEditorProps> = ({
  entity,
  onSave,
  onCancel,
  onNavigate,
}) => {
  const [title, setTitle] = useState(entity.title === 'Novo Artigo de Hecos' ? '' : entity.title || '');
  const [subtitle, setSubtitle] = useState(entity.subtitle === 'Conceito ou linhagem...' ? '' : entity.subtitle || '');
  const [coverImage, setCoverImage] = useState(entity.coverImage || '');
  const [tagsString, setTagsString] = useState(entity.tags.join(', '));
  const [isSecret, setIsSecret] = useState(entity.isSecret || false);
  const [visibility, setVisibility] = useState<ItemVisibility>(entity.visibility || (entity.isSecret ? 'gm' : 'public'));
  const [allowedUserIds, setAllowedUserIds] = useState<string[]>(entity.allowedUserIds || []);

  // Parse or initialize blank structured Ancestry Attributes
  const [data, setData] = useState<AncestryAttributes>(() => {
    return parseAncestryFromContent(entity.title, entity.content || '', entity.ancestryData);
  });

  const [activeMainTab, setActiveMainTab] = useState<'mechanics' | 'lore' | 'gm'>('mechanics');
  const [activeFeatRank, setActiveFeatRank] = useState<1 | 5 | 9 | 13 | 17>(1);
  const [isFeatPickerOpen, setIsFeatPickerOpen] = useState(false);

  // Field change helpers
  const updateHeader = (field: keyof AncestryAttributes, val: string) => {
    setData((prev) => ({ ...prev, [field]: val }));
  };

  const updateNestedField = (
    section: 'culturalArsenal' | 'physiology' | 'identity' | 'culture' | 'spirituality' | 'society' | 'warfare' | 'world' | 'gmGuide',
    field: string,
    val: string
  ) => {
    setData((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [field]: val,
      },
    }));
  };

  // Heritage management
  const addHeritage = () => {
    const newH: AncestryHeritage = {
      id: `heritage-${Date.now()}`,
      name: '',
      description: '',
    };
    setData((prev) => ({
      ...prev,
      heritages: [...(prev.heritages || []), newH],
    }));
  };

  const updateHeritage = (index: number, field: keyof AncestryHeritage, val: string) => {
    setData((prev) => {
      const list = [...(prev.heritages || [])];
      list[index] = { ...list[index], [field]: val };
      return { ...prev, heritages: list };
    });
  };

  const removeHeritage = (index: number) => {
    setData((prev) => {
      const list = [...(prev.heritages || [])];
      list.splice(index, 1);
      return { ...prev, heritages: list };
    });
  };

  // Feat management by rank
  const getFeatsByRank = (rank: 1 | 5 | 9 | 13 | 17): AncestryFeat[] => {
    const key = `rank${rank}` as keyof typeof data.feats;
    return data.feats?.[key] || [];
  };

  const allCurrentFeats = useMemo(() => {
    return [
      ...(data.feats?.rank1 || []),
      ...(data.feats?.rank5 || []),
      ...(data.feats?.rank9 || []),
      ...(data.feats?.rank13 || []),
      ...(data.feats?.rank17 || []),
    ];
  }, [data.feats]);

  const alreadyAddedFeatEntityIds = useMemo(() => {
    return allCurrentFeats
      .map((f) => f.featEntityId)
      .filter((id): id is string => Boolean(id));
  }, [allCurrentFeats]);

  const alreadyAddedFeatNames = useMemo(() => {
    return allCurrentFeats
      .map((f) => (f?.name || '').trim().toLowerCase())
      .filter(Boolean);
  }, [allCurrentFeats]);

  const handleSelectFeatsFromModal = (
    selectedList: {
      entity: HecosEntity;
      parsedFeat: any;
      targetRank: 1 | 5 | 9 | 13 | 17;
    }[]
  ) => {
    setData((prev) => {
      const newFeats = {
        rank1: [...(prev.feats?.rank1 || [])],
        rank5: [...(prev.feats?.rank5 || [])],
        rank9: [...(prev.feats?.rank9 || [])],
        rank13: [...(prev.feats?.rank13 || [])],
        rank17: [...(prev.feats?.rank17 || [])],
      };

      selectedList.forEach(({ entity: featEntity, parsedFeat, targetRank }) => {
        const rankKey = `rank${targetRank}` as keyof typeof newFeats;
        // Check if already in this rank
        const targetTitle = (featEntity.title || '').trim().toLowerCase();
        const existsInRank = newFeats[rankKey].some(
          (f) =>
            (f.featEntityId && f.featEntityId === featEntity.id) ||
            ((f?.name || '').trim().toLowerCase() === targetTitle && targetTitle.length > 0)
        );

        if (!existsInRank) {
          const actionCost = (parsedFeat.actionCost || '1') as 'passive' | '1' | '2' | '3' | 'reaction' | 'free';
          const newFeat: AncestryFeat = {
            id: `feat-${targetRank}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            featEntityId: featEntity.id,
            slug: featEntity.slug,
            name: featEntity.title || 'Talento Sem Nome',
            rank: targetRank,
            actions: actionCost,
            traits:
              parsedFeat.traits && parsedFeat.traits.length > 0
                ? parsedFeat.traits
                : ['Ancestralidade', title.trim() || 'Raça'],
            prerequisites: parsedFeat.prerequisites || '',
            description: parsedFeat.description || '',
          };
          newFeats[rankKey].push(newFeat);
        }
      });

      return {
        ...prev,
        feats: newFeats,
      };
    });
  };

  const addFeatToRank = (rank: 1 | 5 | 9 | 13 | 17) => {
    const key = `rank${rank}` as keyof typeof data.feats;
    const newFeat: AncestryFeat = {
      id: `feat-${rank}-${Date.now()}`,
      name: '',
      rank,
      actions: '1',
      traits: ['Ancestralidade', title.trim() || 'Raça'],
      prerequisites: '',
      description: '',
    };
    setData((prev) => ({
      ...prev,
      feats: {
        ...prev.feats,
        [key]: [...(prev.feats?.[key] || []), newFeat],
      },
    }));
  };

  const updateFeat = (
    rank: 1 | 5 | 9 | 13 | 17,
    index: number,
    field: keyof AncestryFeat,
    val: any
  ) => {
    const key = `rank${rank}` as keyof typeof data.feats;
    setData((prev) => {
      const list = [...(prev.feats?.[key] || [])];
      list[index] = { ...list[index], [field]: val };
      return {
        ...prev,
        feats: {
          ...prev.feats,
          [key]: list,
        },
      };
    });
  };

  const removeFeat = (rank: 1 | 5 | 9 | 13 | 17, index: number) => {
    const key = `rank${rank}` as keyof typeof data.feats;
    setData((prev) => {
      const list = [...(prev.feats?.[key] || [])];
      list.splice(index, 1);
      return {
        ...prev,
        feats: {
          ...prev.feats,
          [key]: list,
        },
      };
    });
  };

  const unlinkFeat = (rank: 1 | 5 | 9 | 13 | 17, index: number) => {
    const key = `rank${rank}` as keyof typeof data.feats;
    setData((prev) => {
      const list = [...(prev.feats?.[key] || [])];
      list[index] = {
        ...list[index],
        featEntityId: undefined,
        slug: undefined,
      };
      return {
        ...prev,
        feats: {
          ...prev.feats,
          [key]: list,
        },
      };
    });
  };

  const refreshFeatFromEntity = (rank: 1 | 5 | 9 | 13 | 17, index: number, featEntityId: string) => {
    const entities = HecosStorage.getEntities();
    const source = entities.find((e) => e.id === featEntityId);
    if (!source) return;

    const parsed = parseFeatFromContent(source.title, source.content || '');
    setData((prev) => {
      const key = `rank${rank}` as keyof typeof data.feats;
      const list = [...(prev.feats?.[key] || [])];
      list[index] = {
        ...list[index],
        name: source.title,
        slug: source.slug,
        actions: (parsed.actionCost as any) || list[index].actions || '1',
        traits: parsed.traits && parsed.traits.length > 0 ? parsed.traits : list[index].traits,
        prerequisites: parsed.prerequisites || '',
        description: parsed.description || '',
      };
      return {
        ...prev,
        feats: {
          ...prev.feats,
          [key]: list,
        },
      };
    });
  };

  // Save full entity with structured data and generated clean HTML
  const handleSave = React.useCallback(() => {
    const finalTitle = title.trim() || 'Nova Ancestralidade';
    const generatedHTML = serializeAncestryToHTML(finalTitle, data);
    const tags = tagsString
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const updatedEntity: HecosEntity = {
      ...entity,
      title: finalTitle,
      subtitle: subtitle.trim() || undefined,
      category: 'ancestry',
      tags: tags.length > 0 ? tags : ['ancestry', 'pf2e'],
      coverImage: coverImage.trim() || undefined,
      isSecret: visibility === 'gm',
      visibility,
      allowedUserIds,
      summary: data.identity?.narrativeHook || subtitle || entity.summary || 'Ancestralidade de Hecos',
      ancestryData: data,
      content: generatedHTML,
      updatedAt: new Date().toISOString(),
    };

    onSave(updatedEntity);
  }, [title, subtitle, tagsString, coverImage, visibility, allowedUserIds, data, entity, onSave]);

  // Keyboard shortcut: Ctrl + S / Cmd + S to save
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  const totalFeatsCount = useMemo(() => {
    return (
      (data.feats?.rank1?.length || 0) +
      (data.feats?.rank5?.length || 0) +
      (data.feats?.rank9?.length || 0) +
      (data.feats?.rank13?.length || 0) +
      (data.feats?.rank17?.length || 0)
    );
  }, [data.feats]);

  return (
    <div className="bg-[#0c0b12] text-zinc-100 rounded-2xl border border-zinc-800/90 shadow-2xl overflow-hidden space-y-6 max-w-full relative">
      {/* Floating Save Button */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
        <button
          type="button"
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#74b6c2] to-[#b19ecc] hover:from-[#88cbd7] hover:to-[#c4b3dc] text-zinc-950 font-black text-sm shadow-[0_4px_25px_rgba(116,182,194,0.4)] hover:shadow-[0_4px_30px_rgba(116,182,194,0.6)] hover:scale-105 active:scale-95 transition-all cursor-pointer border border-white/20"
          title="Salvar Ancestralidade (Ctrl+S)"
        >
          <Save className="w-5 h-5 stroke-[2.5]" />
          <span>Salvar Artigo</span>
        </button>
      </div>

      {/* Top Header & Save Actions Bar */}
      <div className="px-5 sm:px-6 py-4 bg-[#14121d] border-b border-zinc-800/90 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#1b2a32] border border-[#2e4f5a] text-[#74b6c2]">
            <Dna className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-zinc-100 flex items-center gap-2">
              <span>Editor de Ancestralidade</span>
              <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#1b2a32] text-[#74b6c2] border border-[#2e4f5a]">
                PF2e Hecos
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Cadastre a linhagem e estatísticas com diagramação padronizada.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* 3-Level Granular Visibility Menu */}
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

          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 rounded-xl bg-[#171522] hover:bg-[#201d30] border border-zinc-700/80 text-xs font-semibold text-zinc-300 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Cancelar</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#74b6c2] to-[#b19ecc] hover:opacity-95 text-[#0c0b12] text-xs font-black transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Salvar</span>
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 md:p-8 space-y-6">
        {/* Basic Article Meta Details (Title, Subtitle, Cover Image, Tags) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-[#13111b] p-5 rounded-2xl border border-zinc-800/80">
          <div className="md:col-span-6 space-y-1.5">
            <label htmlFor="ancestry-title-input" className="text-xs font-bold text-[#74b6c2] flex items-center gap-1.5">
              <span>Nome da Ancestralidade *</span>
            </label>
            <input
              id="ancestry-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Sylphari, Vane, Qalashin, Humani..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e0d14] border border-[#2e4f5a] focus:border-[#74b6c2] focus:ring-1 focus:ring-[#74b6c2]/40 text-base font-bold text-zinc-100 placeholder-zinc-600 outline-none transition-colors"
            />
          </div>

          <div className="md:col-span-6 space-y-1.5">
            <label htmlFor="ancestry-subtitle-input" className="text-xs font-bold text-zinc-300">
              Subtítulo / Epíteto Cultural
            </label>
            <input
              id="ancestry-subtitle-input"
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Ex: Os Nômades do Eclipse, Filhos da Raiz..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e0d14] border border-zinc-800 focus:border-[#74b6c2] text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors"
            />
          </div>

          <div className="md:col-span-6">
            <ImageUploadInput
              id="ancestry-cover-input"
              value={coverImage}
              onChange={setCoverImage}
              label="URL da Imagem de Capa (opcional)"
              placeholder="https://... ou faça upload direto da arte"
              helpText="Arraste uma imagem ou clique em 'Upload ImgBB' para enviar do computador."
            />
          </div>

          <div className="md:col-span-4 space-y-1.5">
            <label htmlFor="ancestry-tags-input" className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <TagIcon className="w-3.5 h-3.5 text-zinc-400" />
              <span>Tags (separadas por vírgula)</span>
            </label>
            <input
              id="ancestry-tags-input"
              type="text"
              value={tagsString}
              onChange={(e) => setTagsString(e.target.value)}
              placeholder="ancestry, pf2e, humanoide, magia"
              className="w-full px-3.5 py-2 rounded-xl bg-[#0e0d14] border border-zinc-800 focus:border-[#74b6c2] text-xs text-zinc-100 placeholder-zinc-600 outline-none transition-colors"
            />
          </div>

          <div className="md:col-span-2 flex items-center pt-5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isSecret}
                onChange={(e) => setIsSecret(e.target.checked)}
                className="w-4 h-4 rounded bg-[#0e0d14] border-zinc-700 text-[#cb8394] focus:ring-[#cb8394]"
              />
              <span className="text-xs font-bold text-[#cb8394] flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" />
                <span>GM Only</span>
              </span>
            </label>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════════ */}
        {/* CABEÇALHO MECÂNICO (ESTRUTURA FORMAL SIMÉTRICA DA FICHA PF2E) */}
        {/* ═══════════════════════════════════════════════════════════════════════════ */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#13111c] border border-[#2e4f5a]/70 shadow-lg space-y-5">
          <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[#2e4f5a]/40 gap-2">
            <h3 className="text-base sm:text-lg font-black text-[#74b6c2] flex items-center gap-2">
              <span>{title || '[Nome da Ancestralidade]'}</span>
              <span className="text-xs font-normal text-zinc-400 font-mono">— Estatísticas da Ficha</span>
            </h3>
            <span className="text-xs font-semibold text-[#74b6c2] bg-[#1b2a32] px-3 py-1 rounded-full border border-[#2e4f5a]">
              PF2e Core Mechanics
            </span>
          </div>

          {/* Row 1: 4 Base Stats Grid (HP, TAMANHO, VELOCIDADE, SENTIDOS) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 items-stretch">
            {/* HP */}
            <div className="p-3 rounded-xl bg-[#0e0d14] border border-zinc-800/80 flex flex-col justify-start">
              <ReferenceField
                id="ancestry-hp"
                label="🩸 HP (Pontos de Vida)"
                value={data.hp}
                onChange={(val) => updateHeader('hp', val)}
                placeholder="Ex: 8 PV"
                multiline={false}
                onNavigate={onNavigate}
              />
            </div>

            {/* TAMANHO */}
            <div className="p-3 rounded-xl bg-[#0e0d14] border border-zinc-800/80 flex flex-col justify-start">
              <ReferenceField
                id="ancestry-size"
                label="📏 TAMANHO"
                value={data.size}
                onChange={(val) => updateHeader('size', val)}
                placeholder="Ex: Médio"
                multiline={false}
                onNavigate={onNavigate}
              />
            </div>

            {/* VELOCIDADE */}
            <div className="p-3 rounded-xl bg-[#0e0d14] border border-zinc-800/80 flex flex-col justify-start">
              <ReferenceField
                id="ancestry-speed"
                label="🏃 VELOCIDADE"
                value={data.speed}
                onChange={(val) => updateHeader('speed', val)}
                placeholder="Ex: 25 pés (≈ 7,5 m)"
                multiline={false}
                onNavigate={onNavigate}
              />
            </div>

            {/* SENTIDOS */}
            <div className="p-3 rounded-xl bg-[#0e0d14] border border-zinc-800/80 flex flex-col justify-start">
              <ReferenceField
                id="ancestry-senses"
                label="👁️ SENTIDOS"
                value={data.senses}
                onChange={(val) => updateHeader('senses', val)}
                placeholder="Ex: Visão na Penumbra"
                multiline={false}
                onNavigate={onNavigate}
              />
            </div>
          </div>

          {/* Row 2: ATRIBUTOS & TRAÇOS (2 Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-stretch">
            <div className="p-3.5 rounded-xl bg-[#0e0d14] border border-zinc-800/80 flex flex-col justify-start">
              <ReferenceField
                id="ancestry-attributes"
                label="🧠 ATRIBUTOS (Aumentos e Falhas)"
                value={data.attributes}
                onChange={(val) => updateHeader('attributes', val)}
                placeholder="Ex: +2 Des, +2 Int, +2 Livre, -2 For"
                multiline={false}
                onNavigate={onNavigate}
              />
            </div>

            <div className="p-3.5 rounded-xl bg-[#0e0d14] border border-zinc-800/80 flex flex-col justify-start">
              <ReferenceField
                id="ancestry-traits"
                label="🏷️ TRAÇOS DA ESPÉCIE"
                value={data.traits}
                onChange={(val) => updateHeader('traits', val)}
                placeholder="Ex: Humanoide, Elf, Planar"
                multiline={false}
                onNavigate={onNavigate}
              />
            </div>
          </div>

          {/* Row 3: INATO & IDIOMAS (2 Columns, Balanced Heights) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-stretch">
            <div className="p-3.5 rounded-xl bg-[#0e0d14] border border-zinc-800/80 flex flex-col justify-start">
              <ReferenceField
                id="ancestry-innate"
                label="🛠️ INATO (Habilidades Passivas Automáticas)"
                value={data.innate}
                onChange={(val) => updateHeader('innate', val)}
                placeholder="Ex: Adaptação sensorial, resistência natural ou ação passiva..."
                multiline={true}
                rows={3}
                helpText="Dica: Use [[Nome]] para linkar regras, itens ou magias."
                onNavigate={onNavigate}
              />
            </div>

            <div className="p-3.5 rounded-xl bg-[#0e0d14] border border-zinc-800/80 flex flex-col justify-start">
              <ReferenceField
                id="ancestry-languages"
                label="🗣️ IDIOMAS (Línguas Nativas & Adicionais)"
                value={data.languages}
                onChange={(val) => updateHeader('languages', val)}
                placeholder="Ex: Humani, Idioma Ancestral + adicionais"
                multiline={true}
                rows={3}
                onNavigate={onNavigate}
              />
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════════ */}
        {/* NAVEGAÇÃO ENTRE AS TRÊS ABAS: MECÂNICAS, LORE & GM */}
        {/* ═══════════════════════════════════════════════════════════════════════════ */}
        <div className="flex border-b border-zinc-800 bg-[#14121d] rounded-t-xl overflow-hidden p-1.5 gap-1.5 shadow-md">
          <button
            type="button"
            onClick={() => setActiveMainTab('mechanics')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-extrabold text-xs sm:text-sm tracking-wide rounded-lg transition-all cursor-pointer ${
              activeMainTab === 'mechanics'
                ? 'bg-[#1b2a32] text-[#74b6c2] border border-[#2e4f5a] shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#191724]'
            }`}
          >
            <Swords className="w-4 h-4 text-[#74b6c2]" />
            <span>Mecânicas</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#142229] text-[#74b6c2] font-mono">
              {totalFeatsCount + (data.heritages?.length || 0)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('lore')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-extrabold text-xs sm:text-sm tracking-wide rounded-lg transition-all cursor-pointer ${
              activeMainTab === 'lore'
                ? 'bg-[#241e33] text-[#b19ecc] border border-[#493b61] shadow-[0_0_12px_rgba(177,158,204,0.2)]'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#191724]'
            }`}
          >
            <BookOpen className="w-4 h-4 text-[#b19ecc]" />
            <span>Lore</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('gm')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-extrabold text-xs sm:text-sm tracking-wide rounded-lg transition-all cursor-pointer ${
              activeMainTab === 'gm'
                ? 'bg-[#2e1320] text-rose-300 border border-[#701a2d] shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                : 'text-rose-400/80 hover:text-rose-200 hover:bg-[#1a0f19]'
            }`}
          >
            <Crown className="w-4 h-4 text-rose-400" />
            <span>GM</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#3b1220] text-rose-300 font-mono font-bold">
              Segredos
            </span>
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════════ */}
        {/* CONTEÚDO DA ABA: MECÂNICAS */}
        {/* ═══════════════════════════════════════════════════════════════════════════ */}
        {activeMainTab === 'mechanics' && (
          <div className="space-y-6">
            {/* HERANÇAS DE LINHAGEM */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[#13111b] border border-[#2e4f5a]/60 space-y-4">
              <div className="flex flex-wrap items-center justify-between pb-3 border-b border-zinc-800/80 gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-[#1b2a32] text-[#74b6c2] border border-[#2e4f5a]">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-[#74b6c2]">
                      Heranças de Linhagem
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Subespécies ou linhagens raciais com benefícios mecânicos exclusivos.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={addHeritage}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1b2a32] hover:bg-[#233742] border border-[#2e4f5a] text-[#74b6c2] text-xs font-bold transition-all cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Herança</span>
                </button>
              </div>

              <div className="space-y-4">
                {data.heritages && data.heritages.length > 0 ? (
                  data.heritages.map((heritage, idx) => (
                    <div
                      key={heritage.id || idx}
                      className="p-4 rounded-xl bg-[#0e0d14] border border-zinc-800/80 space-y-3 relative group"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <input
                          type="text"
                          value={heritage.name}
                          onChange={(e) => updateHeritage(idx, 'name', e.target.value)}
                          placeholder="Nome da Herança (ex: Herança das Brumas)"
                          className="flex-1 px-3 py-1.5 rounded-lg bg-[#14121d] border border-[#493b61] focus:border-[#b19ecc] text-sm font-bold text-[#b19ecc] placeholder-zinc-600 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => removeHeritage(idx)}
                          className="p-1.5 rounded-lg bg-[#24131a] text-[#cb8394] hover:bg-[#351a24] border border-[#522934] text-xs transition-colors cursor-pointer"
                          title="Remover esta Herança"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <ReferenceField
                        label="Descrição e Benefício Mecânico"
                        value={heritage.description}
                        onChange={(val) => updateHeritage(idx, 'description', val)}
                        placeholder="Descreva o que torna esta subespécie única. Destaque o benefício mecânico (ex: resistência a dano, perícia ou ação especial)."
                        rows={3}
                        onNavigate={onNavigate}
                      />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-xs text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
                    Nenhuma herança adicionada. Clique em "Adicionar Herança" para cadastrar subespécies.
                  </div>
                )}
              </div>
            </div>

            {/* ARSENAL CULTURAL E EQUIPAMENTOS */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[#13111b] border border-[#493b61]/60 space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-800/80">
                <div className="p-1.5 rounded-lg bg-[#241e33] text-[#b19ecc] border border-[#493b61]">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#b19ecc]">
                    Arsenal Cultural & Equipamentos Tradicionais
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Armamentos tradicionais, itens de aventura e arquétipos recomendados.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ReferenceField
                  label="Proficiências e Armas Tradicionais"
                  value={data.culturalArsenal?.proficienciesAndWeapons || ''}
                  onChange={(val) => updateNestedField('culturalArsenal', 'proficienciesAndWeapons', val)}
                  placeholder="Quais armas são icônicas para esta raça? Dê acesso a armas exóticas como se fossem comuns."
                  rows={3}
                  onNavigate={onNavigate}
                />

                <ReferenceField
                  label="Itens Únicos e Arquétipos Recomendados"
                  value={data.culturalArsenal?.uniqueItemsAndArchetypes || ''}
                  onChange={(val) => updateNestedField('culturalArsenal', 'uniqueItemsAndArchetypes', val)}
                  placeholder="Cite itens exclusivos da cultura e sugira quais Classes se encaixam com esta raça."
                  rows={3}
                  onNavigate={onNavigate}
                />
              </div>
            </div>

            {/* TALENTOS DE ANCESTRALIDADE POR RANK */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[#13111b] border border-[#2e4f5a]/60 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-[#1b2a32] text-[#74b6c2] border border-[#2e4f5a]">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-[#74b6c2]">
                      Talentos de Ancestralidade
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Busque talentos do sistema ou crie talentos raciais específicos (Ranks 1, 5, 9, 13 e 17).
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFeatPickerOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#1f3744] to-[#2b243d] hover:from-[#294858] hover:to-[#382f50] border border-[#74b6c2]/70 text-[#74b6c2] text-xs font-extrabold transition-all cursor-pointer shadow-md"
                  >
                    <Search className="w-3.5 h-3.5 text-[#74b6c2]" />
                    <span>Buscar Talentos do Sistema</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => addFeatToRank(activeFeatRank)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#14121d] hover:bg-[#1b1928] border border-zinc-700 text-zinc-300 text-xs font-semibold transition-all cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Criar Manual no Rank {activeFeatRank}</span>
                  </button>
                </div>
              </div>

              {/* Sub-Tabs for Feat Ranks */}
              <div className="flex flex-wrap gap-2">
                {([1, 5, 9, 13, 17] as const).map((r) => {
                  const count = getFeatsByRank(r).length;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setActiveFeatRank(r)}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer border ${
                        activeFeatRank === r
                          ? 'bg-[#1b2a32] text-[#74b6c2] border-[#2e4f5a] shadow-sm'
                          : 'bg-[#0e0d14] text-zinc-400 hover:text-zinc-200 border-zinc-800'
                      }`}
                    >
                      <span>Rank {r}</span>
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/50 border border-zinc-700">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Feats list for active rank */}
              <div className="space-y-4">
                {getFeatsByRank(activeFeatRank).length > 0 ? (
                  getFeatsByRank(activeFeatRank).map((feat, idx) => (
                    <div
                      key={feat.id || idx}
                      className="p-4 rounded-xl bg-[#0e0d14] border border-zinc-800/80 space-y-3 relative group"
                    >
                      {/* Linked feat banner if from system */}
                      {feat.featEntityId && (
                        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-[#14232c]/80 border border-[#2e4f5a]/60 text-xs text-zinc-300">
                          <div className="flex items-center gap-2">
                            <Link2 className="w-3.5 h-3.5 text-[#74b6c2]" />
                            <span className="text-zinc-400">Talento do Sistema:</span>
                            <button
                              type="button"
                              onClick={() => feat.featEntityId && onNavigate(feat.featEntityId)}
                              className="font-bold text-[#74b6c2] hover:underline inline-flex items-center gap-1 cursor-pointer"
                              title="Abrir artigo do talento"
                            >
                              <span>{feat.name}</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => refreshFeatFromEntity(activeFeatRank, idx, feat.featEntityId!)}
                              className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#1b2a32] hover:bg-[#283e4a] border border-[#2e4f5a] text-[11px] text-[#74b6c2] transition-colors cursor-pointer"
                              title="Recarregar descrição e atributos atualizados da entidade original"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Sincronizar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => unlinkFeat(activeFeatRank, idx)}
                              className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 text-[11px] text-zinc-300 transition-colors cursor-pointer"
                              title="Desvincular para editar independentemente sem referência à entidade"
                            >
                              <Unlink className="w-3 h-3 text-zinc-400" />
                              <span>Desvincular</span>
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-zinc-800/80">
                        <div className="flex-1 min-w-[200px]">
                          <input
                            type="text"
                            value={feat.name}
                            onChange={(e) => updateFeat(activeFeatRank, idx, 'name', e.target.value)}
                            placeholder="Nome do Talento (ex: Sentidos Aguçados, Salto dos Eclipses...)"
                            className="w-full px-3 py-1.5 rounded-lg bg-[#14121d] border border-[#2e4f5a] focus:border-[#74b6c2] text-sm font-bold text-[#74b6c2] placeholder-zinc-600 outline-none"
                          />
                        </div>

                        {/* Action glyph selection */}
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-[11px] text-zinc-400 font-semibold">Ação:</span>
                          <select
                            value={feat.actions || 'passive'}
                            onChange={(e) => updateFeat(activeFeatRank, idx, 'actions', e.target.value)}
                            className="px-2.5 py-1 rounded-lg bg-[#14121d] border border-zinc-700 text-xs text-zinc-200 outline-none cursor-pointer font-mono"
                          >
                            <option value="passive">Passivo (Sem ação)</option>
                            <option value="1">1 Ação [◆]</option>
                            <option value="2">2 Ações [◆◆]</option>
                            <option value="3">3 Ações [◆◆◆]</option>
                            <option value="reaction">Reação [↺]</option>
                            <option value="free">Ação Livre [◇]</option>
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFeat(activeFeatRank, idx)}
                          className="p-1.5 rounded-lg bg-[#24131a] text-[#cb8394] hover:bg-[#351a24] border border-[#522934] text-xs transition-colors cursor-pointer"
                          title="Remover talento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <ReferenceField
                          label="Traços (separados por vírgula)"
                          value={feat.traits ? feat.traits.join(', ') : ''}
                          onChange={(val) =>
                            updateFeat(
                              activeFeatRank,
                              idx,
                              'traits',
                              val.split(',').map((t) => t.trim()).filter(Boolean)
                            )
                          }
                          placeholder="Ex: Ancestralidade, Mágico, Teletransporte"
                          multiline={false}
                          onNavigate={onNavigate}
                        />

                        <ReferenceField
                          label="Pré-requisitos (opcional)"
                          value={feat.prerequisites || ''}
                          onChange={(val) => updateFeat(activeFeatRank, idx, 'prerequisites', val)}
                          placeholder="Ex: Herança das Brumas, Treinado em Ocultismo"
                          multiline={false}
                          onNavigate={onNavigate}
                        />
                      </div>

                      <ReferenceField
                        label="Descrição e Efeito do Talento"
                        value={feat.description}
                        onChange={(val) => updateFeat(activeFeatRank, idx, 'description', val)}
                        placeholder="Descreva o efeito mecânico detalhado do talento. Use [[...]] para referenciar regras ou magias."
                        rows={3}
                        onNavigate={onNavigate}
                      />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-xs text-zinc-400 border border-dashed border-zinc-800/80 rounded-2xl bg-[#0e0d14]/50 space-y-3">
                    <p>Nenhum talento cadastrado no <strong>Rank {activeFeatRank}</strong>.</p>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => setIsFeatPickerOpen(true)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#1b2a32] hover:bg-[#233742] border border-[#2e4f5a] text-[#74b6c2] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>Buscar da Lista de Talentos</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => addFeatToRank(activeFeatRank)}
                        className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-all cursor-pointer"
                      >
                        + Criar Manualmente
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════════ */}
        {/* CONTEÚDO DA ABA: LORE & CENÁRIO */}
        {/* ═══════════════════════════════════════════════════════════════════════════ */}
        {activeMainTab === 'lore' && (
          <div className="space-y-6">
            {/* FISIOLOGIA E ANATOMIA */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[#13111b] border border-[#493b61]/60 space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-800/80">
                <div className="p-1.5 rounded-lg bg-[#241e33] text-[#b19ecc] border border-[#493b61]">
                  <Dna className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#b19ecc]">
                    Fisiologia & Anatomia Detalhada
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Biologia, sentidos, sinais não-verbais e adaptações metabólicas.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <ReferenceField
                  label="Descrição Física e Dimorfismo"
                  value={data.physiology?.physicalDescription || ''}
                  onChange={(val) => updateNestedField('physiology', 'physicalDescription', val)}
                  placeholder="Detalhe a aparência média, estatura, compleição, tons de pele, tipos de cabelo e diferenças visuais."
                  rows={3}
                  onNavigate={onNavigate}
                />

                <ReferenceField
                  label="Anatomia Funcional"
                  value={data.physiology?.functionalAnatomy || ''}
                  onChange={(val) => updateNestedField('physiology', 'functionalAnatomy', val)}
                  placeholder="Explique como o corpo funciona. Possuem órgãos extras, bioluminescência ou sentidos exóticos?"
                  rows={3}
                  onNavigate={onNavigate}
                />

                <ReferenceField
                  label="Linguagem Corporal"
                  value={data.physiology?.bodyLanguage || ''}
                  onChange={(val) => updateNestedField('physiology', 'bodyLanguage', val)}
                  placeholder="Descreva sinais não-verbais: como demonstram agressividade, medo ou alegria através de postura e gestos?"
                  rows={3}
                  onNavigate={onNavigate}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ReferenceField
                    label="Ciclo de Vida e Envelhecimento"
                    value={data.physiology?.lifeCycle || ''}
                    onChange={(val) => updateNestedField('physiology', 'lifeCycle', val)}
                    placeholder="Expectativa de vida e fases de maturação (infância, vida adulta e velhice)."
                    rows={3}
                    onNavigate={onNavigate}
                  />

                  <ReferenceField
                    label="Dieta e Metabolismo"
                    value={data.physiology?.dietAndMetabolism || ''}
                    onChange={(val) => updateNestedField('physiology', 'dietAndMetabolism', val)}
                    placeholder="O que comem? Possuem necessidades nutricionais específicas ou restrições biológicas?"
                    rows={3}
                    onNavigate={onNavigate}
                  />
                </div>
              </div>
            </div>

            {/* IDENTIDADE E MENTALIDADE */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[#13111b] border border-[#2e4f5a]/60 space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-800/80">
                <div className="p-1.5 rounded-lg bg-[#1b2a32] text-[#74b6c2] border border-[#2e4f5a]">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#74b6c2]">
                    Identidade, Psicologia & Mentalidade
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Valores morais, mitos de origem, figuras históricas e motivos para se aventurar.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <ReferenceField
                  label="O Gancho Narrativo"
                  value={data.identity?.narrativeHook || ''}
                  onChange={(val) => updateNestedField('identity', 'narrativeHook', val)}
                  placeholder="Uma frase de impacto que resume a alma da ancestralidade para quem lê pela primeira vez."
                  rows={2}
                  onNavigate={onNavigate}
                />

                <ReferenceField
                  label="Psicologia e Filosofia"
                  value={data.identity?.psychologyAndPhilosophy || ''}
                  onChange={(val) => updateNestedField('identity', 'psychologyAndPhilosophy', val)}
                  placeholder="Como eles pensam? Quais são seus traços de personalidade predominantes e lógica de raciocínio?"
                  rows={3}
                  onNavigate={onNavigate}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ReferenceField
                    label="Mito da Criação"
                    value={data.identity?.creationMyth || ''}
                    onChange={(val) => updateNestedField('identity', 'creationMyth', val)}
                    placeholder="Como eles acreditam que surgiram em Hecos? Ato divino, evolução ou experimento mágico?"
                    rows={3}
                    onNavigate={onNavigate}
                  />

                  <ReferenceField
                    label="Épicos e Figuras Históricas"
                    value={data.identity?.epicsAndFigures || ''}
                    onChange={(val) => updateNestedField('identity', 'epicsAndFigures', val)}
                    placeholder="Cite um ou dois heróis lendários que moldaram o que a espécie é hoje."
                    rows={3}
                    onNavigate={onNavigate}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ReferenceField
                    label="Propósito Existencial"
                    value={data.identity?.purpose || ''}
                    onChange={(val) => updateNestedField('identity', 'purpose', val)}
                    placeholder="O que move esta raça? Conhecimento, redenção, expansão ou harmonia?"
                    rows={3}
                    onNavigate={onNavigate}
                  />

                  <ReferenceField
                    label="O Aventureiro"
                    value={data.identity?.theAdventurer || ''}
                    onChange={(val) => updateNestedField('identity', 'theAdventurer', val)}
                    placeholder="Por que um membro desta espécie deixa seu lar para se aventurar pelo mundo?"
                    rows={3}
                    onNavigate={onNavigate}
                  />
                </div>
              </div>
            </div>

            {/* CULTURA, ARTE E COTIDIANO */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[#13111b] border border-[#493b61]/60 space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-800/80">
                <div className="p-1.5 rounded-lg bg-[#241e33] text-[#b19ecc] border border-[#493b61]">
                  <Feather className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#b19ecc]">
                    Cultura, Arte & Cotidiano
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Etiqueta, nomes, vestimenta, culinária e manifestações estéticas.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ReferenceField
                  label="Etiqueta e Costumes"
                  value={data.culture?.etiquetteAndCustoms || ''}
                  onChange={(val) => updateNestedField('culture', 'etiquetteAndCustoms', val)}
                  placeholder="Como se cumprimentam? O que é considerado rude ou extremamente honroso?"
                  rows={3}
                  onNavigate={onNavigate}
                />

                <ReferenceField
                  label="Nomes e Significados"
                  value={data.culture?.namesAndMeanings || ''}
                  onChange={(val) => updateNestedField('culture', 'namesAndMeanings', val)}
                  placeholder="Exemplos de nomes masculinos, femininos, neutros e títulos de família."
                  rows={3}
                  onNavigate={onNavigate}
                />

                <ReferenceField
                  label="Vestuário e Moda"
                  value={data.culture?.clothingAndFashion || ''}
                  onChange={(val) => updateNestedField('culture', 'clothingAndFashion', val)}
                  placeholder="Tecidos, cortes de roupa, adornos e como a vestimenta indica status social."
                  rows={3}
                  onNavigate={onNavigate}
                />

                <ReferenceField
                  label="Expressões Artísticas"
                  value={data.culture?.artisticExpressions || ''}
                  onChange={(val) => updateNestedField('culture', 'artisticExpressions', val)}
                  placeholder="Preferem música, escultura, tatuagens ou arquitetura? Como a arte reflete sua essência?"
                  rows={3}
                  onNavigate={onNavigate}
                />

                <ReferenceField
                  label="Gastronomia"
                  value={data.culture?.gastronomy || ''}
                  onChange={(val) => updateNestedField('culture', 'gastronomy', val)}
                  placeholder="Pratos típicos, banquetes sagrados e ingredientes tradicionais."
                  rows={3}
                  onNavigate={onNavigate}
                />

                <ReferenceField
                  label="Lazer e Esportes"
                  value={data.culture?.leisureAndSports || ''}
                  onChange={(val) => updateNestedField('culture', 'leisureAndSports', val)}
                  placeholder="Como se divertem? Existem jogos competitivos ou treinos recreativos?"
                  rows={3}
                  onNavigate={onNavigate}
                />
              </div>
            </div>

            {/* ESPIRITUALIDADE E RELIGIÃO */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[#13111b] border border-[#2e4f5a]/60 space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-800/80">
                <div className="p-1.5 rounded-lg bg-[#1b2a32] text-[#74b6c2] border border-[#2e4f5a]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#74b6c2]">
                    Espiritualidade, Fé & Misticismo
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Crenças religiosas, panteão nativo, ritos fúnebres e conexão com a magia.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ReferenceField
                  label="O Panteão Nativo"
                  value={data.spirituality?.nativePantheon || ''}
                  onChange={(val) => updateNestedField('spirituality', 'nativePantheon', val)}
                  placeholder="Quais deuses ou forças adoram? Religião central ou animismo?"
                  rows={3}
                  onNavigate={onNavigate}
                />

                <ReferenceField
                  label="Práticas Funerárias"
                  value={data.spirituality?.funeraryPractices || ''}
                  onChange={(val) => updateNestedField('spirituality', 'funeraryPractices', val)}
                  placeholder="Como lidam com a morte? Cremação, sepultamento ou devolução ao elemento?"
                  rows={3}
                  onNavigate={onNavigate}
                />

                <ReferenceField
                  label="Conexão Mágica"
                  value={data.spirituality?.magicalConnection || ''}
                  onChange={(val) => updateNestedField('spirituality', 'magicalConnection', val)}
                  placeholder="Como a magia se manifesta? É ancestral, mística ou científica?"
                  rows={3}
                  onNavigate={onNavigate}
                />
              </div>
            </div>

            {/* SOCIEDADE, GOVERNANÇA E LEIS */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[#13111b] border border-[#493b61]/60 space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-800/80">
                <div className="p-1.5 rounded-lg bg-[#241e33] text-[#b19ecc] border border-[#493b61]">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#b19ecc]">
                    Estrutura Social, Leis & Economia
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Organização comunitária, tabus sociais, moeda e ritos de passagem.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ReferenceField
                  label="Estrutura Social e Família"
                  value={data.society?.socialStructure || ''}
                  onChange={(val) => updateNestedField('society', 'socialStructure', val)}
                  placeholder="Como as famílias se organizam? Clãs, castas ou comunidades abertas?"
                  rows={3}
                  onNavigate={onNavigate}
                />

                <ReferenceField
                  label="Leis, Ética e Tabus"
                  value={data.society?.lawsAndTaboos || ''}
                  onChange={(val) => updateNestedField('society', 'lawsAndTaboos', val)}
                  placeholder="O que é estritamente proibido? Quais tabus levam a punição ou exílio?"
                  rows={3}
                  onNavigate={onNavigate}
                />

                <ReferenceField
                  label="Economia e Comércio"
                  value={data.society?.economyAndTrade || ''}
                  onChange={(val) => updateNestedField('society', 'economyAndTrade', val)}
                  placeholder="O que valorizam como moeda? Ouro, favores, segredos ou escambo?"
                  rows={3}
                  onNavigate={onNavigate}
                />

                <ReferenceField
                  label="Educação e Ritos de Passagem"
                  value={data.society?.educationAndRites || ''}
                  onChange={(val) => updateNestedField('society', 'educationAndRites', val)}
                  placeholder="Como uma criança se torna um adulto reconhecido na sociedade?"
                  rows={3}
                  onNavigate={onNavigate}
                />
              </div>
            </div>

            {/* GUERRA E TÁTICAS MILITARES */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[#13111b] border border-[#522934]/60 space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-800/80">
                <div className="p-1.5 rounded-lg bg-[#24131a] text-[#cb8394] border border-[#522934]">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#cb8394]">
                    Guerra & Táticas Militares
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Doutrinas marciais, forças de elite e arquitetura defensiva.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ReferenceField
                  label="Estilos de Luta Nativos"
                  value={data.warfare?.nativeFightingStyles || ''}
                  onChange={(val) => updateNestedField('warfare', 'nativeFightingStyles', val)}
                  placeholder="Emboscadas, combate frontal, magia ou guerra de atrito?"
                  rows={3}
                  onNavigate={onNavigate}
                />

                <ReferenceField
                  label="Organização Militar"
                  value={data.warfare?.militaryOrganization || ''}
                  onChange={(val) => updateNestedField('warfare', 'militaryOrganization', val)}
                  placeholder="Estrutura de comando, tropas de choque ou patrulhas nômades?"
                  rows={3}
                  onNavigate={onNavigate}
                />

                <ReferenceField
                  label="Engenharia de Defesa"
                  value={data.warfare?.defenseEngineering || ''}
                  onChange={(val) => updateNestedField('warfare', 'defenseEngineering', val)}
                  placeholder="Fortalezas, cidades camufladas, armadilhas ou barreiras místicas?"
                  rows={3}
                  onNavigate={onNavigate}
                />
              </div>
            </div>

            {/* A ANCESTRALIDADE NO MUNDO */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[#13111b] border border-[#2e4f5a]/60 space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-800/80">
                <div className="p-1.5 rounded-lg bg-[#1b2a32] text-[#74b6c2] border border-[#2e4f5a]">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#74b6c2]">
                    A Linhagem no Mundo de Hecos
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Geografia, relações diplomáticas e percepção das outras nações.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ReferenceField
                  label="Distribuição Geográfica"
                  value={data.world?.geographicalDistribution || ''}
                  onChange={(val) => updateNestedField('world', 'geographicalDistribution', val)}
                  placeholder="Onde vivem no mapa de Hecos? Regiões, cidades ou biomas preferidos."
                  rows={3}
                  onNavigate={onNavigate}
                />

                <ReferenceField
                  label="Relações Diplomáticas"
                  value={data.world?.diplomaticRelations || ''}
                  onChange={(val) => updateNestedField('world', 'diplomaticRelations', val)}
                  placeholder="Como se relacionam com as outras nações e povos de Hecos?"
                  rows={3}
                  onNavigate={onNavigate}
                />

                <ReferenceField
                  label="Perspectiva Externa"
                  value={data.world?.externalPerspective || ''}
                  onChange={(val) => updateNestedField('world', 'externalPerspective', val)}
                  placeholder="Como o mundo os enxerga? Preconceitos, admiração ou receio?"
                  rows={3}
                  onNavigate={onNavigate}
                />
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════════ */}
        {/* CONTEÚDO DA ABA: ABA GM (GRANDE EDITOR DE TEXTO PARA ANOTAÇÕES DO MESTRE) */}
        {/* ═══════════════════════════════════════════════════════════════════════════ */}
        {activeMainTab === 'gm' && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/70 via-purple-950/40 to-black border border-rose-600/50 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-900/60 border border-rose-500/80 flex items-center justify-center text-rose-300 shrink-0">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-rose-200 flex items-center gap-2">
                    <span>Aba do Mestre (Caderno Completo de Anotações)</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-900 text-rose-300 border border-rose-700">
                      SEMPRE GM ONLY
                    </span>
                  </h4>
                  <p className="text-xs text-rose-200/70">
                    Espaço livre e confidencial para anotações avulsas, ganchos de campanha, revelações e ideias de NPCs.
                  </p>
                </div>
              </div>

              {/* Snippet insertion shortcuts */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    const current = data.gmGuide?.gmNotes || '';
                    updateNestedField('gmGuide', 'gmNotes', `${current}\n\n### 🎭 NPC da Ancestralidade\n- **Nome:** \n- **Função:** \n- **Segredo:** `);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/60 text-rose-300 text-xs transition-colors"
                >
                  + NPC
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const current = data.gmGuide?.gmNotes || '';
                    updateNestedField('gmGuide', 'gmNotes', `${current}\n\n### 🧭 Gancho de Aventura\n- **Cenário:** \n- **Objetivo:** \n- **Reviravolta:** `);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/60 text-rose-300 text-xs transition-colors"
                >
                  + Gancho
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const current = data.gmGuide?.gmNotes || '';
                    updateNestedField('gmGuide', 'gmNotes', `${current}\n\n> 🔒 **Segredo Proibido:** `);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/60 text-rose-300 text-xs transition-colors"
                >
                  + Segredo
                </button>
              </div>
            </div>

            {/* Large Dedicated GM Notepad Text Area */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[#110a14] border border-rose-900/50 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-rose-300 font-mono flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5" />
                  <span>Anotações Livres do Mestre (Markdown Suportado)</span>
                </label>
                <span className="text-[11px] text-zinc-500 font-mono">
                  {(data.gmGuide?.gmNotes || '').length} caracteres
                </span>
              </div>

              <textarea
                value={data.gmGuide?.gmNotes || ''}
                onChange={(e) => updateNestedField('gmGuide', 'gmNotes', e.target.value)}
                placeholder="Escreva aqui todas as anotações do Mestre para esta ancestralidade... Suporta listas, títulos Markdown (###), referências @ e callouts de segredo."
                rows={18}
                className="w-full p-4 rounded-xl bg-[#08050c] border border-rose-900/60 focus:border-rose-500 text-zinc-100 text-sm font-mono leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* BARRA DE SALVAMENTO FLUTUANTE PERSISTENTE (STICKY BOTTOM SAVE BAR) */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      <div className="sticky bottom-4 z-40 mx-4 sm:mx-6 p-3.5 sm:p-4 rounded-2xl bg-[#0d0b14]/95 backdrop-blur-xl border border-cyan-500/40 shadow-[0_10px_35px_rgba(0,0,0,0.85)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-xs">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-bold text-zinc-200">
            {title ? title : 'Nova Ancestralidade'}
          </span>
          <span className="text-zinc-500 hidden sm:inline">•</span>
          <span className="text-zinc-400 font-mono text-[11px] hidden sm:inline">
            {totalFeatsCount} talentos • {data.heritages?.length || 0} heranças
          </span>
          <span className="text-cyan-400/80 font-mono text-[11px] hidden md:inline bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
            Ctrl + S para salvar
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl bg-[#171522] hover:bg-[#201d30] border border-zinc-700/80 text-xs font-semibold text-zinc-300 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Cancelar</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-purple-400 to-rose-400 hover:opacity-90 text-black text-xs font-black transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Artigo</span>
          </button>
        </div>
      </div>

      {/* MODAL DE BUSCA E MULTISELEÇÃO DE TALENTOS */}
      <FeatPickerModal
        isOpen={isFeatPickerOpen}
        onClose={() => setIsFeatPickerOpen(false)}
        onSelectFeats={handleSelectFeatsFromModal}
        alreadyAddedFeatEntityIds={alreadyAddedFeatEntityIds}
        alreadyAddedFeatNames={alreadyAddedFeatNames}
        defaultRank={activeFeatRank}
        ancestryName={title}
        onNavigate={onNavigate}
      />
    </div>
  );
};
