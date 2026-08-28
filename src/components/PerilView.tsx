import React, { useState, useEffect } from 'react';
import { HecosEntity, PerilAttributes, PerilFieldVisibility, ItemVisibility } from '../types';
import { HecosStorage } from '../services/storage';
import { RichContentRenderer } from './RichContentRenderer';
import { AdjustableImage } from './AdjustableImage';
import { TraitBadge } from './TraitBadge';
import { EntityIcon } from './EntityIcon';
import { Tooltip } from './Tooltip';
import { sortTraitsHierarchically } from '../utils/traitUtils';
import {
  Skull,
  AlertTriangle,
  Flame,
  Ghost,
  Shield,
  Heart,
  Eye,
  EyeOff,
  Swords,
  Zap,
  Sparkles,
  Lock,
  Users,
  Edit3,
  Dna,
  Clock,
  HelpCircle,
  Dice5,
  Folder,
  Compass,
  Layers,
  FileText,
  Wrench,
  RotateCcw,
  Footprints,
  Sparkle,
  Target,
  Activity,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';

interface PerilViewProps {
  entity: HecosEntity;
  onEdit?: () => void;
  onNavigate: (id: string) => void;
  onTagClick: (tag: string) => void;
}

export const PerilView: React.FC<PerilViewProps> = ({
  entity,
  onEdit,
  onNavigate,
  onTagClick
}) => {
  const [currentEntity, setCurrentEntity] = useState<HecosEntity>(entity);

  useEffect(() => {
    setCurrentEntity(entity);
  }, [entity]);

  // Reactive subscription to storage changes
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
  const isActualGm = currentUser?.role === 'gm' || HecosStorage.getGmMode();

  const peril = currentEntity.perilData;
  const fieldVis = peril?.fieldVisibility || {};

  // Check if a specific field is visible to current user
  const isFieldVisible = (fieldKey: keyof PerilFieldVisibility): boolean => {
    if (isActualGm) return true;
    const vis = fieldVis[fieldKey] || 'gm';
    if (vis === 'all') return true;
    if (vis === 'custom' && currentUser) {
      const allowed = fieldVis.allowedUsers?.[fieldKey] || [];
      return allowed.includes(currentUser.id);
    }
    return false;
  };

  // Toggle field visibility directly from the sheet (GM only)
  const handleToggleFieldVis = (fieldKey: keyof PerilFieldVisibility) => {
    if (!isActualGm || !peril) return;

    const current = fieldVis[fieldKey] || 'gm';
    const next: ItemVisibility = current === 'gm' ? 'all' : 'gm';

    const updatedPerilData: PerilAttributes = {
      ...peril,
      fieldVisibility: {
        ...fieldVis,
        [fieldKey]: next
      }
    };

    const updatedEntity: HecosEntity = {
      ...currentEntity,
      perilData: updatedPerilData
    };

    HecosStorage.saveEntity(updatedEntity);
    setCurrentEntity(updatedEntity);
  };

  const renderEyeToggle = (fieldKey: keyof PerilFieldVisibility, label: string) => {
    if (!isActualGm) return null;
    const isVisible = (fieldVis[fieldKey] || 'gm') !== 'gm';

    return (
      <button
        type="button"
        onClick={() => handleToggleFieldVis(fieldKey)}
        title={`GM: Clique para ${isVisible ? 'Ocultar dos Jogadores' : 'Revelar aos Jogadores'} (${label})`}
        className={`ml-2 p-1 rounded-md text-[10px] font-mono transition-all border inline-flex items-center gap-1 cursor-pointer select-none ${
          isVisible
            ? 'bg-emerald-950/90 text-emerald-300 border-emerald-700/80 hover:bg-emerald-900 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
            : 'bg-rose-950/90 text-rose-300 border-rose-700/80 hover:bg-rose-900 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
        }`}
      >
        {isVisible ? <Eye className="w-3 h-3 text-emerald-400" /> : <EyeOff className="w-3 h-3 text-rose-400" />}
        <span>{isVisible ? 'Revelado' : 'Oculto'}</span>
      </button>
    );
  };

  const level = peril?.level ?? currentEntity.statblock?.level ?? 1;
  const kind = peril?.perilKind || (currentEntity.category === 'creature' ? 'monster' : 'hazard_simple');
  const isMonster = kind === 'monster';
  const isSimpleHazard = kind === 'hazard_simple';
  const isComplexHazard = kind === 'hazard_complex';
  const isEnvironmental = kind === 'environmental';
  const isHaunt = kind === 'haunt';
  const rarity = peril?.rarity || currentEntity.statblock?.rarity || 'Comum';
  const size = peril?.size || currentEntity.statblock?.size;

  // Portrait and Token Images
  const portraitImage = currentEntity.coverImage || peril?.portraitImage;
  const tokenImage = currentEntity.icon || peril?.tokenImage;

  // Subcategories / Folders
  const subcategories = peril?.subcategories || currentEntity.subcategories || (currentEntity.subcategory ? [currentEntity.subcategory] : []);

  const getKindBadge = () => {
    switch (kind) {
      case 'monster':
        return { label: 'Criatura / Monstro', icon: Skull, bg: 'bg-rose-950 text-rose-300 border-rose-800' };
      case 'hazard_simple':
        return { label: 'Perigo Simples', icon: AlertTriangle, bg: 'bg-amber-950 text-amber-300 border-amber-800' };
      case 'hazard_complex':
        return { label: 'Perigo Complexo', icon: Zap, bg: 'bg-orange-950 text-orange-300 border-orange-800' };
      case 'haunt':
        return { label: 'Assombração', icon: Ghost, bg: 'bg-purple-950 text-purple-300 border-purple-800' };
      case 'environmental':
        return { label: 'Perigo Ambiental', icon: Flame, bg: 'bg-emerald-950 text-emerald-300 border-emerald-800' };
      default:
        return { label: 'Perigo', icon: AlertTriangle, bg: 'bg-rose-950 text-rose-300 border-rose-800' };
    }
  };

  const kindBadge = getKindBadge();
  const KindIcon = kindBadge.icon;

  return (
    <div id="peril-view-container" className="max-w-6xl mx-auto text-zinc-200 space-y-6 pb-12">
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* LAYOUT PRINCIPAL: COLUNA ESQUERDA (IMAGENS) + COLUNA DIREITA (CONTEÚDO)   */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col md:flex-row items-start gap-6 lg:gap-8">
        {/* ─────────────────────────────────────────────────────────────────────── */}
        {/* COLUNA ESQUERDA: RETRATO VERTICAL + TOKEN 1:1 LOGO ABAIXO               */}
        {/* ─────────────────────────────────────────────────────────────────────── */}
        <div className="w-full md:w-80 lg:w-88 shrink-0 space-y-4">
          {/* 1. RETRATO (ORIENTAÇÃO DE RETRATO - FORMATO RETÂNGULO VERTICAL) */}
          <div className="rounded-3xl bg-[#0f0a1c] border border-rose-900/50 overflow-hidden shadow-2xl relative">
            <div className="p-2.5 bg-[#170e28] border-b border-zinc-800/80 flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Skull className="w-3.5 h-3.5 text-rose-400" />
                Retrato do Perigo
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/50 text-zinc-400 border border-zinc-800">
                Vertical
              </span>
            </div>

            <div className="relative aspect-[3/4] w-full bg-[#0a0714] overflow-hidden">
              {portraitImage ? (
                <AdjustableImage
                  src={portraitImage}
                  alt={currentEntity.title}
                  imageKey={`peril-portrait-${currentEntity.id}`}
                  isGm={isActualGm}
                  containerClassName="relative w-full h-full overflow-hidden"
                  imgClassName="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-[#180f2b] to-[#0a0714]">
                  <div className="w-16 h-16 rounded-2xl bg-rose-950/40 border border-rose-800/40 flex items-center justify-center text-rose-400/60 mb-3 shadow-lg">
                    <KindIcon className="w-8 h-8" />
                  </div>
                  <span className="text-xs font-semibold text-zinc-400 font-serif">Sem Retrato Cadastrado</span>
                  {isActualGm && onEdit && (
                    <button
                      type="button"
                      onClick={onEdit}
                      className="mt-3 px-3 py-1.5 text-[11px] font-semibold text-rose-300 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 rounded-xl transition-all cursor-pointer"
                    >
                      Adicionar Retrato
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 2. TOKEN (PROPORÇÃO 1:1 - FORMATO QUADRADO) LOGO ABAIXO DO RETRATO */}
          <div className="rounded-3xl bg-[#0f0a1c] border border-rose-900/50 overflow-hidden shadow-2xl relative">
            <div className="p-2.5 bg-[#170e28] border-b border-zinc-800/80 flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                Token de Mesa
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/50 text-amber-400 border border-zinc-800">
                1:1 Quadrado
              </span>
            </div>

            <div className="relative aspect-square w-full bg-[#0a0714] p-3 flex items-center justify-center">
              {tokenImage && (tokenImage.startsWith('http') || tokenImage.startsWith('data:')) ? (
                <div className="relative w-full h-full rounded-2xl overflow-hidden border-2 border-rose-500/50 shadow-inner bg-[#140d22]">
                  <AdjustableImage
                    src={tokenImage}
                    alt={`${currentEntity.title} Token`}
                    imageKey={`peril-token-${currentEntity.id}`}
                    isGm={isActualGm}
                    containerClassName="relative w-full h-full overflow-hidden"
                    imgClassName="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-full h-full rounded-2xl bg-gradient-to-br from-[#1a0f2e] to-[#0b0714] border-2 border-rose-500/30 flex flex-col items-center justify-center p-4 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-rose-950/60 border border-rose-700/60 flex items-center justify-center text-rose-300 mb-2 shadow-md">
                    <EntityIcon
                      icon={tokenImage || currentEntity.icon}
                      category="peril"
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
            <div className="rounded-2xl bg-[#0e0a19] border border-zinc-800/80 p-3.5 space-y-2 shadow-lg">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Folder className="w-3.5 h-3.5 text-rose-400" />
                Pastas Vinculadas
              </span>
              <div className="flex flex-wrap gap-1.5">
                {subcategories.map((folder) => (
                  <span
                    key={folder}
                    className="text-xs px-2.5 py-1 rounded-lg bg-[#180f26] text-rose-200 border border-rose-900/50 flex items-center gap-1.5 shadow-sm"
                  >
                    <Folder className="w-3 h-3 text-rose-400" />
                    <span>{folder}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ─────────────────────────────────────────────────────────────────────── */}
        {/* COLUNA DIREITA: STATBLOCK PF2E COMPLETO & CONTEÚDO                     */}
        {/* ─────────────────────────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-5">
          {/* BANNER / CABEÇALHO DO PERIGO */}
          <div className="rounded-3xl bg-[#0f0a1c] border border-rose-900/40 p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Tooltip content={`${kindBadge.label} • Nível ${level}`}>
                  <span className={`px-3 py-1 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm border ${kindBadge.bg} cursor-help`}>
                    <KindIcon className="w-3.5 h-3.5" />
                    {kindBadge.label}
                  </span>
                </Tooltip>

                <Tooltip content={`Nível de Desafio: ${level}`}>
                  <span className="px-3 py-1 rounded-xl bg-purple-950 text-purple-300 border border-purple-800 font-mono font-bold text-xs cursor-help">
                    Nível {isFieldVisible('level') ? level : '???'}
                  </span>
                </Tooltip>

                {rarity && <TraitBadge trait={rarity} />}
                {size && <TraitBadge trait={size} />}
              </div>

              {onEdit && isActualGm && (
                <Tooltip content="Abrir o modal completo de edição deste Perigo">
                  <button
                    type="button"
                    onClick={onEdit}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-zinc-800 hover:bg-rose-950 text-zinc-200 hover:text-rose-200 border border-zinc-700/80 hover:border-rose-700/80 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-rose-400" />
                    Editar Perigo
                  </button>
                </Tooltip>
              )}
            </div>

            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-zinc-100 font-serif tracking-tight flex items-center flex-wrap gap-2">
                <span>{isFieldVisible('name') ? currentEntity.title : 'Entidade Desconhecida (Nome Oculto)'}</span>
                {renderEyeToggle('name', 'Nome')}
              </h1>
              {currentEntity.subtitle && (
                <p className="text-sm text-rose-200/80 font-medium mt-1">{currentEntity.subtitle}</p>
              )}
            </div>

            {/* Traços */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              {isFieldVisible('typeAndTraits') ? (
                sortTraitsHierarchically(
                  peril?.traits || currentEntity.statblock?.traits || ['PF2e'],
                  {
                    rarity,
                    size
                  }
                ).map((trait, idx) => (
                  <TraitBadge
                    key={idx}
                    trait={trait}
                  />
                ))
              ) : (
                <span className="text-xs text-zinc-500 font-mono italic">
                  🔒 Traços ocultos pelo Mestre
                </span>
              )}
              {renderEyeToggle('typeAndTraits', 'Traços')}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {/* STATBLOCK DO PERIGO                                                   */}
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          <div className="rounded-3xl bg-[#0b0814] border border-zinc-800/80 p-6 space-y-6 shadow-xl">
            {/* ═══════════════════════════════════════════════════════════════════════ */}
            {/* STATBLOCK ADAPTATIVO POR CATEGORIA DE PERIGO                           */}
            {/* ═══════════════════════════════════════════════════════════════════════ */}

            {/* ────────────────── 1. CRIATURA / MONSTRO ────────────────── */}
            {isMonster && (
              <>
                {/* Percepção, Sentidos & Perícias */}
                <div className="p-4 rounded-2xl bg-[#120e20] border border-zinc-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
                      Percepção & Sentidos
                    </span>
                    {renderEyeToggle('sensesAndPerception', 'Percepção')}
                  </div>

                  {isFieldVisible('sensesAndPerception') ? (
                    <div className="text-xs text-zinc-300 space-y-1.5">
                      <div>
                        <strong className="text-zinc-100">Percepção:</strong>{' '}
                        <span className="font-mono text-cyan-300 font-bold">
                          {peril?.perception !== undefined ? `+${peril.perception}` : '+0'}
                        </span>
                        {'; '}
                        <span className="text-zinc-300">{peril?.senses || currentEntity.statblock?.senses || 'Visão Padrão'}</span>
                      </div>

                      {peril?.stealthCheck && (
                        <div>
                          <strong className="text-zinc-100">Furtividade / Detecção:</strong>{' '}
                          <span className="text-amber-300 font-mono">{peril.stealthCheck}</span>
                        </div>
                      )}

                      {peril?.languages && peril.languages.length > 0 && (
                        <div>
                          <strong className="text-zinc-100">Idiomas:</strong> {peril.languages.join(', ')}
                        </div>
                      )}

                      {peril?.skills && Object.keys(peril.skills).length > 0 && (
                        <div>
                          <strong className="text-zinc-100">Perícias:</strong>{' '}
                          {Object.entries(peril.skills)
                            .map(([k, v]) => `${k} +${v}`)
                            .join(', ')}
                        </div>
                      )}

                      {peril?.attributes && (
                        <div className="pt-2 border-t border-zinc-800/60 flex items-center gap-3 flex-wrap text-[11px] font-mono text-zinc-400">
                          <span>FOR <strong className="text-zinc-200">{peril.attributes.str >= 0 ? `+${peril.attributes.str}` : peril.attributes.str}</strong></span>
                          <span>DES <strong className="text-zinc-200">{peril.attributes.dex >= 0 ? `+${peril.attributes.dex}` : peril.attributes.dex}</strong></span>
                          <span>CON <strong className="text-zinc-200">{peril.attributes.con >= 0 ? `+${peril.attributes.con}` : peril.attributes.con}</strong></span>
                          <span>INT <strong className="text-zinc-200">{peril.attributes.int >= 0 ? `+${peril.attributes.int}` : peril.attributes.int}</strong></span>
                          <span>SAB <strong className="text-zinc-200">{peril.attributes.wis >= 0 ? `+${peril.attributes.wis}` : peril.attributes.wis}</strong></span>
                          <span>CAR <strong className="text-zinc-200">{peril.attributes.cha >= 0 ? `+${peril.attributes.cha}` : peril.attributes.cha}</strong></span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-500 italic">
                      🔒 Sentidos e Percepção ocultos (faça um teste de Recordar Conhecimento).
                    </div>
                  )}
                </div>

                {/* Defesas & Saúde */}
                <div className="p-4 rounded-2xl bg-[#120e20] border border-zinc-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                      <Shield className="w-3.5 h-3.5 text-rose-400" />
                      Defesas & Saúde
                    </span>
                    <div className="flex items-center gap-2">
                      {renderEyeToggle('acAndDefenses', 'CA & Saves')}
                      {renderEyeToggle('hpAndHealth', 'PV')}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                    <div className="bg-black/50 p-2.5 rounded-xl border border-zinc-800 text-center">
                      <div className="text-[10px] uppercase font-mono text-zinc-500">CA</div>
                      <div className="text-base font-bold text-zinc-100 mt-0.5">
                        {isFieldVisible('acAndDefenses') ? peril?.ac || currentEntity.statblock?.ac || '—' : '???'}
                      </div>
                    </div>

                    <div className="bg-black/50 p-2.5 rounded-xl border border-zinc-800 text-center">
                      <div className="text-[10px] uppercase font-mono text-zinc-500">Fortitude</div>
                      <div className="text-base font-bold text-zinc-100 mt-0.5">
                        {isFieldVisible('acAndDefenses')
                          ? peril?.fort !== undefined
                            ? `+${peril.fort}`
                            : '—'
                          : '???'}
                      </div>
                    </div>

                    <div className="bg-black/50 p-2.5 rounded-xl border border-zinc-800 text-center">
                      <div className="text-[10px] uppercase font-mono text-zinc-500">Reflexos</div>
                      <div className="text-base font-bold text-zinc-100 mt-0.5">
                        {isFieldVisible('acAndDefenses')
                          ? peril?.ref !== undefined
                            ? `+${peril.ref}`
                            : '—'
                          : '???'}
                      </div>
                    </div>

                    <div className="bg-black/50 p-2.5 rounded-xl border border-zinc-800 text-center">
                      <div className="text-[10px] uppercase font-mono text-zinc-500">Vontade</div>
                      <div className="text-base font-bold text-zinc-100 mt-0.5">
                        {isFieldVisible('acAndDefenses')
                          ? peril?.will !== undefined
                            ? `+${peril.will}`
                            : '—'
                          : '???'}
                      </div>
                    </div>

                    <div className="bg-rose-950/40 p-2.5 rounded-xl border border-rose-800/60 text-center col-span-2 sm:col-span-1">
                      <div className="text-[10px] uppercase font-mono text-rose-400">PV (HP)</div>
                      <div className="text-base font-black text-rose-200 mt-0.5">
                        {isFieldVisible('hpAndHealth') ? `${peril?.hp || currentEntity.statblock?.hp || '—'} PV` : '??? PV'}
                      </div>
                    </div>
                  </div>

                  {/* Deslocamento */}
                  {peril?.speed && (
                    <div className="pt-1 text-xs text-zinc-300 flex items-center gap-1.5">
                      <Footprints className="w-3.5 h-3.5 text-emerald-400" />
                      <strong className="text-zinc-100">Deslocamento:</strong>{' '}
                      <span>{peril.speed}</span>
                    </div>
                  )}

                  {/* Dureza, Imunidades, Fraquezas, Resistências */}
                  <div className="pt-2 border-t border-zinc-800/60 space-y-1.5 text-xs text-zinc-300">
                    {peril?.hardness !== undefined && (
                      <div>
                        <strong className="text-zinc-100">Dureza:</strong>{' '}
                        {isFieldVisible('hardnessAndBT') ? peril.hardness : '???'} (Limite de Quebra: {peril.brokenThreshold || '—'})
                        {renderEyeToggle('hardnessAndBT', 'Dureza')}
                      </div>
                    )}

                    {peril?.immunities && peril.immunities.length > 0 && (
                      <div>
                        <strong className="text-zinc-100">Imunidades:</strong>{' '}
                        {isFieldVisible('immunities') ? peril.immunities.join(', ') : '🔒 Oculto'}
                        {renderEyeToggle('immunities', 'Imunidades')}
                      </div>
                    )}

                    {peril?.weaknesses && peril.weaknesses.length > 0 && (
                      <div>
                        <strong className="text-zinc-100">Fraquezas:</strong>{' '}
                        {isFieldVisible('weaknessesAndResistances') ? (
                          <span className="text-rose-300 font-semibold">{peril.weaknesses.join(', ')}</span>
                        ) : (
                          '🔒 Oculto'
                        )}
                        {renderEyeToggle('weaknessesAndResistances', 'Fraquezas')}
                      </div>
                    )}

                    {peril?.resistances && peril.resistances.length > 0 && (
                      <div>
                        <strong className="text-zinc-100">Resistências:</strong>{' '}
                        {isFieldVisible('weaknessesAndResistances') ? (
                          <span className="text-cyan-300 font-semibold">{peril.resistances.join(', ')}</span>
                        ) : (
                          '🔒 Oculto'
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Golpes & Ataques */}
                {peril?.attacks && peril.attacks.length > 0 && (
                  <div className="p-4 rounded-2xl bg-[#120e20] border border-zinc-800/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                        <Swords className="w-3.5 h-3.5 text-amber-400" />
                        Golpes & Ataques
                      </span>
                      {renderEyeToggle('attacksAndDamage', 'Ataques')}
                    </div>

                    {isFieldVisible('attacksAndDamage') ? (
                      <div className="space-y-2">
                        {(peril?.attacks || []).map((atk) => (
                          <div key={atk.id} className="p-3 rounded-xl bg-black/50 border border-zinc-800 text-xs">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-zinc-100">
                                {atk.type === 'melee' ? 'Corpo a Corpo [1 ação]' : 'À Distância [1 ação]'} {atk.name}
                              </span>
                              <span className="font-mono text-cyan-300 font-bold">+{atk.bonus}</span>
                              {atk.traits && atk.traits.length > 0 && (
                                <span className="text-zinc-400 text-[11px]">({atk.traits.join(', ')})</span>
                              )}
                            </div>
                            <div className="text-zinc-300 mt-1">
                              <strong>Dano:</strong> <span className="text-rose-300 font-mono font-bold">{atk.damage}</span>
                              {atk.extraEffects && <span className="text-zinc-400"> mais {atk.extraEffects}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-zinc-500 italic">
                        🔒 Dados de ataque e dano ocultos pelo Mestre.
                      </div>
                    )}
                  </div>
                )}

                {/* Magias (Spellcasting) */}
                {peril?.spells && (
                  <div className="p-4 rounded-2xl bg-[#120e20] border border-purple-900/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        Magias ({peril.spells.tradition})
                      </span>
                      {renderEyeToggle('spells', 'Magias')}
                    </div>

                    {isFieldVisible('spells') ? (
                      <div className="text-xs text-zinc-300 space-y-2">
                        <div className="flex items-center gap-4 text-zinc-200 font-mono">
                          <span>CD de Magia: <strong className="text-purple-300">{peril.spells.dc}</strong></span>
                          <span>Ataque de Magia: <strong className="text-purple-300">+{peril.spells.attack}</strong></span>
                        </div>
                        <p className="whitespace-pre-line text-zinc-300 bg-black/40 p-2.5 rounded-xl border border-zinc-800">
                          {peril.spells.spellsList}
                        </p>
                      </div>
                    ) : (
                      <div className="text-xs text-zinc-500 italic">
                        🔒 Tradição e lista de magias ocultas pelo Mestre.
                      </div>
                    )}
                  </div>
                )}

                {/* Ações Especiais & Reações */}
                {peril?.actions && peril.actions.length > 0 && (
                  <div className="p-4 rounded-2xl bg-[#120e20] border border-zinc-800/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                        <Zap className="w-3.5 h-3.5 text-purple-400" />
                        Ações Especiais & Reações
                      </span>
                      {renderEyeToggle('actionsAndAbilities', 'Ações')}
                    </div>

                    {isFieldVisible('actionsAndAbilities') ? (
                      <div className="space-y-2">
                        {(peril?.actions || []).map((act) => (
                          <div key={act.id} className="p-3 rounded-xl bg-black/50 border border-zinc-800 text-xs space-y-1.5">
                            <div className="font-bold text-zinc-100 flex items-center gap-1.5 flex-wrap">
                              <span className="text-amber-400 font-mono font-bold px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-800/60 text-[11px]">
                                [{act.cost}]
                              </span>
                              <span className="text-sm">{act.name}</span>
                              {act.traits && act.traits.length > 0 && (
                                <span className="text-zinc-400 text-[11px] font-normal">({act.traits.join(', ')})</span>
                              )}
                            </div>
                            {act.trigger && (
                              <div className="text-amber-300/90 text-[11px]">
                                <strong>Gatilho:</strong> {act.trigger}
                              </div>
                            )}
                            <p className="text-zinc-300 leading-relaxed">{act.effect}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-zinc-500 italic">
                        🔒 Habilidades e ações especiais ocultas.
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* ────────────────── 2. PERIGO SIMPLES (HAZARD SIMPLE) ────────────────── */}
            {isSimpleHazard && (
              <>
                {/* Detecção & Furtividade */}
                <div className="p-4 rounded-2xl bg-[#120e20] border border-amber-900/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                      <Eye className="w-3.5 h-3.5 text-amber-400" />
                      Detecção & Furtividade
                    </span>
                    {renderEyeToggle('sensesAndPerception', 'Detecção')}
                  </div>

                  {isFieldVisible('sensesAndPerception') ? (
                    <div className="text-xs text-zinc-300 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-zinc-100">Furtividade / CD de Detecção:</strong>
                        <span className="px-2.5 py-0.5 rounded-lg bg-amber-950/60 text-amber-200 border border-amber-800/50 font-mono font-bold">
                          {peril?.stealthCheck || 'Percepção CD 15 (treinado) ou Furtividade +5'}
                        </span>
                      </div>
                      {peril?.senses && (
                        <div>
                          <strong className="text-zinc-100">Sentidos do Perigo:</strong>{' '}
                          <span className="text-zinc-300">{peril.senses}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-500 italic">
                      🔒 Dados de detecção ocultos (faça um teste de Percepção para notar a armadilha).
                    </div>
                  )}
                </div>

                {/* Desativação (Disable Device) */}
                <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                      <Wrench className="w-3.5 h-3.5 text-amber-400" />
                      Desativação (Disable Device)
                    </span>
                    {renderEyeToggle('disableAndReset', 'Desativação')}
                  </div>

                  {isFieldVisible('disableAndReset') ? (
                    <div className="p-3 rounded-xl bg-black/50 border border-amber-800/50 text-xs text-amber-100 leading-relaxed font-sans">
                      {peril?.disable || 'Ladinagem ou teste apropriado para desarmar o mecanismo.'}
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-500 italic">
                      🔒 Métodos de desativação ocultos (teste de Ladinagem ou Percepção para deduzir).
                    </div>
                  )}
                </div>

                {/* Defesas Estruturais & Integridade */}
                <div className="p-4 rounded-2xl bg-[#120e20] border border-zinc-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                      <Shield className="w-3.5 h-3.5 text-rose-400" />
                      Defesas Estruturais & Integridade
                    </span>
                    <div className="flex items-center gap-2">
                      {renderEyeToggle('hardnessAndBT', 'Dureza')}
                      {renderEyeToggle('hpAndHealth', 'PV')}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-black/50 p-2.5 rounded-xl border border-zinc-800 text-center">
                      <div className="text-[10px] uppercase font-mono text-zinc-500">Dureza</div>
                      <div className="text-base font-bold text-amber-300 mt-0.5 font-mono">
                        {isFieldVisible('hardnessAndBT') ? peril?.hardness ?? '—' : '???'}
                      </div>
                    </div>

                    <div className="bg-black/50 p-2.5 rounded-xl border border-zinc-800 text-center">
                      <div className="text-[10px] uppercase font-mono text-zinc-500">Limite Quebra (LT)</div>
                      <div className="text-base font-bold text-zinc-300 mt-0.5 font-mono">
                        {isFieldVisible('hardnessAndBT') ? peril?.brokenThreshold ?? '—' : '???'}
                      </div>
                    </div>

                    <div className="bg-rose-950/40 p-2.5 rounded-xl border border-rose-800/60 text-center">
                      <div className="text-[10px] uppercase font-mono text-rose-400">PV Estrutural</div>
                      <div className="text-base font-black text-rose-200 mt-0.5 font-mono">
                        {isFieldVisible('hpAndHealth') ? (peril?.hp ? `${peril.hp} PV` : '—') : '??? PV'}
                      </div>
                    </div>

                    <div className="bg-black/50 p-2.5 rounded-xl border border-zinc-800 text-center">
                      <div className="text-[10px] uppercase font-mono text-zinc-500">CA</div>
                      <div className="text-base font-bold text-zinc-100 mt-0.5 font-mono">
                        {isFieldVisible('acAndDefenses') ? peril?.ac ?? '—' : '???'}
                      </div>
                    </div>
                  </div>

                  {/* Imunidades & Fraquezas */}
                  <div className="pt-2 border-t border-zinc-800/60 space-y-1 text-xs text-zinc-300">
                    <div>
                      <strong className="text-zinc-100">Imunidades:</strong>{' '}
                      {isFieldVisible('immunities')
                        ? peril?.immunities && peril.immunities.length > 0
                          ? peril.immunities.join(', ')
                          : 'Imunidades de objeto (acertos críticos, dano mental, veneno, sono, atordoamento)'
                        : '🔒 Oculto'}
                    </div>

                    {peril?.weaknesses && peril.weaknesses.length > 0 && (
                      <div>
                        <strong className="text-rose-400">Fraquezas:</strong>{' '}
                        {isFieldVisible('weaknessesAndResistances') ? (
                          <span className="text-rose-300 font-semibold">{peril.weaknesses.join(', ')}</span>
                        ) : (
                          '🔒 Oculto'
                        )}
                      </div>
                    )}

                    {peril?.resistances && peril.resistances.length > 0 && (
                      <div>
                        <strong className="text-cyan-400">Resistências:</strong>{' '}
                        {isFieldVisible('weaknessesAndResistances') ? (
                          <span className="text-cyan-300 font-semibold">{peril.resistances.join(', ')}</span>
                        ) : (
                          '🔒 Oculto'
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Gatilho & Reação de Disparo */}
                {(peril?.routine || (peril?.actions && peril.actions.length > 0) || (peril?.attacks && peril.attacks.length > 0)) && (
                  <div className="p-4 rounded-2xl bg-[#120e20] border border-rose-900/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                        <Zap className="w-3.5 h-3.5 text-rose-400" />
                        Gatilho & Reação de Disparo
                      </span>
                      {renderEyeToggle('actionsAndAbilities', 'Reação')}
                    </div>

                    {isFieldVisible('actionsAndAbilities') ? (
                      <div className="space-y-2 text-xs">
                        {peril?.routine && (
                          <div className="p-3 rounded-xl bg-black/50 border border-zinc-800 text-zinc-200 leading-relaxed">
                            <strong className="text-rose-300 font-mono">Efeito de Disparo: </strong>
                            {peril.routine}
                          </div>
                        )}

                        {peril?.attacks && peril.attacks.map((atk) => (
                          <div key={atk.id} className="p-2.5 rounded-xl bg-black/40 border border-zinc-800 flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-zinc-100">[Reação] {atk.name}</span>
                            <span className="font-mono text-cyan-300 font-bold">+{atk.bonus}</span>
                            <span className="text-rose-300 font-mono font-semibold">{atk.damage}</span>
                            {atk.extraEffects && <span className="text-zinc-400">({atk.extraEffects})</span>}
                          </div>
                        ))}

                        {peril?.actions && peril.actions.map((act) => (
                          <div key={act.id} className="p-2.5 rounded-xl bg-black/40 border border-zinc-800 space-y-1">
                            <div className="font-bold text-zinc-100 flex items-center gap-2">
                              <span className="text-amber-400 font-mono">[{act.cost}]</span>
                              <span>{act.name}</span>
                            </div>
                            {act.trigger && (
                              <div className="text-amber-300/90 text-[11px]">
                                <strong>Gatilho:</strong> {act.trigger}
                              </div>
                            )}
                            <p className="text-zinc-300">{act.effect}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-zinc-500 italic">
                        🔒 Gatilho e efeito de disparo ocultos.
                      </div>
                    )}
                  </div>
                )}

                {/* Reset / Rearme */}
                {peril?.reset && (
                  <div className="p-3.5 rounded-2xl bg-[#0f0b1a] border border-zinc-800/80 flex items-start gap-2.5 text-xs text-zinc-300">
                    <RotateCcw className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-zinc-100 font-mono">Rearme & Reset: </strong>
                      <span>{peril.reset}</span>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ────────────────── 3. PERIGO COMPLEXO (HAZARD COMPLEX) ────────────────── */}
            {isComplexHazard && (
              <>
                {/* Iniciativa & Detecção */}
                <div className="p-4 rounded-2xl bg-[#120e20] border border-cyan-900/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                      <Zap className="w-3.5 h-3.5 text-cyan-400" />
                      Iniciativa & Detecção
                    </span>
                    {renderEyeToggle('sensesAndPerception', 'Iniciativa')}
                  </div>

                  {isFieldVisible('sensesAndPerception') ? (
                    <div className="text-xs text-zinc-300 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-zinc-100">Furtividade / Iniciativa:</strong>
                        <span className="px-2.5 py-0.5 rounded-lg bg-cyan-950/60 text-cyan-200 border border-cyan-800/50 font-mono font-bold">
                          {peril?.stealthCheck || 'Furtividade +15 (ou rola iniciativa)'}
                        </span>
                      </div>
                      {peril?.senses && (
                        <div>
                          <strong className="text-zinc-100">Sentidos:</strong>{' '}
                          <span className="text-zinc-300">{peril.senses}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-500 italic">
                      🔒 Iniciativa oculta até o início do combate tático.
                    </div>
                  )}
                </div>

                {/* Desativação em Encontro Tático */}
                <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                      <Wrench className="w-3.5 h-3.5 text-amber-400" />
                      Desativação em Encontro Tático
                    </span>
                    {renderEyeToggle('disableAndReset', 'Desativação')}
                  </div>

                  {isFieldVisible('disableAndReset') ? (
                    <div className="p-3 rounded-xl bg-black/50 border border-amber-800/50 text-xs text-amber-100 leading-relaxed font-sans">
                      {peril?.disable || 'Ladinagem ou perícias mágicas durante o combate com sucessos progressivos.'}
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-500 italic">
                      🔒 Métodos de desativação tática ocultos pelo Mestre.
                    </div>
                  )}
                </div>

                {/* Defesas Estruturais & Salvamentos */}
                <div className="p-4 rounded-2xl bg-[#120e20] border border-zinc-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                      <Shield className="w-3.5 h-3.5 text-rose-400" />
                      Defesas Estruturais & Salvamentos
                    </span>
                    <div className="flex items-center gap-2">
                      {renderEyeToggle('acAndDefenses', 'CA & Saves')}
                      {renderEyeToggle('hardnessAndBT', 'Dureza')}
                      {renderEyeToggle('hpAndHealth', 'PV')}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
                    <div className="bg-black/50 p-2 rounded-xl border border-zinc-800 text-center">
                      <div className="text-[10px] uppercase font-mono text-zinc-500">CA</div>
                      <div className="text-sm font-bold text-zinc-100 mt-0.5 font-mono">
                        {isFieldVisible('acAndDefenses') ? peril?.ac ?? '—' : '???'}
                      </div>
                    </div>

                    <div className="bg-black/50 p-2 rounded-xl border border-zinc-800 text-center">
                      <div className="text-[10px] uppercase font-mono text-zinc-500">Fort</div>
                      <div className="text-sm font-bold text-zinc-100 mt-0.5 font-mono">
                        {isFieldVisible('acAndDefenses') ? (peril?.fort !== undefined ? `+${peril.fort}` : '—') : '???'}
                      </div>
                    </div>

                    <div className="bg-black/50 p-2 rounded-xl border border-zinc-800 text-center">
                      <div className="text-[10px] uppercase font-mono text-zinc-500">Ref</div>
                      <div className="text-sm font-bold text-zinc-100 mt-0.5 font-mono">
                        {isFieldVisible('acAndDefenses') ? (peril?.ref !== undefined ? `+${peril.ref}` : '—') : '???'}
                      </div>
                    </div>

                    <div className="bg-black/50 p-2 rounded-xl border border-zinc-800 text-center">
                      <div className="text-[10px] uppercase font-mono text-zinc-500">Dureza</div>
                      <div className="text-sm font-bold text-amber-300 mt-0.5 font-mono">
                        {isFieldVisible('hardnessAndBT') ? peril?.hardness ?? '—' : '???'}
                      </div>
                    </div>

                    <div className="bg-black/50 p-2 rounded-xl border border-zinc-800 text-center">
                      <div className="text-[10px] uppercase font-mono text-zinc-500">LT</div>
                      <div className="text-sm font-bold text-zinc-300 mt-0.5 font-mono">
                        {isFieldVisible('hardnessAndBT') ? peril?.brokenThreshold ?? '—' : '???'}
                      </div>
                    </div>

                    <div className="bg-rose-950/40 p-2 rounded-xl border border-rose-800/60 text-center">
                      <div className="text-[10px] uppercase font-mono text-rose-400">PV</div>
                      <div className="text-sm font-black text-rose-200 mt-0.5 font-mono">
                        {isFieldVisible('hpAndHealth') ? (peril?.hp ? `${peril.hp}` : '—') : '???'}
                      </div>
                    </div>
                  </div>

                  {/* Imunidades & Fraquezas */}
                  <div className="pt-2 border-t border-zinc-800/60 space-y-1 text-xs text-zinc-300">
                    <div>
                      <strong className="text-zinc-100">Imunidades:</strong>{' '}
                      {isFieldVisible('immunities')
                        ? peril?.immunities && peril.immunities.length > 0
                          ? peril.immunities.join(', ')
                          : 'Imunidades de objeto (acertos críticos, dano mental, veneno, sono)'
                        : '🔒 Oculto'}
                    </div>

                    {peril?.weaknesses && peril.weaknesses.length > 0 && (
                      <div>
                        <strong className="text-rose-400">Fraquezas:</strong>{' '}
                        {isFieldVisible('weaknessesAndResistances') ? (
                          <span className="text-rose-300 font-semibold">{peril.weaknesses.join(', ')}</span>
                        ) : (
                          '🔒 Oculto'
                        )}
                      </div>
                    )}

                    {peril?.resistances && peril.resistances.length > 0 && (
                      <div>
                        <strong className="text-cyan-400">Resistências:</strong>{' '}
                        {isFieldVisible('weaknessesAndResistances') ? (
                          <span className="text-cyan-300 font-semibold">{peril.resistances.join(', ')}</span>
                        ) : (
                          '🔒 Oculto'
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Rotina de Combate (Turno do Perigo) */}
                <div className="p-4 rounded-2xl bg-orange-950/20 border border-orange-700/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-orange-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                      <Activity className="w-3.5 h-3.5 text-orange-400" />
                      Rotina de Combate (Turno do Perigo)
                    </span>
                    {renderEyeToggle('routine', 'Rotina')}
                  </div>

                  {isFieldVisible('routine') ? (
                    <div className="space-y-2 text-xs">
                      {peril?.routine && (
                        <div className="p-3 rounded-xl bg-black/50 border border-orange-900/50 text-zinc-200 leading-relaxed font-sans">
                          {peril.routine}
                        </div>
                      )}

                      {peril?.attacks && peril.attacks.map((atk) => (
                        <div key={atk.id} className="p-2.5 rounded-xl bg-black/40 border border-zinc-800 flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-zinc-100">[1 ação] {atk.name}</span>
                          <span className="font-mono text-cyan-300 font-bold">+{atk.bonus}</span>
                          <span className="text-rose-300 font-mono font-semibold">{atk.damage}</span>
                          {atk.extraEffects && <span className="text-zinc-400">({atk.extraEffects})</span>}
                        </div>
                      ))}

                      {peril?.actions && peril.actions.map((act) => (
                        <div key={act.id} className="p-2.5 rounded-xl bg-black/40 border border-zinc-800 space-y-1">
                          <div className="font-bold text-zinc-100 flex items-center gap-2">
                            <span className="text-orange-400 font-mono">[{act.cost}]</span>
                            <span>{act.name}</span>
                          </div>
                          {act.trigger && (
                            <div className="text-amber-300/90 text-[11px]">
                              <strong>Gatilho:</strong> {act.trigger}
                            </div>
                          )}
                          <p className="text-zinc-300">{act.effect}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-500 italic">
                      🔒 Ações e rotina de combate ocultas pelo Mestre.
                    </div>
                  )}
                </div>

                {/* Reset / Desativação Permanente */}
                {peril?.reset && (
                  <div className="p-3.5 rounded-2xl bg-[#0f0b1a] border border-zinc-800/80 flex items-start gap-2.5 text-xs text-zinc-300">
                    <RotateCcw className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-zinc-100 font-mono">Reset & Neutralização: </strong>
                      <span>{peril.reset}</span>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ────────────────── 4. PERIGO AMBIENTAL (ENVIRONMENTAL) ────────────────── */}
            {isEnvironmental && (
              <>
                {/* Detecção & Observação do Bioma */}
                <div className="p-4 rounded-2xl bg-[#120e20] border border-emerald-900/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                      <Eye className="w-3.5 h-3.5 text-emerald-400" />
                      Detecção & Observação Ambiental
                    </span>
                    {renderEyeToggle('sensesAndPerception', 'Detecção')}
                  </div>

                  {isFieldVisible('sensesAndPerception') ? (
                    <div className="text-xs text-zinc-300 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-zinc-100">Identificação / Detecção:</strong>
                        <span className="px-2.5 py-0.5 rounded-lg bg-emerald-950/60 text-emerald-200 border border-emerald-800/50 font-mono font-bold">
                          {peril?.stealthCheck || 'Sobrevivência ou Natureza para prever a anomalia'}
                        </span>
                      </div>
                      {peril?.senses && (
                        <div>
                          <strong className="text-zinc-100">Área / Escopo:</strong>{' '}
                          <span className="text-zinc-300">{peril.senses}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-500 italic">
                      🔒 Sinais climáticos e pistas ocultas (teste de Sobrevivência ou Natureza para prever).
                    </div>
                  )}
                </div>

                {/* Superação & Sobrevivência (Overcoming) */}
                <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                      <Footprints className="w-3.5 h-3.5 text-emerald-400" />
                      Superação & Sobrevivência (Overcoming)
                    </span>
                    {renderEyeToggle('disableAndReset', 'Superação')}
                  </div>

                  {isFieldVisible('disableAndReset') ? (
                    <div className="p-3 rounded-xl bg-black/50 border border-emerald-800/50 text-xs text-emerald-100 leading-relaxed font-sans">
                      {peril?.disable || 'Sobrevivência para encontrar abrigo, Atletismo para transpor ou testes de Fortitude.'}
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-500 italic">
                      🔒 Procedimentos de sobrevivência ocultos (teste de Sobrevivência para deduzir).
                    </div>
                  )}
                </div>

                {/* Efeito Climático & Dano Ambiental */}
                {(peril?.routine || (peril?.actions && peril.actions.length > 0)) && (
                  <div className="p-4 rounded-2xl bg-[#120e20] border border-zinc-800/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                        <Flame className="w-3.5 h-3.5 text-emerald-400" />
                        Efeito Climático & Dano Ambiental
                      </span>
                      {renderEyeToggle('routine', 'Efeito')}
                    </div>

                    {isFieldVisible('routine') ? (
                      <div className="space-y-2 text-xs">
                        {peril?.routine && (
                          <div className="p-3 rounded-xl bg-black/50 border border-zinc-800 text-zinc-200 leading-relaxed">
                            {peril.routine}
                          </div>
                        )}

                        {peril?.actions && peril.actions.map((act) => (
                          <div key={act.id} className="p-2.5 rounded-xl bg-black/40 border border-zinc-800 space-y-1">
                            <div className="font-bold text-zinc-100 flex items-center gap-2">
                              <span className="text-emerald-400 font-mono">[{act.cost}]</span>
                              <span>{act.name}</span>
                            </div>
                            <p className="text-zinc-300">{act.effect}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-zinc-500 italic">
                        🔒 Dados de exposição e severidade climática ocultos.
                      </div>
                    )}
                  </div>
                )}

                {/* Resiliência & Imunidades do Bioma */}
                <div className="p-4 rounded-2xl bg-[#120e20] border border-zinc-800/80 space-y-2 text-xs text-zinc-300">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <Shield className="w-3.5 h-3.5 text-rose-400" />
                    Resiliência & Imunidades do Ambiente
                  </span>

                  <div className="pt-2 space-y-1">
                    <div>
                      <strong className="text-zinc-100">Imunidades do Ambiente:</strong>{' '}
                      {isFieldVisible('immunities')
                        ? peril?.immunities && peril.immunities.length > 0
                          ? peril.immunities.join(', ')
                          : 'Imune a ataques físicos convencionais, dano de precisão e efeitos mentais'
                        : '🔒 Oculto'}
                    </div>

                    {peril?.weaknesses && peril.weaknesses.length > 0 && (
                      <div>
                        <strong className="text-rose-400">Fraquezas Ambientais:</strong>{' '}
                        {isFieldVisible('weaknessesAndResistances') ? (
                          <span className="text-rose-300 font-semibold">{peril.weaknesses.join(', ')}</span>
                        ) : (
                          '🔒 Oculto'
                        )}
                      </div>
                    )}

                    {peril?.resistances && peril.resistances.length > 0 && (
                      <div>
                        <strong className="text-cyan-400">Resistências:</strong>{' '}
                        {isFieldVisible('weaknessesAndResistances') ? (
                          <span className="text-cyan-300 font-semibold">{peril.resistances.join(', ')}</span>
                        ) : (
                          '🔒 Oculto'
                        )}
                      </div>
                    )}

                    {/* Dureza ou PV de barreiras físicas (ex: desabamento de pedras, geleira) */}
                    {(peril?.hardness !== undefined || peril?.hp !== undefined) && (
                      <div className="pt-1 flex items-center gap-3 text-zinc-300 font-mono">
                        {peril.hardness !== undefined && <span>Dureza da Barreira: <strong>{peril.hardness}</strong></span>}
                        {peril.hp !== undefined && <span>PV para Escavar/Quebrar: <strong>{peril.hp} PV</strong></span>}
                      </div>
                    )}
                  </div>
                </div>

                {/* Duração & Ciclo Climático */}
                {peril?.reset && (
                  <div className="p-3.5 rounded-2xl bg-[#0f0b1a] border border-zinc-800/80 flex items-start gap-2.5 text-xs text-zinc-300">
                    <Clock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-zinc-100 font-mono">Duração & Ciclo: </strong>
                      <span>{peril.reset}</span>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ────────────────── 5. ASSOMBRAÇÃO (HAUNT) ────────────────── */}
            {isHaunt && (
              <>
                {/* Sensibilidade & Furtividade Espiritual */}
                <div className="p-4 rounded-2xl bg-[#120e20] border border-purple-900/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                      <Ghost className="w-3.5 h-3.5 text-purple-400" />
                      Sensibilidade & Furtividade Espiritual
                    </span>
                    {renderEyeToggle('sensesAndPerception', 'Sensibilidade')}
                  </div>

                  {isFieldVisible('sensesAndPerception') ? (
                    <div className="text-xs text-zinc-300 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-zinc-100">Detecção Sobrenatural:</strong>
                        <span className="px-2.5 py-0.5 rounded-lg bg-purple-950/60 text-purple-200 border border-purple-800/50 font-mono font-bold">
                          {peril?.stealthCheck || 'Ocultismo ou Religião CD 20 para sentir o calafrio espectral'}
                        </span>
                      </div>
                      {peril?.senses && (
                        <div>
                          <strong className="text-zinc-100">Assinatura Espectral:</strong>{' '}
                          <span className="text-zinc-300">{peril.senses}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-500 italic">
                      🔒 Presença espiritual imperceptível (teste de Ocultismo ou Religião para pressentir).
                    </div>
                  )}
                </div>

                {/* Exorcismo & Apaziguamento (Disable) */}
                <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                      <Sparkle className="w-3.5 h-3.5 text-purple-400" />
                      Exorcismo & Apaziguamento (Disable)
                    </span>
                    {renderEyeToggle('disableAndReset', 'Exorcismo')}
                  </div>

                  {isFieldVisible('disableAndReset') ? (
                    <div className="p-3 rounded-xl bg-black/50 border border-purple-800/50 text-xs text-purple-100 leading-relaxed font-sans">
                      {peril?.disable || 'Religião para consagrar o local, Ocultismo para banir ou Diplomacia para apaziguar o espírito.'}
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-500 italic">
                      🔒 Métodos de exorcismo ocultos (teste de Religião ou Ocultismo para descobrir como apaziguar).
                    </div>
                  )}
                </div>

                {/* Defesas Espirituais & Fraquezas Sagradas */}
                <div className="p-4 rounded-2xl bg-[#120e20] border border-zinc-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                      Defesas Espirituais & Fraquezas Sagradas
                    </span>
                    <div className="flex items-center gap-2">
                      {renderEyeToggle('weaknessesAndResistances', 'Fraquezas')}
                      {renderEyeToggle('hpAndHealth', 'PV Espiritual')}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div className="bg-purple-950/30 p-2.5 rounded-xl border border-purple-800/50 text-center">
                      <div className="text-[10px] uppercase font-mono text-purple-400">PV Espiritual</div>
                      <div className="text-base font-black text-purple-200 mt-0.5 font-mono">
                        {isFieldVisible('hpAndHealth') ? (peril?.hp ? `${peril.hp} PV` : 'Incorpóreo') : '???'}
                      </div>
                    </div>

                    <div className="bg-black/50 p-2.5 rounded-xl border border-zinc-800 text-center">
                      <div className="text-[10px] uppercase font-mono text-zinc-500">CA da Manifestação</div>
                      <div className="text-base font-bold text-zinc-100 mt-0.5 font-mono">
                        {isFieldVisible('acAndDefenses') ? peril?.ac ?? '—' : '???'}
                      </div>
                    </div>

                    <div className="bg-black/50 p-2.5 rounded-xl border border-zinc-800 text-center">
                      <div className="text-[10px] uppercase font-mono text-zinc-500">Dureza Espectral</div>
                      <div className="text-base font-bold text-zinc-300 mt-0.5 font-mono">
                        {isFieldVisible('hardnessAndBT') ? peril?.hardness ?? '—' : '???'}
                      </div>
                    </div>
                  </div>

                  {/* Fraquezas Sagradas & Imunidades */}
                  <div className="pt-2 border-t border-zinc-800/60 space-y-1.5 text-xs text-zinc-300">
                    <div>
                      <strong className="text-rose-400 font-bold">Fraquezas Sagradas:</strong>{' '}
                      {isFieldVisible('weaknessesAndResistances')
                        ? peril?.weaknesses && peril.weaknesses.length > 0
                          ? <span className="text-rose-300 font-semibold">{peril.weaknesses.join(', ')}</span>
                          : 'Dano positivo, feitiços de luz divina, água benta'
                        : '🔒 Oculto'}
                    </div>

                    <div>
                      <strong className="text-zinc-100">Imunidades Espectrais:</strong>{' '}
                      {isFieldVisible('immunities')
                        ? peril?.immunities && peril.immunities.length > 0
                          ? peril.immunities.join(', ')
                          : 'Imune a ataques físicos mundanos, precisão, veneno, paralisia, atordoamento'
                        : '🔒 Oculto'}
                    </div>

                    {peril?.resistances && peril.resistances.length > 0 && (
                      <div>
                        <strong className="text-cyan-400">Resistências:</strong>{' '}
                        {isFieldVisible('weaknessesAndResistances') ? (
                          <span className="text-cyan-300 font-semibold">{peril.resistances.join(', ')}</span>
                        ) : (
                          '🔒 Oculto'
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Gatilho & Manifestação Sobrenatural */}
                {(peril?.routine || (peril?.actions && peril.actions.length > 0) || (peril?.attacks && peril.attacks.length > 0)) && (
                  <div className="p-4 rounded-2xl bg-[#120e20] border border-purple-900/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                        <Flame className="w-3.5 h-3.5 text-purple-400" />
                        Gatilho & Manifestação Sobrenatural
                      </span>
                      {renderEyeToggle('actionsAndAbilities', 'Manifestação')}
                    </div>

                    {isFieldVisible('actionsAndAbilities') ? (
                      <div className="space-y-2 text-xs">
                        {peril?.routine && (
                          <div className="p-3 rounded-xl bg-black/50 border border-purple-900/50 text-zinc-200 leading-relaxed font-sans">
                            <strong className="text-purple-300 font-mono">Manifestação: </strong>
                            {peril.routine}
                          </div>
                        )}

                        {peril?.attacks && peril.attacks.map((atk) => (
                          <div key={atk.id} className="p-2.5 rounded-xl bg-black/40 border border-zinc-800 flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-purple-200">[Espiritual] {atk.name}</span>
                            <span className="font-mono text-cyan-300 font-bold">+{atk.bonus}</span>
                            <span className="text-rose-300 font-mono font-semibold">{atk.damage}</span>
                            {atk.extraEffects && <span className="text-zinc-400">({atk.extraEffects})</span>}
                          </div>
                        ))}

                        {peril?.actions && peril.actions.map((act) => (
                          <div key={act.id} className="p-2.5 rounded-xl bg-black/40 border border-zinc-800 space-y-1">
                            <div className="font-bold text-zinc-100 flex items-center gap-2">
                              <span className="text-purple-400 font-mono">[{act.cost}]</span>
                              <span>{act.name}</span>
                            </div>
                            {act.trigger && (
                              <div className="text-amber-300/90 text-[11px]">
                                <strong>Perturbação / Gatilho:</strong> {act.trigger}
                              </div>
                            )}
                            <p className="text-zinc-300">{act.effect}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-zinc-500 italic">
                        🔒 Efeitos de pavor e perturbação sobrenatural ocultos.
                      </div>
                    )}
                  </div>
                )}

                {/* Descanso Eterno & Retorno (Reset) */}
                {peril?.reset && (
                  <div className="p-3.5 rounded-2xl bg-[#0f0b1a] border border-purple-900/40 flex items-start gap-2.5 text-xs text-zinc-300">
                    <RotateCcw className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-purple-300 font-mono">Descanso Eterno & Retorno: </strong>
                      <span>{peril.reset}</span>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* SEÇÃO COMPLEMENTAR SE HOUVER DADOS HÍBRIDOS NÃO APRESENTADOS */}
            {isMonster && (peril?.disable || peril?.routine || peril?.reset) && (
              <div className="p-4 rounded-2xl bg-[#120e20] border border-amber-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    Mecânicas Especiais Adicionais
                  </span>
                  {renderEyeToggle('disableAndReset', 'Mecânicas')}
                </div>

                {isFieldVisible('disableAndReset') ? (
                  <div className="space-y-2 text-xs text-zinc-300">
                    {peril.disable && (
                      <div className="p-2.5 rounded-xl bg-black/40 border border-zinc-800">
                        <strong className="text-amber-200">Desativação:</strong> {peril.disable}
                      </div>
                    )}
                    {peril.routine && (
                      <div className="p-2.5 rounded-xl bg-black/40 border border-zinc-800">
                        <strong className="text-zinc-100">Rotina:</strong> {peril.routine}
                      </div>
                    )}
                    {peril.reset && (
                      <div className="p-2.5 rounded-xl bg-black/40 border border-zinc-800">
                        <strong className="text-zinc-100">Reset:</strong> {peril.reset}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-zinc-500 italic">
                    🔒 Mecânicas especiais ocultas pelo Mestre.
                  </div>
                )}
              </div>
            )}

            {/* Descrição e Conteúdo Formatado */}
            {currentEntity.content && (
              <div className="pt-4 border-t border-zinc-800">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-rose-400" />
                  <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider font-mono">
                    Ecologia, Lore & Descrição
                  </h3>
                </div>
                <RichContentRenderer
                  content={currentEntity.content}
                  onNavigate={onNavigate}
                  onTagClick={onTagClick}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
