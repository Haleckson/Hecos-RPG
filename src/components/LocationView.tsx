import React, { useState, useEffect, useMemo } from 'react';
import { HecosEntity, LocationAttributes, LocationPointOfInterest } from '../types';
import { HecosStorage } from '../services/storage';
import { RichContentRenderer } from './RichContentRenderer';
import { AdjustableImage } from './AdjustableImage';
import { Tooltip } from './Tooltip';
import {
  MapPin,
  Compass,
  Building2,
  Users,
  Shield,
  Crown,
  Scroll,
  Lock,
  Edit3,
  Trash2,
  Folder,
  Flame,
  AlertTriangle,
  Link2,
  ExternalLink,
  FileText,
  Activity,
  Layers,
  Sparkles,
  Map as MapIcon,
  Sun,
  Globe2,
  Landmark,
  TreePine,
  Flower2,
  Bug,
  Eye,
  Plus
} from 'lucide-react';

interface LocationViewProps {
  entity: HecosEntity;
  onEdit?: () => void;
  onDelete?: () => void;
  onNavigate: (id: string) => void;
  onTagClick: (tag: string) => void;
}

export type LocationTabType = 'overview' | 'poi' | 'inhabitants' | 'faunaFlora' | 'quests' | 'lore' | 'backlinks';

