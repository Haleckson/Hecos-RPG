import React, { useState, useEffect, useMemo } from 'react';
import { HecosEntity, PCAttributes } from '../types';
import { HecosStorage } from '../services/storage';
import { RichContentRenderer } from './RichContentRenderer';
import { AdjustableImage } from './AdjustableImage';
import { TraitBadge } from './TraitBadge';
import { EntityIcon } from './EntityIcon';
import { Tooltip } from './Tooltip';
import { ItemDrawer } from './ItemDrawer';
import { sortTraitsHierarchically } from '../utils/traitUtils';
import {
  Users,
  Shield,
  Heart,
  Eye,
  EyeOff,
  Swords,
  Zap,
  Sparkles,
  Lock,
  Edit3,
  Trash2,
  Share2,
  Folder,
  Compass,
  User,
  Award,
  ChevronDown,
  Coins,
  Package,
  Activity,
  Footprints,
  Brain,
  Crosshair,
  BookOpen,
  Dna,
  Flame,
  Sparkle,
  MessageSquare
} from 'lucide-react';

interface PCViewProps {
  entity: HecosEntity;
  onEdit?: () => void;
  onDelete?: () => void;
  onNavigate: (id: string) => void;
  onTagClick: (tag: string) => void;
}

export const PCView: React.FC<PCViewProps> = ({
  entity,
  onEdit,
  onDelete,
  onNavigate,
  onTagClick,
}) => {
  const [currentEntity, setCurrentEntity] = useState<HecosEntity>(entity);
  const [isGmSecretExpanded, setIsGmSecretExpanded] = useState<boolean>(false);
  const [drawerItemId, setDrawerItemId] = useState<string | null>(null);

  useEffect(() => {
    setCurrentEntity(entity);
  }, [entity]);

  // Reactive subscription to storage
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

  const pc: Partial<PCAttributes> = currentEntity.pcData || {};

  // Extract GM Secret Notes
  const gmSecretNotes = useMemo(() => {
    if (pc?.gmNotes && pc.gmNotes.trim()) return pc.gmNotes.trim();
    if (currentEntity.gmNotes && currentEntity.gmNotes.trim()) return currentEntity.gmNotes.trim();

    if (currentEntity.content) {
      const match =
        currentEntity.content.match(/:::gm(?:-only)?\s*([\s\S]*?):::/i) ||
        currentEntity.content.match(/:::secret\s*([\s\S]*?):::/i);
      if (match && match[1]) {
        return match[1].replace(/^\*\*Notas Secretas do Mestre:\*\*\s*/i, '').trim();
      }
    }
    return '';
  }, [pc?.gmNotes, currentEntity.gmNotes, currentEntity.content]);

  // Clean content for bottom rendering
  const cleanContentForBottom = useMemo(() => {
    if (!currentEntity.content) return '';
    return currentEntity.content
      .replace(/:::gm(?:-only)?\s*[\s\S]*?:::/gi, '')
      .replace(/:::secret\s*[\s\S]*?:::/gi, '')
      .trim();
  }, [currentEntity.content]);

  // Vitals & Identity
  const level = pc.level ?? currentEntity.statblock?.level ?? 1;
  const charClass = pc.characterClass || pc.class || 'Aventureiro';
  const subclass = pc.subclass;
  const playerName = pc.playerName;
  const ancestry = pc.ancestry;
  const heritage = pc.heritage;
  const background = pc.background;
  const deity = pc.deity;
  const alignment = pc.alignment;
  const size = pc.size || currentEntity.statblock?.size || 'Médio';

  const maxHp = pc.maxHp ?? pc.hp ?? currentEntity.statblock?.hp ?? 10;
  const currentHp = pc.hp ?? maxHp;
  const ac = pc.ac ?? currentEntity.statblock?.ac ?? 10;
  const perception = pc.perception ?? currentEntity.statblock?.perception ?? 0;
  const speed = pc.speed ?? currentEntity.statblock?.speed ?? '9m (6q)';
  const heroPoints = pc.heroPoints ?? 0;

  // Ability Scores
  const str = pc.str ?? pc.attributes?.str ?? 10;
  const dex = pc.dex ?? pc.attributes?.dex ?? 10;
  const con = pc.con ?? pc.attributes?.con ?? 10;
  const int = pc.int ?? pc.attributes?.int ?? 10;
  const wis = pc.wis ?? pc.attributes?.wis ?? 10;
  const cha = pc.cha ?? pc.attributes?.cha ?? 10;

  // Saves
  const fort = pc.fort ?? 0;
  const ref = pc.ref ?? 0;
  const will = pc.will ?? 0;

  // Attacks, Spells & Special Features
  const attacks = pc.attacks || [];
  const anyPcAny = pc as any;
  const spells = anyPcAny.spells;
  const specialAbilities = anyPcAny.specialAbilities || anyPcAny.feats;
  const inventoryItems = anyPcAny.inventory || anyPcAny.loot || [];
  const currency = anyPcAny.currency;

  // Images
  const portraitImage = currentEntity.coverImage || pc.portraitImage;
  const tokenImage = pc.tokenImage || currentEntity.icon;

  // Traits
  const rawTraits = (pc.traits && pc.traits.length > 0)
    ? pc.traits
    : (currentEntity.traits && currentEntity.traits.length > 0)
    ? currentEntity.traits
    : (currentEntity.tags || []);
  const orderedTraits = sortTraitsHierarchically(rawTraits, { rarity: 'Comum', size });

  // Subcategories / Folders
  const subcategories = currentEntity.subcategories || (currentEntity.subcategory ? [currentEntity.subcategory] : []);

  // Backlinks
  const allEntities = HecosStorage.getEntities();
  const backlinks = allEntities.filter((other) => {
    if (other.id === currentEntity.id) return false;
    const cleanSlug = currentEntity.slug || currentEntity.id;
    return (
      other.content?.includes(`@${cleanSlug}`) ||
      other.content?.includes(`@${currentEntity.id}`) ||
      other.content?.includes(`[[${currentEntity.title}]]`)
    );
  });

  const getMod = (score: number) => {
    const mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  const handleOpenItemDrawer = (itemEntityId?: string, itemName?: string) => {
    if (itemEntityId) {
      const match = allEntities.find((e) => e.id === itemEntityId);
      if (match) {
        setDrawerItemId(match.id);
        return;
      }
    }
    if (itemName) {
      const match = allEntities.find(
        (e) =>
          e.title.toLowerCase() === itemName.toLowerCase() ||
          (e.category === 'item' && e.title.toLowerCase().includes(itemName.toLowerCase()))
      );
      if (match) {
        setDrawerItemId(match.id);
        return;
      }
    }
    if (itemEntityId) {
      setDrawerItemId(itemEntityId);
    }
  };

  const hasCurrency = currency && (currency.po !== undefined || currency.pp !== undefined || currency.pc !== undefined || currency.custom);

  return (
    <div id="pc-view-container" className="w-full text-zinc-200 space-y-6 pb-12">
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* LAYOUT PRINCIPAL: COLUNA ESQUERDA (IMAGENS) + COLUNA DIREITA (CONTEÚDO)   */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col lg:flex-row items-start gap-6 lg:gap-8 w-full">
        {/* ─────────────────────────────────────────────────────────────────────── */}
        {/* COLUNA ESQUERDA: RETRATO VERTICAL + TOKEN 1:1 NA MARGEM ESQUERDA       */}
        {/* ─────────────────────────────────────────────────────────────────────── */}
        <div className="w-full lg:w-72 xl:w-80 shrink-0 space-y-4">
          {/* 1. RETRATO (ORIENTAÇÃO DE RETRATO - FORMATO RETÂNGULO VERTICAL) */}
          <div className="rounded-3xl bg-[#080d16] border border-sky-900/50 overflow-hidden shadow-2xl relative">
            <div className="p-2.5 bg-[#0b1524] border-b border-zinc-800/80 flex items-center justify-between">
              <span className="text-[11px] font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Users className="w-3.5 h-3.5 text-sky-400" />
                Retrato do Personagem
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/50 text-zinc-400 border border-zinc-800">
                Vertical
              </span>
            </div>

            <div className="relative aspect-[3/4] w-full bg-[#05080e] overflow-hidden">
              {portraitImage ? (
                <AdjustableImage
                  src={portraitImage}
                  alt={currentEntity.title}
                  imageKey={`pc-portrait-${currentEntity.id}`}
                  isGm={isActualGm}
                  containerClassName="relative w-full h-full overflow-hidden"
                  imgClassName="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-[#0c233c] to-[#040810]">
                  <div className="w-16 h-16 rounded-2xl bg-sky-950/40 border border-sky-800/40 flex items-center justify-center text-sky-400/60 mb-3 shadow-lg">
                    <Users className="w-8 h-8" />
                  </div>
                  <span className="text-xs font-semibold text-zinc-400 font-serif">Sem Retrato Cadastrado</span>
                  {isActualGm && onEdit && (
                    <button
                      type="button"
                      onClick={onEdit}
                      className="mt-3 px-3 py-1.5 text-[11px] font-semibold text-sky-300 bg-sky-950/60 hover:bg-sky-900 border border-sky-800 rounded-xl transition-all cursor-pointer"
                    >
                      Adicionar Retrato
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 2. TOKEN (PROPORÇÃO 1:1 - FORMATO QUADRADO) LOGO ABAIXO DO RETRATO */}
          <div className="rounded-3xl bg-[#080d16] border border-sky-900/50 overflow-hidden shadow-2xl relative">
            <div className="p-2.5 bg-[#0b1524] border-b border-zinc-800/80 flex items-center justify-between">
              <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                Token de Mesa
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/50 text-cyan-400 border border-zinc-800">
                1:1 Quadrado
              </span>
            </div>

            <div className="relative aspect-square w-full bg-[#05080e] p-3 flex items-center justify-center">
              {tokenImage && (tokenImage.startsWith('http') || tokenImage.startsWith('data:')) ? (
                <div className="relative w-full h-full rounded-2xl overflow-hidden border-2 border-sky-500/50 shadow-inner bg-[#0a121e]">
                  <AdjustableImage
                    src={tokenImage}
                    alt={`${currentEntity.title} Token`}
                    imageKey={`pc-token-${currentEntity.id}`}
                    isGm={isActualGm}
                    containerClassName="relative w-full h-full overflow-hidden"
                    imgClassName="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-full h-full rounded-2xl bg-gradient-to-br from-[#0c233c] to-[#040810] border-2 border-sky-500/30 flex flex-col items-center justify-center p-4 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-sky-950/60 border border-sky-700/60 flex items-center justify-center text-sky-300 mb-2 shadow-md">
                    <EntityIcon
                      icon={tokenImage || currentEntity.icon}
                      category="pc"
                      className="w-7 h-7"
                    />
                  </div>
                  <span className="text-[11px] font-medium text-zinc-400">Token Padrão</span>
                </div>
              )}
            </div>
          </div>

          {/* 3. METADADOS E PASTAS VINCULADAS */}
          {subcategories.length > 0 && (
            <div className="rounded-2xl bg-[#080d16] border border-zinc-800/80 p-3.5 space-y-2 shadow-lg">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Folder className="w-3.5 h-3.5 text-sky-400" />
                Pastas Vinculadas
              </span>
              <div className="flex flex-wrap gap-1.5">
                {subcategories.map((folder) => (
                  <span
                    key={folder}
                    className="text-xs px-2.5 py-1 rounded-lg bg-[#0b1524] text-sky-200 border border-sky-900/50 flex items-center gap-1.5 shadow-sm"
                  >
                    <Folder className="w-3 h-3 text-sky-400" />
                    <span>{folder}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 4. DADOS DO JOGADOR RESPONSÁVEL */}
          {playerName && (
            <div className="rounded-2xl bg-[#080d16] border border-purple-900/50 p-3.5 space-y-2 shadow-lg">
              <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <User className="w-3.5 h-3.5 text-purple-400" />
                Jogador Responsável
              </span>
              <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-800/40 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-900/50 border border-purple-700/50 flex items-center justify-center text-purple-200 font-bold text-sm">
                  {playerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-xs font-bold text-purple-200">{playerName}</div>
                  <div className="text-[10px] text-zinc-400 font-mono">Personagem Jogador (PC)</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─────────────────────────────────────────────────────────────────────── */}
        {/* COLUNA DIREITA: CABEÇALHO, GM SECRETS & STATBLOCK COMPLETO             */}
        {/* ─────────────────────────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-5">
          {/* BANNER / CABEÇALHO DO PERSONAGEM */}
          <div className="rounded-3xl bg-[#080d16] border border-sky-900/40 p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Tooltip content={`Classe: ${charClass}${subclass ? ` (${subclass})` : ''} • Nível ${level}`}>
                  <span className="px-3 py-1 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm border bg-sky-950 text-sky-300 border-sky-800 cursor-help">
                    <Swords className="w-3.5 h-3.5 text-sky-400" />
                    <span>{charClass}{subclass ? ` • ${subclass}` : ''}</span>
                  </span>
                </Tooltip>

                <Tooltip content={`Nível do Personagem: ${level}`}>
                  <span className="px-3 py-1 rounded-xl bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono font-bold text-xs cursor-help">
                    Nível {level}
                  </span>
                </Tooltip>

                {heroPoints > 0 && (
                  <Tooltip content={`Pontos Heroicos: ${heroPoints}`}>
                    <span className="px-3 py-1 rounded-xl bg-amber-950 text-amber-300 border border-amber-800 font-mono font-bold text-xs flex items-center gap-1 cursor-help">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>{heroPoints} PH</span>
                    </span>
                  </Tooltip>
                )}
              </div>

              {onEdit && isActualGm && (
                <Tooltip content="Abrir o modal de edição deste Personagem">
                  <button
                    type="button"
                    onClick={onEdit}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-zinc-800 hover:bg-sky-950 text-zinc-200 hover:text-sky-200 border border-zinc-700/80 hover:border-sky-700/80 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-sky-400" />
                    Editar Personagem
                  </button>
                </Tooltip>
              )}
            </div>

            {/* ENTRADA SECRETA DO GM (COLAPSÁVEL - ACIMA DO NOME DO PERSONAGEM) */}
            {isActualGm && gmSecretNotes && (
              <div className="rounded-2xl bg-[#170c18] border-2 border-amber-500/70 shadow-[0_0_20px_rgba(245,158,11,0.15)] overflow-hidden transition-all">
                <button
                  type="button"
                  onClick={() => setIsGmSecretExpanded(!isGmSecretExpanded)}
                  className="w-full px-4 py-3 bg-amber-950/30 hover:bg-amber-950/50 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer border-b border-amber-500/20"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0">
                      <EyeOff className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-amber-300 font-mono uppercase tracking-wider">
                          Entrada Secreta — Visível Apenas para o GM
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold">
                          CONFIDENCIAL GM
                        </span>
                      </div>
                      {!isGmSecretExpanded && (
                        <p className="text-[11px] text-zinc-400 truncate mt-0.5 max-w-md">
                          {gmSecretNotes.slice(0, 100)}...
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-mono text-amber-400/80 hidden sm:inline">
                      {isGmSecretExpanded ? 'Recolher' : 'Expandir'}
                    </span>
                    <div className={`p-1 rounded-md bg-black/40 text-amber-300 transition-transform duration-200 ${isGmSecretExpanded ? 'rotate-180' : ''}`}>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </button>

                {isGmSecretExpanded && (
                  <div className="p-4 bg-black/40 space-y-2 text-xs leading-relaxed text-zinc-200 border-t border-amber-500/20">
                    <RichContentRenderer
                      content={gmSecretNotes}
                      onNavigate={onNavigate}
                      isGmMode={true}
                    />
                  </div>
                )}
              </div>
            )}

            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-zinc-100 font-serif tracking-tight flex items-center flex-wrap gap-2">
                <span>{currentEntity.title}</span>
              </h1>
              {currentEntity.subtitle && (
                <p className="text-sm text-sky-200/80 font-medium mt-1">{currentEntity.subtitle}</p>
              )}
            </div>

            {/* Traços Hierárquicos */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              {orderedTraits.map((trait, idx) => (
                <TraitBadge
                  key={idx}
                  trait={trait}
                  onClick={() => {
                    window.dispatchEvent(
                      new CustomEvent('hecos:open-trait-drawer', { detail: { trait } })
                    );
                  }}
                />
              ))}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {/* STATBLOCK DO PC: BLOCOS INTELIGENTES DISTRIBUÍDOS EM 2 COLUNAS         */}
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          <div className="rounded-3xl bg-[#070b12] border border-zinc-800/80 p-6 space-y-6 shadow-xl">
            {/* LINHA 1: ATRIBUTOS & SENTIDOS (ESQUERDA) VS DEFESAS & SAÚDE (DIREITA) */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
              {/* Coluna 1: Atributos Fundamentais & Sentidos */}
              <div className="p-4 rounded-2xl bg-[#09121f] border border-sky-900/40 space-y-3.5 h-full">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-300 font-mono flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-sky-400" />
                    Atributos Fundamentais
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">Modificadores PF2e</span>
                </div>

                {/* 6 Atributos em grade */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[
                    { label: 'FOR', name: 'Força', val: str },
                    { label: 'DES', name: 'Destreza', val: dex },
                    { label: 'CON', name: 'Constituição', val: con },
                    { label: 'INT', name: 'Inteligência', val: int },
                    { label: 'SAB', name: 'Sabedoria', val: wis },
                    { label: 'CAR', name: 'Carisma', val: cha },
                  ].map((attr) => (
                    <div
                      key={attr.label}
                      className="p-2 rounded-xl bg-[#060c14] border border-sky-900/50 text-center hover:border-sky-500/60 transition-colors"
                    >
                      <div className="text-[10px] uppercase font-bold text-sky-400 font-mono">{attr.label}</div>
                      <div className="text-base font-black text-zinc-100 font-mono my-0.5">{attr.val}</div>
                      <div className="text-xs font-bold text-sky-300 font-mono bg-sky-950/60 rounded py-0.5 border border-sky-800/40">
                        {getMod(attr.val)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Percepção & Deslocamento */}
                <div className="pt-2 border-t border-sky-900/30 grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#060c14] border border-zinc-800/80 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <div className="text-[10px] uppercase font-mono text-zinc-400">Percepção</div>
                      <div className="font-mono font-bold text-cyan-300 text-sm">+{perception}</div>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#060c14] border border-zinc-800/80 flex items-center gap-2">
                    <Footprints className="w-4 h-4 text-purple-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase font-mono text-zinc-400">Deslocamento</div>
                      <div className="font-mono font-bold text-purple-300 text-xs truncate">{speed}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Coluna 2: Defesas, Saúde & Salvamentos */}
              <div className="p-4 rounded-2xl bg-[#09121f] border border-sky-900/40 space-y-3.5 h-full">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-300 font-mono flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-sky-400" />
                  Defesas & Salvamentos
                </span>

                {/* Grid de CA, Salvamentos e PV */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                  <div className="bg-black/50 p-2.5 rounded-xl border border-zinc-800 text-center">
                    <div className="text-[10px] uppercase font-mono text-zinc-500">CA</div>
                    <div className="text-base font-black text-sky-100 mt-0.5 font-mono">{ac}</div>
                  </div>

                  <div className="bg-black/50 p-2.5 rounded-xl border border-zinc-800 text-center">
                    <div className="text-[10px] uppercase font-mono text-zinc-500">Fort</div>
                    <div className="text-base font-bold text-emerald-200 mt-0.5 font-mono">+{fort}</div>
                  </div>

                  <div className="bg-black/50 p-2.5 rounded-xl border border-zinc-800 text-center">
                    <div className="text-[10px] uppercase font-mono text-zinc-500">Ref</div>
                    <div className="text-base font-bold text-sky-200 mt-0.5 font-mono">+{ref}</div>
                  </div>

                  <div className="bg-black/50 p-2.5 rounded-xl border border-zinc-800 text-center">
                    <div className="text-[10px] uppercase font-mono text-zinc-500">Von</div>
                    <div className="text-base font-bold text-purple-200 mt-0.5 font-mono">+{will}</div>
                  </div>

                  <div className="bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-800/60 text-center col-span-2 sm:col-span-1">
                    <div className="text-[10px] uppercase font-mono text-emerald-400">PV</div>
                    <div className="text-base font-black text-emerald-200 mt-0.5 font-mono">
                      {currentHp} <span className="text-[10px] text-emerald-400/70">/{maxHp}</span>
                    </div>
                  </div>
                </div>

                {/* Barra de PV Visual */}
                <div className="p-3 rounded-xl bg-[#060c14] border border-emerald-900/40 space-y-1.5">
                  <div className="flex justify-between items-center text-[11px] font-mono">
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 fill-emerald-400/20" /> Integridade Vital
                    </span>
                    <span className="text-zinc-300 font-bold">{currentHp} / {maxHp} PV</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-black/60 overflow-hidden border border-emerald-950">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(0, (currentHp / (maxHp || 1)) * 100))}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* LINHA 2: ORIGEM & LINHAGEM (ESQ) + CRENÇAS & FILOSOFIA (DIR) */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
              {/* Coluna 1: Origem, Linhagem & Carreira */}
              <div className="p-4 rounded-2xl bg-[#080e1a] border border-sky-900/40 space-y-3 h-full">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-300 font-mono flex items-center gap-1.5">
                  <Dna className="w-4 h-4 text-sky-400" />
                  Origem, Linhagem & Carreira
                </span>
                <div className="space-y-2 text-xs">
                  {ancestry && (
                    <div className="flex justify-between items-baseline py-1 border-b border-zinc-800/60">
                      <span className="text-zinc-400 font-mono">Ancestralidade:</span>
                      <span className="font-bold text-zinc-200">{ancestry}</span>
                    </div>
                  )}
                  {heritage && (
                    <div className="flex justify-between items-baseline py-1 border-b border-zinc-800/60">
                      <span className="text-zinc-400 font-mono">Herança:</span>
                      <span className="font-bold text-zinc-200">{heritage}</span>
                    </div>
                  )}
                  {background && (
                    <div className="flex justify-between items-baseline py-1 border-b border-zinc-800/60">
                      <span className="text-zinc-400 font-mono">Antecedente:</span>
                      <span className="font-bold text-zinc-200">{background}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-baseline py-1 border-b border-zinc-800/60">
                    <span className="text-zinc-400 font-mono">Classe & Subclasse:</span>
                    <span className="font-bold text-sky-300">{charClass}{subclass ? ` (${subclass})` : ''}</span>
                  </div>
                  {size && (
                    <div className="flex justify-between items-baseline py-1 border-b border-zinc-800/60">
                      <span className="text-zinc-400 font-mono">Tamanho:</span>
                      <span className="font-bold text-zinc-200">{size}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Coluna 2: Crenças, Filosofia & Campanha */}
              <div className="p-4 rounded-2xl bg-[#080e1a] border border-cyan-900/40 space-y-3 h-full">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 font-mono flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-cyan-400" />
                  Crenças, Filosofia & Campanha
                </span>
                <div className="space-y-2 text-xs">
                  {deity && (
                    <div className="flex justify-between items-baseline py-1 border-b border-zinc-800/60">
                      <span className="text-zinc-400 font-mono">Divindade / Patrono:</span>
                      <span className="font-bold text-zinc-200">{deity}</span>
                    </div>
                  )}
                  {alignment && (
                    <div className="flex justify-between items-baseline py-1 border-b border-zinc-800/60">
                      <span className="text-zinc-400 font-mono">Alinhamento / Ética:</span>
                      <span className="font-bold text-zinc-200">{alignment}</span>
                    </div>
                  )}
                  {playerName && (
                    <div className="flex justify-between items-baseline py-1 border-b border-zinc-800/60">
                      <span className="text-zinc-400 font-mono">Jogador Responsável:</span>
                      <span className="font-bold text-purple-300">{playerName}</span>
                    </div>
                  )}
                  {heroPoints > 0 && (
                    <div className="flex justify-between items-baseline py-1 border-b border-zinc-800/60">
                      <span className="text-zinc-400 font-mono">Pontos Heroicos:</span>
                      <span className="font-bold text-amber-300 font-mono">{heroPoints} PH</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* LINHA 3: GOLPES & ATAQUES (ESQ) + MAGIAS OU TALENTOS ESPECIAIS (DIR) */}
            {(attacks.length > 0 || spells || specialAbilities) && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
                {/* Coluna 1: Golpes & Ataques Principais */}
                {attacks.length > 0 ? (
                  <div className="p-4 rounded-2xl bg-[#09121f] border border-sky-900/40 space-y-3 h-full">
                    <span className="text-xs font-bold uppercase tracking-wider text-sky-300 font-mono flex items-center gap-1.5">
                      <Swords className="w-4 h-4 text-sky-400" />
                      Golpes & Ataques Principais ({attacks.length})
                    </span>
                    <div className="space-y-2">
                      {attacks.map((att: any, idx: number) => (
                        <div key={idx} className="p-3 rounded-xl bg-[#060c14] border border-zinc-800/80 flex items-start justify-between gap-2">
                          <div>
                            <div className="font-bold text-zinc-100 text-xs">{att.name}</div>
                            <div className="text-[11px] text-zinc-400 mt-0.5">
                              {att.damage} {att.type ? `(${att.type})` : ''}
                            </div>
                            {att.traits && Array.isArray(att.traits) && att.traits.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {att.traits.map((t: string, tidx: number) => (
                                  <span key={tidx} className="text-[10px] px-1.5 py-0.2 rounded bg-sky-950/60 text-sky-300 border border-sky-800/40 font-mono">
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <span className="px-2.5 py-1 rounded-lg bg-sky-950 text-sky-300 border border-sky-800 font-mono font-bold text-xs shrink-0">
                            {att.bonus >= 0 ? `+${att.bonus}` : att.bonus}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-[#09121f] border border-zinc-800/80 space-y-2 h-full flex flex-col justify-center text-center text-zinc-400 text-xs">
                    <Swords className="w-6 h-6 text-zinc-600 mx-auto mb-1" />
                    <span>Nenhum golpe principal cadastrado</span>
                  </div>
                )}

                {/* Coluna 2: Magias ou Talentos Especiais */}
                {(spells || specialAbilities) && (
                  <div className="p-4 rounded-2xl bg-[#09121f] border border-purple-900/40 space-y-3 h-full">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-300 font-mono flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      Magias & Habilidades Especiais
                    </span>
                    <div className="space-y-2 text-xs">
                      {spells && (
                        <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-800/40 space-y-1.5">
                          <div className="flex justify-between items-center font-mono text-[11px]">
                            <span className="text-purple-300 font-bold">Tradição: {spells.tradition || 'Arcana'}</span>
                            <span className="text-zinc-300">CD: {spells.dc || '—'} • Ataque: +{spells.attack || '0'}</span>
                          </div>
                        </div>
                      )}

                      {specialAbilities && Array.isArray(specialAbilities) && (
                        <div className="space-y-1.5">
                          {specialAbilities.map((ab: any, idx: number) => (
                            <div key={idx} className="p-2.5 rounded-xl bg-[#060c14] border border-zinc-800/80">
                              <span className="font-bold text-purple-200">{ab.name || ab}</span>
                              {ab.description && <p className="text-zinc-400 text-[11px] mt-0.5">{ab.description}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* LINHA 4: POSSES, MOEDAS & INVENTÁRIO (SE HOUVER) */}
            {(inventoryItems.length > 0 || hasCurrency) && (
              <div className="p-4 sm:p-5 rounded-2xl bg-[#09121f] border border-amber-900/40 space-y-4 shadow-lg shadow-black/40">
                <div className="flex items-center justify-between border-b border-amber-950/60 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Coins className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono">
                      Posse de Moedas & Pertences Carregados
                    </h3>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Moedas */}
                  {hasCurrency && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {currency.po !== undefined && (
                        <div className="bg-black/40 border border-amber-500/30 rounded-xl p-2.5 flex items-center justify-between shadow-inner">
                          <span className="text-[11px] font-mono text-amber-400 uppercase font-semibold">Ouro (PO)</span>
                          <span className="text-sm font-bold text-amber-200 font-mono">{currency.po}</span>
                        </div>
                      )}
                      {currency.pp !== undefined && (
                        <div className="bg-black/40 border border-zinc-400/30 rounded-xl p-2.5 flex items-center justify-between shadow-inner">
                          <span className="text-[11px] font-mono text-zinc-300 uppercase font-semibold">Prata (PP)</span>
                          <span className="text-sm font-bold text-zinc-100 font-mono">{currency.pp}</span>
                        </div>
                      )}
                      {currency.pc !== undefined && (
                        <div className="bg-black/40 border border-amber-700/30 rounded-xl p-2.5 flex items-center justify-between shadow-inner">
                          <span className="text-[11px] font-mono text-amber-600 uppercase font-semibold">Cobre (PC)</span>
                          <span className="text-sm font-bold text-amber-500 font-mono">{currency.pc}</span>
                        </div>
                      )}
                      {currency.custom && (
                        <div className="bg-black/40 border border-purple-500/30 rounded-xl p-2.5 flex items-center justify-between shadow-inner col-span-2 sm:col-span-1">
                          <span className="text-[11px] font-mono text-purple-400 uppercase font-semibold truncate mr-2">Outro</span>
                          <span className="text-sm font-bold text-purple-200 font-mono truncate">{currency.custom}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Lista de Itens Carregados */}
                  {inventoryItems.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
                        Equipamento & Itens ({inventoryItems.length})
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {inventoryItems.map((item: any, idx: number) => {
                          const itemName = item.name || item.title || (typeof item === 'string' ? item : 'Item');
                          const itemEntityId = item.entityId || item.id;
                          return (
                            <div
                              key={idx}
                              onClick={() => handleOpenItemDrawer(itemEntityId, itemName)}
                              className="group p-2.5 rounded-xl bg-black/40 border border-zinc-800 hover:border-amber-500/50 hover:bg-amber-950/20 transition-all flex items-center justify-between gap-2 cursor-pointer"
                            >
                              <div className="min-w-0 flex items-center gap-2">
                                <Package className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
                                <span className="text-xs font-semibold text-zinc-200 truncate group-hover:text-amber-200">
                                  {itemName}
                                </span>
                              </div>
                              {item.quantity && item.quantity > 1 && (
                                <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px] font-mono shrink-0">
                                  x{item.quantity}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {/* CONTEÚDO NARRATIVO / BIOGRAFIA & DIÁRIO EM MARKDOWN                     */}
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {cleanContentForBottom && (
            <div className="rounded-3xl bg-[#080d16] border border-zinc-800/80 p-6 space-y-4 shadow-xl">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-300 font-mono flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-sky-400" />
                Histórico & Biografia do Personagem
              </span>
              <div className="prose prose-invert max-w-none text-zinc-200 text-sm leading-relaxed">
                <RichContentRenderer
                  content={cleanContentForBottom}
                  onNavigate={onNavigate}
                  isGmMode={isActualGm}
                />
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {/* CONEXÕES, MENÇÕES E BACKLINKS                                          */}
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {backlinks.length > 0 && (
            <div className="rounded-3xl bg-[#080d16] border border-zinc-800/80 p-6 space-y-3 shadow-xl">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono flex items-center gap-1.5">
                <Users className="w-4 h-4 text-sky-400" />
                Conexões e Menções ({backlinks.length})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {backlinks.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => onNavigate(b.id)}
                    className="p-3 rounded-xl bg-[#0a121e] border border-zinc-800/80 hover:border-sky-500/60 text-left flex items-center justify-between gap-3 transition-colors cursor-pointer"
                  >
                    <div className="min-w-0 flex items-center gap-2">
                      <EntityIcon icon={b.icon} category={b.category} className="w-4 h-4 text-sky-400 shrink-0" />
                      <span className="text-xs font-bold text-zinc-200 truncate">{b.title}</span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase shrink-0">{b.category}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Item Quick Drawer */}
      <ItemDrawer
        itemId={drawerItemId}
        entities={HecosStorage.getEntities()}
        isOpen={Boolean(drawerItemId)}
        onClose={() => setDrawerItemId(null)}
        onNavigateFullPage={(id) => {
          setDrawerItemId(null);
          onNavigate(id);
        }}
        isGmMode={isActualGm}
      />
    </div>
  );
};
