import React, { useState, useEffect, useMemo } from 'react';
import {
  HecosEntity,
  NPCAttributes,
  NPCFieldVisibility,
  NPCLootItem,
  NPCRelationship,
  NPCRumor,
  NPCQuestLink,
  ItemVisibility
} from '../types';
import { HecosStorage } from '../services/storage';
import { MutualLinkService, LinkedEntitiesForNPC } from '../services/mutualLinkService';
import { RichContentRenderer } from './RichContentRenderer';
import { AdjustableImage } from './AdjustableImage';
import { TraitBadge } from './TraitBadge';
import { EntityIcon } from './EntityIcon';
import { Tooltip } from './Tooltip';
import { ItemDrawer } from './ItemDrawer';
import { sortTraitsHierarchically } from '../utils/traitUtils';
import { DISPOSITION_CONFIG } from '../utils/npcSerializer';
import {
  User,
  Shield,
  Heart,
  Eye,
  EyeOff,
  Swords,
  Zap,
  Sparkles,
  Lock,
  Unlock,
  Edit3,
  Trash2,
  Share2,
  Folder,
  Compass,
  MapPin,
  Briefcase,
  Quote,
  Volume2,
  Smile,
  Flame,
  Coins,
  History,
  MessageSquare,
  AlertTriangle,
  Package,
  ChevronDown,
  Activity,
  Footprints,
  Brain,
  Crosshair,
  BookOpen,
  Dna,
  Users,
  Award,
  Clock,
  Sparkle,
  Layers,
  Link2,
  Sliders,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  Building2,
  Scroll,
  Flag
} from 'lucide-react';

interface NPCViewProps {
  entity: HecosEntity;
  onEdit?: () => void;
  onDelete?: () => void;
  onNavigate: (id: string) => void;
  onTagClick: (tag: string) => void;
}

export type NPCTabType = 'profile' | 'combat' | 'social' | 'inventory' | 'backlinks';

