import React, { useState, useEffect, useMemo } from 'react';
import { HecosEntity, FloraAttributes } from '../types';
import { HecosStorage } from '../services/storage';
import { RichContentRenderer } from './RichContentRenderer';
import { AdjustableImage } from './AdjustableImage';
import { TraitBadge } from './TraitBadge';
import { Tooltip } from './Tooltip';
import { sortTraitsHierarchically } from '../utils/traitUtils';
import {
  Sprout,
  Flower2,
  Leaf,
  FlaskConical,
  Skull,
  Clock,
  Sun,
  ShieldAlert,
  Sparkles,
  Lock,
  Edit3,
  Trash2,
  Folder,
  Compass,
  MapPin,
  Flame,
  Layers,
  Link2,
  ExternalLink,
  FileText,
  Activity,
  Heart,
  Droplets
} from 'lucide-react';

interface FloraViewProps {
  entity: HecosEntity;
  onEdit?: () => void;
  onDelete?: () => void;
  onNavigate: (id: string) => void;
  onTagClick: (tag: string) => void;
}

export type FloraTabType = 'overview' | 'properties' | 'lore' | 'backlinks';

export const FloraView: React.FC<FloraViewProps> = ({
  entity,
  onEdit,
  onDelete,
  onNavigate,
  onTagClick,
}) => {
  const [currentEntity, setCurrentEntity] = useState<HecosEntity>(entity);
  const [activeTab, setActiveTab] = useState<FloraTabType>('overview');
  const [isGmSecretExpanded, setIsGmSecretExpanded] = useState<boolean>(false);

  useEffect(() => {
    setCurrentEntity(entity);
  }, [entity]);

  // Reactive storage subscription
  useEffect(() => {
    const unsub = HecosStorage.subscribeEntities((entities) => {
      const updated = entities.find((e) => e.id === entity.id);
      if (updated) {
        setCurrentEntity(updated);
      }
    });
    return unsub;
  }, [entity.id]);

  const currentUser = HecosStorage.getCurrentUser();
  const isActualGm = currentUser?.role === 'gm' || HecosStorage.getGmMode() || HecosStorage.isUserGm();

  const allEntities = HecosStorage.getEntities();
  const flora: Partial<FloraAttributes> = currentEntity.floraData || {};

  // Backlinks
  const backlinks = useMemo(() => {
    return allEntities.filter((other) => {
      if (other.id === currentEntity.id) return false;
      const cleanSlug = currentEntity.slug || currentEntity.id;
      return (
        other.content?.includes(`@${cleanSlug}`) ||
        other.content?.includes(`@${currentEntity.id}`) ||
        other.content?.includes(`[[${currentEntity.title}]]`)
      );
    });
  }, [allEntities, currentEntity]);

  // Associated habitat locations
  const habitatLocations = useMemo(() => {
    if (!flora.habitat) return [];
    return allEntities.filter(
      (e) => (e.category === 'location' || Boolean(e.locationData)) &&
             (e.title.toLowerCase().includes(flora.habitat!.toLowerCase()) || flora.habitat!.toLowerCase().includes(e.title.toLowerCase()))
    );
  }, [allEntities, flora.habitat]);

  const portraitImage = flora.portraitImage || currentEntity.coverImage;
  const tokenImage = flora.tokenImage;
  const traits = currentEntity.traits || flora.traits || [];
  const sortedTraits = sortTraitsHierarchically(traits);

  const propertiesList = flora.properties || [];

  // Property badge color mapper
  const getPropertyStyle = (prop: string) => {
    switch (prop.toLowerCase()) {
      case 'medicinal':
        return { bg: 'bg-emerald-950/80', text: 'text-emerald-300', border: 'border-emerald-700/80', icon: Heart };
      case 'venenosa':
      case 'tóxica':
        return { bg: 'bg-rose-950/80', text: 'text-rose-300', border: 'border-rose-700/80', icon: Skull };
      case 'reagente alquímico':
        return { bg: 'bg-amber-950/80', text: 'text-amber-300', border: 'border-amber-700/80', icon: FlaskConical };
      case 'alucinógena':
        return { bg: 'bg-purple-950/80', text: 'text-purple-300', border: 'border-purple-700/80', icon: Sparkles };
      case 'mágica':
        return { bg: 'bg-cyan-950/80', text: 'text-cyan-300', border: 'border-cyan-700/80', icon: Droplets };
      case 'nutritiva':
        return { bg: 'bg-lime-950/80', text: 'text-lime-300', border: 'border-lime-700/80', icon: Leaf };
      default:
        return { bg: 'bg-zinc-900', text: 'text-zinc-300', border: 'border-zinc-700', icon: Flower2 };
    }
  };

  const gmNotes = flora.gmNotes || currentEntity.gmNotes || '';

  return (
    <div id="flora-view-container" className="w-full text-zinc-200 space-y-5 pb-12">
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* CORPO PRINCIPAL DO ARTIGO: SIDEBAR VISUAL (ESQ) + ABAS ESTATÍSTICAS (DIR)*/}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* ─────────────────────────────────────────────────────────────────────── */}
        {/* COLUNA ESQUERDA: RETRATO, TOKEN, PASTAS & CLASSIFICAÇÃO BOTÂNICA         */}
        {/* ─────────────────────────────────────────────────────────────────────── */}
        <div className="w-full lg:w-72 xl:w-80 shrink-0 space-y-4">
          {/* 1. RETRATO BOTÂNICO VERTICAL (2:3) */}
          <div className="rounded-3xl bg-[#0a1410] border border-emerald-900/40 overflow-hidden shadow-2xl relative group">
            <div className="p-2.5 bg-[#0f1f18] border-b border-zinc-800/80 flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                Herbário / Flora
              </span>
              <Tooltip content="Formato retrato 2:3 para ilustração botânica de plantas e fungos">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/50 text-emerald-300 border border-zinc-800 cursor-help">
                  2:3 Vertical
                </span>
              </Tooltip>
            </div>

            <div className="relative aspect-[2/3] w-full bg-[#060e0a] overflow-hidden">
              {portraitImage && (portraitImage.startsWith('http') || portraitImage.startsWith('data:')) ? (
                <AdjustableImage
                  src={portraitImage}
                  alt={currentEntity.title}
                  imageKey={`flora-portrait-${currentEntity.id}`}
                  isGm={isActualGm}
                  containerClassName="relative w-full h-full overflow-hidden"
                  imgClassName="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-[#0e2119] to-[#060e0a]">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400 mb-3 shadow-inner">
                    <Flower2 className="w-8 h-8" />
                  </div>
                  <span className="text-xs font-semibold text-zinc-300">Sem Ilustração Botânica</span>
                  <span className="text-[11px] text-zinc-500 mt-1">Exibindo ícone herbário padrão</span>
                  {isActualGm && onEdit && (
                    <button
                      type="button"
                      onClick={onEdit}
                      className="mt-3 px-3 py-1.5 text-[11px] font-semibold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800 rounded-xl transition-all cursor-pointer"
                    >
                      Adicionar Imagem
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 2. TOKEN (1:1) SE EXISTIR */}
          {tokenImage && (
            <div className="rounded-3xl bg-[#0a1410] border border-emerald-900/40 overflow-hidden shadow-2xl relative">
              <div className="p-2.5 bg-[#0f1f18] border-b border-zinc-800/80 flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <Compass className="w-3.5 h-3.5 text-emerald-400" />
                  Token de Amostra
                </span>
                <Tooltip content="Token circular para mapa e grid tático">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/50 text-emerald-300 border border-zinc-800 cursor-help">
                    1:1 Token
                  </span>
                </Tooltip>
              </div>
              <div className="p-3 flex items-center justify-center bg-[#060e0a]">
                <div className="w-24 h-24 rounded-full border-2 border-emerald-500/80 overflow-hidden shadow-lg p-0.5 bg-zinc-950">
                  <img
                    src={tokenImage}
                    alt={`${currentEntity.title} Token`}
                    className="w-full h-full object-cover rounded-full"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. DADOS BOTÂNICOS */}
          <div className="rounded-3xl bg-[#0a1410] border border-emerald-900/40 p-4 space-y-3 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Sprout className="w-3.5 h-3.5 text-emerald-400" />
                Dados Botânicos
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {/* Raridade */}
              {flora.rarity && (
                <div className="flex justify-between items-center py-1 border-b border-zinc-800/50">
                  <Tooltip content="Frequência com que esta espécie vegetal é encontrada na natureza">
                    <span className="text-zinc-400 font-mono text-[11px] cursor-help">Raridade:</span>
                  </Tooltip>
                  <span className="font-semibold text-purple-300">{flora.rarity}</span>
                </div>
              )}

              {/* Estação de Colheita */}
              {flora.harvestSeason && (
                <div className="flex justify-between items-center py-1 border-b border-zinc-800/50">
                  <Tooltip content="Época do ano, fase lunar ou clima propício para a colheita">
                    <span className="text-zinc-400 font-mono text-[11px] cursor-help">Colheita / Estação:</span>
                  </Tooltip>
                  <span className="font-semibold text-amber-200">{flora.harvestSeason}</span>
                </div>
              )}

              {/* Tempo de Preservação */}
              {flora.preservationTime && (
                <div className="flex justify-between items-center py-1 border-b border-zinc-800/50">
                  <Tooltip content="Tempo útil de validade das folhas, flores ou raízes após a extração">
                    <span className="text-zinc-400 font-mono text-[11px] cursor-help">Preservação:</span>
                  </Tooltip>
                  <span className="font-semibold text-zinc-200">{flora.preservationTime}</span>
                </div>
              )}

              {/* Habitat */}
              {flora.habitat && (
                <div className="pt-1">
                  <Tooltip content="Bioma, floresta ou tipo de solo onde a espécie germina">
                    <span className="text-zinc-400 font-mono text-[11px] block mb-1 cursor-help">Habitat Natural:</span>
                  </Tooltip>
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-zinc-950/60 border border-zinc-800 text-emerald-200">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="font-medium text-xs truncate">{flora.habitat}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 4. PASTAS & SUBCATEGORIAS */}
          {((currentEntity.subcategories && currentEntity.subcategories.length > 0) || currentEntity.subcategory) && (
            <div className="rounded-3xl bg-[#0a1410] border border-emerald-900/40 p-4 space-y-3 shadow-xl">
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Folder className="w-3.5 h-3.5 text-emerald-400" />
                Pastas & Classificação
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(currentEntity.subcategories || [currentEntity.subcategory!]).filter(Boolean).map((sub, idx) => (
                  <Tooltip key={`${sub}-${idx}`} content={`Pasta de classificação: ${sub}`}>
                    <span className="px-2.5 py-1 rounded-xl bg-emerald-950/40 text-emerald-300 border border-emerald-800/60 text-xs font-medium flex items-center gap-1.5 cursor-help">
                      <Folder className="w-3 h-3 text-emerald-400" />
                      <span>{sub}</span>
                    </span>
                  </Tooltip>
                ))}
              </div>
            </div>
          )}

          {/* 5. TRAÇOS PF2e */}
          {sortedTraits.length > 0 && (
            <div className="rounded-3xl bg-[#0a1410] border border-emerald-900/40 p-4 space-y-3 shadow-xl">
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Traços Botânicos
              </span>
              <div className="flex flex-wrap gap-1.5">
                {sortedTraits.map((t, idx) => (
                  <TraitBadge key={`${t}-${idx}`} trait={t} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ─────────────────────────────────────────────────────────────────────── */}
        {/* COLUNA DIREITA: CABEÇALHO PRINCIPAL & SISTEMA DE ABAS ORGANIZADAS       */}
        {/* ─────────────────────────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* BANNER / CABEÇALHO DO ARTIGO */}
          <div className="rounded-3xl bg-[#0a1410] border border-emerald-900/40 p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Tooltip content="Categoria: Flora do Mundo de Hecos">
                  <span className="px-3 py-1 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm border bg-emerald-950 text-emerald-300 border-emerald-800 cursor-help">
                    <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Flora</span>
                  </span>
                </Tooltip>

                {propertiesList.map((p, idx) => {
                  const style = getPropertyStyle(p);
                  const PIcon = style.icon;
                  return (
                    <Tooltip key={`${p}-${idx}`} content={`Propriedade Botânica: ${p}`}>
                      <span className={`px-3 py-1 rounded-xl font-bold text-xs flex items-center gap-1.5 border ${style.bg} ${style.text} ${style.border} cursor-help`}>
                        <PIcon className="w-3.5 h-3.5" />
                        <span>{p}</span>
                      </span>
                    </Tooltip>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                {onEdit && isActualGm && (
                  <Tooltip content="Editar artigo de Flora">
                    <button
                      type="button"
                      onClick={onEdit}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-zinc-800 hover:bg-emerald-950 text-zinc-200 hover:text-emerald-200 border border-zinc-700/80 hover:border-emerald-700/80 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                      Editar
                    </button>
                  </Tooltip>
                )}
                {onDelete && isActualGm && (
                  <Tooltip content="Excluir esta espécie de flora">
                    <button
                      type="button"
                      onClick={onDelete}
                      className="p-1.5 text-xs font-semibold rounded-xl bg-zinc-800 hover:bg-rose-950 text-zinc-400 hover:text-rose-300 border border-zinc-700/80 hover:border-rose-800 transition-all cursor-pointer shadow-sm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </Tooltip>
                )}
              </div>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-zinc-100 font-serif tracking-tight">
                {currentEntity.title}
              </h1>
              {currentEntity.subtitle && (
                <p className="text-sm sm:text-base text-emerald-300 font-medium mt-1 italic">
                  {currentEntity.subtitle}
                </p>
              )}
            </div>

            {/* Tags */}
            {currentEntity.tags && currentEntity.tags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-zinc-800/60">
                {currentEntity.tags.map((t, idx) => (
                  <Tooltip key={`${t}-${idx}`} content={`Filtrar por tag #${t}`}>
                    <button
                      type="button"
                      onClick={() => onTagClick(t)}
                      className="px-2 py-0.5 rounded-lg bg-black/50 text-zinc-400 hover:text-emerald-300 border border-zinc-800 hover:border-emerald-800/60 text-[11px] font-mono transition-colors cursor-pointer"
                    >
                      #{t}
                    </button>
                  </Tooltip>
                ))}
              </div>
            )}

            {/* SEGREDO DO MESTRE (GM ONLY) */}
            {isActualGm && gmNotes && (
              <div className="rounded-2xl bg-[#170c18] border-2 border-amber-500/70 shadow-[0_0_20px_rgba(245,158,11,0.15)] overflow-hidden transition-all">
                <button
                  type="button"
                  onClick={() => setIsGmSecretExpanded(!isGmSecretExpanded)}
                  className="w-full px-4 py-3 bg-amber-950/30 hover:bg-amber-950/50 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer border-b border-amber-500/20"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-amber-300 font-mono uppercase tracking-wider">
                        Segredos & Anotações do Mestre (Confidencial GM)
                      </span>
                    </div>
                  </div>
                </button>

                {isGmSecretExpanded && (
                  <div className="p-4 bg-black/40 text-xs text-amber-100/90 leading-relaxed font-sans space-y-2 border-t border-amber-500/20">
                    <RichContentRenderer content={gmNotes} onNavigate={onNavigate} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* BARRA DE NAVEGAÇÃO DE ABAS */}
          <div className="flex items-center gap-2 bg-[#0a1410] border border-emerald-900/40 p-1.5 rounded-2xl shadow-lg overflow-x-auto">
            <Tooltip content="Ver características gerais, preparo e métodos de uso">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                }`}
              >
                <Leaf className="w-4 h-4 text-emerald-400" />
                <span>Preparo & Efeitos</span>
              </button>
            </Tooltip>

            <Tooltip content="Ver propriedades alquímicas, toxicidade e perigo">
              <button
                type="button"
                onClick={() => setActiveTab('properties')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'properties'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                }`}
              >
                <FlaskConical className="w-4 h-4 text-emerald-400" />
                <span>Toxicidade & Alquimia</span>
              </button>
            </Tooltip>

            <Tooltip content="Ver narrativa completa e crônicas herbárias em Markdown">
              <button
                type="button"
                onClick={() => setActiveTab('lore')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'lore'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                }`}
              >
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Lore & Artigo</span>
              </button>
            </Tooltip>

            <Tooltip content="Ver artigos vinculados, habitats e menções cruzadas">
              <button
                type="button"
                onClick={() => setActiveTab('backlinks')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'backlinks'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                }`}
              >
                <Link2 className="w-4 h-4 text-emerald-400" />
                <span>Vínculos & Menções ({backlinks.length + habitatLocations.length})</span>
              </button>
            </Tooltip>
          </div>

          {/* CONTEÚDO DAS ABAS */}
          <div className="rounded-3xl bg-[#0a1410] border border-emerald-900/40 p-6 shadow-xl min-h-[350px]">
            {/* ABA 1: PREPARO & EFEITOS */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Preparo e Efeitos Práticos */}
                <div className="p-5 rounded-2xl bg-[#0f1f18] border border-emerald-900/30 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm font-serif">
                    <FlaskConical className="w-4 h-4 text-emerald-400" />
                    <h3>Métodos de Preparo, Infusões & Aplicações</h3>
                  </div>
                  {flora.preparationAndEffects ? (
                    <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                      {flora.preparationAndEffects}
                    </p>
                  ) : (
                    <p className="text-xs text-zinc-500 italic">
                      Nenhuma receita de infusão, cataplasma ou preparo alquímico registrado ainda.
                    </p>
                  )}
                </div>

                {/* Época de Colheita e Validade */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-[#0f1f18] border border-emerald-900/30 space-y-2">
                    <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs font-mono">
                      <Sun className="w-4 h-4 text-amber-400" />
                      <span>Condições Ideais de Colheita</span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      {flora.harvestSeason || 'Informação não detalhada.'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#0f1f18] border border-emerald-900/30 space-y-2">
                    <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-xs font-mono">
                      <Clock className="w-4 h-4 text-cyan-400" />
                      <span>Tempo de Conservação</span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      {flora.preservationTime || 'Sem prazo de validade estipulado.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ABA 2: TOXICIDADE & ALQUIMIA */}
            {activeTab === 'properties' && (
              <div className="space-y-6">
                {/* Perigo & Toxicidade */}
                <div className="p-5 rounded-2xl bg-[#0f1f18] border border-rose-900/30 space-y-3">
                  <div className="flex items-center gap-2 text-rose-300 font-bold text-sm font-serif">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <h3>Perigos, Toxicidade & Efeitos Colaterais</h3>
                  </div>
                  {flora.dangerOrToxicity ? (
                    <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                      {flora.dangerOrToxicity}
                    </p>
                  ) : (
                    <p className="text-xs text-zinc-500 italic">
                      Não há relatos de toxicidade, espinhos venenosos ou esporos nocivos conhecidos.
                    </p>
                  )}
                </div>

                {/* Lista de Propriedades Aplicadas */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider font-mono">
                    Propriedades Mágicas & Medicinais Ativas
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {propertiesList.map((prop, idx) => {
                      const style = getPropertyStyle(prop);
                      const PIcon = style.icon;
                      return (
                        <div
                          key={`${prop}-${idx}`}
                          className={`p-3.5 rounded-2xl border flex items-center gap-3 ${style.bg} ${style.border}`}
                        >
                          <div className="p-2 rounded-xl bg-black/40 text-emerald-400">
                            <PIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="font-bold text-xs text-zinc-100 block">{prop}</span>
                            <span className="text-[11px] text-zinc-400">Classificação botânica ativa</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ABA 3: LORE & MARKDOWN */}
            {activeTab === 'lore' && (
              <div className="prose prose-invert max-w-none text-xs sm:text-sm text-zinc-300 leading-relaxed space-y-4">
                {currentEntity.content ? (
                  <RichContentRenderer content={currentEntity.content} onNavigate={onNavigate} />
                ) : (
                  <div className="p-8 text-center rounded-2xl bg-zinc-950/40 border border-zinc-800/80 text-zinc-500 text-xs italic">
                    Nenhum texto de lore registrado ainda. Clique em "Editar" para escrever os detalhes desta planta.
                  </div>
                )}
              </div>
            )}

            {/* ABA 4: BACKLINKS & RELAÇÕES */}
            {activeTab === 'backlinks' && (
              <div className="space-y-6">
                {/* Locais de Ocorrência */}
                {habitatLocations.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      Locais de Ocorrência Conhecidos
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {habitatLocations.map((loc) => (
                        <button
                          key={loc.id}
                          type="button"
                          onClick={() => onNavigate(loc.id)}
                          className="p-3 rounded-2xl bg-[#0f1f18] border border-emerald-900/40 hover:border-emerald-700/60 transition-all text-left flex items-center justify-between gap-2 group cursor-pointer"
                        >
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-zinc-200 group-hover:text-emerald-300 transition-colors truncate block">
                              {loc.title}
                            </span>
                            {loc.subtitle && (
                              <span className="text-[11px] text-zinc-500 truncate block">
                                {loc.subtitle}
                              </span>
                            )}
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-emerald-400 opacity-60 group-hover:opacity-100 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Backlinks */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-emerald-400" />
                    Artigos que Mencionam esta Flora ({backlinks.length})
                  </h3>

                  {backlinks.length === 0 ? (
                    <div className="p-6 text-center rounded-2xl bg-zinc-950/40 border border-zinc-800/80 text-zinc-500 text-xs italic">
                      Nenhum outro artigo de Hecos menciona este vegetal diretamente ainda. Use @{currentEntity.slug || currentEntity.id} em outros artigos para criar links instantâneos!
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {backlinks.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => onNavigate(b.id)}
                          className="p-3 rounded-2xl bg-[#0f1f18] border border-emerald-900/40 hover:border-emerald-700/60 transition-all text-left flex items-center justify-between gap-2 group cursor-pointer"
                        >
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-zinc-200 group-hover:text-emerald-300 transition-colors truncate block">
                              {b.title}
                            </span>
                            <span className="text-[10px] uppercase font-mono text-zinc-500">
                              {b.category}
                            </span>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-emerald-400 opacity-60 group-hover:opacity-100 shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
