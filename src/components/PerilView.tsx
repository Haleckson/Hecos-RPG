import React, { useState } from 'react';
import { HecosEntity, PerilAttributes, PerilFieldVisibility, ItemVisibility } from '../types';
import { HecosStorage } from '../services/storage';
import { RichContentRenderer } from './RichContentRenderer';
import { AdjustableImage } from './AdjustableImage';
import { TraitBadge } from './TraitBadge';
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
  Maximize2,
  Activity,
  Edit3,
  Dna,
  Clock,
  HelpCircle,
  Dice5
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
  const currentUser = HecosStorage.getCurrentUser();
  const isActualGm = currentUser?.role === 'gm' || HecosStorage.getGmMode();

  const peril = entity.perilData;
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
      ...entity,
      perilData: updatedPerilData
    };

    HecosStorage.saveEntity(updatedEntity);
  };

  const renderEyeToggle = (fieldKey: keyof PerilFieldVisibility, label: string) => {
    if (!isActualGm) return null;
    const isVisible = (fieldVis[fieldKey] || 'gm') !== 'gm';

    return (
      <button
        type="button"
        onClick={() => handleToggleFieldVis(fieldKey)}
        title={`GM: Clique para ${isVisible ? 'Ocultar dos Jogadores' : 'Revelar aos Jogadores'} (${label})`}
        className={`ml-2 p-1 rounded-md text-[10px] font-mono transition-all border inline-flex items-center gap-1 cursor-pointer ${
          isVisible
            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800 hover:bg-emerald-900'
            : 'bg-rose-950/80 text-rose-300 border-rose-800 hover:bg-rose-900'
        }`}
      >
        {isVisible ? <Eye className="w-3 h-3 text-emerald-400" /> : <EyeOff className="w-3 h-3 text-rose-400" />}
        <span>{isVisible ? 'Revelado' : 'Oculto'}</span>
      </button>
    );
  };

  const level = peril?.level ?? entity.statblock?.level ?? 1;
  const kind = peril?.perilKind || 'monster';

  return (
    <div id="peril-view-container" className="space-y-6 max-w-4xl mx-auto text-zinc-200">
      {/* Top Banner / Statblock Header */}
      <div className="relative rounded-3xl bg-[#0f0a1c] border border-rose-900/40 overflow-hidden shadow-2xl">
        {entity.coverImage && (
          <div className="relative h-64 w-full overflow-hidden border-b border-zinc-800">
            <AdjustableImage
              src={entity.coverImage}
              alt={entity.title}
              imageKey={`peril-cover-${entity.id}`}
              isGm={isActualGm}
              containerClassName="relative w-full h-full overflow-hidden"
              imgClassName="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f0a1c] via-[#0f0a1c]/60 to-transparent pointer-events-none" />
          </div>
        )}

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-rose-950 text-rose-300 border border-rose-800 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <Skull className="w-3.5 h-3.5 text-rose-400" />
                {kind === 'monster'
                  ? 'Criatura / Monstro'
                  : kind === 'hazard_simple'
                  ? 'Perigo Simples'
                  : kind === 'hazard_complex'
                  ? 'Perigo Complexo'
                  : kind === 'environmental'
                  ? 'Perigo Ambiental'
                  : 'Assombração'}
              </span>

              <span className="px-3 py-1 rounded-xl bg-purple-950 text-purple-300 border border-purple-800 font-mono font-bold text-xs">
                Nível {isFieldVisible('level') ? level : '???'}
              </span>

              {peril?.rarity && (
                <TraitBadge trait={peril.rarity} />
              )}
            </div>

            {onEdit && isActualGm && (
              <button
                type="button"
                onClick={onEdit}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-zinc-400" />
                Editar Perigo
              </button>
            )}
          </div>

          <div>
            <h1 className="text-3xl font-black text-zinc-100 tracking-tight flex items-center">
              {isFieldVisible('name') ? entity.title : 'Entidade Desconhecida (Nome Oculto)'}
              {renderEyeToggle('name', 'Nome')}
            </h1>
            {entity.subtitle && (
              <p className="text-sm text-zinc-400 mt-1">{entity.subtitle}</p>
            )}
          </div>

          {/* Traits */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            {isFieldVisible('typeAndTraits') ? (
              (peril?.traits || entity.statblock?.traits || ['PF2e']).map((trait, idx) => (
                <TraitBadge
                  key={idx}
                  trait={trait}
                />
              ))
            ) : (
              <span className="text-xs text-zinc-500 font-mono italic">
                Traços ocultos pelo Mestre
              </span>
            )}
            {renderEyeToggle('typeAndTraits', 'Traços')}
          </div>
        </div>
      </div>

      {/* CORE STATBLOCK CARD */}
      <div className="rounded-3xl bg-[#0b0814] border border-zinc-800/80 p-6 space-y-6 shadow-xl">
        {/* Perception & Senses */}
        <div className="p-4 rounded-2xl bg-[#120e20] border border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              Percepção & Sentidos
            </span>
            {renderEyeToggle('sensesAndPerception', 'Percepção')}
          </div>

          {isFieldVisible('sensesAndPerception') ? (
            <div className="text-xs text-zinc-300 space-y-1">
              <div>
                <strong className="text-zinc-100">Percepção:</strong>{' '}
                {peril?.perception !== undefined ? `+${peril.perception}` : '+0'};{' '}
                <span className="text-zinc-400">{peril?.senses || entity.statblock?.senses || 'Visão Padrão'}</span>
              </div>
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
            </div>
          ) : (
            <div className="text-xs text-zinc-500 italic">
              🔒 Sentidos e Percepção ocultos (faça um teste de Recordar Conhecimento).
            </div>
          )}
        </div>

        {/* Defenses & Saves Grid */}
        <div className="p-4 rounded-2xl bg-[#120e20] border border-zinc-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
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
                {isFieldVisible('acAndDefenses') ? peril?.ac || entity.statblock?.ac || '—' : '???'}
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

            <div className="bg-rose-950/40 p-2.5 rounded-xl border border-rose-800/60 text-center">
              <div className="text-[10px] uppercase font-mono text-rose-400">PV (HP)</div>
              <div className="text-base font-black text-rose-200 mt-0.5">
                {isFieldVisible('hpAndHealth') ? `${peril?.hp || entity.statblock?.hp || '—'} PV` : '??? PV'}
              </div>
            </div>
          </div>

          {/* Hardness, Weaknesses, Resistances, Immunities */}
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

        {/* Speed & Strikes */}
        {peril?.attacks && peril.attacks.length > 0 && (
          <div className="p-4 rounded-2xl bg-[#120e20] border border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Swords className="w-3.5 h-3.5 text-amber-400" />
                Golpes & Ataques
              </span>
              {renderEyeToggle('attacksAndDamage', 'Ataques')}
            </div>

            {isFieldVisible('attacksAndDamage') ? (
              <div className="space-y-2">
                {peril.attacks.map((atk) => (
                  <div key={atk.id} className="p-2.5 rounded-xl bg-black/50 border border-zinc-800 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-100">
                        {atk.type === 'melee' ? 'Corpo a Corpo [1 ação]' : 'À Distância [1 ação]'} {atk.name}
                      </span>
                      <span className="font-mono text-cyan-300 font-bold">+{atk.bonus}</span>
                      {atk.traits && atk.traits.length > 0 && (
                        <span className="text-zinc-400 text-[11px]">({atk.traits.join(', ')})</span>
                      )}
                    </div>
                    <div className="text-zinc-300 mt-0.5">
                      <strong>Dano:</strong> <span className="text-rose-300 font-mono">{atk.damage}</span>
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

        {/* Actions & Reactions */}
        {peril?.actions && peril.actions.length > 0 && (
          <div className="p-4 rounded-2xl bg-[#120e20] border border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-purple-400" />
                Ações Especiais & Reações
              </span>
              {renderEyeToggle('actionsAndAbilities', 'Ações')}
            </div>

            {isFieldVisible('actionsAndAbilities') ? (
              <div className="space-y-2">
                {peril.actions.map((act) => (
                  <div key={act.id} className="p-2.5 rounded-xl bg-black/50 border border-zinc-800 text-xs space-y-1">
                    <div className="font-bold text-zinc-100 flex items-center gap-1.5">
                      <span className="text-amber-400 font-mono font-bold">[{act.cost}]</span>
                      {act.name}
                      {act.traits && act.traits.length > 0 && (
                        <span className="text-zinc-400 text-[11px] font-normal">({act.traits.join(', ')})</span>
                      )}
                    </div>
                    {act.trigger && (
                      <div className="text-amber-300/80 text-[11px]">
                        <strong>Gatilho:</strong> {act.trigger}
                      </div>
                    )}
                    <p className="text-zinc-300 leading-relaxed">{act.effect}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-zinc-500 italic">
                🔒 Ações especiais ocultas pelo Mestre.
              </div>
            )}
          </div>
        )}

        {/* Hazard Mechanics (Disable & Routine) */}
        {(peril?.disable || peril?.routine || peril?.reset) && (
          <div className="p-4 rounded-2xl bg-[#120e20] border border-amber-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                Mecânicas de Perigo / Armadilha
              </span>
              {renderEyeToggle('disableAndReset', 'Desativação')}
            </div>

            {isFieldVisible('disableAndReset') ? (
              <div className="space-y-2 text-xs text-zinc-300">
                {peril.disable && (
                  <div>
                    <strong className="text-zinc-100">Desativação (Disable):</strong> {peril.disable}
                  </div>
                )}
                {peril.routine && (
                  <div>
                    <strong className="text-zinc-100">Rotina (Routine):</strong> {peril.routine}
                  </div>
                )}
                {peril.reset && (
                  <div>
                    <strong className="text-zinc-100">Reset:</strong> {peril.reset}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-zinc-500 italic">
                🔒 Métodos de desativação ocultos (faça um teste de Ladinagem ou Percepção para descobrir).
              </div>
            )}
          </div>
        )}

        {/* Description & Markdown Content */}
        {entity.content && (
          <div className="pt-4 border-t border-zinc-800">
            <RichContentRenderer
              content={entity.content}
              onNavigate={onNavigate}
              onTagClick={onTagClick}
            />
          </div>
        )}
      </div>
    </div>
  );
};