export const NPCView: React.FC<NPCViewProps> = ({
  entity,
  onEdit,
  onDelete,
  onNavigate,
  onTagClick,
}) => {
  const [currentEntity, setCurrentEntity] = useState<HecosEntity>(entity);
  const [activeTab, setActiveTab] = useState<NPCTabType>('profile');
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

  const allEntities = HecosStorage.getEntities();
  const npc: Partial<NPCAttributes> = currentEntity.npcData || {};

  // Mutual Linking resolution
  const linkedData: LinkedEntitiesForNPC = useMemo(() => {
    return MutualLinkService.getLinkedForNPC(currentEntity, allEntities);
  }, [currentEntity, allEntities]);

  // Visibility dictionary for granular permissions
  const fieldVis: NPCFieldVisibility = useMemo(() => {
    return npc?.fieldVisibility || {};
  }, [npc?.fieldVisibility]);

  // Check if a field is configured as revealed (for GM display & toggle states)
  const isFieldRevealed = (fieldKey: string, defaultVis: ItemVisibility = 'all'): boolean => {
    const val = fieldVis[fieldKey];
    if (val === undefined || val === null) {
      return defaultVis === 'all';
    }
    if (typeof val === 'boolean') {
      return val;
    }
    return val !== 'gm';
  };

  // Check if a field is visible to the currently active user
  const isFieldVisible = (fieldKey: string, defaultVis: ItemVisibility = 'all'): boolean => {
    if (isActualGm) return true; // GM always sees all information in GM mode
    const val = fieldVis[fieldKey];
    if (val === undefined || val === null) {
      return defaultVis === 'all';
    }
    if (typeof val === 'boolean') {
      return val;
    }
    if (val === 'all') return true;
    if (val === 'gm') return false;
    if (val === 'custom' && currentUser) {
      const allowed = fieldVis.allowedUsers?.[fieldKey] || [];
      return allowed.includes(currentUser.id);
    }
    return false;
  };

  // Toggle field visibility directly from the view (GM only)
  const handleToggleFieldVis = (fieldKey: string, defaultVis: ItemVisibility = 'all') => {
    if (!isActualGm) return;

    const currentIsRevealed = isFieldRevealed(fieldKey, defaultVis);
    const nextVis: ItemVisibility = currentIsRevealed ? 'gm' : 'all';

    const updatedNpcData: NPCAttributes = {
      ...(currentEntity.npcData || {}),
      fieldVisibility: {
        ...fieldVis,
        [fieldKey]: nextVis
      }
    };

    const updatedEntity: HecosEntity = {
      ...currentEntity,
      npcData: updatedNpcData
    };

    HecosStorage.saveEntity(updatedEntity);
    setCurrentEntity(updatedEntity);
  };

  // Quick Action: Reveal All / Hide All or Hide Sensitive Data
  const handleSetAllVisibility = (mode: 'all_visible' | 'all_hidden' | 'hide_sensitive') => {
    if (!isActualGm) return;

    const newFieldVis: Record<string, ItemVisibility> = { ...fieldVis };

    // Standard list of keys
    const coreKeys = [
      'portraitImage', 'tokenImage', 'level', 'disposition', 'role', 'traits',
      'subcategories', 'locationFactionCard', 'identityBlock', 'occupation',
      'location', 'ancestry', 'faction', 'wealth', 'alignment', 'ageAndPronouns',
      'psychologyBlock', 'voiceAndSpeech', 'personality', 'appearance', 'canOffer',
      'narrativeLore', 'combatStats', 'acAndDefenses', 'hpAndHealth', 'perceptionAndSenses',
      'speed', 'keySkills', 'specialAbilities', 'relationships', 'questsAndRumors',
      'quests', 'rumors', 'inventory', 'currency', 'loot', 'backlinks', 'linkedLocations',
      'linkedOrganizations'
    ];

    const sensitiveKeys = [
      'motivations', 'triggers', 'secrets', 'combatStats', 'acAndDefenses',
      'hpAndHealth', 'perceptionAndSenses', 'specialAbilities', 'currency', 'loot'
    ];

    // Collect all dynamic item keys
    const dynamicKeys: string[] = [];
    const rawT = (npc.traits && npc.traits.length > 0)
      ? npc.traits
      : (currentEntity.traits && currentEntity.traits.length > 0)
      ? currentEntity.traits
      : (currentEntity.tags || []);
    rawT.forEach(t => dynamicKeys.push(`tag_${t}`));

    const subc = currentEntity.subcategories || (currentEntity.subcategory ? [currentEntity.subcategory] : []);
    subc.forEach(s => dynamicKeys.push(`folder_${s}`));

    (npc.relationships || []).forEach(r => dynamicKeys.push(`rel_${r.id}`));
    (npc.quests || []).forEach(q => dynamicKeys.push(`quest_${q.id}`));
    (npc.rumors || []).forEach(r => dynamicKeys.push(`rumor_${r.id}`));
    (npc.loot || npc.inventory || []).forEach((item, idx) => dynamicKeys.push(`loot_${item.id || idx}`));
    linkedData.locations.forEach(loc => dynamicKeys.push(`location_${loc.id}`));
    linkedData.organizations.forEach(org => dynamicKeys.push(`org_${org.id}`));

    if (mode === 'all_visible') {
      [...coreKeys, ...sensitiveKeys, ...dynamicKeys].forEach(k => {
        newFieldVis[k] = 'all';
      });
    } else if (mode === 'all_hidden') {
      [...coreKeys, ...sensitiveKeys, ...dynamicKeys].forEach(k => {
        newFieldVis[k] = 'gm';
      });
    } else if (mode === 'hide_sensitive') {
      // Reveal identity & basic lore, hide sensitive secrets, combat, loot
      coreKeys.forEach(k => {
        newFieldVis[k] = 'all';
      });
      dynamicKeys.forEach(k => {
        newFieldVis[k] = 'all';
      });
      sensitiveKeys.forEach(k => {
        newFieldVis[k] = 'gm';
      });
    }

    const updatedNpcData: NPCAttributes = {
      ...(currentEntity.npcData || {}),
      fieldVisibility: newFieldVis
    };

    const updatedEntity: HecosEntity = {
      ...currentEntity,
      npcData: updatedNpcData
    };

    HecosStorage.saveEntity(updatedEntity);
    setCurrentEntity(updatedEntity);
  };

  // Reusable eye toggle button with status feedback and tooltips
  const renderEyeToggle = (
    fieldKey: string,
    label: string,
    defaultVis: ItemVisibility = 'all',
    options?: {
      compact?: boolean;
      className?: string;
    }
  ) => {
    if (!isActualGm) return null;
    const isRevealed = isFieldRevealed(fieldKey, defaultVis);

    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleToggleFieldVis(fieldKey, defaultVis);
        }}
        title={`GM: Clique para ${isRevealed ? 'Ocultar dos Jogadores' : 'Revelar aos Jogadores'} (${label})`}
        className={`p-1 rounded-md text-[10px] font-mono transition-all border inline-flex items-center gap-1 cursor-pointer select-none shrink-0 ${
          isRevealed
            ? 'bg-emerald-950/90 text-emerald-300 border-emerald-700/80 hover:bg-emerald-900 shadow-[0_0_8px_rgba(16,185,129,0.25)]'
            : 'bg-rose-950/90 text-rose-300 border-rose-700/80 hover:bg-rose-900 shadow-[0_0_8px_rgba(244,63,94,0.25)]'
        } ${options?.className || ''}`}
      >
        {isRevealed ? (
          <Eye className="w-3 h-3 text-emerald-400" />
        ) : (
          <EyeOff className="w-3 h-3 text-rose-400" />
        )}
        {!options?.compact && (
          <span className="font-semibold">{isRevealed ? 'Revelado' : 'Oculto'}</span>
        )}
      </button>
    );
  };

  // Extract GM Secret Notes (STRICTLY GM-ONLY)
  const gmSecretNotes = useMemo(() => {
    if (npc?.gmSecret && npc.gmSecret.trim()) return npc.gmSecret.trim();
    if (npc?.gmNotes && npc.gmNotes.trim()) return npc.gmNotes.trim();
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
  }, [npc?.gmSecret, npc?.gmNotes, currentEntity.gmNotes, currentEntity.content]);

  // Clean content for tab narrative lore rendering
  const cleanContentForNarrative = useMemo(() => {
    if (!currentEntity.content) return '';
    return currentEntity.content
      .replace(/:::gm(?:-only)?\s*[\s\S]*?:::/gi, '')
      .replace(/:::secret\s*[\s\S]*?:::/gi, '')
      .trim();
  }, [currentEntity.content]);

  // Meta & Identity
  const level = npc.level ?? currentEntity.statblock?.level;
  const disposition = npc.disposition ? DISPOSITION_CONFIG[npc.disposition] : null;
  const role = npc.role || npc.occupation || currentEntity.subtitle || 'Habitante';
  const occupation = npc.occupation || npc.role;
  const location = npc.location;
  const ancestry = npc.ancestry;
  const heritage = npc.heritage;
  const faction = npc.faction || npc.organization;
  const wealth = npc.wealth;
  const size = npc.size || currentEntity.statblock?.size || 'Médio';
  const age = npc.age;
  const pronouns = npc.pronouns;
  const alignment = npc.alignment;

  // Combat Stats
  const hasCombatStats = Boolean(npc.hasCombatStats || (currentEntity.statblock && (currentEntity.statblock.hp || currentEntity.statblock.ac)) || npc.hp || npc.ac || npc.saves);
  const hp = npc.hp ?? currentEntity.statblock?.hp;
  const ac = npc.ac ?? currentEntity.statblock?.ac;
  const perception = npc.perception ?? currentEntity.statblock?.perception;
  const speed = npc.speed ?? currentEntity.statblock?.speed;
  const saves = npc.saves;
  const keySkills = npc.keySkills;
  const specialAbilities = npc.specialAbilities;

  // Psychology / Social
  const voice = npc.voice || npc.voiceAndSpeech;
  const mannerisms = npc.mannerisms;
  const personality = npc.personality;
  const motivations = npc.motivations || npc.motivation;
  const appearance = npc.appearance;
  const firstImpression = npc.firstImpression;
  const triggers = npc.triggers;
  const canOffer = npc.canOffer;
  const secrets = npc.secrets;

  // Lists
  const relationships: NPCRelationship[] = npc.relationships || [];
  const rumors: NPCRumor[] = npc.rumors || [];
  const quests: NPCQuestLink[] = npc.quests || [];
  const lootItems: NPCLootItem[] = npc.loot || npc.inventory || [];
  const currency = npc.currency;

  // Images
  const portraitImage = currentEntity.coverImage || npc.portraitImage;
  const tokenImage = npc.tokenImage || currentEntity.icon;

  // Traits (with permission filtering for non-GMs)
  const rawTraits = (npc.traits && npc.traits.length > 0)
    ? npc.traits
    : (currentEntity.traits && currentEntity.traits.length > 0)
    ? currentEntity.traits
    : (currentEntity.tags || []);
  const orderedTraits = sortTraitsHierarchically(rawTraits, { rarity: npc.rarity || 'Comum', size });

  const visibleTraits = useMemo(() => {
    if (isActualGm) return orderedTraits;
    if (!isFieldVisible('traits')) return [];
    return orderedTraits.filter(trait => isFieldVisible(`tag_${trait}`));
  }, [orderedTraits, isActualGm, fieldVis]);

  // Subcategories / Folders (with permission filtering for non-GMs)
  const subcategories = currentEntity.subcategories || (currentEntity.subcategory ? [currentEntity.subcategory] : []);
  const visibleSubcategories = useMemo(() => {
    if (isActualGm) return subcategories;
    if (!isFieldVisible('subcategories')) return [];
    return subcategories.filter(folder => isFieldVisible(`folder_${folder}`));
  }, [subcategories, isActualGm, fieldVis]);

  // Backlinks
  const backlinks = useMemo(() => {
    return allEntities.filter((e) => {
      if (e.id === currentEntity.id) return false;
      if (e.content && (e.content.includes(currentEntity.title) || e.content.includes(currentEntity.id))) {
        return true;
      }
      return false;
    });
  }, [allEntities, currentEntity.id, currentEntity.title]);

  const visibleBacklinks = useMemo(() => {
    if (isActualGm) return backlinks;
    if (!isFieldVisible('backlinks')) return [];
    return backlinks.filter(b => isFieldVisible(`backlink_${b.id}`));
  }, [backlinks, isActualGm, fieldVis]);

  // Ancestry Entity lookup for Drawer interaction
  const ancestryEntity = useMemo(() => {
    if (npc.ancestryEntityId) {
      return allEntities.find((e) => e.id === npc.ancestryEntityId);
    }
    if (ancestry) {
      const match = allEntities.find(
        (e) =>
          e.category === 'ancestry' &&
          (e.title.toLowerCase() === ancestry.toLowerCase() ||
           e.slug?.toLowerCase() === ancestry.toLowerCase() ||
           ancestry.toLowerCase().includes(e.title.toLowerCase()))
      );
      if (match) return match;
    }
    return null;
  }, [allEntities, npc.ancestryEntityId, ancestry]);

  // Handler to open Ancestry in Drawer (prevents redirecting to full article page!)
  const handleOpenAncestryDrawer = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (ancestryEntity) {
      window.dispatchEvent(
        new CustomEvent('hecos:open-entity-drawer', {
          detail: { entityId: ancestryEntity.id, slug: ancestryEntity.slug }
        })
      );
    } else if (ancestry) {
      window.dispatchEvent(
        new CustomEvent('hecos:open-trait-drawer', {
          detail: { trait: ancestry }
        })
      );
    }
  };

  // Open Entity Drawer helper
  const handleOpenEntityDrawer = (targetEntity: HecosEntity) => {
    window.dispatchEvent(
      new CustomEvent('hecos:open-entity-drawer', {
        detail: { entityId: targetEntity.id, slug: targetEntity.slug }
      })
    );
  };

  const handleOpenItemDrawer = (itemEntityId?: string, itemName?: string) => {
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

  const hasCurrency = Boolean(currency && (currency.po !== undefined || currency.pp !== undefined || currency.pc !== undefined || currency.custom));

  // Filtered lists for non-GM display & counters
  const visibleRelationships = useMemo(() => {
    if (isActualGm) return relationships;
    if (!isFieldVisible('relationships')) return [];
    return relationships.filter(r => !r.isSecret && isFieldVisible(`rel_${r.id}`));
  }, [relationships, isActualGm, fieldVis]);

  const visibleQuests = useMemo(() => {
    if (isActualGm) return quests;
    if (!isFieldVisible('questsAndRumors') || !isFieldVisible('quests')) return [];
    return quests.filter(q => !q.isSecret && isFieldVisible(`quest_${q.id}`));
  }, [quests, isActualGm, fieldVis]);

  const visibleRumors = useMemo(() => {
    if (isActualGm) return rumors;
    if (!isFieldVisible('questsAndRumors') || !isFieldVisible('rumors')) return [];
    return rumors.filter(r => isFieldVisible(`rumor_${r.id}`));
  }, [rumors, isActualGm, fieldVis]);

  const visibleLootItems = useMemo(() => {
    if (isActualGm) return lootItems;
    if (!isFieldVisible('inventory') || !isFieldVisible('loot')) return [];
    return lootItems.filter(item => !item.isSecret && isFieldVisible(`loot_${item.id || item.name}`));
  }, [lootItems, isActualGm, fieldVis]);

  const visibleLinkedLocations = useMemo(() => {
    if (isActualGm) return linkedData.locations;
    if (!isFieldVisible('linkedLocations') && !isFieldVisible('locationFactionCard')) return [];
    return linkedData.locations.filter(loc => isFieldVisible(`location_${loc.id}`) && MutualLinkService.isVisibleToUser(loc, isActualGm, currentUser?.id));
  }, [linkedData.locations, isActualGm, fieldVis, currentUser]);

  const visibleLinkedOrganizations = useMemo(() => {
    if (isActualGm) return linkedData.organizations;
    if (!isFieldVisible('linkedOrganizations') && !isFieldVisible('locationFactionCard')) return [];
    return linkedData.organizations.filter(org => isFieldVisible(`org_${org.id}`) && MutualLinkService.isVisibleToUser(org, isActualGm, currentUser?.id));
  }, [linkedData.organizations, isActualGm, fieldVis, currentUser]);

  const isCurrencyVisible = isFieldVisible('currency') && isFieldVisible('inventory');

  const totalSocialCount = isActualGm
    ? relationships.length + quests.length + rumors.length + linkedData.locations.length + linkedData.organizations.length
    : visibleRelationships.length + visibleQuests.length + visibleRumors.length + visibleLinkedLocations.length + visibleLinkedOrganizations.length;

  const totalInventoryCount = isActualGm
    ? lootItems.length + (hasCurrency ? 1 : 0)
    : visibleLootItems.length + (hasCurrency && isCurrencyVisible ? 1 : 0);

  return (
    <div id="npc-view-container" className="w-full text-zinc-200 space-y-5 pb-12">
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* PAINEL MESTRE DE CONTROLE DE VISIBILIDADE (APENAS PARA O GM)            */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {isActualGm && (
        <div className="rounded-2xl bg-gradient-to-r from-[#1b102e] via-[#150a24] to-[#0d0718] border border-purple-800/60 p-3.5 sm:p-4 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-950/80 border border-purple-700/80 flex items-center justify-center text-purple-300 shrink-0 shadow-md">
              <Sliders className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-purple-200 uppercase font-mono tracking-wider">
                  Controle de Permissões & Olhinho do NPC
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-300 font-mono font-bold border border-purple-700/50">
                  Modo Mestre
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Clique no ícone de olhinho ao lado de qualquer informação, tag, pasta, estatística ou vínculo para revelar ou ocultar dos jogadores.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0 w-full md:w-auto justify-end">
            <button
              type="button"
              onClick={() => handleSetAllVisibility('all_visible')}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/80 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Revelar todas as informações aos jogadores"
            >
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span>Revelar Tudo</span>
            </button>

            <button
              type="button"
              onClick={() => handleSetAllVisibility('hide_sensitive')}
              className="px-2.5 py-1.5 rounded-xl bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-700/80 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Ocultar atributos de combate, segredos e riquezas"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Ocultar Sensíveis</span>
            </button>

            <button
              type="button"
              onClick={() => handleSetAllVisibility('all_hidden')}
              className="px-2.5 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-700/80 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Ocultar todos os campos dos jogadores"
            >
              <EyeOff className="w-3.5 h-3.5 text-rose-400" />
              <span>Ocultar Tudo</span>
            </button>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* CORPO PRINCIPAL DO ARTIGO: SIDEBAR VISUAL (ESQ) + ABAS ESTATÍSTICAS (DIR)*/}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* ─────────────────────────────────────────────────────────────────────── */}
        {/* COLUNA ESQUERDA: RETRATO, TOKEN, PASTAS & VÍNCULOS GEOGRÁFICOS          */}
        {/* ─────────────────────────────────────────────────────────────────────── */}
        <div className="w-full lg:w-72 xl:w-80 shrink-0 space-y-4">
          {/* 1. RETRATO VERTICAL (2:3) */}
          <div className="rounded-3xl bg-[#0f0a1c] border border-purple-900/50 overflow-hidden shadow-2xl relative group">
            <div className="p-2.5 bg-[#170e28] border-b border-zinc-800/80 flex items-center justify-between">
              <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <User className="w-3.5 h-3.5 text-purple-400" />
                Retrato do Personagem
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/50 text-purple-300 border border-zinc-800">
                  2:3 Vertical
                </span>
                {renderEyeToggle('portraitImage', 'Retrato do NPC', 'all', { compact: true })}
              </div>
            </div>

            <div className="relative aspect-[2/3] w-full bg-[#0a0714] overflow-hidden">
              {isFieldVisible('portraitImage') ? (
                portraitImage && (portraitImage.startsWith('http') || portraitImage.startsWith('data:')) ? (
                  <AdjustableImage
                    src={portraitImage}
                    alt={currentEntity.title}
                    imageKey={`npc-portrait-${currentEntity.id}`}
                    isGm={isActualGm}
                    containerClassName="relative w-full h-full overflow-hidden"
                    imgClassName="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-[#140c24] to-[#0a0614]">
                    <div className="w-16 h-16 rounded-2xl bg-purple-950/60 border border-purple-800/60 flex items-center justify-center text-purple-400 mb-3 shadow-inner">
                      <User className="w-8 h-8" />
                    </div>
                    <span className="text-xs font-semibold text-zinc-300">Sem Imagem de Retrato</span>
                    <span className="text-[11px] text-zinc-500 mt-1">Configurado com ícone padrão</span>
                    {isActualGm && onEdit && (
                      <button
                        type="button"
                        onClick={onEdit}
                        className="mt-3 px-3 py-1.5 text-[11px] font-semibold text-purple-300 bg-purple-950/60 hover:bg-purple-900 border border-purple-800 rounded-xl transition-all cursor-pointer"
                      >
                        Adicionar Retrato
                      </button>
                    )}
                  </div>
                )
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[#0d0918]">
                  <Lock className="w-10 h-10 text-rose-500/50 mb-2" />
                  <span className="text-xs font-semibold text-zinc-400">Retrato Oculto pelo Mestre</span>
                </div>
              )}
            </div>
          </div>

          {/* 2. TOKEN (PROPORÇÃO 1:1 - FORMATO QUADRADO) LOGO ABAIXO DO RETRATO */}
          <div className="rounded-3xl bg-[#0f0a1c] border border-purple-900/50 overflow-hidden shadow-2xl relative">
            <div className="p-2.5 bg-[#170e28] border-b border-zinc-800/80 flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                Token de Mesa
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/50 text-amber-400 border border-zinc-800">
                  1:1 Quadrado
                </span>
                {renderEyeToggle('tokenImage', 'Token de Mesa', 'all', { compact: true })}
              </div>
            </div>

            <div className="relative aspect-square w-full bg-[#0a0714] p-3 flex items-center justify-center">
              {isFieldVisible('tokenImage') ? (
                tokenImage && (tokenImage.startsWith('http') || tokenImage.startsWith('data:')) ? (
                  <div className="relative w-full h-full rounded-2xl overflow-hidden border-2 border-purple-500/50 shadow-inner bg-[#140d22]">
                    <AdjustableImage
                      src={tokenImage}
                      alt={`${currentEntity.title} Token`}
                      imageKey={`npc-token-${currentEntity.id}`}
                      isGm={isActualGm}
                      containerClassName="relative w-full h-full overflow-hidden"
                      imgClassName="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full rounded-2xl bg-gradient-to-br from-[#231540] to-[#0a0614] border-2 border-purple-500/30 flex flex-col items-center justify-center p-4 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-purple-950/60 border border-purple-700/60 flex items-center justify-center text-purple-300 mb-2 shadow-md">
                      <EntityIcon
                        icon={tokenImage || currentEntity.icon}
                        category="npc"
                        className="w-7 h-7"
                      />
                    </div>
                    <span className="text-[11px] font-medium text-zinc-400">Token Padrão</span>
                  </div>
                )
              ) : (
                <div className="w-full h-full rounded-2xl bg-[#0e091a] border-2 border-rose-900/40 flex flex-col items-center justify-center p-4 text-center">
                  <Lock className="w-8 h-8 text-rose-400/50 mb-1" />
                  <span className="text-[11px] font-medium text-zinc-400">Token Oculto</span>
                </div>
              )}
            </div>
          </div>

          {/* 3. METADADOS E PASTAS VINCULADAS COM OLHINHO INDIVIDUAL */}
          {(isActualGm ? subcategories.length > 0 : visibleSubcategories.length > 0) && (
            <div className="rounded-2xl bg-[#0e0a19] border border-zinc-800/80 p-3.5 space-y-2 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <Folder className="w-3.5 h-3.5 text-purple-400" />
                  Pastas Vinculadas
                </span>
                {renderEyeToggle('subcategories', 'Todas as Pastas', 'all', { compact: true })}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(isActualGm ? subcategories : visibleSubcategories).map((folder) => {
                  const isFolderRev = isFieldRevealed(`folder_${folder}`, 'all');
                  return (
                    <span
                      key={folder}
                      className={`text-xs px-2.5 py-1 rounded-lg border flex items-center gap-1.5 shadow-sm transition-all ${
                        isActualGm && !isFolderRev
                          ? 'bg-rose-950/40 text-rose-300 border-rose-800/60 opacity-80'
                          : 'bg-[#180f26] text-purple-200 border-purple-900/50'
                      }`}
                    >
                      <Folder className="w-3 h-3 text-purple-400" />
                      <span>{folder}</span>
                      {renderEyeToggle(`folder_${folder}`, `Pasta ${folder}`, 'all', { compact: true })}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. RESUMO SOCIAL / AFILIAÇÃO & LOCAL COM LINKS MUTUOS */}
          {(isFieldVisible('locationFactionCard') && (faction || location || linkedData.locations.length > 0 || linkedData.organizations.length > 0)) && (
            <div className="rounded-2xl bg-[#0e0a19] border border-zinc-800/80 p-3.5 space-y-2.5 text-xs shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <MapPin className="w-3.5 h-3.5 text-purple-400" />
                  Vínculo Geográfico & Social
                </span>
                {renderEyeToggle('locationFactionCard', 'Vínculo Geográfico', 'all', { compact: true })}
              </div>

              <div className="space-y-2 text-zinc-300">
                {/* Local Principal */}
                {(location || linkedData.locations.length > 0) && isFieldVisible('location') && (
                  <div className="space-y-1">
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-zinc-500 font-mono text-[11px]">Residência / Local:</span>
                      {renderEyeToggle('location', 'Local Principal', 'all', { compact: true })}
                    </div>
                    {linkedData.locations.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {linkedData.locations.map((loc) => {
                          const isLocRev = isFieldRevealed(`location_${loc.id}`, 'all');
                          if (!isActualGm && !isLocRev) return null;
                          return (
                            <button
                              key={loc.id}
                              type="button"
                              onClick={() => handleOpenEntityDrawer(loc)}
                              className={`px-2 py-1 rounded-lg border text-left flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer ${
                                isActualGm && !isLocRev
                                  ? 'bg-rose-950/30 text-rose-300 border-rose-800/60'
                                  : 'bg-cyan-950/40 text-cyan-300 border-cyan-800/60 hover:bg-cyan-900/60'
                              }`}
                              title={`Abrir ${loc.title}`}
                            >
                              <Compass className="w-3 h-3 text-cyan-400 shrink-0" />
                              <span className="truncate">{loc.title}</span>
                              <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="font-semibold text-zinc-200 block">{location}</span>
                    )}
                  </div>
                )}

                {/* Organização / Facção Principal */}
                {(faction || linkedData.organizations.length > 0) && isFieldVisible('faction') && (
                  <div className="space-y-1 pt-1 border-t border-zinc-800/60">
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-zinc-500 font-mono text-[11px]">Facção / Lealdade:</span>
                      {renderEyeToggle('faction', 'Facção Principal', 'all', { compact: true })}
                    </div>
                    {linkedData.organizations.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {linkedData.organizations.map((org) => {
                          const isOrgRev = isFieldRevealed(`org_${org.id}`, 'all');
                          if (!isActualGm && !isOrgRev) return null;
                          return (
                            <button
                              key={org.id}
                              type="button"
                              onClick={() => handleOpenEntityDrawer(org)}
                              className={`px-2 py-1 rounded-lg border text-left flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer ${
                                isActualGm && !isOrgRev
                                  ? 'bg-rose-950/30 text-rose-300 border-rose-800/60'
                                  : 'bg-purple-950/40 text-purple-300 border-purple-800/60 hover:bg-purple-900/60'
                              }`}
                              title={`Abrir ${org.title}`}
                            >
                              <Building2 className="w-3 h-3 text-purple-400 shrink-0" />
                              <span className="truncate">{org.title}</span>
                              <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="font-semibold text-purple-300 block">{faction}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ─────────────────────────────────────────────────────────────────────── */}
        {/* COLUNA DIREITA: CABEÇALHO PRINCIPAL & SISTEMA DE ABAS ORGANIZADAS       */}
        {/* ─────────────────────────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* BANNER / CABEÇALHO DO NPC */}
          <div className="rounded-3xl bg-[#0f0a1c] border border-purple-900/40 p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Ocupação / Papel */}
                <div className="inline-flex items-center gap-1">
                  <Tooltip content={`Papel / Ocupação: ${role}`}>
                    <span className="px-3 py-1 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm border bg-purple-950 text-purple-300 border-purple-800 cursor-help">
                      <User className="w-3.5 h-3.5 text-purple-400" />
                      <span>{isFieldVisible('role') ? role : '???'}</span>
                    </span>
                  </Tooltip>
                  {renderEyeToggle('role', 'Papel/Ocupação', 'all', { compact: true })}
                </div>

                {/* Nível */}
                {level !== undefined && level !== null && (
                  <div className="inline-flex items-center gap-1">
                    <Tooltip content={`Nível do NPC: ${level}`}>
                      <span className="px-3 py-1 rounded-xl bg-violet-950 text-violet-300 border border-violet-800 font-mono font-bold text-xs cursor-help">
                        Nível {isFieldVisible('level') ? level : '???'}
                      </span>
                    </Tooltip>
                    {renderEyeToggle('level', 'Nível', 'all', { compact: true })}
                  </div>
                )}

                {/* Disposição */}
                {disposition && (isFieldVisible('disposition') || isActualGm) && (
                  <div className="inline-flex items-center gap-1">
                    <Tooltip content={`Disposição / Atitude inicial: ${disposition.label} - ${disposition.desc}`}>
                      <span className={`px-3 py-1 rounded-xl border font-mono font-bold text-xs flex items-center gap-1 cursor-help ${disposition.bg} ${disposition.border} ${disposition.text}`}>
                        <Smile className="w-3.5 h-3.5" />
                        <span>{isFieldVisible('disposition') ? disposition.label : '🔒 Disposição Oculta'}</span>
                      </span>
                    </Tooltip>
                    {renderEyeToggle('disposition', 'Disposição', 'all', { compact: true })}
                  </div>
                )}
              </div>

              {onEdit && isActualGm && (
                <Tooltip content="Abrir o modal de edição deste NPC">
                  <button
                    type="button"
                    onClick={onEdit}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-zinc-800 hover:bg-purple-950 text-zinc-200 hover:text-purple-200 border border-zinc-700/80 hover:border-purple-700/80 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-purple-400" />
                    Editar NPC
                  </button>
                </Tooltip>
              )}
            </div>

            {/* ENTRADA SECRETA DO GM (STRICTLY GM-ONLY, NUNCA EXIBIDA PARA JOGADORES) */}
            {isActualGm && gmSecretNotes && (
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-amber-300 font-mono uppercase tracking-wider">
                          Área Exclusiva do Mestre (Confidencial GM)
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold">
                          APENAS GM
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
                <p className="text-sm text-purple-200/80 font-medium mt-1">{currentEntity.subtitle}</p>
              )}
            </div>

            {/* Traços Hierárquicos com Olhinho Individual */}
            {(isActualGm ? orderedTraits.length > 0 : visibleTraits.length > 0) && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {isActualGm && (
                  <div className="mr-1">
                    {renderEyeToggle('traits', 'Todos os Traços', 'all', { compact: true })}
                  </div>
                )}
                {(isActualGm ? orderedTraits : visibleTraits).map((trait, idx) => {
                  const isTraitRev = isFieldRevealed(`tag_${trait}`, 'all');
                  return (
                    <div
                      key={idx}
                      className={`inline-flex items-center gap-1 p-0.5 rounded-xl transition-all ${
                        isActualGm && !isTraitRev ? 'bg-rose-950/40 border border-rose-800/60 opacity-80' : ''
                      }`}
                    >
                      <TraitBadge
                        trait={trait}
                        onClick={() => {
                          window.dispatchEvent(
                            new CustomEvent('hecos:open-trait-drawer', { detail: { trait } })
                          );
                        }}
                      />
                      {renderEyeToggle(`tag_${trait}`, `Traço ${trait}`, 'all', { compact: true })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {/* BARRA DE NAVEGAÇÃO POR ABAS (DIVISÃO INTELIGENTE DE INFORMAÇÕES)        */}
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          <div className="bg-[#0e0a19] p-1.5 rounded-2xl border border-purple-900/40 shadow-lg overflow-x-auto no-scrollbar">
            <nav className="flex items-center gap-1.5 min-w-max" aria-label="Abas do NPC">
              {/* Aba 1: Perfil & Interpretação */}
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/70'
                }`}
              >
                <Brain className="w-3.5 h-3.5 text-purple-300" />
                <span>Perfil & Interpretação</span>
              </button>

              {/* Aba 2: Estatísticas & Combate */}
              <button
                type="button"
                onClick={() => setActiveTab('combat')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'combat'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/70'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-rose-400" />
                <span>Estatísticas & Combate</span>
                {hasCombatStats && isFieldVisible('combatStats') && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${activeTab === 'combat' ? 'bg-black/30 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                    {hp && isFieldVisible('hpAndHealth') ? `${hp} PV` : 'Stats'}
                  </span>
                )}
              </button>

              {/* Aba 3: Relações & Missões */}
              <button
                type="button"
                onClick={() => setActiveTab('social')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'social'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/70'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span>Relações & Missões</span>
                {totalSocialCount > 0 && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${activeTab === 'social' ? 'bg-black/30 text-white' : 'bg-purple-950 text-purple-300 border border-purple-800'}`}>
                    {totalSocialCount}
                  </span>
                )}
              </button>

              {/* Aba 4: Inventário & Bens */}
              <button
                type="button"
                onClick={() => setActiveTab('inventory')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'inventory'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/70'
                }`}
              >
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>Inventário & Bens</span>
                {totalInventoryCount > 0 && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${activeTab === 'inventory' ? 'bg-black/30 text-white' : 'bg-amber-950 text-amber-300 border border-amber-800'}`}>
                    {visibleLootItems.length > 0 ? visibleLootItems.length : 'Moedas'}
                  </span>
                )}
              </button>

              {/* Aba 5: Conexões do Codex */}
              {(isActualGm ? backlinks.length > 0 : visibleBacklinks.length > 0) && (
                <button
                  type="button"
                  onClick={() => setActiveTab('backlinks')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'backlinks'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/70'
                  }`}
                >
                  <Link2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Conexões</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${activeTab === 'backlinks' ? 'bg-black/30 text-white' : 'bg-cyan-950 text-cyan-300 border border-cyan-800'}`}>
                    {isActualGm ? backlinks.length : visibleBacklinks.length}
                  </span>
                </button>
              )}
            </nav>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {/* CONTEÚDO DAS ABAS                                                      */}
          {/* ═══════════════════════════════════════════════════════════════════════ */}

          {/* ─── ABA 1: PERFIL & INTERPRETAÇÃO ─── */}
          {activeTab === 'profile' && (
            <div className="space-y-4 animate-fade-in">
              {/* Matriz em 2 Colunas: Identidade Social (Esq) vs Psicologia & Interpretação (Dir) */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
                {/* Coluna 1: Identidade & Papel Social */}
                {(isActualGm || isFieldVisible('identityBlock')) && (
                  <div className="p-5 rounded-3xl bg-[#0b0814] border border-purple-900/40 space-y-3.5 shadow-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-purple-300 font-mono flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4 text-purple-400" />
                        Identidade & Papel Social
                      </span>
                      {renderEyeToggle('identityBlock', 'Bloco de Identidade')}
                    </div>

                    <div className="space-y-2.5 text-xs">
                      {occupation && (isActualGm || isFieldVisible('occupation')) && (
                        <div className="flex justify-between items-baseline py-1 border-b border-zinc-800/60 gap-2">
                          <span className="text-zinc-400 font-mono flex items-center gap-1.5">
                            Ofício / Ocupação:
                            {renderEyeToggle('occupation', 'Ofício', 'all', { compact: true })}
                          </span>
                          <span className="font-bold text-zinc-200 text-right">{occupation}</span>
                        </div>
                      )}

                      {/* Ancestralidade / Povo com Abertura em Drawer sem Redirecionar */}
                      {ancestry && (isActualGm || isFieldVisible('ancestry')) && (
                        <div className="flex justify-between items-center py-1 border-b border-zinc-800/60 gap-2">
                          <span className="text-zinc-400 font-mono flex items-center gap-1.5">
                            Povo / Ancestralidade:
                            {renderEyeToggle('ancestry', 'Ancestralidade', 'all', { compact: true })}
                          </span>
                          <button
                            type="button"
                            onClick={handleOpenAncestryDrawer}
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-orange-950/50 text-orange-300 border border-orange-800/60 hover:bg-orange-900/60 transition-all font-bold cursor-pointer text-right group"
                            title={`Abrir painel lateral de ${ancestry}`}
                          >
                            <Dna className="w-3 h-3 text-orange-400" />
                            <span>{heritage ? `${ancestry} (${heritage})` : ancestry}</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" />
                          </button>
                        </div>
                      )}

                      {/* Residência / Local */}
                      {(location || linkedData.locations.length > 0) && (isActualGm || isFieldVisible('location')) && (
                        <div className="flex justify-between items-center py-1 border-b border-zinc-800/60 gap-2">
                          <span className="text-zinc-400 font-mono flex items-center gap-1.5">
                            Residência / Local:
                            {renderEyeToggle('location', 'Residência', 'all', { compact: true })}
                          </span>
                          {linkedData.locations.length > 0 ? (
                            <div className="flex flex-wrap gap-1 justify-end">
                              {linkedData.locations.map(loc => (
                                <button
                                  key={loc.id}
                                  type="button"
                                  onClick={() => handleOpenEntityDrawer(loc)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-950/40 text-cyan-300 border border-cyan-800/50 hover:bg-cyan-900/50 text-xs font-semibold cursor-pointer"
                                >
                                  <Compass className="w-3 h-3 text-cyan-400" />
                                  <span>{loc.title}</span>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <span className="font-bold text-zinc-200 text-right">{location}</span>
                          )}
                        </div>
                      )}

                      {/* Facção / Lealdade */}
                      {(faction || linkedData.organizations.length > 0) && (isActualGm || isFieldVisible('faction')) && (
                        <div className="flex justify-between items-center py-1 border-b border-zinc-800/60 gap-2">
                          <span className="text-zinc-400 font-mono flex items-center gap-1.5">
                            Facção / Lealdade:
                            {renderEyeToggle('faction', 'Facção', 'all', { compact: true })}
                          </span>
                          {linkedData.organizations.length > 0 ? (
                            <div className="flex flex-wrap gap-1 justify-end">
                              {linkedData.organizations.map(org => (
                                <button
                                  key={org.id}
                                  type="button"
                                  onClick={() => handleOpenEntityDrawer(org)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-950/40 text-purple-300 border border-purple-800/50 hover:bg-purple-900/50 text-xs font-semibold cursor-pointer"
                                >
                                  <Building2 className="w-3 h-3 text-purple-400" />
                                  <span>{org.title}</span>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <span className="font-bold text-purple-200 text-right">{faction}</span>
                          )}
                        </div>
                      )}

                      {wealth && (isActualGm || isFieldVisible('wealth')) && (
                        <div className="flex justify-between items-baseline py-1 border-b border-zinc-800/60 gap-2">
                          <span className="text-zinc-400 font-mono flex items-center gap-1.5">
                            Riqueza / Condição:
                            {renderEyeToggle('wealth', 'Riqueza', 'all', { compact: true })}
                          </span>
                          <span className="font-bold text-amber-300 text-right">{wealth}</span>
                        </div>
                      )}

                      {alignment && (isActualGm || isFieldVisible('alignment')) && (
                        <div className="flex justify-between items-baseline py-1 border-b border-zinc-800/60 gap-2">
                          <span className="text-zinc-400 font-mono flex items-center gap-1.5">
                            Alinhamento / Filosofia:
                            {renderEyeToggle('alignment', 'Alinhamento', 'all', { compact: true })}
                          </span>
                          <span className="font-bold text-zinc-200 text-right">{alignment}</span>
                        </div>
                      )}

                      {(age || pronouns) && (isActualGm || isFieldVisible('ageAndPronouns')) && (
                        <div className="flex justify-between items-baseline py-1 border-b border-zinc-800/60 gap-2">
                          <span className="text-zinc-400 font-mono flex items-center gap-1.5">
                            Idade / Pronomes:
                            {renderEyeToggle('ageAndPronouns', 'Idade/Pronomes', 'all', { compact: true })}
                          </span>
                          <span className="font-bold text-zinc-300 text-right">{[age, pronouns].filter(Boolean).join(' • ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Coluna 2: Psicologia & Interpretação */}
                {(isActualGm || isFieldVisible('psychologyBlock')) && (
                  <div className="p-5 rounded-3xl bg-[#0b0814] border border-purple-900/40 space-y-3.5 shadow-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-purple-300 font-mono flex items-center gap-1.5">
                        <Brain className="w-4 h-4 text-purple-400" />
                        Psicologia & Interpretação
                      </span>
                      {renderEyeToggle('psychologyBlock', 'Bloco de Psicologia')}
                    </div>

                    <div className="space-y-2.5 text-xs">
                      {voice && (isActualGm || isFieldVisible('voiceAndSpeech')) && (
                        <div className="py-1.5 px-2.5 rounded-xl bg-purple-950/30 border border-purple-900/40">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-purple-300 font-mono text-[11px] flex items-center gap-1.5 font-bold">
                              <Volume2 className="w-3.5 h-3.5 text-purple-400" />
                              Voz & Maneirismos:
                            </span>
                            {renderEyeToggle('voiceAndSpeech', 'Voz & Maneirismos', 'all', { compact: true })}
                          </div>
                          <span className="italic text-zinc-200 leading-relaxed">{voice}</span>
                        </div>
                      )}

                      {personality && (isActualGm || isFieldVisible('personality')) && (
                        <div className="py-1 border-b border-zinc-800/60">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-zinc-400 font-mono text-[11px]">Personalidade:</span>
                            {renderEyeToggle('personality', 'Personalidade', 'all', { compact: true })}
                          </div>
                          <span className="text-zinc-200">{personality}</span>
                        </div>
                      )}

                      {motivations && (isActualGm || isFieldVisible('motivations', 'gm')) && (
                        <div className="py-1 border-b border-zinc-800/60">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-amber-400 font-mono text-[11px] font-bold">Motivação / Agenda:</span>
                            {renderEyeToggle('motivations', 'Motivação / Agenda', 'gm', { compact: true })}
                          </div>
                          <span className="text-amber-200/90 leading-relaxed">{motivations}</span>
                        </div>
                      )}

                      {appearance && (isActualGm || isFieldVisible('appearance')) && (
                        <div className="py-1 border-b border-zinc-800/60">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-zinc-400 font-mono text-[11px]">Aparência Física:</span>
                            {renderEyeToggle('appearance', 'Aparência Física', 'all', { compact: true })}
                          </div>
                          <span className="text-zinc-300 leading-relaxed">{appearance}</span>
                        </div>
                      )}

                      {canOffer && (isActualGm || isFieldVisible('canOffer')) && (
                        <div className="py-1.5 px-2.5 rounded-xl bg-emerald-950/20 border border-emerald-800/40">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-emerald-400 font-mono text-[11px] font-bold">O que pode oferecer:</span>
                            {renderEyeToggle('canOffer', 'O que pode oferecer', 'all', { compact: true })}
                          </div>
                          <span className="text-emerald-200 leading-relaxed">{canOffer}</span>
                        </div>
                      )}

                      {triggers && (isActualGm || isFieldVisible('triggers', 'gm')) && (
                        <div className="py-1.5 px-2.5 rounded-xl bg-rose-950/20 border border-rose-800/40">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-rose-400 font-mono text-[11px] font-bold">Gatilhos / Irritações:</span>
                            {renderEyeToggle('triggers', 'Gatilhos', 'gm', { compact: true })}
                          </div>
                          <span className="text-rose-200 leading-relaxed">{triggers}</span>
                        </div>
                      )}

                      {secrets && (isActualGm || isFieldVisible('secrets', 'gm')) && (
                        <div className="py-1.5 px-2.5 rounded-xl bg-purple-950/30 border border-purple-800/50">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-purple-300 font-mono text-[11px] font-bold">Segredos Conhecidos:</span>
                            {renderEyeToggle('secrets', 'Segredos', 'gm', { compact: true })}
                          </div>
                          <span className="text-purple-200 leading-relaxed">{secrets}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* CONTEÚDO NARRATIVO / LORE & BIOGRAFIA INTEGRADO NA ABA DE PERFIL */}
              {cleanContentForNarrative && (isActualGm || isFieldVisible('narrativeLore')) && (
                <div className="rounded-3xl bg-[#0f0a1c] border border-zinc-800/80 p-6 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-300 font-mono flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-purple-400" />
                      Histórico & Detalhes Narrativos
                    </span>
                    {renderEyeToggle('narrativeLore', 'Histórico Narrativo')}
                  </div>
                  <div className="prose prose-invert max-w-none text-zinc-200 text-sm leading-relaxed">
                    <RichContentRenderer
                      content={cleanContentForNarrative}
                      onNavigate={onNavigate}
                      isGmMode={isActualGm}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── ABA 2: ESTATÍSTICAS & COMBATE ─── */}
          {activeTab === 'combat' && (
            <div className="space-y-5 animate-fade-in">
              <div className="rounded-3xl bg-[#0b0814] border border-zinc-800/80 p-6 space-y-6 shadow-xl">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      <Shield className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-bold text-rose-300 uppercase tracking-wider font-mono">
                      Mecânicas de Combate & Parâmetros de Jogo
                    </h3>
                  </div>
                  {renderEyeToggle('combatStats', 'Estatísticas de Combate')}
                </div>

                {/* LINHA: DEFESAS (ESQUERDA) & PERCEPÇÃO/HABILIDADES (DIREITA) */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
                  {/* Defesas & Saúde */}
                  <div className="p-5 rounded-2xl bg-[#120e20] border border-zinc-800/80 space-y-3.5 h-full">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                        <Shield className="w-4 h-4 text-rose-400" />
                        Defesas & Saúde
                      </span>
                      <div className="flex items-center gap-2">
                        {renderEyeToggle('acAndDefenses', 'CA & Resistências')}
                        {renderEyeToggle('hpAndHealth', 'PV')}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                      <div className="bg-black/50 p-2.5 rounded-xl border border-zinc-800 text-center">
                        <div className="text-[10px] uppercase font-mono text-zinc-500">CA</div>
                        <div className="text-base font-bold text-zinc-100 mt-0.5 font-mono">
                          {isFieldVisible('acAndDefenses') ? (ac !== undefined ? ac : '—') : '???'}
                        </div>
                      </div>

                      <div className="bg-black/50 p-2.5 rounded-xl border border-zinc-800 text-center">
                        <div className="text-[10px] uppercase font-mono text-zinc-500">Fortitude</div>
                        <div className="text-base font-bold text-zinc-100 mt-0.5 font-mono">
                          {isFieldVisible('acAndDefenses') ? (saves?.fortitude !== undefined ? `+${saves.fortitude}` : '—') : '???'}
                        </div>
                      </div>

                      <div className="bg-black/50 p-2.5 rounded-xl border border-zinc-800 text-center">
                        <div className="text-[10px] uppercase font-mono text-zinc-500">Reflexos</div>
                        <div className="text-base font-bold text-zinc-100 mt-0.5 font-mono">
                          {isFieldVisible('acAndDefenses') ? (saves?.reflex !== undefined ? `+${saves.reflex}` : '—') : '???'}
                        </div>
                      </div>

                      <div className="bg-black/50 p-2.5 rounded-xl border border-zinc-800 text-center">
                        <div className="text-[10px] uppercase font-mono text-zinc-500">Vontade</div>
                        <div className="text-base font-bold text-zinc-100 mt-0.5 font-mono">
                          {isFieldVisible('acAndDefenses') ? (saves?.will !== undefined ? `+${saves.will}` : '—') : '???'}
                        </div>
                      </div>

                      <div className="bg-rose-950/40 p-2.5 rounded-xl border border-rose-800/60 text-center col-span-2 sm:col-span-1">
                        <div className="text-[10px] uppercase font-mono text-rose-400">PV</div>
                        <div className="text-base font-black text-rose-200 mt-0.5 font-mono">
                          {isFieldVisible('hpAndHealth') ? (hp !== undefined ? `${hp} PV` : '—') : '??? PV'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Percepção, Sentidos & Perícias */}
                  <div className="p-5 rounded-2xl bg-[#120e20] border border-zinc-800/80 space-y-3 h-full">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                        <Eye className="w-4 h-4 text-cyan-400" />
                        Percepção, Sentidos & Perícias
                      </span>
                      {renderEyeToggle('perceptionAndSenses', 'Percepção & Sentidos')}
                    </div>

                    <div className="text-xs text-zinc-300 space-y-2">
                      {perception !== undefined && (isActualGm || isFieldVisible('perceptionAndSenses')) && (
                        <div className="flex items-center justify-between py-1 border-b border-zinc-800/60">
                          <strong className="text-zinc-200">Percepção:</strong>
                          <span className="font-mono text-cyan-300 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                            {isFieldVisible('perceptionAndSenses') ? `+${perception}` : '???'}
                          </span>
                        </div>
                      )}

                      {speed && (isActualGm || isFieldVisible('speed')) && (
                        <div className="flex items-center justify-between py-1 border-b border-zinc-800/60">
                          <span className="flex items-center gap-1.5 font-semibold text-zinc-200">
                            <Footprints className="w-3.5 h-3.5 text-purple-400" />
                            Deslocamento:
                            {renderEyeToggle('speed', 'Deslocamento', 'all', { compact: true })}
                          </span>
                          <span className="font-mono text-purple-300 font-bold">
                            {isFieldVisible('speed') ? speed : '???'}
                          </span>
                        </div>
                      )}

                      {keySkills && (isActualGm || isFieldVisible('keySkills')) && (
                        <div className="py-1 border-b border-zinc-800/60">
                          <div className="flex items-center justify-between mb-0.5">
                            <strong className="text-zinc-200 block">Perícias Chave:</strong>
                            {renderEyeToggle('keySkills', 'Perícias Chave', 'all', { compact: true })}
                          </div>
                          <span className="text-zinc-300">{isFieldVisible('keySkills') ? keySkills : '🔒 Oculto'}</span>
                        </div>
                      )}

                      {specialAbilities && (isActualGm || isFieldVisible('specialAbilities')) && (
                        <div className="pt-1.5 text-purple-300 text-xs">
                          <div className="flex items-center justify-between mb-0.5">
                            <strong className="text-purple-200 block">Habilidades Especiais:</strong>
                            {renderEyeToggle('specialAbilities', 'Habilidades Especiais', 'all', { compact: true })}
                          </div>
                          <span className="leading-relaxed">{isFieldVisible('specialAbilities') ? specialAbilities : '🔒 Oculto'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Caso o NPC não possua stats de combate detalhados */}
                {!hasCombatStats && !perception && !speed && (
                  <div className="p-6 rounded-2xl bg-[#120c1a] border border-purple-900/40 text-center space-y-2">
                    <Activity className="w-8 h-8 text-purple-400/60 mx-auto" />
                    <h4 className="text-sm font-bold text-zinc-200">Perfil Social & Narrativo</h4>
                    <p className="text-xs text-zinc-400 max-w-md mx-auto">
                      Este NPC foi criado com foco em interpretação e interações sociais. Nenhuma ficha de combate completa foi configurada.
                    </p>
                    {isActualGm && onEdit && (
                      <button
                        type="button"
                        onClick={onEdit}
                        className="mt-2 px-3 py-1.5 text-xs font-semibold text-purple-300 bg-purple-950/60 hover:bg-purple-900 border border-purple-800 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Adicionar Atributos de Combate
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── ABA 3: RELAÇÕES & MISSÕES (COM VÍNCULOS MÚTUOS DE LOCAIS, ORGS E QUESTS) ─── */}
          {activeTab === 'social' && (
            <div className="space-y-4 animate-fade-in">
              {/* Seção 1: Vínculos Mútuos Geográficos & Organizacionais */}
              {(isActualGm
                ? linkedData.locations.length > 0 || linkedData.organizations.length > 0
                : visibleLinkedLocations.length > 0 || visibleLinkedOrganizations.length > 0
              ) && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
                  {/* Locais Mútuos */}
                  {(isActualGm ? linkedData.locations.length > 0 : visibleLinkedLocations.length > 0) && (
                    <div className="p-5 rounded-3xl bg-[#0b0814] border border-cyan-900/40 space-y-3.5 shadow-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 font-mono flex items-center gap-1.5">
                          <Compass className="w-4 h-4 text-cyan-400" />
                          Locais Vinculados ({isActualGm ? linkedData.locations.length : visibleLinkedLocations.length})
                        </span>
                        {renderEyeToggle('linkedLocations', 'Locais Vinculados')}
                      </div>

                      <div className="space-y-2">
                        {(isActualGm ? linkedData.locations : visibleLinkedLocations).map((loc) => {
                          const isLocRev = isFieldRevealed(`location_${loc.id}`, 'all');
                          return (
                            <div
                              key={loc.id}
                              className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 transition-all ${
                                isActualGm && !isLocRev
                                  ? 'bg-rose-950/30 border-rose-800/60'
                                  : 'bg-black/40 border-cyan-900/40 hover:border-cyan-500/60'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => handleOpenEntityDrawer(loc)}
                                className="min-w-0 flex items-center gap-2.5 flex-1 text-left cursor-pointer group"
                              >
                                <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center text-cyan-300 shrink-0">
                                  <EntityIcon icon={loc.icon} category="location" className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-zinc-200 group-hover:text-cyan-300 truncate">{loc.title}</div>
                                  {loc.subtitle && <p className="text-zinc-400 text-[10px] truncate">{loc.subtitle}</p>}
                                </div>
                              </button>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEntityDrawer(loc)}
                                  className="px-2.5 py-1 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-mono hover:bg-cyan-900 cursor-pointer"
                                >
                                  Explorar
                                </button>
                                {renderEyeToggle(`location_${loc.id}`, loc.title, 'all', { compact: true })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Organizações & Facções Mútuas */}
                  {(isActualGm ? linkedData.organizations.length > 0 : visibleLinkedOrganizations.length > 0) && (
                    <div className="p-5 rounded-3xl bg-[#0b0814] border border-purple-900/40 space-y-3.5 shadow-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-purple-300 font-mono flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-purple-400" />
                          Organizações & Facções ({isActualGm ? linkedData.organizations.length : visibleLinkedOrganizations.length})
                        </span>
                        {renderEyeToggle('linkedOrganizations', 'Organizações')}
                      </div>

                      <div className="space-y-2">
                        {(isActualGm ? linkedData.organizations : visibleLinkedOrganizations).map((org) => {
                          const isOrgRev = isFieldRevealed(`org_${org.id}`, 'all');
                          return (
                            <div
                              key={org.id}
                              className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 transition-all ${
                                isActualGm && !isOrgRev
                                  ? 'bg-rose-950/30 border-rose-800/60'
                                  : 'bg-black/40 border-purple-900/40 hover:border-purple-500/60'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => handleOpenEntityDrawer(org)}
                                className="min-w-0 flex items-center gap-2.5 flex-1 text-left cursor-pointer group"
                              >
                                <div className="w-8 h-8 rounded-lg bg-purple-950/60 border border-purple-800/60 flex items-center justify-center text-purple-300 shrink-0">
                                  <EntityIcon icon={org.icon} category="organization" className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-zinc-200 group-hover:text-purple-300 truncate">{org.title}</div>
                                  {org.subtitle && <p className="text-zinc-400 text-[10px] truncate">{org.subtitle}</p>}
                                </div>
                              </button>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEntityDrawer(org)}
                                  className="px-2.5 py-1 rounded-lg bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-mono hover:bg-purple-900 cursor-pointer"
                                >
                                  Explorar
                                </button>
                                {renderEyeToggle(`org_${org.id}`, org.title, 'all', { compact: true })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Seção 2: Rede Social & Missões/Rumores */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
                {/* Relacionamentos Sociais */}
                {(isActualGm ? relationships.length > 0 : visibleRelationships.length > 0) && (
                  <div className="p-5 rounded-3xl bg-[#0b0814] border border-purple-900/40 space-y-3.5 shadow-xl h-full">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-purple-300 font-mono flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-purple-400" />
                        Rede Social & Vínculos ({isActualGm ? relationships.length : visibleRelationships.length})
                      </span>
                      {renderEyeToggle('relationships', 'Rede Social')}
                    </div>

                    <div className="space-y-2">
                      {(isActualGm ? relationships : visibleRelationships).map((rel) => {
                        const isRelRev = isFieldRevealed(`rel_${rel.id}`, 'all') && !rel.isSecret;
                        return (
                          <div
                            key={rel.id}
                            className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 transition-all ${
                              isActualGm && !isRelRev
                                ? 'bg-rose-950/30 border-rose-800/60'
                                : 'bg-black/40 border-zinc-800'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-zinc-200">{rel.targetName}</span>
                                <span className="text-purple-300 text-[11px] font-mono">({rel.relationshipType})</span>
                                {rel.isSecret && (
                                  <span className="text-[9px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded font-mono">
                                    Segredo GM
                                  </span>
                                )}
                              </div>
                              {rel.notes && <p className="text-zinc-400 text-[11px] mt-0.5">{rel.notes}</p>}
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {rel.targetEntityId && (
                                <button
                                  type="button"
                                  onClick={() => onNavigate(rel.targetEntityId!)}
                                  className="px-2.5 py-1 rounded-lg bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-mono hover:bg-purple-900 cursor-pointer shrink-0"
                                >
                                  Ver
                                </button>
                              )}
                              {renderEyeToggle(`rel_${rel.id}`, `Relação com ${rel.targetName}`, 'all', { compact: true })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Missões & Rumores */}
                {(isActualGm
                  ? rumors.length > 0 || quests.length > 0
                  : visibleRumors.length > 0 || visibleQuests.length > 0
                ) && (
                  <div className="p-5 rounded-3xl bg-[#0b0814] border border-amber-900/40 space-y-3.5 shadow-xl h-full">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-300 font-mono flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-amber-400" />
                        Ganchos de Missão & Rumores
                      </span>
                      {renderEyeToggle('questsAndRumors', 'Missões & Rumores')}
                    </div>

                    <div className="space-y-2.5">
                      {/* Quests */}
                      {(isActualGm ? quests : visibleQuests).map((q) => {
                        const isQuestRev = isFieldRevealed(`quest_${q.id}`, 'all') && !q.isSecret;
                        return (
                          <div
                            key={q.id}
                            className={`p-3 rounded-xl border text-xs space-y-1 transition-all ${
                              isActualGm && !isQuestRev
                                ? 'bg-rose-950/30 border-rose-800/60'
                                : 'bg-amber-950/20 border-amber-800/40'
                            }`}
                          >
                            <div className="font-bold text-amber-200 flex items-center justify-between gap-1.5">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <Sparkle className="w-3 h-3 text-amber-400 shrink-0" />
                                <span className="truncate">{q.title}</span>
                                {q.roleInQuest && <span className="text-[10px] font-mono text-zinc-400">({q.roleInQuest})</span>}
                                {q.isSecret && (
                                  <span className="text-[9px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded font-mono">
                                    Segredo GM
                                  </span>
                                )}
                              </div>
                              {renderEyeToggle(`quest_${q.id}`, `Missão: ${q.title}`, 'all', { compact: true })}
                            </div>
                            {q.description && <p className="text-zinc-300 text-[11px] leading-relaxed">{q.description}</p>}
                          </div>
                        );
                      })}

                      {/* Rumors */}
                      {(isActualGm ? rumors : visibleRumors).map((r) => {
                        const isRumorRev = isFieldRevealed(`rumor_${r.id}`, 'all');
                        return (
                          <div
                            key={r.id}
                            className={`p-3 rounded-xl border text-xs italic text-zinc-300 flex items-start justify-between gap-2.5 transition-all ${
                              isActualGm && !isRumorRev
                                ? 'bg-rose-950/30 border-rose-800/60'
                                : 'bg-black/40 border-zinc-800'
                            }`}
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <Quote className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                              <div>
                                <p className="leading-relaxed">"{r.text}"</p>
                                {r.source && <span className="text-[10px] text-zinc-500 font-mono not-italic mt-1 block">— {r.source}</span>}
                              </div>
                            </div>
                            {renderEyeToggle(`rumor_${r.id}`, `Rumor`, 'all', { compact: true })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {totalSocialCount === 0 && (
                <div className="p-8 rounded-3xl bg-[#0b0814] border border-zinc-800/80 text-center space-y-2 shadow-xl">
                  <Users className="w-10 h-10 text-zinc-600 mx-auto" />
                  <h4 className="text-sm font-bold text-zinc-300">Nenhum Vínculo Registrado</h4>
                  <p className="text-xs text-zinc-500 max-w-md mx-auto">
                    Nenhum relacionamento social, rumor, local ou missão visível para este NPC no momento.
                  </p>
                  {isActualGm && onEdit && (
                    <button
                      type="button"
                      onClick={onEdit}
                      className="mt-2 px-3 py-1.5 text-xs font-semibold text-purple-300 bg-purple-950/60 hover:bg-purple-900 border border-purple-800 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Vincular Relações & Missões
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ─── ABA 4: INVENTÁRIO & BENS ─── */}
          {activeTab === 'inventory' && (
            <div className="space-y-5 animate-fade-in">
              <div className="p-6 rounded-3xl bg-[#0b0814] border border-amber-900/40 space-y-5 shadow-xl">
                <div className="flex items-center justify-between border-b border-amber-950/60 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Coins className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono">
                      Posse de Moedas & Pertences Carregados
                    </h3>
                  </div>
                  {renderEyeToggle('inventory', 'Inventário Completo')}
                </div>

                <div className="space-y-5">
                  {/* Moedas */}
                  {(isActualGm || isCurrencyVisible) && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-400/90 uppercase font-mono flex items-center gap-1.5">
                          <Coins className="w-3.5 h-3.5 text-amber-400" />
                          Moedas & Riquezas em Dinheiro
                        </span>
                        {renderEyeToggle('currency', 'Moedas')}
                      </div>

                      {hasCurrency ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                          {currency?.po !== undefined && (
                            <div className="p-3 rounded-2xl bg-[#1a140a] border border-amber-800/60 text-center">
                              <div className="text-[10px] uppercase font-mono text-amber-400 font-bold">Ouro (PO)</div>
                              <div className="text-lg font-black text-amber-200 font-mono mt-0.5">{currency.po}</div>
                            </div>
                          )}
                          {currency?.pp !== undefined && (
                            <div className="p-3 rounded-2xl bg-[#141618] border border-zinc-700/60 text-center">
                              <div className="text-[10px] uppercase font-mono text-zinc-300 font-bold">Prata (PP)</div>
                              <div className="text-lg font-black text-zinc-100 font-mono mt-0.5">{currency.pp}</div>
                            </div>
                          )}
                          {currency?.pc !== undefined && (
                            <div className="p-3 rounded-2xl bg-[#180f0a] border border-orange-800/60 text-center">
                              <div className="text-[10px] uppercase font-mono text-orange-400 font-bold">Cobre (PC)</div>
                              <div className="text-lg font-black text-orange-200 font-mono mt-0.5">{currency.pc}</div>
                            </div>
                          )}
                          {currency?.custom && (
                            <div className="p-3 rounded-2xl bg-[#170a24] border border-purple-800/60 text-center">
                              <div className="text-[10px] uppercase font-mono text-purple-300 font-bold">Especial</div>
                              <div className="text-xs font-bold text-purple-200 mt-1 truncate">{currency.custom}</div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-400 italic">Nenhum montante monetário registrado.</p>
                      )}
                    </div>
                  )}

                  {/* Itens e Equipamento */}
                  {(isActualGm ? lootItems.length > 0 : visibleLootItems.length > 0) ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-300 uppercase font-mono flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-amber-400" />
                          Itens Carregados ({isActualGm ? lootItems.length : visibleLootItems.length})
                        </span>
                        {renderEyeToggle('loot', 'Itens de Loot')}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {(isActualGm ? lootItems : visibleLootItems).map((item, idx) => {
                          const isItemRev = isFieldRevealed(`loot_${item.id || item.name || idx}`, 'all') && !item.isSecret;
                          return (
                            <div
                              key={idx}
                              className={`p-3 rounded-2xl border text-left flex items-center justify-between gap-2 transition-all group ${
                                isActualGm && !isItemRev
                                  ? 'bg-rose-950/30 border-rose-800/60'
                                  : 'bg-[#0a0614] border-zinc-800/80 hover:border-amber-500/60 hover:bg-[#120a1c]'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => handleOpenItemDrawer(item.itemEntityId || item.itemId, item.name)}
                                className="min-w-0 flex-1 text-left cursor-pointer"
                              >
                                <div className="text-xs font-bold text-zinc-200 group-hover:text-amber-300 truncate flex items-center gap-1.5">
                                  <span>{item.name}</span>
                                  {item.isSecret && (
                                    <span className="text-[9px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded font-mono">
                                      Segredo GM
                                    </span>
                                  )}
                                </div>
                                {item.quantity && Number(item.quantity) > 1 && (
                                  <div className="text-[10px] text-zinc-400 font-mono">Qtd: {item.quantity}</div>
                                )}
                              </button>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleOpenItemDrawer(item.itemEntityId || item.itemId, item.name)}
                                  className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-zinc-900 text-zinc-400 group-hover:text-amber-300 border border-zinc-800 hover:bg-black cursor-pointer"
                                >
                                  Ver
                                </button>
                                {renderEyeToggle(`loot_${item.id || item.name || idx}`, item.name, 'all', { compact: true })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl bg-black/30 border border-zinc-800 text-center space-y-2">
                      <Package className="w-8 h-8 text-zinc-600 mx-auto" />
                      <p className="text-xs text-zinc-400">Nenhum item ou equipamento registrado no inventário deste NPC.</p>
                      {isActualGm && onEdit && (
                        <button
                          type="button"
                          onClick={onEdit}
                          className="px-3 py-1.5 text-xs font-semibold text-amber-300 bg-amber-950/60 hover:bg-amber-900 border border-amber-800 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Adicionar Itens / Loot
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ─── ABA 5: CONEXÕES DO CODEX ─── */}
          {activeTab === 'backlinks' && (isActualGm ? backlinks.length > 0 : visibleBacklinks.length > 0) && (
            <div className="space-y-5 animate-fade-in">
              <div className="rounded-3xl bg-[#0f0a1c] border border-zinc-800/80 p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 font-mono flex items-center gap-1.5">
                    <Link2 className="w-4 h-4 text-cyan-400" />
                    Conexões e Menções Cruzadas ({isActualGm ? backlinks.length : visibleBacklinks.length})
                  </span>
                  {renderEyeToggle('backlinks', 'Conexões Cruzadas')}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(isActualGm ? backlinks : visibleBacklinks).map((b) => {
                    const isBacklinkRev = isFieldRevealed(`backlink_${b.id}`, 'all');
                    return (
                      <div
                        key={b.id}
                        className={`p-3.5 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all group ${
                          isActualGm && !isBacklinkRev
                            ? 'bg-rose-950/30 border-rose-800/60'
                            : 'bg-[#140c24] border-zinc-800/80 hover:border-cyan-500/60'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => onNavigate(b.id)}
                          className="min-w-0 flex items-center gap-2.5 flex-1 text-left cursor-pointer"
                        >
                          <EntityIcon icon={b.icon} category={b.category} className="w-4 h-4 text-cyan-400 shrink-0" />
                          <span className="text-xs font-bold text-zinc-200 group-hover:text-cyan-300 truncate">{b.title}</span>
                        </button>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] font-mono text-zinc-500 uppercase bg-black/40 px-2 py-0.5 rounded border border-zinc-800">
                            {b.category}
                          </span>
                          {renderEyeToggle(`backlink_${b.id}`, b.title, 'all', { compact: true })}
                        </div>
                      </div>
                    );
                  })}
                </div>
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