export const LocationView: React.FC<LocationViewProps> = ({
  entity,
  onEdit,
  onDelete,
  onNavigate,
  onTagClick,
}) => {
  const [currentEntity, setCurrentEntity] = useState<HecosEntity>(entity);
  const [activeTab, setActiveTab] = useState<LocationTabType>('overview');
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
  const location: Partial<LocationAttributes> = currentEntity.locationData || {};

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

  // Ruler resolution
  const rulerEntity = useMemo(() => {
    if (location.rulerEntityId) {
      return allEntities.find((e) => e.id === location.rulerEntityId);
    }
    return null;
  }, [allEntities, location.rulerEntityId]);

  // Inhabitant NPCs resolution
  const inhabitantNpcs = useMemo(() => {
    const ids = new Set(location.inhabitantNpcIds || []);
    // Also check NPCs whose location is this entity
    allEntities.forEach((e) => {
      if (e.category === 'npc' && e.npcData) {
        if (
          e.npcData.locationEntityId === currentEntity.id ||
          e.npcData.linkedLocationIds?.includes(currentEntity.id) ||
          e.npcData.locationIds?.includes(currentEntity.id) ||
          (e.npcData.location && e.npcData.location.toLowerCase() === currentEntity.title.toLowerCase())
        ) {
          ids.add(e.id);
        }
      }
    });
    return allEntities.filter((e) => ids.has(e.id));
  }, [allEntities, location.inhabitantNpcIds, currentEntity]);

  // Factions present resolution
  const presentFactions = useMemo(() => {
    const ids = new Set(location.factionEntityIds || []);
    // Also check organizations affiliated with this location
    allEntities.forEach((e) => {
      if (e.category === 'organization' && e.organizationData) {
        if (
          e.organizationData.headquartersLocationId === currentEntity.id ||
          e.organizationData.affiliatedLocationIds?.includes(currentEntity.id) ||
          (e.organizationData.headquarters && e.organizationData.headquarters.toLowerCase() === currentEntity.title.toLowerCase())
        ) {
          ids.add(e.id);
        }
      }
    });
    return allEntities.filter((e) => ids.has(e.id));
  }, [allEntities, location.factionEntityIds, currentEntity]);

  // Linked quests resolution
  const linkedQuests = useMemo(() => {
    const ids = new Set(location.questIds || []);
    allEntities.forEach((e) => {
      if (e.category === 'quest' && e.questData) {
        if (
          e.questData.locationEntityId === currentEntity.id ||
          e.questData.involvedLocationIds?.includes(currentEntity.id) ||
          e.questData.relatedLocationIds?.includes(currentEntity.id) ||
          (e.questData.location && e.questData.location.toLowerCase() === currentEntity.title.toLowerCase())
        ) {
          ids.add(e.id);
        }
      }
    });
    return allEntities.filter((e) => ids.has(e.id));
  }, [allEntities, location.questIds, currentEntity]);

  // Regional Fauna resolution
  const regionalFauna = useMemo(() => {
    const ids = new Set(location.faunaEntityIds || []);
    allEntities.forEach((e) => {
      if (e.category === 'fauna' && e.faunaData) {
        if (
          e.faunaData.locationEntityId === currentEntity.id ||
          e.faunaData.linkedLocationIds?.includes(currentEntity.id) ||
          e.faunaData.habitatLocationIds?.includes(currentEntity.id) ||
          (e.faunaData.habitat && e.faunaData.habitat.toLowerCase().includes(currentEntity.title.toLowerCase())) ||
          (location.fauna && location.fauna.some((f) => f.toLowerCase() === e.title.toLowerCase()))
        ) {
          ids.add(e.id);
        }
      }
    });
    return allEntities.filter((e) => ids.has(e.id));
  }, [allEntities, location.faunaEntityIds, location.fauna, currentEntity]);

  // Regional Flora resolution
  const regionalFlora = useMemo(() => {
    const ids = new Set(location.floraEntityIds || []);
    allEntities.forEach((e) => {
      if (e.category === 'flora' && e.floraData) {
        if (
          e.floraData.locationEntityId === currentEntity.id ||
          e.floraData.linkedLocationIds?.includes(currentEntity.id) ||
          e.floraData.habitatLocationIds?.includes(currentEntity.id) ||
          (e.floraData.habitat && e.floraData.habitat.toLowerCase().includes(currentEntity.title.toLowerCase())) ||
          (location.flora && location.flora.some((f) => f.toLowerCase() === e.title.toLowerCase()))
        ) {
          ids.add(e.id);
        }
      }
    });
    return allEntities.filter((e) => ids.has(e.id));
  }, [allEntities, location.floraEntityIds, location.flora, currentEntity]);

  const mapImage = location.mapImage || currentEntity.coverImage;
  const pointsOfInterest: LocationPointOfInterest[] = location.pointsOfInterest || [];
  const districts: string[] = location.districts || [];

  // Danger styling
  const getDangerBadge = (danger?: string) => {
    switch (danger?.toLowerCase()) {
      case 'seguro':
      case 'baixo':
        return { bg: 'bg-emerald-950/80', text: 'text-emerald-300', border: 'border-emerald-700/80', icon: Shield };
      case 'moderado':
        return { bg: 'bg-amber-950/80', text: 'text-amber-300', border: 'border-amber-700/80', icon: AlertTriangle };
      case 'perigoso':
        return { bg: 'bg-orange-950/80', text: 'text-orange-300', border: 'border-orange-700/80', icon: Flame };
      case 'extremo':
      case 'mortal':
        return { bg: 'bg-rose-950/80', text: 'text-rose-300', border: 'border-rose-700/80', icon: AlertTriangle };
      default:
        return { bg: 'bg-zinc-900', text: 'text-zinc-300', border: 'border-zinc-700', icon: MapPin };
    }
  };

  const dangerStyle = getDangerBadge(location.dangerLevel);
  const DangerIcon = dangerStyle.icon;

  const gmSecrets = location.gmSecrets || currentEntity.gmNotes || '';

  return (
    <div id="location-view-container" className="w-full text-zinc-200 space-y-5 pb-12">
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* CORPO PRINCIPAL DO ARTIGO: SIDEBAR VISUAL (ESQ) + ABAS ESTATÍSTICAS (DIR)*/}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* ─────────────────────────────────────────────────────────────────────── */}
        {/* COLUNA ESQUERDA: MAPA/PANORAMA, GOVERNANTE & ESTATÍSTICAS GEOGRÁFICAS    */}
        {/* ─────────────────────────────────────────────────────────────────────── */}
        <div className="w-full lg:w-72 xl:w-80 shrink-0 space-y-4">
          {/* 1. MAPA / ILUSTRAÇÃO PANORÂMICA (16:9 / 4:3) */}
          <div className="rounded-3xl bg-[#0d1520] border border-cyan-900/40 overflow-hidden shadow-2xl relative group">
            <div className="p-2.5 bg-[#121f2f] border-b border-zinc-800/80 flex items-center justify-between">
              <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <MapIcon className="w-3.5 h-3.5 text-cyan-400" />
                Mapa / Panorama
              </span>
              <Tooltip content="Imagem cartográfica ou panorama visual da localidade">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/50 text-cyan-300 border border-zinc-800 cursor-help">
                  Visual
                </span>
              </Tooltip>
            </div>

            <div className="relative aspect-[4/3] w-full bg-[#080d14] overflow-hidden">
              {mapImage && (mapImage.startsWith('http') || mapImage.startsWith('data:')) ? (
                <AdjustableImage
                  src={mapImage}
                  alt={currentEntity.title}
                  imageKey={`location-map-${currentEntity.id}`}
                  isGm={isActualGm}
                  containerClassName="relative w-full h-full overflow-hidden"
                  imgClassName="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-[#142336] to-[#080d14]">
                  <div className="w-16 h-16 rounded-2xl bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center text-cyan-400 mb-3 shadow-inner">
                    <Compass className="w-8 h-8" />
                  </div>
                  <span className="text-xs font-semibold text-zinc-300">Sem Mapa Cadastrado</span>
                  <span className="text-[11px] text-zinc-500 mt-1">Exibindo ícone geográfico padrão</span>
                  {isActualGm && onEdit && (
                    <button
                      type="button"
                      onClick={onEdit}
                      className="mt-3 px-3 py-1.5 text-[11px] font-semibold text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-800 rounded-xl transition-all cursor-pointer"
                    >
                      Adicionar Mapa
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 2. GOVERNANTE / LÍDER (SE EXISTIR) */}
          {(location.ruler || rulerEntity) && (
            <div className="rounded-3xl bg-[#0d1520] border border-cyan-900/40 p-4 space-y-3 shadow-xl">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                Governante / Autoridade
              </span>
              <div
                onClick={() => rulerEntity && onNavigate(rulerEntity.id)}
                className={`p-3 rounded-2xl bg-zinc-950/60 border border-amber-900/40 flex items-center gap-3 transition-all ${
                  rulerEntity ? 'hover:border-amber-500/60 cursor-pointer group' : ''
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-700/80 flex items-center justify-center text-amber-300 font-bold shrink-0">
                  <Crown className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-zinc-100 group-hover:text-amber-300 transition-colors truncate block">
                    {rulerEntity ? rulerEntity.title : location.ruler}
                  </span>
                  <span className="text-[11px] text-zinc-400 truncate block">
                    {rulerEntity?.subtitle || location.government || 'Líder Supremo'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 3. DADOS GEOGRÁFICOS & DEMOGRAFIA */}
          <div className="rounded-3xl bg-[#0d1520] border border-cyan-900/40 p-4 space-y-3 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Globe2 className="w-3.5 h-3.5 text-cyan-400" />
                Dados Demográficos
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {/* Tipo de Assentamento */}
              {location.settlementType && (
                <div className="flex justify-between items-center py-1 border-b border-zinc-800/50">
                  <Tooltip content="Tipo ou porte da localidade (Metrópole, Aldeia, Ruínas, Distrito, etc.)">
                    <span className="text-zinc-400 font-mono text-[11px] cursor-help">Tipo:</span>
                  </Tooltip>
                  <span className="font-semibold text-cyan-200">{location.settlementType}</span>
                </div>
              )}

              {/* Periculosidade */}
              {location.dangerLevel && (
                <div className="flex justify-between items-center py-1 border-b border-zinc-800/50">
                  <Tooltip content="Nível de ameaça para viajantes e aventureiros">
                    <span className="text-zinc-400 font-mono text-[11px] cursor-help">Periculosidade:</span>
                  </Tooltip>
                  <span className={`px-2 py-0.5 rounded font-semibold text-[11px] border ${dangerStyle.bg} ${dangerStyle.text} ${dangerStyle.border}`}>
                    {location.dangerLevel}
                  </span>
                </div>
              )}

              {/* População */}
              {location.population && (
                <div className="flex justify-between items-center py-1 border-b border-zinc-800/50">
                  <Tooltip content="Censo estimado e composição racial dos habitantes">
                    <span className="text-zinc-400 font-mono text-[11px] cursor-help">População:</span>
                  </Tooltip>
                  <span className="font-semibold text-zinc-200">{location.population}</span>
                </div>
              )}

              {/* Região / Plano */}
              {location.planeOrRegion && (
                <div className="flex justify-between items-center py-1 border-b border-zinc-800/50">
                  <Tooltip content="Região geográfica maior ou Plano de Existência">
                    <span className="text-zinc-400 font-mono text-[11px] cursor-help">Região / Plano:</span>
                  </Tooltip>
                  <span className="font-semibold text-zinc-300">{location.planeOrRegion}</span>
                </div>
              )}

              {/* Clima */}
              {location.climate && (
                <div className="flex justify-between items-center py-1 border-b border-zinc-800/50">
                  <Tooltip content="Condições climáticas e bioma preponderante">
                    <span className="text-zinc-400 font-mono text-[11px] cursor-help">Clima / Bioma:</span>
                  </Tooltip>
                  <span className="font-semibold text-amber-200">{location.climate}</span>
                </div>
              )}

              {/* Governo */}
              {location.government && (
                <div className="flex justify-between items-center py-1 border-b border-zinc-800/50">
                  <Tooltip content="Forma de governo e estrutura de poder político">
                    <span className="text-zinc-400 font-mono text-[11px] cursor-help">Regime Político:</span>
                  </Tooltip>
                  <span className="font-semibold text-purple-300">{location.government}</span>
                </div>
              )}
            </div>
          </div>

          {/* 4. PASTAS & SUBCATEGORIAS (EXCLUSIVO GM) */}
          {isActualGm && ((currentEntity.subcategories && currentEntity.subcategories.length > 0) || currentEntity.subcategory) && (
            <div className="rounded-3xl bg-[#0d1520] border border-cyan-900/40 p-4 space-y-3 shadow-xl">
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Folder className="w-3.5 h-3.5 text-cyan-400" />
                Pastas & Regiões (GM)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(currentEntity.subcategories || [currentEntity.subcategory!]).filter(Boolean).map((sub, idx) => (
                  <Tooltip key={`${sub}-${idx}`} content={`Pasta de classificação geográfica: ${sub}`}>
                    <span className="px-2.5 py-1 rounded-xl bg-cyan-950/40 text-cyan-300 border border-cyan-800/60 text-xs font-medium flex items-center gap-1.5 cursor-help">
                      <Folder className="w-3 h-3 text-cyan-400" />
                      <span>{sub}</span>
                    </span>
                  </Tooltip>
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
          <div className="rounded-3xl bg-[#0d1520] border border-cyan-900/40 p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Tooltip content="Categoria: Localidade do Mundo de Hecos">
                  <span className="px-3 py-1 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm border bg-cyan-950 text-cyan-300 border-cyan-800 cursor-help">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Local</span>
                  </span>
                </Tooltip>

                {location.settlementType && (
                  <Tooltip content={`Tipo de Assentamento: ${location.settlementType}`}>
                    <span className="px-3 py-1 rounded-xl bg-zinc-900 text-zinc-200 border border-zinc-700 text-xs font-semibold cursor-help">
                      {location.settlementType}
                    </span>
                  </Tooltip>
                )}

                {location.dangerLevel && (
                  <Tooltip content={`Nível de Ameaça: ${location.dangerLevel}`}>
                    <span className={`px-3 py-1 rounded-xl font-bold text-xs flex items-center gap-1.5 border ${dangerStyle.bg} ${dangerStyle.text} ${dangerStyle.border} cursor-help`}>
                      <DangerIcon className="w-3.5 h-3.5" />
                      <span>{location.dangerLevel}</span>
                    </span>
                  </Tooltip>
                )}
              </div>

              <div className="flex items-center gap-2">
                {onEdit && isActualGm && (
                  <Tooltip content="Editar artigo de Local">
                    <button
                      type="button"
                      onClick={onEdit}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-zinc-800 hover:bg-cyan-950 text-zinc-200 hover:text-cyan-200 border border-zinc-700/80 hover:border-cyan-700/80 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                      Editar
                    </button>
                  </Tooltip>
                )}
                {onDelete && isActualGm && (
                  <Tooltip content="Excluir este local">
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
                <p className="text-sm sm:text-base text-cyan-300 font-medium mt-1 italic">
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
                      className="px-2 py-0.5 rounded-lg bg-black/50 text-zinc-400 hover:text-cyan-300 border border-zinc-800 hover:border-cyan-800/60 text-[11px] font-mono transition-colors cursor-pointer"
                    >
                      #{t}
                    </button>
                  </Tooltip>
                ))}
              </div>
            )}

            {/* SEGREDO DO MESTRE (GM ONLY) */}
            {isActualGm && gmSecrets && (
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
                    <RichContentRenderer content={gmSecrets} onNavigate={onNavigate} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* BARRA DE NAVEGAÇÃO DE ABAS */}
          <div className="flex items-center gap-2 bg-[#0d1520] border border-cyan-900/40 p-1.5 rounded-2xl shadow-lg overflow-x-auto">
            <Tooltip content="Ver panorama geral, distritos e estrutura social">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                }`}
              >
                <Compass className="w-4 h-4 text-cyan-400" />
                <span>Geografia & Sociedade</span>
              </button>
            </Tooltip>

            <Tooltip content="Ver pontos de interesse, tavernas, templos e ruínas">
              <button
                type="button"
                onClick={() => setActiveTab('poi')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'poi'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                }`}
              >
                <Landmark className="w-4 h-4 text-cyan-400" />
                <span>Pontos de Interesse ({pointsOfInterest.length})</span>
              </button>
            </Tooltip>

            <Tooltip content="Ver NPCs residentes, figuras notáveis e facções locais">
              <button
                type="button"
                onClick={() => setActiveTab('inhabitants')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'inhabitants'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                }`}
              >
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Habitantes & Facções ({inhabitantNpcs.length + presentFactions.length})</span>
              </button>
            </Tooltip>

            <Tooltip content="Ver espécies de fauna e espécimes botânicos nativos desta região">
              <button
                type="button"
                onClick={() => setActiveTab('faunaFlora')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'faunaFlora'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                }`}
              >
                <TreePine className="w-4 h-4 text-emerald-400" />
                <span>Fauna & Flora Nativas ({regionalFauna.length + regionalFlora.length})</span>
              </button>
            </Tooltip>

            <Tooltip content="Ver missões e ganchos de aventura ambientados neste local">
              <button
                type="button"
                onClick={() => setActiveTab('quests')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'quests'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                }`}
              >
                <Scroll className="w-4 h-4 text-cyan-400" />
                <span>Missões ({linkedQuests.length})</span>
              </button>
            </Tooltip>

            <Tooltip content="Ver narrativa completa, história e lore em Markdown">
              <button
                type="button"
                onClick={() => setActiveTab('lore')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'lore'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                }`}
              >
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Lore & Artigo</span>
              </button>
            </Tooltip>

            <Tooltip content="Ver backlinks e menções cruzadas em outros artigos">
              <button
                type="button"
                onClick={() => setActiveTab('backlinks')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'backlinks'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                }`}
              >
                <Link2 className="w-4 h-4 text-cyan-400" />
                <span>Vínculos ({backlinks.length})</span>
              </button>
            </Tooltip>
          </div>

          {/* CONTEÚDO DAS ABAS */}
          <div className="rounded-3xl bg-[#0d1520] border border-cyan-900/40 p-6 shadow-xl min-h-[350px]">
            {/* ABA 1: GEOGRAFIA & SOCIEDADE */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Distritos e Bairros */}
                {districts.length > 0 && (
                  <div className="p-5 rounded-2xl bg-[#121f2f] border border-cyan-900/30 space-y-3">
                    <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm font-serif">
                      <Building2 className="w-4 h-4 text-cyan-400" />
                      <h3>Distritos, Setores & Bairros Principais</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {districts.map((d, dIdx) => (
                        <Tooltip key={`${d}-${dIdx}`} content={`Distrito / Setor de ${currentEntity.title}`}>
                          <span className="px-3 py-1.5 rounded-xl bg-zinc-900 text-cyan-200 border border-cyan-800/60 text-xs font-semibold flex items-center gap-1.5 cursor-help">
                            <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                            <span>{d}</span>
                          </span>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resumo do Local */}
                <div className="p-5 rounded-2xl bg-[#121f2f] border border-cyan-900/30 space-y-3">
                  <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm font-serif">
                    <Globe2 className="w-4 h-4 text-cyan-400" />
                    <h3>Panorama & Vida Social</h3>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                    {currentEntity.summary || 'Resumo geral sobre o modo de vida, comércio e atmosfera da localidade.'}
                  </p>
                </div>
              </div>
            )}

            {/* ABA 2: PONTOS DE INTERESSE */}
            {activeTab === 'poi' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div>
                    <h3 className="text-sm font-bold text-cyan-200 font-serif">Locais Notáveis, Edifícios & Mistérios</h3>
                    <p className="text-xs text-zinc-400">Tavernas, oficinas, santuários, catacumbas e portais de destaque.</p>
                  </div>
                </div>

                {pointsOfInterest.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-zinc-950/40 border border-zinc-800/80 text-zinc-500 text-xs italic">
                    Nenhum ponto de interesse cadastrado neste local ainda.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {pointsOfInterest.map((poi, idx) => (
                      <div
                        key={poi.id || `poi-${idx}`}
                        className="p-4 rounded-2xl bg-[#121f2f] border border-cyan-900/40 hover:border-cyan-700/60 transition-all flex flex-col justify-between gap-3 shadow-md"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-sm text-cyan-200 font-serif flex items-center gap-1.5">
                              <Landmark className="w-3.5 h-3.5 text-cyan-400" />
                              {poi.name}
                            </span>
                            {poi.district && (
                              <span className="px-2 py-0.5 rounded-lg bg-zinc-900 text-zinc-300 border border-zinc-700 text-[10px] font-mono">
                                {poi.district}
                              </span>
                            )}
                          </div>

                          {poi.type && (
                            <span className="text-[11px] text-cyan-400 font-medium mt-0.5 block">
                              {poi.type}
                            </span>
                          )}

                          {poi.description && (
                            <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
                              {poi.description}
                            </p>
                          )}
                        </div>

                        {poi.notes && isActualGm && (
                          <div className="pt-2 border-t border-zinc-800/60 text-xs text-amber-300 bg-amber-950/30 p-2 rounded-lg border border-amber-800/40 flex items-start gap-1.5">
                            <Lock className="w-3 h-3 mt-0.5 shrink-0" />
                            <span><strong>Nota do Mestre:</strong> {poi.notes}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ABA 3: HABITANTES & FACÇÕES */}
            {activeTab === 'inhabitants' && (
              <div className="space-y-6">
                {/* Figuras Notáveis */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-cyan-400" />
                    Habitantes Notáveis & NPCs Residentes ({inhabitantNpcs.length})
                  </h3>

                  {inhabitantNpcs.length === 0 ? (
                    <div className="p-6 text-center rounded-2xl bg-zinc-950/40 border border-zinc-800/80 text-zinc-500 text-xs italic">
                      Nenhum NPC vinculado como morador ou autoridade deste local ainda.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {inhabitantNpcs.map((npc) => (
                        <button
                          key={npc.id}
                          type="button"
                          onClick={() => onNavigate(npc.id)}
                          className="p-3 rounded-2xl bg-[#121f2f] border border-cyan-900/40 hover:border-cyan-700/60 transition-all text-left flex items-center justify-between gap-2 group cursor-pointer"
                        >
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-zinc-200 group-hover:text-cyan-300 transition-colors truncate block">
                              {npc.title}
                            </span>
                            <span className="text-[11px] text-zinc-400 truncate block">
                              {npc.npcData?.role || npc.subtitle || 'Residente'}
                            </span>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-cyan-400 opacity-60 group-hover:opacity-100 shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Facções Presentes */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                    Organizações & Facções com Sede ou Influência ({presentFactions.length})
                  </h3>

                  {presentFactions.length === 0 ? (
                    <div className="p-6 text-center rounded-2xl bg-zinc-950/40 border border-zinc-800/80 text-zinc-500 text-xs italic">
                      Nenhuma guilda ou facção registrada atuando aqui ainda.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {presentFactions.map((org) => (
                        <button
                          key={org.id}
                          type="button"
                          onClick={() => onNavigate(org.id)}
                          className="p-3 rounded-2xl bg-[#121f2f] border border-purple-900/40 hover:border-purple-700/60 transition-all text-left flex items-center justify-between gap-2 group cursor-pointer"
                        >
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-zinc-200 group-hover:text-purple-300 transition-colors truncate block">
                              {org.title}
                            </span>
                            <span className="text-[11px] text-purple-400 truncate block">
                              {org.organizationData?.type || org.subtitle || 'Facção'}
                            </span>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-purple-400 opacity-60 group-hover:opacity-100 shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ABA: FAUNA & FLORA NATIVAS */}
            {activeTab === 'faunaFlora' && (
              <div className="space-y-6">
                {/* Fauna Regional */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <Bug className="w-3.5 h-3.5 text-emerald-400" />
                      Espécies de Fauna Regional ({regionalFauna.length})
                    </h3>
                  </div>

                  {regionalFauna.length === 0 ? (
                    <div className="p-6 text-center rounded-2xl bg-zinc-950/40 border border-zinc-800/80 text-zinc-500 text-xs italic">
                      Nenhuma criatura ou besta registrada como nativa desta região ainda.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {regionalFauna.map((critter) => (
                        <Tooltip key={critter.id} content={`Abrir artigo completo de ${critter.title}`}>
                          <button
                            type="button"
                            onClick={() => onNavigate(critter.id)}
                            className="p-3 rounded-2xl bg-[#0f1f18] border border-emerald-900/40 hover:border-emerald-700/60 transition-all text-left flex items-center justify-between gap-2 group cursor-pointer"
                          >
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-zinc-200 group-hover:text-emerald-300 transition-colors truncate block">
                                {critter.title}
                              </span>
                              <span className="text-[11px] text-emerald-400/90 truncate block">
                                {critter.faunaData?.classification || critter.subtitle || 'Fauna'}
                              </span>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-emerald-400 opacity-60 group-hover:opacity-100 shrink-0" />
                          </button>
                        </Tooltip>
                      ))}
                    </div>
                  )}
                </div>

                {/* Flora Regional */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <Flower2 className="w-3.5 h-3.5 text-emerald-400" />
                      Espécies de Flora & Vegetação Botânica ({regionalFlora.length})
                    </h3>
                  </div>

                  {regionalFlora.length === 0 ? (
                    <div className="p-6 text-center rounded-2xl bg-zinc-950/40 border border-zinc-800/80 text-zinc-500 text-xs italic">
                      Nenhuma planta, erva ou fungo registrado como nativo desta região ainda.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {regionalFlora.map((plant) => (
                        <Tooltip key={plant.id} content={`Abrir artigo completo de ${plant.title}`}>
                          <button
                            type="button"
                            onClick={() => onNavigate(plant.id)}
                            className="p-3 rounded-2xl bg-[#0f1f18] border border-emerald-900/40 hover:border-emerald-700/60 transition-all text-left flex items-center justify-between gap-2 group cursor-pointer"
                          >
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-zinc-200 group-hover:text-emerald-300 transition-colors truncate block">
                                {plant.title}
                              </span>
                              <span className="text-[11px] text-emerald-400/90 truncate block">
                                {plant.floraData?.classification || plant.subtitle || 'Flora'}
                              </span>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-emerald-400 opacity-60 group-hover:opacity-100 shrink-0" />
                          </button>
                        </Tooltip>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ABA 4: MISSÕES */}
            {activeTab === 'quests' && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Scroll className="w-3.5 h-3.5 text-cyan-400" />
                  Missões Ambientadas Neste Local ({linkedQuests.length})
                </h3>

                {linkedQuests.length === 0 ? (
                  <div className="p-6 text-center rounded-2xl bg-zinc-950/40 border border-zinc-800/80 text-zinc-500 text-xs italic">
                    Nenhuma missão ou contrato ativo diretamente vinculado a este local no momento.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {linkedQuests.map((q) => (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => {
                          if (!HecosStorage.isUserGm() && !HecosStorage.canUserAccessItem(q)) return;
                          window.dispatchEvent(
                            new CustomEvent('hecos:open-entity-drawer', {
                              detail: { entityId: q.id, slug: q.slug },
                            })
                          );
                        }}
                        className="p-4 rounded-2xl bg-[#121f2f] border border-cyan-900/40 hover:border-cyan-700/60 transition-all text-left flex items-start justify-between gap-3 group cursor-pointer"
                      >
                        <div className="min-w-0">
                          <span className="text-sm font-bold text-cyan-200 font-serif group-hover:text-cyan-300 transition-colors block">
                            {q.title}
                          </span>
                          {q.subtitle && (
                            <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                              {q.subtitle}
                            </p>
                          )}
                        </div>
                        <ExternalLink className="w-4 h-4 text-cyan-400 opacity-60 group-hover:opacity-100 shrink-0 mt-0.5" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ABA 5: LORE & MARKDOWN */}
            {activeTab === 'lore' && (
              <div className="prose prose-invert max-w-none text-xs sm:text-sm text-zinc-300 leading-relaxed space-y-4">
                {currentEntity.content ? (
                  <RichContentRenderer content={currentEntity.content} onNavigate={onNavigate} />
                ) : (
                  <div className="p-8 text-center rounded-2xl bg-zinc-950/40 border border-zinc-800/80 text-zinc-500 text-xs italic">
                    Nenhum texto de história detalhada registrado ainda. Clique em "Editar" para expandir as crônicas deste local.
                  </div>
                )}
              </div>
            )}

            {/* ABA 6: BACKLINKS & RELAÇÕES */}
            {activeTab === 'backlinks' && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-cyan-400" />
                  Artigos que Mencionam este Local ({backlinks.length})
                </h3>

                {backlinks.length === 0 ? (
                  <div className="p-6 text-center rounded-2xl bg-zinc-950/40 border border-zinc-800/80 text-zinc-500 text-xs italic">
                    Nenhum outro artigo de Hecos cita este local diretamente ainda. Use @{currentEntity.slug || currentEntity.id} em outros artigos para gerar conexões automáticas!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {backlinks.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => onNavigate(b.id)}
                        className="p-3 rounded-2xl bg-[#121f2f] border border-cyan-900/40 hover:border-cyan-700/60 transition-all text-left flex items-center justify-between gap-2 group cursor-pointer"
                      >
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-zinc-200 group-hover:text-cyan-300 transition-colors truncate block">
                            {b.title}
                          </span>
                          <span className="text-[10px] uppercase font-mono text-zinc-500">
                            {b.category}
                          </span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-cyan-400 opacity-60 group-hover:opacity-100 shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
