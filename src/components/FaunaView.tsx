import React, { useState, useEffect, useMemo } from 'react';
import { HecosEntity, FaunaAttributes, FaunaHarvestPart } from '../types';
import { HecosStorage } from '../services/storage';
import { RichContentRenderer } from './RichContentRenderer';
import { AdjustableImage } from './AdjustableImage';
import { TraitBadge } from './TraitBadge';
import { EntityIcon } from './EntityIcon';
import { Tooltip } from './Tooltip';
import { sortTraitsHierarchically } from '../utils/traitUtils';
import {
  PawPrint,
  Heart,
  Shield,
  Sparkles,
  Lock,
  Edit3,
  Trash2,
  Share2,
  Folder,
  Compass,
  MapPin,
  Flame,
  AlertTriangle,
  Layers,
  Link2,
  ExternalLink,
  Scissors,
  Coins,
  Smile,
  Eye,
  FileText,
  Activity,
  Feather,
  Info
} from 'lucide-react';

interface FaunaViewProps {
  entity: HecosEntity;
  onEdit?: () => void;
  onDelete?: () => void;
  onNavigate: (id: string) => void;
  onTagClick: (tag: string) => void;
}

export type FaunaTabType = 'overview' | 'harvest' | 'lore' | 'backlinks';

export const FaunaView: React.FC<FaunaViewProps> = ({
  entity,
  onEdit,
  onDelete,
  onNavigate,
  onTagClick,
}) => {
  const [currentEntity, setCurrentEntity] = useState<HecosEntity>(entity);
  const [activeTab, setActiveTab] = useState<FaunaTabType>('overview');
  const [isGmSecretExpanded, setIsGmSecretExpanded] = useState<boolean>(false);

  useEffect(() => {
    setCurrentEntity(entity);
  }, [entity]);

  // Reactive subscription
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
  const fauna: Partial<FaunaAttributes> = currentEntity.faunaData || {};

  // Find linked entities and backlinks
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

  // Matched habitat locations
  const habitatLocations = useMemo(() => {
    if (!fauna.habitat) return [];
    return allEntities.filter(
      (e) => (e.category === 'location' || Boolean(e.locationData)) &&
             (e.title.toLowerCase().includes(fauna.habitat!.toLowerCase()) || fauna.habitat!.toLowerCase().includes(e.title.toLowerCase()))
    );
  }, [allEntities, fauna.habitat]);

  const portraitImage = fauna.portraitImage || currentEntity.coverImage;
  const tokenImage = fauna.tokenImage;
  const traits = currentEntity.traits || fauna.traits || [];
  const sortedTraits = sortTraitsHierarchically(traits);

  // Harvest parts
  const harvestParts: FaunaHarvestPart[] = fauna.harvestableParts || [];

  // Danger colors
  const getDangerBadge = (danger?: string) => {
    switch (danger?.toLowerCase()) {
      case 'inofensivo':
      case 'baixo':
        return { bg: 'bg-emerald-950/80', text: 'text-emerald-300', border: 'border-emerald-700/80', icon: Shield };
      case 'médio':
      case 'moderado':
        return { bg: 'bg-amber-950/80', text: 'text-amber-300', border: 'border-amber-700/80', icon: AlertTriangle };
      case 'perigoso':
        return { bg: 'bg-orange-950/80', text: 'text-orange-300', border: 'border-orange-700/80', icon: Flame };
      case 'mortal':
      case 'extremo':
        return { bg: 'bg-rose-950/80', text: 'text-rose-300', border: 'border-rose-700/80', icon: AlertTriangle };
      default:
        return { bg: 'bg-zinc-900', text: 'text-zinc-300', border: 'border-zinc-700', icon: PawPrint };
    }
  };

  const dangerStyle = getDangerBadge(fauna.dangerLevel);
  const DangerIcon = dangerStyle.icon;

  // GM secrets
  const gmNotes = fauna.gmNotes || currentEntity.gmNotes || '';

  return (
    <div id="fauna-view-container" className="w-full text-zinc-200 space-y-5 pb-12">
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* CORPO PRINCIPAL DO ARTIGO: SIDEBAR VISUAL (ESQ) + ABAS ESTATÍSTICAS (DIR)*/}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* ─────────────────────────────────────────────────────────────────────── */}
        {/* COLUNA ESQUERDA: RETRATO, TOKEN, PASTAS & CLASSIFICAÇÃO BIOLÓGICA        */}
        {/* ─────────────────────────────────────────────────────────────────────── */}
        <div className="w-full lg:w-72 xl:w-80 shrink-0 space-y-4">
          {/* 1. RETRATO VERTICAL (2:3) */}
          <div className="rounded-3xl bg-[#0f0a1c] border border-amber-900/40 overflow-hidden shadow-2xl relative group">
            <div className="p-2.5 bg-[#170e28] border-b border-zinc-800/80 flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <PawPrint className="w-3.5 h-3.5 text-amber-400" />
                Espécime / Fauna
              </span>
              <Tooltip content="Formato retrato 2:3 para visualização de criaturas da fauna">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/50 text-amber-300 border border-zinc-800 cursor-help">
                  2:3 Vertical
                </span>
              </Tooltip>
            </div>

            <div className="relative aspect-[2/3] w-full bg-[#0a0714] overflow-hidden">
              {portraitImage && (portraitImage.startsWith('http') || portraitImage.startsWith('data:')) ? (
                <AdjustableImage
                  src={portraitImage}
                  alt={currentEntity.title}
                  imageKey={`fauna-portrait-${currentEntity.id}`}
                  isGm={isActualGm}
                  containerClassName="relative w-full h-full overflow-hidden"
                  imgClassName="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-[#191024] to-[#0a0614]">
                  <div className="w-16 h-16 rounded-2xl bg-amber-950/60 border border-amber-800/60 flex items-center justify-center text-amber-400 mb-3 shadow-inner">
                    <PawPrint className="w-8 h-8" />
                  </div>
                  <span className="text-xs font-semibold text-zinc-300">Sem Ilustração de Espécime</span>
                  <span className="text-[11px] text-zinc-500 mt-1">Exibindo ícone biológico padrão</span>
                  {isActualGm && onEdit && (
                    <button
                      type="button"
                      onClick={onEdit}
                      className="mt-3 px-3 py-1.5 text-[11px] font-semibold text-amber-300 bg-amber-950/60 hover:bg-amber-900 border border-amber-800 rounded-xl transition-all cursor-pointer"
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
            <div className="rounded-3xl bg-[#0f0a1c] border border-amber-900/40 overflow-hidden shadow-2xl relative">
              <div className="p-2.5 bg-[#170e28] border-b border-zinc-800/80 flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <Compass className="w-3.5 h-3.5 text-amber-400" />
                  Token de VTT
                </span>
                <Tooltip content="Token circular para batalha e combate de mesa">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/50 text-amber-300 border border-zinc-800 cursor-help">
                    1:1 Token
                  </span>
                </Tooltip>
              </div>
              <div className="p-3 flex items-center justify-center bg-[#0a0714]">
                <div className="w-24 h-24 rounded-full border-2 border-amber-500/80 overflow-hidden shadow-lg p-0.5 bg-zinc-950">
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

          {/* 3. CLASSIFICAÇÃO BIOLÓGICA */}
          <div className="rounded-3xl bg-[#0f0a1c] border border-amber-900/40 p-4 space-y-3 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                Dados Biológicos
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {/* Dieta */}
              {fauna.diet && (
                <div className="flex justify-between items-center py-1 border-b border-zinc-800/50">
                  <Tooltip content="Tipo de alimentação e hábitos da espécie">
                    <span className="text-zinc-400 font-mono text-[11px] cursor-help">Dieta:</span>
                  </Tooltip>
                  <span className="font-semibold text-amber-200">{fauna.diet}</span>
                </div>
              )}

              {/* Temperamento */}
              {fauna.temperament && (
                <div className="flex justify-between items-center py-1 border-b border-zinc-800/50">
                  <Tooltip content="Atitude comportamental e agressividade típica">
                    <span className="text-zinc-400 font-mono text-[11px] cursor-help">Temperamento:</span>
                  </Tooltip>
                  <span className="font-semibold text-zinc-200">{fauna.temperament}</span>
                </div>
              )}

              {/* Periculosidade */}
              {fauna.dangerLevel && (
                <div className="flex justify-between items-center py-1 border-b border-zinc-800/50">
                  <Tooltip content="Nível de ameaça representado para aventureiros e viajantes">
                    <span className="text-zinc-400 font-mono text-[11px] cursor-help">Periculosidade:</span>
                  </Tooltip>
                  <span className={`px-2 py-0.5 rounded font-semibold text-[11px] border ${dangerStyle.bg} ${dangerStyle.text} ${dangerStyle.border}`}>
                    {fauna.dangerLevel}
                  </span>
                </div>
              )}

              {/* Tamanho */}
              {fauna.size && (
                <div className="flex justify-between items-center py-1 border-b border-zinc-800/50">
                  <Tooltip content="Categoria de porte físico do espécime">
                    <span className="text-zinc-400 font-mono text-[11px] cursor-help">Tamanho:</span>
                  </Tooltip>
                  <span className="font-semibold text-zinc-200">{fauna.size}</span>
                </div>
              )}

              {/* Raridade */}
              {fauna.rarity && (
                <div className="flex justify-between items-center py-1 border-b border-zinc-800/50">
                  <Tooltip content="Frequência de avistamento no cenário de Hecos">
                    <span className="text-zinc-400 font-mono text-[11px] cursor-help">Raridade:</span>
                  </Tooltip>
                  <span className="font-semibold text-purple-300">{fauna.rarity}</span>
                </div>
              )}

              {/* Habitat */}
              {fauna.habitat && (
                <div className="pt-1">
                  <Tooltip content="Bioma, região ou ecossistema onde a criatura é encontrada">
                    <span className="text-zinc-400 font-mono text-[11px] block mb-1 cursor-help">Habitat Natural:</span>
                  </Tooltip>
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-zinc-950/60 border border-zinc-800 text-amber-200">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="font-medium text-xs truncate">{fauna.habitat}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 4. PASTAS & SUBCATEGORIAS */}
          {((currentEntity.subcategories && currentEntity.subcategories.length > 0) || currentEntity.subcategory) && (
            <div className="rounded-3xl bg-[#0f0a1c] border border-amber-900/40 p-4 space-y-3 shadow-xl">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Folder className="w-3.5 h-3.5 text-amber-400" />
                Pastas & Organização
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(currentEntity.subcategories || [currentEntity.subcategory!]).filter(Boolean).map((sub, idx) => (
                  <Tooltip key={`${sub}-${idx}`} content={`Pasta de classificação: ${sub}`}>
                    <span className="px-2.5 py-1 rounded-xl bg-amber-950/40 text-amber-300 border border-amber-800/60 text-xs font-medium flex items-center gap-1.5 cursor-help">
                      <Folder className="w-3 h-3 text-amber-400" />
                      <span>{sub}</span>
                    </span>
                  </Tooltip>
                ))}
              </div>
            </div>
          )}

          {/* 5. TRAÇOS PF2e */}
          {sortedTraits.length > 0 && (
            <div className="rounded-3xl bg-[#0f0a1c] border border-amber-900/40 p-4 space-y-3 shadow-xl">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Traços de Criatura
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
          <div className="rounded-3xl bg-[#0f0a1c] border border-amber-900/40 p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Tooltip content="Categoria: Fauna do Mundo de Hecos">
                  <span className="px-3 py-1 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm border bg-amber-950 text-amber-300 border-amber-800 cursor-help">
                    <PawPrint className="w-3.5 h-3.5 text-amber-400" />
                    <span>Fauna</span>
                  </span>
                </Tooltip>

                {fauna.dangerLevel && (
                  <Tooltip content={`Periculosidade: ${fauna.dangerLevel}`}>
                    <span className={`px-3 py-1 rounded-xl font-bold text-xs flex items-center gap-1.5 border ${dangerStyle.bg} ${dangerStyle.text} ${dangerStyle.border} cursor-help`}>
                      <DangerIcon className="w-3.5 h-3.5" />
                      <span>{fauna.dangerLevel}</span>
                    </span>
                  </Tooltip>
                )}

                {fauna.diet && (
                  <Tooltip content={`Alimentação: ${fauna.diet}`}>
                    <span className="px-3 py-1 rounded-xl bg-zinc-900 text-zinc-300 border border-zinc-800 text-xs font-semibold cursor-help">
                      {fauna.diet}
                    </span>
                  </Tooltip>
                )}
              </div>

              <div className="flex items-center gap-2">
                {onEdit && isActualGm && (
                  <Tooltip content="Editar artigo de Fauna">
                    <button
                      type="button"
                      onClick={onEdit}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-zinc-800 hover:bg-amber-950 text-zinc-200 hover:text-amber-200 border border-zinc-700/80 hover:border-amber-700/80 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                      Editar
                    </button>
                  </Tooltip>
                )}
                {onDelete && isActualGm && (
                  <Tooltip content="Excluir este espécime">
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
                <p className="text-sm sm:text-base text-amber-300 font-medium mt-1 italic">
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
                      className="px-2 py-0.5 rounded-lg bg-black/50 text-zinc-400 hover:text-amber-300 border border-zinc-800 hover:border-amber-800/60 text-[11px] font-mono transition-colors cursor-pointer"
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
          <div className="flex items-center gap-2 bg-[#0f0a1c] border border-amber-900/40 p-1.5 rounded-2xl shadow-lg overflow-x-auto">
            <Tooltip content="Ver características biológicas, comportamento e domesticação">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-amber-950 text-amber-300 border border-amber-700 shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                }`}
              >
                <PawPrint className="w-4 h-4 text-amber-400" />
                <span>Biologia & Comportamento</span>
              </button>
            </Tooltip>

            <Tooltip content="Ver partes anatômicas, testes de colheita e valor de mercado">
              <button
                type="button"
                onClick={() => setActiveTab('harvest')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'harvest'
                    ? 'bg-amber-950 text-amber-300 border border-amber-700 shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                }`}
              >
                <Scissors className="w-4 h-4 text-amber-400" />
                <span>Partes Colheitáveis ({harvestParts.length})</span>
              </button>
            </Tooltip>

            <Tooltip content="Ver narrativa completa, lendas e detalhes em Markdown">
              <button
                type="button"
                onClick={() => setActiveTab('lore')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'lore'
                    ? 'bg-amber-950 text-amber-300 border border-amber-700 shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                }`}
              >
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Lore & Artigo</span>
              </button>
            </Tooltip>

            <Tooltip content="Ver artigos vinculados, habitats e menções cruzadas">
              <button
                type="button"
                onClick={() => setActiveTab('backlinks')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'backlinks'
                    ? 'bg-amber-950 text-amber-300 border border-amber-700 shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                }`}
              >
                <Link2 className="w-4 h-4 text-amber-400" />
                <span>Vínculos & Menções ({backlinks.length + habitatLocations.length})</span>
              </button>
            </Tooltip>
          </div>

          {/* CONTEÚDO DAS ABAS */}
          <div className="rounded-3xl bg-[#0f0a1c] border border-amber-900/40 p-6 shadow-xl min-h-[350px]">
            {/* ABA 1: BIOLOGIA & COMPORTAMENTO */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Comportamento e Hábitos */}
                <div className="p-5 rounded-2xl bg-[#140e24] border border-amber-900/30 space-y-3">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-sm font-serif">
                    <Activity className="w-4 h-4 text-amber-400" />
                    <h3>Comportamento & Instintos no Ecossistema</h3>
                  </div>
                  {fauna.behavior ? (
                    <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                      {fauna.behavior}
                    </p>
                  ) : (
                    <p className="text-xs text-zinc-500 italic">
                      Nenhum padrão comportamental detalhado registrado ainda para esta espécie.
                    </p>
                  )}
                </div>

                {/* Domesticação & Utilidade */}
                <div className="p-5 rounded-2xl bg-[#140e24] border border-amber-900/30 space-y-3">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-sm font-serif">
                    <Smile className="w-4 h-4 text-amber-400" />
                    <h3>Domesticação, Montaria & Utilidade Prática</h3>
                  </div>
                  {fauna.domestication ? (
                    <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                      {fauna.domestication}
                    </p>
                  ) : (
                    <p className="text-xs text-zinc-500 italic">
                      Não há notas sobre adestramento ou montaria para este espécime.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ABA 2: PARTES COLHEITÁVEIS */}
            {activeTab === 'harvest' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div>
                    <h3 className="text-sm font-bold text-amber-200 font-serif">Anatomia & Recursos de Caça</h3>
                    <p className="text-xs text-zinc-400">Materiais, peles, órgãos ou toxinas extraíveis deste espécime.</p>
                  </div>
                </div>

                {harvestParts.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-zinc-950/40 border border-zinc-800/80 text-zinc-500 text-xs italic">
                    Nenhuma parte colheitável cadastrada para esta criatura da fauna.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {harvestParts.map((part, pIdx) => (
                      <div
                        key={part.id || `part-${pIdx}`}
                        className="p-4 rounded-2xl bg-[#140e24] border border-amber-900/40 hover:border-amber-700/60 transition-all flex flex-col justify-between gap-3 shadow-md"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-sm text-amber-200 font-serif flex items-center gap-1.5">
                              <Scissors className="w-3.5 h-3.5 text-amber-400" />
                              {part.name}
                            </span>
                            {part.value && (
                              <Tooltip content="Valor comercial estimado no mercado de Hecos">
                                <span className="px-2 py-0.5 rounded-lg bg-amber-950/80 text-amber-300 border border-amber-800 text-[11px] font-mono font-bold flex items-center gap-1 cursor-help">
                                  <Coins className="w-3 h-3" />
                                  {part.value}
                                </span>
                              </Tooltip>
                            )}
                          </div>

                          {part.utility && (
                            <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
                              {part.utility}
                            </p>
                          )}
                        </div>

                        {part.dcOrDifficulty && (
                          <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-xs">
                            <Tooltip content="Teste de Sobrevivência, Medicina ou Perícia necessária para extrair intacto">
                              <span className="text-zinc-400 font-mono text-[11px] cursor-help">Dificuldade de Extração:</span>
                            </Tooltip>
                            <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 font-mono font-bold text-amber-300 text-[11px]">
                              {part.dcOrDifficulty}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ABA 3: LORE & MARKDOWN */}
            {activeTab === 'lore' && (
              <div className="prose prose-invert max-w-none text-xs sm:text-sm text-zinc-300 leading-relaxed space-y-4">
                {currentEntity.content ? (
                  <RichContentRenderer content={currentEntity.content} onNavigate={onNavigate} />
                ) : (
                  <div className="p-8 text-center rounded-2xl bg-zinc-950/40 border border-zinc-800/80 text-zinc-500 text-xs italic">
                    Nenhum texto de lore registrado ainda. Clique em "Editar" para escrever os detalhes desta criatura.
                  </div>
                )}
              </div>
            )}

            {/* ABA 4: BACKLINKS & RELAÇÕES */}
            {activeTab === 'backlinks' && (
              <div className="space-y-6">
                {/* Locais de Habitat */}
                {habitatLocations.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      Locais de Ocorrência Conhecidos
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {habitatLocations.map((loc) => (
                        <button
                          key={loc.id}
                          type="button"
                          onClick={() => onNavigate(loc.id)}
                          className="p-3 rounded-2xl bg-[#140e24] border border-amber-900/40 hover:border-amber-700/60 transition-all text-left flex items-center justify-between gap-2 group cursor-pointer"
                        >
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-zinc-200 group-hover:text-amber-300 transition-colors truncate block">
                              {loc.title}
                            </span>
                            {loc.subtitle && (
                              <span className="text-[11px] text-zinc-500 truncate block">
                                {loc.subtitle}
                              </span>
                            )}
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-amber-400 opacity-60 group-hover:opacity-100 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Backlinks */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-amber-400" />
                    Artigos que Mencionam esta Fauna ({backlinks.length})
                  </h3>

                  {backlinks.length === 0 ? (
                    <div className="p-6 text-center rounded-2xl bg-zinc-950/40 border border-zinc-800/80 text-zinc-500 text-xs italic">
                      Nenhum outro artigo de Hecos menciona este espécime diretamente ainda. Use @{currentEntity.slug || currentEntity.id} em outros artigos para criar links instantâneos!
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {backlinks.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => onNavigate(b.id)}
                          className="p-3 rounded-2xl bg-[#140e24] border border-amber-900/40 hover:border-amber-700/60 transition-all text-left flex items-center justify-between gap-2 group cursor-pointer"
                        >
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-zinc-200 group-hover:text-amber-300 transition-colors truncate block">
                              {b.title}
                            </span>
                            <span className="text-[10px] uppercase font-mono text-zinc-500">
                              {b.category}
                            </span>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-amber-400 opacity-60 group-hover:opacity-100 shrink-0" />
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
