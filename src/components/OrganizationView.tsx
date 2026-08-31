import React, { useState, useEffect, useMemo } from 'react';
import { HecosEntity, OrganizationAttributes, OrganizationRank } from '../types';
import { HecosStorage } from '../services/storage';
import { RichContentRenderer } from './RichContentRenderer';
import { AdjustableImage } from './AdjustableImage';
import { Tooltip } from './Tooltip';
import {
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
  Award,
  Globe2,
  Handshake,
  Swords,
  MapPin,
  Coins,
  Compass,
  Quote
} from 'lucide-react';

interface OrganizationViewProps {
  entity: HecosEntity;
  onEdit?: () => void;
  onDelete?: () => void;
  onNavigate: (id: string) => void;
  onTagClick: (tag: string) => void;
}

export type OrgTabType = 'overview' | 'hierarchy' | 'members' | 'diplomacy' | 'quests' | 'lore' | 'backlinks';

export const OrganizationView: React.FC<OrganizationViewProps> = ({
  entity,
  onEdit,
  onDelete,
  onNavigate,
  onTagClick,
}) => {
  const [currentEntity, setCurrentEntity] = useState<HecosEntity>(entity);
  const [activeTab, setActiveTab] = useState<OrgTabType>('overview');
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
  const org: Partial<OrganizationAttributes> = currentEntity.organizationData || {};

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

  // Leader resolution
  const leaderEntity = useMemo(() => {
    if (org.leaderEntityId) {
      return allEntities.find((e) => e.id === org.leaderEntityId);
    }
    return null;
  }, [allEntities, org.leaderEntityId]);

  // HQ Location resolution
  const hqEntity = useMemo(() => {
    if (org.headquartersLocationId) {
      return allEntities.find((e) => e.id === org.headquartersLocationId);
    }
    return null;
  }, [allEntities, org.headquartersLocationId]);

  // Member NPCs resolution
  const memberNpcs = useMemo(() => {
    const ids = new Set(org.memberNpcIds || []);
    allEntities.forEach((e) => {
      if (e.category === 'npc' && e.npcData) {
        if (
          e.npcData.organizationEntityId === currentEntity.id ||
          e.npcData.factionEntityId === currentEntity.id ||
          e.npcData.linkedOrganizationIds?.includes(currentEntity.id) ||
          e.npcData.organizationIds?.includes(currentEntity.id) ||
          (e.npcData.organization && e.npcData.organization.toLowerCase() === currentEntity.title.toLowerCase()) ||
          (e.npcData.faction && e.npcData.faction.toLowerCase() === currentEntity.title.toLowerCase())
        ) {
          ids.add(e.id);
        }
      }
    });
    return allEntities.filter((e) => ids.has(e.id));
  }, [allEntities, org.memberNpcIds, currentEntity]);

  // Affiliated Locations resolution
  const affiliatedLocations = useMemo(() => {
    const ids = new Set(org.affiliatedLocationIds || []);
    if (org.headquartersLocationId) ids.add(org.headquartersLocationId);
    allEntities.forEach((e) => {
      if (e.category === 'location' && e.locationData) {
        if (
          e.locationData.factionEntityIds?.includes(currentEntity.id) ||
          (e.locationData.factionsPresent && e.locationData.factionsPresent.some((f) => f.toLowerCase() === currentEntity.title.toLowerCase()))
        ) {
          ids.add(e.id);
        }
      }
    });
    return allEntities.filter((e) => ids.has(e.id));
  }, [allEntities, org.affiliatedLocationIds, org.headquartersLocationId, currentEntity]);

  // Allied Orgs resolution
  const alliedOrgs = useMemo(() => {
    const ids = new Set([...(org.alliedOrgIds || []), ...(org.allyEntityIds || [])]);
    return allEntities.filter((e) => ids.has(e.id));
  }, [allEntities, org.alliedOrgIds, org.allyEntityIds]);

  // Rival Orgs resolution
  const rivalOrgs = useMemo(() => {
    const ids = new Set([...(org.rivalOrgIds || []), ...(org.rivalEntityIds || [])]);
    return allEntities.filter((e) => ids.has(e.id));
  }, [allEntities, org.rivalOrgIds, org.rivalEntityIds]);

  // Linked Quests resolution
  const linkedQuests = useMemo(() => {
    const ids = new Set(org.questIds || []);
    allEntities.forEach((e) => {
      if (e.category === 'quest' && e.questData) {
        if (
          e.questData.organizationEntityId === currentEntity.id ||
          e.questData.factionEntityId === currentEntity.id ||
          e.questData.involvedOrgIds?.includes(currentEntity.id) ||
          (e.questData.organization && e.questData.organization.toLowerCase() === currentEntity.title.toLowerCase()) ||
          (e.questData.faction && e.questData.faction.toLowerCase() === currentEntity.title.toLowerCase())
        ) {
          ids.add(e.id);
        }
      }
    });
    return allEntities.filter((e) => ids.has(e.id));
  }, [allEntities, org.questIds, currentEntity]);

  const symbolImage = org.symbolImage || currentEntity.coverImage;
  const ranks: OrganizationRank[] = org.ranks || [];

  // Influence styling
  const getInfluenceBadge = (inf?: string) => {
    switch (inf?.toLowerCase()) {
      case 'dominante':
        return { bg: 'bg-purple-950/80', text: 'text-purple-300', border: 'border-purple-700/80' };
      case 'alta':
        return { bg: 'bg-indigo-950/80', text: 'text-indigo-300', border: 'border-indigo-700/80' };
      case 'média':
      case 'moderada':
        return { bg: 'bg-cyan-950/80', text: 'text-cyan-300', border: 'border-cyan-700/80' };
      case 'baixa':
        return { bg: 'bg-zinc-900', text: 'text-zinc-400', border: 'border-zinc-700' };
      default:
        return { bg: 'bg-purple-950/40', text: 'text-purple-300', border: 'border-purple-800/50' };
    }
  };

  const infStyle = getInfluenceBadge(org.influence);
  const gmSecrets = org.gmSecrets || currentEntity.gmNotes || '';

  return (
    <div id="organization-view-container" className="w-full text-zinc-200 space-y-5 pb-12">
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* CORPO PRINCIPAL DO ARTIGO: SIDEBAR VISUAL (ESQ) + ABAS ESTATÍSTICAS (DIR)*/}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* ─────────────────────────────────────────────────────────────────────── */}
        {/* COLUNA ESQUERDA: BRASÃO, LÍDER, SEDE & DADOS POLÍTICOS                   */}
        {/* ─────────────────────────────────────────────────────────────────────── */}
        <div className="w-full lg:w-72 xl:w-80 shrink-0 space-y-4">
          {/* 1. BRASÃO / SÍMBOLO DA ORGANIZAÇÃO (1:1 / 4:3) */}
          <div className="rounded-3xl bg-[#140b22] border border-purple-900/40 overflow-hidden shadow-2xl relative group">
            <div className="p-2.5 bg-[#1b102e] border-b border-zinc-800/80 flex items-center justify-between">
              <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Building2 className="w-3.5 h-3.5 text-purple-400" />
                Brasão / Emblema
              </span>
              <Tooltip content="Símbolo heráldico ou estandarte da organização">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/50 text-purple-300 border border-zinc-800 cursor-help">
                  Heráldica
                </span>
              </Tooltip>
            </div>

            <div className="relative aspect-square w-full bg-[#0a0512] overflow-hidden flex items-center justify-center p-4">
              {symbolImage && (symbolImage.startsWith('http') || symbolImage.startsWith('data:')) ? (
                <AdjustableImage
                  src={symbolImage}
                  alt={currentEntity.title}
                  imageKey={`org-symbol-${currentEntity.id}`}
                  isGm={isActualGm}
                  containerClassName="relative w-full h-full overflow-hidden rounded-2xl"
                  imgClassName="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-[#1a0e2e] to-[#0a0512] rounded-2xl">
                  <div className="w-16 h-16 rounded-2xl bg-purple-950/60 border border-purple-800/60 flex items-center justify-center text-purple-400 mb-3 shadow-inner">
                    <Building2 className="w-8 h-8" />
                  </div>
                  <span className="text-xs font-semibold text-zinc-300">Sem Emblema Cadastrado</span>
                  <span className="text-[11px] text-zinc-500 mt-1">Exibindo insígnia padrão</span>
                  {isActualGm && onEdit && (
                    <button
                      type="button"
                      onClick={onEdit}
                      className="mt-3 px-3 py-1.5 text-[11px] font-semibold text-purple-300 bg-purple-950/60 hover:bg-purple-900 border border-purple-800 rounded-xl transition-all cursor-pointer"
                    >
                      Adicionar Emblema
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 2. LÍDER & SEDE PRINCIPAL */}
          <div className="rounded-3xl bg-[#140b22] border border-purple-900/40 p-4 space-y-3 shadow-xl">
            <span className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Crown className="w-3.5 h-3.5 text-purple-400" />
              Liderança & Sede
            </span>

            {/* Líder */}
            {(org.leader || leaderEntity) && (
              <div
                onClick={() => leaderEntity && onNavigate(leaderEntity.id)}
                className={`p-3 rounded-2xl bg-zinc-950/60 border border-purple-900/40 flex items-center gap-3 transition-all ${
                  leaderEntity ? 'hover:border-purple-500/60 cursor-pointer group' : ''
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-700/80 flex items-center justify-center text-purple-300 font-bold shrink-0">
                  <Crown className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-zinc-100 group-hover:text-purple-300 transition-colors truncate block">
                    {leaderEntity ? leaderEntity.title : org.leader}
                  </span>
                  <span className="text-[11px] text-zinc-400 truncate block">
                    {leaderEntity?.subtitle || 'Líder / Grão-Mestre'}
                  </span>
                </div>
              </div>
            )}

            {/* Sede */}
            {(org.headquarters || hqEntity) && (
              <div
                onClick={() => hqEntity && onNavigate(hqEntity.id)}
                className={`p-3 rounded-2xl bg-zinc-950/60 border border-cyan-900/40 flex items-center gap-3 transition-all ${
                  hqEntity ? 'hover:border-cyan-500/60 cursor-pointer group' : ''
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-700/80 flex items-center justify-center text-cyan-300 font-bold shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-zinc-100 group-hover:text-cyan-300 transition-colors truncate block">
                    {hqEntity ? hqEntity.title : org.headquarters}
                  </span>
                  <span className="text-[11px] text-cyan-400 truncate block">
                    Sede Principal / QG
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 3. DADOS POLÍTICOS & ESTRUTURA */}
          <div className="rounded-3xl bg-[#140b22] border border-purple-900/40 p-4 space-y-3 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
              <span className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Globe2 className="w-3.5 h-3.5 text-purple-400" />
                Estrutura Política
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {/* Tipo */}
              {org.type && (
                <div className="flex justify-between items-center py-1 border-b border-zinc-800/50">
                  <Tooltip content="Natureza da organização (Guilda, Ordem, Culto, etc.)">
                    <span className="text-zinc-400 font-mono text-[11px] cursor-help">Tipo:</span>
                  </Tooltip>
                  <span className="font-semibold text-purple-200">{org.type}</span>
                </div>
              )}

              {/* Âmbito */}
              {org.scope && (
                <div className="flex justify-between items-center py-1 border-b border-zinc-800/50">
                  <Tooltip content="Alcance territorial de atuação">
                    <span className="text-zinc-400 font-mono text-[11px] cursor-help">Alcance / Âmbito:</span>
                  </Tooltip>
                  <span className="font-semibold text-zinc-200">{org.scope}</span>
                </div>
              )}

              {/* Influência */}
              {org.influence && (
                <div className="flex justify-between items-center py-1 border-b border-zinc-800/50">
                  <Tooltip content="Grau de poder político e influência em Hecos">
                    <span className="text-zinc-400 font-mono text-[11px] cursor-help">Influência:</span>
                  </Tooltip>
                  <span className={`px-2 py-0.5 rounded font-semibold text-[11px] border ${infStyle.bg} ${infStyle.text} ${infStyle.border}`}>
                    {org.influence}
                  </span>
                </div>
              )}

              {/* Tendência / Filosofia */}
              {org.alignment && (
                <div className="flex justify-between items-center py-1 border-b border-zinc-800/50">
                  <Tooltip content="Tendência moral ou diretriz filosófica institucional">
                    <span className="text-zinc-400 font-mono text-[11px] cursor-help">Tendência:</span>
                  </Tooltip>
                  <span className="font-semibold text-amber-300">{org.alignment}</span>
                </div>
              )}
            </div>
          </div>

          {/* 4. PASTAS & SUBCATEGORIAS (EXCLUSIVO GM) */}
          {isActualGm && ((currentEntity.subcategories && currentEntity.subcategories.length > 0) || currentEntity.subcategory) && (
            <div className="rounded-3xl bg-[#140b22] border border-purple-900/40 p-4 space-y-3 shadow-xl">
              <span className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Folder className="w-3.5 h-3.5 text-purple-400" />
                Pastas & Facções (GM)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(currentEntity.subcategories || [currentEntity.subcategory!]).filter(Boolean).map((sub, idx) => (
                  <Tooltip key={`${sub}-${idx}`} content={`Pasta de classificação: ${sub}`}>
                    <span className="px-2.5 py-1 rounded-xl bg-purple-950/40 text-purple-300 border border-purple-800/60 text-xs font-medium flex items-center gap-1.5 cursor-help">
                      <Folder className="w-3 h-3 text-purple-400" />
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
          <div className="rounded-3xl bg-[#140b22] border border-purple-900/40 p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Tooltip content="Categoria: Organização / Facção do Mundo de Hecos">
                  <span className="px-3 py-1 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm border bg-purple-950 text-purple-300 border-purple-800 cursor-help">
                    <Building2 className="w-3.5 h-3.5 text-purple-400" />
                    <span>Organização</span>
                  </span>
                </Tooltip>

                {org.type && (
                  <Tooltip content={`Tipo: ${org.type}`}>
                    <span className="px-3 py-1 rounded-xl bg-zinc-900 text-zinc-200 border border-zinc-700 text-xs font-semibold cursor-help">
                      {org.type}
                    </span>
                  </Tooltip>
                )}

                {org.influence && (
                  <Tooltip content={`Influência: ${org.influence}`}>
                    <span className={`px-3 py-1 rounded-xl font-bold text-xs flex items-center gap-1.5 border ${infStyle.bg} ${infStyle.text} ${infStyle.border} cursor-help`}>
                      <Activity className="w-3.5 h-3.5" />
                      <span>{org.influence}</span>
                    </span>
                  </Tooltip>
                )}
              </div>

              <div className="flex items-center gap-2">
                {onEdit && isActualGm && (
                  <Tooltip content="Editar artigo de Organização">
                    <button
                      type="button"
                      onClick={onEdit}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-zinc-800 hover:bg-purple-950 text-zinc-200 hover:text-purple-200 border border-zinc-700/80 hover:border-purple-700/80 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-purple-400" />
                      Editar
                    </button>
                  </Tooltip>
                )}
                {onDelete && isActualGm && (
                  <Tooltip content="Excluir esta organização">
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
              {org.motto ? (
                <p className="text-sm sm:text-base text-purple-300 font-medium mt-1 italic flex items-center gap-1.5">
                  <Quote className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>"{org.motto}"</span>
                </p>
              ) : currentEntity.subtitle ? (
                <p className="text-sm sm:text-base text-purple-300 font-medium mt-1 italic">
                  {currentEntity.subtitle}
                </p>
              ) : null}
            </div>

            {/* Tags */}
            {currentEntity.tags && currentEntity.tags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-zinc-800/60">
                {currentEntity.tags.map((t, idx) => (
                  <Tooltip key={`${t}-${idx}`} content={`Filtrar por tag #${t}`}>
                    <button
                      type="button"
                      onClick={() => onTagClick(t)}
                      className="px-2 py-0.5 rounded-lg bg-black/50 text-zinc-400 hover:text-purple-300 border border-zinc-800 hover:border-purple-800/60 text-[11px] font-mono transition-colors cursor-pointer"
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
          <div className="flex items-center gap-2 bg-[#140b22] border border-purple-900/40 p-1.5 rounded-2xl shadow-lg overflow-x-auto">
            <Tooltip content="Ver panorama geral, recursos e doutrina">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-purple-950 text-purple-300 border border-purple-700 shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                }`}
              >
                <Building2 className="w-4 h-4 text-purple-400" />
                <span>Visão Geral & Recursos</span>
              </button>
            </Tooltip>

            <Tooltip content="Ver patentes, hierarquia interna e títulos">
              <button
                type="button"
                onClick={() => setActiveTab('hierarchy')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'hierarchy'
                    ? 'bg-purple-950 text-purple-300 border border-purple-700 shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                }`}
              >
                <Award className="w-4 h-4 text-purple-400" />
                <span>Hierarquia & Patentes ({ranks.length})</span>
              </button>
            </Tooltip>

            <Tooltip content="Ver membros notáveis e locais de atuação">
              <button
                type="button"
                onClick={() => setActiveTab('members')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'members'
                    ? 'bg-purple-950 text-purple-300 border border-purple-700 shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                }`}
              >
                <Users className="w-4 h-4 text-purple-400" />
                <span>Membros & Sedes ({memberNpcs.length + affiliatedLocations.length})</span>
              </button>
            </Tooltip>

            <Tooltip content="Ver aliados e rivais no cenário">
              <button
                type="button"
                onClick={() => setActiveTab('diplomacy')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'diplomacy'
                    ? 'bg-purple-950 text-purple-300 border border-purple-700 shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                }`}
              >
                <Handshake className="w-4 h-4 text-purple-400" />
                <span>Diplomacia ({alliedOrgs.length + rivalOrgs.length})</span>
              </button>
            </Tooltip>

            <Tooltip content="Ver missões e contratos vinculados">
              <button
                type="button"
                onClick={() => setActiveTab('quests')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'quests'
                    ? 'bg-purple-950 text-purple-300 border border-purple-700 shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                }`}
              >
                <Scroll className="w-4 h-4 text-purple-400" />
                <span>Missões ({linkedQuests.length})</span>
              </button>
            </Tooltip>

            <Tooltip content="Ver narrativa completa e história em Markdown">
              <button
                type="button"
                onClick={() => setActiveTab('lore')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'lore'
                    ? 'bg-purple-950 text-purple-300 border border-purple-700 shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                }`}
              >
                <FileText className="w-4 h-4 text-purple-400" />
                <span>Lore & Artigo</span>
              </button>
            </Tooltip>

            <Tooltip content="Ver artigos vinculados e menções no mundo">
              <button
                type="button"
                onClick={() => setActiveTab('backlinks')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  activeTab === 'backlinks'
                    ? 'bg-purple-950 text-purple-300 border border-purple-700 shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                }`}
              >
                <Link2 className="w-4 h-4 text-purple-400" />
                <span>Vínculos ({backlinks.length})</span>
              </button>
            </Tooltip>
          </div>

          {/* CONTEÚDO DAS ABAS */}
          <div className="rounded-3xl bg-[#140b22] border border-purple-900/40 p-6 shadow-xl min-h-[350px]">
            {/* ABA 1: VISÃO GERAL & RECURSOS */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Recursos & Poder Econômico/Militar */}
                <div className="p-5 rounded-2xl bg-[#1b102e] border border-purple-900/30 space-y-3">
                  <div className="flex items-center gap-2 text-purple-300 font-bold text-sm font-serif">
                    <Coins className="w-4 h-4 text-purple-400" />
                    <h3>Recursos, Bases Operacionais & Influência Econômica</h3>
                  </div>
                  {org.resources ? (
                    <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                      {org.resources}
                    </p>
                  ) : (
                    <p className="text-xs text-zinc-500 italic">
                      Nenhum inventário de recursos, tropas ou ativos registrado ainda.
                    </p>
                  )}
                </div>

                {/* Resumo Institucional */}
                <div className="p-5 rounded-2xl bg-[#1b102e] border border-purple-900/30 space-y-3">
                  <div className="flex items-center gap-2 text-purple-300 font-bold text-sm font-serif">
                    <Building2 className="w-4 h-4 text-purple-400" />
                    <h3>Doutrina & Filosofia Operacional</h3>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                    {currentEntity.summary || 'Resumo geral sobre o propósito, história de fundação e objetivos desta organização.'}
                  </p>
                </div>
              </div>
            )}

            {/* ABA 2: HIERARQUIA & PATENTES */}
            {activeTab === 'hierarchy' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div>
                    <h3 className="text-sm font-bold text-purple-200 font-serif">Estrutura de Postos & Patentes</h3>
                    <p className="text-xs text-zinc-400">Graus hierárquicos, deveres e requisitos para promoção.</p>
                  </div>
                </div>

                {ranks.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-zinc-950/40 border border-zinc-800/80 text-zinc-500 text-xs italic">
                    Nenhuma hierarquia ou patente cadastrada para esta organização.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {ranks.map((r, idx) => (
                      <div
                        key={r.id || `rank-${idx}`}
                        className="p-4 rounded-2xl bg-[#1b102e] border border-purple-900/40 hover:border-purple-700/60 transition-all flex flex-col justify-between gap-3 shadow-md"
                      >
                        <div>
                          <span className="font-bold text-sm text-purple-200 font-serif flex items-center gap-1.5">
                            <Award className="w-3.5 h-3.5 text-purple-400" />
                            {r.rankName}
                          </span>

                          {r.description && (
                            <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
                              {r.description}
                            </p>
                          )}
                        </div>

                        {r.requirements && (
                          <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-xs">
                            <span className="text-zinc-400 font-mono text-[11px]">Requisitos:</span>
                            <span className="font-semibold text-amber-300 text-[11px]">
                              {r.requirements}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ABA 3: MEMBROS & SEDES */}
            {activeTab === 'members' && (
              <div className="space-y-6">
                {/* Membros Notáveis */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-purple-400" />
                    Membros Notáveis & Oficiais ({memberNpcs.length})
                  </h3>

                  {memberNpcs.length === 0 ? (
                    <div className="p-6 text-center rounded-2xl bg-zinc-950/40 border border-zinc-800/80 text-zinc-500 text-xs italic">
                      Nenhum NPC vinculado como membro ou agente desta organização ainda.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {memberNpcs.map((npc) => (
                        <button
                          key={npc.id}
                          type="button"
                          onClick={() => onNavigate(npc.id)}
                          className="p-3 rounded-2xl bg-[#1b102e] border border-purple-900/40 hover:border-purple-700/60 transition-all text-left flex items-center justify-between gap-2 group cursor-pointer"
                        >
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-zinc-200 group-hover:text-purple-300 transition-colors truncate block">
                              {npc.title}
                            </span>
                            <span className="text-[11px] text-zinc-400 truncate block">
                              {npc.npcData?.role || npc.subtitle || 'Agente'}
                            </span>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-purple-400 opacity-60 group-hover:opacity-100 shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sedes e Entrepostos */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-purple-400" />
                    Locais com Sedes, Filiais ou Entrepostos ({affiliatedLocations.length})
                  </h3>

                  {affiliatedLocations.length === 0 ? (
                    <div className="p-6 text-center rounded-2xl bg-zinc-950/40 border border-zinc-800/80 text-zinc-500 text-xs italic">
                      Nenhum local vinculado como sede ou entreposto desta organização ainda.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {affiliatedLocations.map((loc) => (
                        <button
                          key={loc.id}
                          type="button"
                          onClick={() => onNavigate(loc.id)}
                          className="p-3 rounded-2xl bg-[#1b102e] border border-cyan-900/40 hover:border-cyan-700/60 transition-all text-left flex items-center justify-between gap-2 group cursor-pointer"
                        >
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-zinc-200 group-hover:text-cyan-300 transition-colors truncate block">
                              {loc.title}
                            </span>
                            <span className="text-[11px] text-cyan-400 truncate block">
                              {loc.locationData?.settlementType || loc.subtitle || 'Local de Atuação'}
                            </span>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-cyan-400 opacity-60 group-hover:opacity-100 shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ABA 4: DIPLOMACIA */}
            {activeTab === 'diplomacy' && (
              <div className="space-y-6">
                {/* Aliados */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Handshake className="w-3.5 h-3.5 text-emerald-400" />
                    Facções Aliadas & Tratados ({alliedOrgs.length})
                  </h3>

                  {alliedOrgs.length === 0 ? (
                    <div className="p-6 text-center rounded-2xl bg-zinc-950/40 border border-zinc-800/80 text-zinc-500 text-xs italic">
                      Nenhuma aliança formal registrada.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {alliedOrgs.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => onNavigate(a.id)}
                          className="p-3.5 rounded-2xl bg-[#1b102e] border border-emerald-900/40 hover:border-emerald-700/60 transition-all text-left flex items-center justify-between gap-2 group cursor-pointer"
                        >
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-zinc-200 group-hover:text-emerald-300 transition-colors truncate block">
                              {a.title}
                            </span>
                            <span className="text-[11px] text-emerald-400 truncate block">
                              Aliado Institucional
                            </span>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-emerald-400 opacity-60 group-hover:opacity-100 shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Rivais */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-rose-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Swords className="w-3.5 h-3.5 text-rose-400" />
                    Facções Rivais & Inimigos Declarados ({rivalOrgs.length})
                  </h3>

                  {rivalOrgs.length === 0 ? (
                    <div className="p-6 text-center rounded-2xl bg-zinc-950/40 border border-zinc-800/80 text-zinc-500 text-xs italic">
                      Nenhuma rivalidade ou hostilidade aberta declarada.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {rivalOrgs.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => onNavigate(r.id)}
                          className="p-3.5 rounded-2xl bg-[#1b102e] border border-rose-900/40 hover:border-rose-700/60 transition-all text-left flex items-center justify-between gap-2 group cursor-pointer"
                        >
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-zinc-200 group-hover:text-rose-300 transition-colors truncate block">
                              {r.title}
                            </span>
                            <span className="text-[11px] text-rose-400 truncate block">
                              Facção Rival
                            </span>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-rose-400 opacity-60 group-hover:opacity-100 shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ABA 5: MISSÕES */}
            {activeTab === 'quests' && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Scroll className="w-3.5 h-3.5 text-purple-400" />
                  Missões Patrocinadas por Esta Organização ({linkedQuests.length})
                </h3>

                {linkedQuests.length === 0 ? (
                  <div className="p-6 text-center rounded-2xl bg-zinc-950/40 border border-zinc-800/80 text-zinc-500 text-xs italic">
                    Nenhuma missão ou contrato ativo diretamente patrocinado por esta facção no momento.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {linkedQuests.map((q) => (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => onNavigate(q.id)}
                        className="p-4 rounded-2xl bg-[#1b102e] border border-purple-900/40 hover:border-purple-700/60 transition-all text-left flex items-start justify-between gap-3 group cursor-pointer"
                      >
                        <div className="min-w-0">
                          <span className="text-sm font-bold text-purple-200 font-serif group-hover:text-purple-300 transition-colors block">
                            {q.title}
                          </span>
                          {q.subtitle && (
                            <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                              {q.subtitle}
                            </p>
                          )}
                        </div>
                        <ExternalLink className="w-4 h-4 text-purple-400 opacity-60 group-hover:opacity-100 shrink-0 mt-0.5" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ABA 6: LORE & MARKDOWN */}
            {activeTab === 'lore' && (
              <div className="prose prose-invert max-w-none text-xs sm:text-sm text-zinc-300 leading-relaxed space-y-4">
                {currentEntity.content ? (
                  <RichContentRenderer content={currentEntity.content} onNavigate={onNavigate} />
                ) : (
                  <div className="p-8 text-center rounded-2xl bg-zinc-950/40 border border-zinc-800/80 text-zinc-500 text-xs italic">
                    Nenhum texto de história detalhada registrado ainda. Clique em "Editar" para registrar as crônicas e acordos desta organização.
                  </div>
                )}
              </div>
            )}

            {/* ABA 7: BACKLINKS & RELAÇÕES */}
            {activeTab === 'backlinks' && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-purple-400" />
                  Artigos que Mencionam esta Organização ({backlinks.length})
                </h3>

                {backlinks.length === 0 ? (
                  <div className="p-6 text-center rounded-2xl bg-zinc-950/40 border border-zinc-800/80 text-zinc-500 text-xs italic">
                    Nenhum outro artigo de Hecos cita esta facção diretamente ainda. Use @{currentEntity.slug || currentEntity.id} em outros artigos para gerar conexões automáticas!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {backlinks.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => onNavigate(b.id)}
                        className="p-3 rounded-2xl bg-[#1b102e] border border-purple-900/40 hover:border-purple-700/60 transition-all text-left flex items-center justify-between gap-2 group cursor-pointer"
                      >
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-zinc-200 group-hover:text-purple-300 transition-colors truncate block">
                            {b.title}
                          </span>
                          <span className="text-[10px] uppercase font-mono text-zinc-500">
                            {b.category}
                          </span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-purple-400 opacity-60 group-hover:opacity-100 shrink-0" />
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
