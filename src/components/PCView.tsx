import React, { useState, useEffect, useMemo } from 'react';
import {
  HecosEntity,
  PCAttributes,
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
import { QuestCard } from './QuestCard';
import { sortTraitsHierarchically } from '../utils/traitUtils';
import {
  User,
  Users,
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
  Tag,
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

interface PCViewProps {
  entity: HecosEntity;
  onEdit?: () => void;
  onDelete?: () => void;
  onNavigate: (id: string) => void;
  onTagClick: (tag: string) => void;
}

export type PCTabType = 'profile' | 'combat' | 'social' | 'inventory' | 'backlinks';

export const PCView: React.FC<PCViewProps> = ({
  entity,
  onEdit,
  onDelete,
  onNavigate,
  onTagClick,
}) => {
  const [currentEntity, setCurrentEntity] = useState<HecosEntity>(entity);
  const [activeTab, setActiveTab] = useState<PCTabType>('profile');
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
  const pc: Partial<PCAttributes> = currentEntity.pcData || {};

  // Mutual Linking resolution
  const linkedData: LinkedEntitiesForNPC = useMemo(() => {
    return MutualLinkService.getLinkedForPC(currentEntity, allEntities);
  }, [currentEntity, allEntities]);

  // Visibility dictionary for granular permissions
  const fieldVis: NPCFieldVisibility = useMemo(() => {
    return pc?.fieldVisibility || {};
  }, [pc?.fieldVisibility]);

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

    const updatedFieldVis: Record<string, ItemVisibility> = {
      ...fieldVis,
      [fieldKey]: nextVis,
    };

    // Synchronize parent and child keys for nested sections
    if (fieldKey === 'questsAndRumors') {
      updatedFieldVis['quests'] = nextVis;
      updatedFieldVis['rumors'] = nextVis;
    } else if (fieldKey === 'quests' || fieldKey === 'rumors') {
      if (nextVis === 'all') {
        updatedFieldVis['questsAndRumors'] = 'all';
      }
    } else if (fieldKey === 'inventory') {
      updatedFieldVis['loot'] = nextVis;
      updatedFieldVis['currency'] = nextVis;
    } else if (fieldKey === 'loot' || fieldKey === 'currency') {
      if (nextVis === 'all') {
        updatedFieldVis['inventory'] = 'all';
      }
    }

    const updatedPcData: PCAttributes = {
      ...(currentEntity.pcData || {}),
      fieldVisibility: updatedFieldVis,
    };

    const updatedEntity: HecosEntity = {
      ...currentEntity,
      pcData: updatedPcData,
    };

    HecosStorage.saveEntity(updatedEntity);
    setCurrentEntity(updatedEntity);
  };

  // Unlink a quest directly from PCView (GM only)
  const handleUnlinkQuest = (questIdentifier: string) => {
    if (!isActualGm) return;

    const remainingQuests = (currentEntity.pcData?.quests || []).filter(
      (q) => q.id !== questIdentifier && q.questEntityId !== questIdentifier
    );
    const remainingQuestIds = (currentEntity.pcData?.questIds || []).filter(
      (id) => id !== questIdentifier
    );

    const updatedPcData: PCAttributes = {
      ...(currentEntity.pcData || {}),
      quests: remainingQuests,
      questIds: remainingQuestIds,
    };

    const updatedEntity: HecosEntity = {
      ...currentEntity,
      pcData: updatedPcData,
    };

    HecosStorage.saveEntity(updatedEntity);
    MutualLinkService.syncMutualLinksOnSave(updatedEntity);
    setCurrentEntity(updatedEntity);
  };

  // Quick Action: Reveal All / Hide All or Hide Sensitive Data
  const handleSetAllVisibility = (mode: 'all_visible' | 'all_hidden' | 'hide_sensitive') => {
    if (!isActualGm) return;

    const newFieldVis: Record<string, ItemVisibility> = { ...fieldVis };

    // Standard list of keys
    const coreKeys = [
      'portraitImage', 'tokenImage', 'level', 'playerOwner', 'role', 'traits',
      'subcategories', 'locationFactionCard', 'identityBlock', 'occupation',
      'location', 'ancestry', 'faction', 'wealth', 'alignment', 'ageAndPronouns',
      'psychologyBlock', 'voiceAndSpeech', 'personality', 'appearance', 'canOffer',
      'narrativeLore', 'combatStats', 'acAndDefenses', 'hpAndHealth', 'perceptionAndSenses',
      'speed', 'keySkills', 'specialAbilities', 'relationships', 'questsAndRumors',
      'quests', 'rumors', 'inventory', 'currency', 'loot', 'backlinks', 'linkedLocations',
      'linkedOrganizations', 'heroPoints', 'background', 'deity'
    ];

    const sensitiveKeys = [
      'motivations', 'triggers', 'secrets', 'combatStats', 'acAndDefenses',
      'hpAndHealth', 'perceptionAndSenses', 'specialAbilities', 'currency', 'loot'
    ];

    // Collect all dynamic item keys
    const dynamicKeys: string[] = [];
    const rawT = (pc.traits && pc.traits.length > 0)
      ? pc.traits
      : (currentEntity.traits && currentEntity.traits.length > 0)
      ? currentEntity.traits
      : [];
    rawT.forEach(t => dynamicKeys.push(`tag_${t}`));

    const subc = currentEntity.subcategories || (currentEntity.subcategory ? [currentEntity.subcategory] : []);
    subc.forEach(s => dynamicKeys.push(`folder_${s}`));

    (pc.relationships || []).forEach(r => dynamicKeys.push(`rel_${r.id}`));
    (pc.quests || []).forEach(q => dynamicKeys.push(`quest_${q.id}`));
    (pc.rumors || []).forEach(r => dynamicKeys.push(`rumor_${r.id}`));
    (pc.loot || pc.inventory || []).forEach((item, idx) => dynamicKeys.push(`loot_${item.id || idx}`));
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

    const updatedPcData: PCAttributes = {
      ...(currentEntity.pcData || {}),
      fieldVisibility: newFieldVis
    };

    const updatedEntity: HecosEntity = {
      ...currentEntity,
      pcData: updatedPcData
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
    if (pc?.gmSecret && pc.gmSecret.trim()) return pc.gmSecret.trim();
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
  }, [pc?.gmSecret, pc?.gmNotes, currentEntity.gmNotes, currentEntity.content]);

  // Clean content for tab narrative lore rendering
  const cleanContentForNarrative = useMemo(() => {
    if (!currentEntity.content) return '';
    return currentEntity.content
      .replace(/:::gm(?:-only)?\s*[\s\S]*?:::/gi, '')
      .replace(/:::secret\s*[\s\S]*?:::/gi, '')
      .trim();
  }, [currentEntity.content]);

  // Meta & Identity
  const level = pc.level ?? currentEntity.statblock?.level ?? 1;
  const charClass = pc.characterClass || pc.class || currentEntity.subtitle || 'Aventureiro';
  const subclass = pc.subclass;
  const playerName = pc.playerName;
  const occupation = pc.occupation || pc.role;
  const location = pc.location;
  const ancestry = pc.ancestry;
  const heritage = pc.heritage;
  const background = pc.background;
  const deity = pc.deity;
  const faction = pc.faction || pc.organization;
  const wealth = pc.wealth;
  const size = pc.size || currentEntity.statblock?.size || 'Médio';
  const age = pc.age;
  const pronouns = pc.pronouns;
  const alignment = pc.alignment;

  // Combat Stats
  const hasCombatStats = Boolean(
    pc.hasCombatStats ||
    currentEntity.statblock?.hp ||
    currentEntity.statblock?.ac ||
    pc.hp ||
    pc.maxHp ||
    pc.ac ||
    pc.saves ||
    pc.str ||
    pc.dex ||
    pc.con
  );
  const maxHp = pc.maxHp ?? pc.hp ?? currentEntity.statblock?.hp ?? 10;
  const hp = pc.hp ?? maxHp;
  const ac = pc.ac ?? currentEntity.statblock?.ac ?? 10;
  const perception = pc.perception ?? currentEntity.statblock?.perception ?? 0;
  const speed = pc.speed ?? currentEntity.statblock?.speed ?? '9m (6q)';
  const heroPoints = pc.heroPoints ?? 0;
  const saves = pc.saves || {
    fortitude: pc.fort,
    reflex: pc.ref,
    will: pc.will
  };

  // Ability Scores
  const str = pc.str ?? pc.attributes?.str ?? 10;
  const dex = pc.dex ?? pc.attributes?.dex ?? 10;
  const con = pc.con ?? pc.attributes?.con ?? 10;
  const int = pc.int ?? pc.attributes?.int ?? 10;
  const wis = pc.wis ?? pc.attributes?.wis ?? 10;
  const cha = pc.cha ?? pc.attributes?.cha ?? 10;

  const getMod = (score: number) => {
    const mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  const keySkills = pc.keySkills;
  const anyPc = pc as any;
  const specialAbilities = pc.specialAbilities || anyPc.feats;
  const attacks = pc.attacks || [];
  const spells = pc.spells;

  // Psychology / Social
  const concept = pc.concept;
  const voice = pc.voice || pc.voiceAndSpeech;
  const mannerisms = pc.mannerisms;
  const personality = pc.personality;
  const motivations = pc.motivations || pc.motivation;
  const appearance = pc.appearance;
  const firstImpression = pc.firstImpression;
  const triggers = pc.triggers;
  const canOffer = pc.canOffer;
  const secrets = pc.secrets;

  // Lists
  const relationships: NPCRelationship[] = pc.relationships || [];
  const rumors: NPCRumor[] = pc.rumors || [];

  // Quests
  const quests: NPCQuestLink[] = useMemo(() => {
    const map = new Map<string, NPCQuestLink>();

    // 1. Direct explicit quests array
    (pc.quests || []).forEach((q, idx) => {
      const key = q.questEntityId || q.id || `q-${idx}-${q.title}`;
      map.set(key, {
        ...q,
        id: q.id || q.questEntityId || `q-${idx}`,
      });
    });

    // 2. Direct quest IDs
    (pc.questIds || []).forEach((qId) => {
      if (qId && !map.has(qId)) {
        const ent = allEntities.find((e) => e.id === qId);
        if (ent) {
          map.set(qId, {
            id: ent.id,
            questEntityId: ent.id,
            title: ent.title,
            roleInQuest: 'Missão Vinculada',
            description: ent.subtitle || ent.summary || '',
            isSecret: Boolean(ent.isSecret || ent.visibility === 'gm'),
          });
        }
      }
    });

    // 3. Mutual links
    (linkedData.quests || []).forEach((lq) => {
      const key = lq.entity?.id || lq.linkId || lq.title;
      if (key && !map.has(key)) {
        map.set(key, {
          id: lq.linkId || lq.entity?.id || key,
          questEntityId: lq.entity?.id,
          title: lq.title,
          roleInQuest: lq.roleInQuest || 'Missão Vinculada',
          description: lq.description || lq.entity?.subtitle || '',
          isSecret: Boolean(lq.isSecret || lq.entity?.isSecret || lq.entity?.visibility === 'gm'),
        });
      }
    });

    return Array.from(map.values());
  }, [pc.quests, pc.questIds, linkedData.quests, allEntities]);

  // Inventory & Currency
  const currency = pc.currency;
  const hasCurrency = Boolean(currency && (currency.po || currency.pp || currency.pc || currency.custom));
  const lootItems: NPCLootItem[] = pc.loot || pc.inventory || [];

  // Images
  const portraitImage = currentEntity.coverImage || pc.portraitImage;
  const tokenImage = pc.tokenImage || currentEntity.icon;

  // Traits
  const rawTraits = (pc.traits && pc.traits.length > 0)
    ? pc.traits
    : (currentEntity.traits && currentEntity.traits.length > 0)
    ? currentEntity.traits
    : [];
  const orderedTraits = sortTraitsHierarchically(rawTraits, { rarity: pc.rarity || 'Comum', size });

  const visibleTraits = isActualGm
    ? orderedTraits
    : isFieldVisible('traits')
    ? orderedTraits.filter(t => isFieldVisible(`tag_${t}`))
    : [];

  // Discrete Tags
  const discreteTags = (currentEntity.tags || []).filter(
    (t) => !rawTraits.some((tr) => tr.toLowerCase() === t.toLowerCase())
  );

  // Subcategories
  const subcategories = pc.subcategories || currentEntity.subcategories || (currentEntity.subcategory ? [currentEntity.subcategory] : []);

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
  }, [allEntities, currentEntity.id, currentEntity.slug, currentEntity.title]);

  // Filtered visible elements for regular players
  const visibleLootItems = lootItems.filter((item, idx) => {
    if (isActualGm) return true;
    if (item.isSecret) return false;
    return isFieldVisible(`loot_${item.id || item.name || idx}`) && isFieldVisible('loot') && isFieldVisible('inventory');
  });

  const visibleRelationships = relationships.filter((rel) => {
    if (isActualGm) return true;
    if (rel.isSecret) return false;
    return isFieldVisible(`rel_${rel.id}`) && isFieldVisible('relationships');
  });

  const visibleQuests = quests.filter((q) => {
    if (isActualGm) return true;
    if (q.isSecret) return false;
    return isFieldVisible(`quest_${q.id}`) && isFieldVisible('quests') && isFieldVisible('questsAndRumors');
  });

  const visibleRumors = rumors.filter((r) => {
    if (isActualGm) return true;
    return isFieldVisible(`rumor_${r.id}`) && isFieldVisible('rumors') && isFieldVisible('questsAndRumors');
  });

  const visibleBacklinks = backlinks.filter((b) => {
    if (isActualGm) return true;
    return isFieldVisible(`backlink_${b.id}`) && isFieldVisible('backlinks');
  });

  const visibleLinkedLocations = linkedData.locations.filter((loc) => {
    if (isActualGm) return true;
    return isFieldVisible(`location_${loc.id}`) && isFieldVisible('linkedLocations');
  });

  const visibleLinkedOrganizations = linkedData.organizations.filter((org) => {
    if (isActualGm) return true;
    return isFieldVisible(`org_${org.id}`) && isFieldVisible('linkedOrganizations');
  });

  const isCurrencyVisible = isFieldVisible('currency') && isFieldVisible('inventory');
  const totalSocialCount = (isActualGm ? relationships.length : visibleRelationships.length) +
    (isActualGm ? quests.length : visibleQuests.length) +
    (isActualGm ? rumors.length : visibleRumors.length) +
    (isActualGm ? linkedData.locations.length : visibleLinkedLocations.length) +
    (isActualGm ? linkedData.organizations.length : visibleLinkedOrganizations.length);

  const totalInventoryCount = (isActualGm ? lootItems.length : visibleLootItems.length) + (hasCurrency && (isActualGm || isCurrencyVisible) ? 1 : 0);

  const handleOpenAncestryDrawer = () => {
    if (!ancestry) return;
    window.dispatchEvent(
      new CustomEvent('hecos:open-ancestry-drawer', { detail: { ancestryName: ancestry } })
    );
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

  const handleOpenEntityDrawer = (target: HecosEntity) => {
    if (!isActualGm && !HecosStorage.canUserAccessItem(target)) {
      return;
    }
    window.dispatchEvent(
      new CustomEvent('hecos:open-entity-drawer', {
        detail: { entityId: target.id, slug: target.slug },
      })
    );
  };

  return (
    <div id={`pc-view-${currentEntity.id}`} className="space-y-6 pb-12 animate-fade-in text-zinc-100 max-w-7xl mx-auto">
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MASTER GM VISIBILITY / CONTROLE DE OLHINHO TOOLBAR                      */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {isActualGm && (
        <div className="p-4 rounded-3xl bg-[#091526] border border-sky-500/40 shadow-2xl space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/40 shrink-0">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-sky-300">
                    Controle de Permissões &amp; Olhinho do Personagem
                  </h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold">
                    Modo Mestre
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Controle a visibilidade de blocos de combate, inventário, histórico e vínculos deste Personagem.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <Tooltip
                title="Revelar Tudo"
                description="Torna todos os campos e seções visíveis para os jogadores."
                badge="GM Rápido"
              >
                <button
                  type="button"
                  onClick={() => handleSetAllVisibility('all_visible')}
                  className="px-2.5 py-1 text-xs font-mono rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/80 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Revelar Tudo</span>
                </button>
              </Tooltip>

              <Tooltip
                title="Ocultar Dados Sensíveis"
                description="Oculta estatísticas de combate, notas secretas, gatilhos e loot."
                badge="GM Rápido"
              >
                <button
                  type="button"
                  onClick={() => handleSetAllVisibility('hide_sensitive')}
                  className="px-2.5 py-1 text-xs font-mono rounded-xl bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-700/80 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ocultar Sensíveis</span>
                </button>
              </Tooltip>

              <Tooltip
                title="Ocultar Tudo"
                description="Oculta todas as informações deste personagem para os jogadores."
                badge="GM Rápido"
              >
                <button
                  type="button"
                  onClick={() => handleSetAllVisibility('all_hidden')}
                  className="px-2.5 py-1 text-xs font-mono rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-700/80 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <EyeOff className="w-3.5 h-3.5 text-rose-400" />
                  <span>Ocultar Tudo</span>
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* CORPO PRINCIPAL (2 COLUNAS: RETRATO/TOKEN NA ESQ + DADOS NA DIR)        */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* COLUNA ESQUERDA: RETRATO VERTICAL + TOKEN + AFILIAÇÃO + JOGADOR     */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-4 space-y-4">
          {/* Retrato Vertical (Cover do Personagem) */}
          {(portraitImage || isActualGm) && (isActualGm || isFieldVisible('portraitImage')) && (
            <div className="relative rounded-3xl bg-[#080d16] border border-sky-900/40 p-2 overflow-hidden shadow-2xl group">
              <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-[#091526]">
                {portraitImage ? (
                  <AdjustableImage
                    src={portraitImage}
                    alt={currentEntity.title}
                    imageKey={`pc-portrait-${currentEntity.id}`}
                    isGm={isActualGm}
                    containerClassName="w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-zinc-600 bg-gradient-to-b from-[#091526] to-[#040810]">
                    <Users className="w-16 h-16 mb-2 opacity-30 text-sky-400" />
                    <span className="text-xs font-mono text-zinc-400">Nenhum retrato definido</span>
                  </div>
                )}

                {/* Olhinho no canto do Retrato para o Mestre */}
                {isActualGm && (
                  <div className="absolute top-2.5 right-2.5 z-20">
                    {renderEyeToggle('portraitImage', 'Retrato Vertical', 'all', { compact: true })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Card do Token de Mesa / VTT */}
          {(tokenImage || isActualGm) && (isActualGm || isFieldVisible('tokenImage')) && (
            <div className="p-4 rounded-3xl bg-[#080d16] border border-sky-900/40 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-300 font-mono flex items-center gap-1.5">
                  <Crosshair className="w-3.5 h-3.5 text-sky-400" />
                  Token de Mesa / VTT
                </span>
                {renderEyeToggle('tokenImage', 'Token de Mesa')}
              </div>

              <div className="flex items-center gap-3.5">
                <div className="w-16 h-16 rounded-2xl bg-[#091526] border-2 border-sky-500/40 overflow-hidden shrink-0 shadow-lg flex items-center justify-center">
                  {tokenImage ? (
                    <AdjustableImage
                      src={tokenImage}
                      alt={`Token de ${currentEntity.title}`}
                      imageKey={`pc-token-${currentEntity.id}`}
                      isGm={isActualGm}
                      containerClassName="w-full h-full"
                    />
                  ) : (
                    <EntityIcon
                      icon={currentEntity.icon}
                      category="pc"
                      className="w-8 h-8 text-sky-400"
                    />
                  )}
                </div>
                <div className="text-xs text-zinc-400 min-w-0">
                  <div className="font-bold text-zinc-200 truncate">{currentEntity.title}</div>
                  <div className="text-[11px] text-sky-300/80 font-mono mt-0.5">
                    {charClass} {level ? `(Nv ${level})` : ''}
                  </div>
                  {playerName && (
                    <div className="text-[10px] text-zinc-400 truncate mt-0.5">
                      Jogador: <strong className="text-zinc-200">{playerName}</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Pastas & Subcategorias (Estritamente Exclusivo do GM) */}
          {isActualGm && subcategories.length > 0 && (
            <div className="p-4 rounded-3xl bg-[#080d16] border border-sky-900/40 space-y-2.5 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-300 font-mono flex items-center gap-1.5">
                  <Folder className="w-3.5 h-3.5 text-sky-400" />
                  Pastas do Codex (Apenas GM)
                </span>
                {renderEyeToggle('subcategories', 'Pastas', 'gm')}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {subcategories.map((sub) => (
                  <span
                    key={sub}
                    className="text-xs px-2.5 py-1 rounded-xl bg-sky-950/60 text-sky-300 border border-sky-800/60 font-mono font-medium flex items-center gap-1"
                  >
                    <Folder className="w-3 h-3 text-sky-400" />
                    <span>{sub}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Card Resumo de Afiliação e Residência */}
          {(location || faction || linkedData.locations.length > 0 || linkedData.organizations.length > 0) && (isActualGm || isFieldVisible('locationFactionCard')) && (
            <div className="p-4 rounded-3xl bg-[#080d16] border border-sky-900/40 space-y-3 text-xs shadow-xl">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                <span className="font-bold text-sky-300 font-mono uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-sky-400" />
                  Vínculos no Mundo
                </span>
                {renderEyeToggle('locationFactionCard', 'Card de Vínculos')}
              </div>

              {(location || linkedData.locations.length > 0) && (isActualGm || isFieldVisible('location')) && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-zinc-400 text-[11px] font-mono">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-cyan-400" />
                      Residência / Local:
                    </span>
                    {renderEyeToggle('location', 'Residência', 'all', { compact: true })}
                  </div>
                  {linkedData.locations.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-1">
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
                    <div className="font-bold text-zinc-200 pl-4">{location}</div>
                  )}
                </div>
              )}

              {(faction || linkedData.organizations.length > 0) && (isActualGm || isFieldVisible('faction')) && (
                <div className="space-y-1 pt-1 border-t border-zinc-800/60">
                  <div className="flex items-center justify-between text-zinc-400 text-[11px] font-mono">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-teal-400" />
                      Facção / Guilda:
                    </span>
                    {renderEyeToggle('faction', 'Facção', 'all', { compact: true })}
                  </div>
                  {linkedData.organizations.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {linkedData.organizations.map(org => (
                        <button
                          key={org.id}
                          type="button"
                          onClick={() => handleOpenEntityDrawer(org)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-teal-950/40 text-teal-300 border border-teal-800/50 hover:bg-teal-900/50 text-xs font-semibold cursor-pointer"
                        >
                          <Building2 className="w-3 h-3 text-teal-400" />
                          <span>{org.title}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="font-bold text-teal-200 pl-4">{faction}</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* COLUNA DIREITA: HEADER DO PERSONAGEM + ABAS INTEGRADAS               */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-8 space-y-5">
          {/* Header Superior: Nome, Subtítulo, Badges e Controles do GM */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Badge de Classe & Subclasse */}
                <div className="inline-flex items-center gap-1">
                  <Tooltip
                    title="Classe do Personagem"
                    description={`${charClass}${subclass ? ` (${subclass})` : ''} • Nível ${level}`}
                    badge="PC"
                  >
                    <span className="px-3 py-1 rounded-xl bg-sky-950/80 text-sky-300 border border-sky-700/80 font-mono font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-help">
                      <Swords className="w-3.5 h-3.5 text-sky-400" />
                      <span>{charClass}{subclass ? ` • ${subclass}` : ''}</span>
                    </span>
                  </Tooltip>
                  {renderEyeToggle('role', 'Classe', 'all', { compact: true })}
                </div>

                {/* Badge de Nível */}
                <div className="inline-flex items-center gap-1">
                  <Tooltip
                    title="Nível do Personagem"
                    description={`Nível ${level} — Define as estatísticas de combate, magias e graduações.`}
                    badge={`Nv ${level}`}
                  >
                    <span className="px-3 py-1 rounded-xl bg-black/70 text-sky-300 border border-sky-800 font-mono font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-help">
                      <span>Nível {level}</span>
                    </span>
                  </Tooltip>
                  {renderEyeToggle('level', 'Nível', 'all', { compact: true })}
                </div>

                {/* Badge do Jogador */}
                {playerName && (isActualGm || isFieldVisible('playerOwner')) && (
                  <div className="inline-flex items-center gap-1">
                    <Tooltip
                      title="Jogador Responsável"
                      description={`Personagem controlado por ${playerName}`}
                      badge="Jogador"
                    >
                      <span className="px-3 py-1 rounded-xl bg-sky-950/50 text-sky-300 border border-sky-800/70 font-mono font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-help">
                        <User className="w-3.5 h-3.5 text-sky-400" />
                        <span>{playerName}</span>
                      </span>
                    </Tooltip>
                    {renderEyeToggle('playerOwner', 'Jogador', 'all', { compact: true })}
                  </div>
                )}
              </div>

              {onEdit && isActualGm && (
                <Tooltip
                  title="Editar Ficha"
                  description="Abrir o modal de edição deste Personagem para alterar atributos, vínculos, inventário e notas."
                  badge="GM"
                >
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

            {/* ENTRADA SECRETA DO GM (STRICTLY GM-ONLY, NUNCA EXIBIDA PARA JOGADORES) */}
            {isActualGm && gmSecretNotes && (
              <div className="rounded-2xl bg-[#091526] border-2 border-amber-500/70 shadow-[0_0_20px_rgba(245,158,11,0.15)] overflow-hidden transition-all">
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
                <p className="text-sm text-sky-200/80 font-medium mt-1">{currentEntity.subtitle}</p>
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

            {/* Tags Discretas de Pesquisa & Filtragem */}
            {discreteTags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="text-[11px] text-zinc-500 font-mono flex items-center gap-1 mr-0.5">
                  <Tag className="w-3 h-3 text-zinc-500" />
                  <span>Tags:</span>
                </span>
                {discreteTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      if (onTagClick) {
                        onTagClick(tag);
                      } else {
                        window.dispatchEvent(new CustomEvent('hecos:filter-by-tag', { detail: { tag } }));
                      }
                    }}
                    className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-zinc-900/70 hover:bg-sky-950/50 text-zinc-400 hover:text-sky-300 border border-zinc-800 hover:border-sky-800/60 transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                    title={`Filtrar compêndio por #${tag}`}
                  >
                    <span>#{tag}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {/* BARRA DE NAVEGAÇÃO POR ABAS (DIVISÃO INTELIGENTE DE INFORMAÇÕES)        */}
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          <div className="bg-[#080d16] p-1.5 rounded-2xl border border-sky-900/40 shadow-lg overflow-x-auto no-scrollbar">
            <nav className="flex items-center gap-1.5 min-w-max" aria-label="Abas do Personagem">
              {/* Aba 1: Perfil & Interpretação */}
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-900/40'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/70'
                }`}
              >
                <Brain className="w-3.5 h-3.5 text-sky-300" />
                <span>Perfil &amp; Interpretação</span>
              </button>

              {/* Aba 2: Estatísticas & Combate */}
              <button
                type="button"
                onClick={() => setActiveTab('combat')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'combat'
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-900/40'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/70'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-rose-400" />
                <span>Estatísticas &amp; Combate</span>
                {hasCombatStats && isFieldVisible('combatStats') && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${activeTab === 'combat' ? 'bg-black/30 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                    {hp && isFieldVisible('hpAndHealth') ? `${hp}/${maxHp} PV` : 'Stats'}
                  </span>
                )}
              </button>

              {/* Aba 3: Relações & Missões */}
              <button
                type="button"
                onClick={() => setActiveTab('social')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'social'
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-900/40'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/70'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span>Relações &amp; Missões</span>
                {totalSocialCount > 0 && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${activeTab === 'social' ? 'bg-black/30 text-white' : 'bg-sky-950 text-sky-300 border border-sky-800'}`}>
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
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-900/40'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/70'
                }`}
              >
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>Inventário &amp; Bens</span>
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
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-900/40'
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
                  <div className="p-5 rounded-3xl bg-[#080d16] border border-sky-900/40 space-y-3.5 shadow-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-sky-300 font-mono flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4 text-sky-400" />
                        Identidade &amp; Papel Social
                      </span>
                      {renderEyeToggle('identityBlock', 'Bloco de Identidade')}
                    </div>

                    <div className="space-y-2.5 text-xs">
                      {/* Jogador Responsável */}
                      {playerName && (isActualGm || isFieldVisible('playerOwner')) && (
                        <div className="flex justify-between items-baseline py-1 border-b border-zinc-800/60 gap-2">
                          <span className="text-zinc-400 font-mono flex items-center gap-1.5">
                            Jogador Responsável:
                            {renderEyeToggle('playerOwner', 'Jogador', 'all', { compact: true })}
                          </span>
                          <span className="font-bold text-sky-300 text-right">{playerName}</span>
                        </div>
                      )}

                      {/* Classe / Subclasse */}
                      {charClass && (isActualGm || isFieldVisible('role')) && (
                        <div className="flex justify-between items-baseline py-1 border-b border-zinc-800/60 gap-2">
                          <span className="text-zinc-400 font-mono flex items-center gap-1.5">
                            Classe &amp; Trilha:
                            {renderEyeToggle('role', 'Classe', 'all', { compact: true })}
                          </span>
                          <span className="font-bold text-zinc-200 text-right">{charClass}{subclass ? ` (${subclass})` : ''}</span>
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
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-indigo-950/50 text-indigo-300 border border-indigo-800/60 hover:bg-indigo-900/60 transition-all font-bold cursor-pointer text-right group"
                            title={`Abrir painel lateral de ${ancestry}`}
                          >
                            <Dna className="w-3 h-3 text-indigo-400" />
                            <span>{heritage ? `${ancestry} (${heritage})` : ancestry}</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" />
                          </button>
                        </div>
                      )}

                      {/* Antecedente / Background */}
                      {background && (isActualGm || isFieldVisible('background')) && (
                        <div className="flex justify-between items-baseline py-1 border-b border-zinc-800/60 gap-2">
                          <span className="text-zinc-400 font-mono flex items-center gap-1.5">
                            Antecedente:
                            {renderEyeToggle('background', 'Antecedente', 'all', { compact: true })}
                          </span>
                          <span className="font-bold text-zinc-200 text-right">{background}</span>
                        </div>
                      )}

                      {/* Ofício / Ocupação */}
                      {occupation && (isActualGm || isFieldVisible('occupation')) && (
                        <div className="flex justify-between items-baseline py-1 border-b border-zinc-800/60 gap-2">
                          <span className="text-zinc-400 font-mono flex items-center gap-1.5">
                            Ofício / Ocupação:
                            {renderEyeToggle('occupation', 'Ofício', 'all', { compact: true })}
                          </span>
                          <span className="font-bold text-zinc-200 text-right">{occupation}</span>
                        </div>
                      )}

                      {/* Divindade / Patrono */}
                      {deity && (isActualGm || isFieldVisible('deity')) && (
                        <div className="flex justify-between items-baseline py-1 border-b border-zinc-800/60 gap-2">
                          <span className="text-zinc-400 font-mono flex items-center gap-1.5">
                            Divindade / Patrono:
                            {renderEyeToggle('deity', 'Divindade', 'all', { compact: true })}
                          </span>
                          <span className="font-bold text-amber-300 text-right">{deity}</span>
                        </div>
                      )}

                      {/* Residência / Local */}
                      {(location || linkedData.locations.length > 0) && (isActualGm || isFieldVisible('location')) && (
                        <div className="flex justify-between items-center py-1 border-b border-zinc-800/60 gap-2">
                          <span className="text-zinc-400 font-mono flex items-center gap-1.5">
                            Residência / Base:
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

                      {/* Facção / Guilda */}
                      {(faction || linkedData.organizations.length > 0) && (isActualGm || isFieldVisible('faction')) && (
                        <div className="flex justify-between items-center py-1 border-b border-zinc-800/60 gap-2">
                          <span className="text-zinc-400 font-mono flex items-center gap-1.5">
                            Facção / Guilda:
                            {renderEyeToggle('faction', 'Facção', 'all', { compact: true })}
                          </span>
                          {linkedData.organizations.length > 0 ? (
                            <div className="flex flex-wrap gap-1 justify-end">
                              {linkedData.organizations.map(org => (
                                <button
                                  key={org.id}
                                  type="button"
                                  onClick={() => handleOpenEntityDrawer(org)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-teal-950/40 text-teal-300 border border-teal-800/50 hover:bg-teal-900/50 text-xs font-semibold cursor-pointer"
                                >
                                  <Building2 className="w-3 h-3 text-teal-400" />
                                  <span>{org.title}</span>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <span className="font-bold text-teal-200 text-right">{faction}</span>
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
                  <div className="p-5 rounded-3xl bg-[#080d16] border border-sky-900/40 space-y-3.5 shadow-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-sky-300 font-mono flex items-center gap-1.5">
                        <Brain className="w-4 h-4 text-sky-400" />
                        Psicologia &amp; Interpretação
                      </span>
                      {renderEyeToggle('psychologyBlock', 'Bloco de Psicologia')}
                    </div>

                    <div className="space-y-2.5 text-xs">
                      {concept && (isActualGm || isFieldVisible('concept')) && (
                        <div className="p-2.5 rounded-xl bg-sky-950/30 border border-sky-900/40">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-sky-300 font-mono text-[11px] flex items-center gap-1.5 font-bold">
                              <Quote className="w-3.5 h-3.5 text-sky-400" />
                              Conceito &amp; Essência:
                            </span>
                            {renderEyeToggle('concept', 'Conceito', 'all', { compact: true })}
                          </div>
                          <span className="italic text-sky-200/90 leading-relaxed">&ldquo;{concept}&rdquo;</span>
                        </div>
                      )}

                      {voice && (isActualGm || isFieldVisible('voiceAndSpeech')) && (
                        <div className="py-1.5 px-2.5 rounded-xl bg-sky-950/30 border border-sky-900/40">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-sky-300 font-mono text-[11px] flex items-center gap-1.5 font-bold">
                              <Volume2 className="w-3.5 h-3.5 text-sky-400" />
                              Voz &amp; Maneirismos:
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
                            <span className="text-amber-400 font-mono text-[11px] font-bold">Motivação / Objetivos:</span>
                            {renderEyeToggle('motivations', 'Motivações', 'gm', { compact: true })}
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
                        <div className="py-1.5 px-2.5 rounded-xl bg-sky-950/30 border border-sky-800/50">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-sky-300 font-mono text-[11px] font-bold">Segredos Conhecidos:</span>
                            {renderEyeToggle('secrets', 'Segredos', 'gm', { compact: true })}
                          </div>
                          <span className="text-sky-200 leading-relaxed">{secrets}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* CONTEÚDO NARRATIVO / LORE & BIOGRAFIA INTEGRADO NA ABA DE PERFIL */}
              {cleanContentForNarrative && (isActualGm || isFieldVisible('narrativeLore')) && (
                <div className="rounded-3xl bg-[#080d16] border border-zinc-800/80 p-6 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-sky-300 font-mono flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-sky-400" />
                      Histórico &amp; Detalhes Narrativos
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
              <div className="rounded-3xl bg-[#080d16] border border-zinc-800/80 p-6 space-y-6 shadow-xl">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      <Shield className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-bold text-rose-300 uppercase tracking-wider font-mono">
                      Mecânicas de Combate &amp; Parâmetros de Jogo
                    </h3>
                  </div>
                  {renderEyeToggle('combatStats', 'Estatísticas de Combate')}
                </div>

                {/* ATRIBUTOS FUNDAMENTAIS (6 ABILITY SCORES) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <Brain className="w-3.5 h-3.5 text-sky-400" />
                      Atributos Fundamentais
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-center">
                    <div className="p-3 rounded-2xl bg-[#091526] border border-sky-900/60 shadow-sm">
                      <div className="text-[10px] uppercase font-mono text-zinc-400 font-bold">FOR</div>
                      <div className="text-lg font-black text-sky-300 font-mono mt-0.5">{getMod(str)}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">({str})</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#091526] border border-sky-900/60 shadow-sm">
                      <div className="text-[10px] uppercase font-mono text-zinc-400 font-bold">DES</div>
                      <div className="text-lg font-black text-sky-300 font-mono mt-0.5">{getMod(dex)}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">({dex})</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#091526] border border-sky-900/60 shadow-sm">
                      <div className="text-[10px] uppercase font-mono text-zinc-400 font-bold">CON</div>
                      <div className="text-lg font-black text-sky-300 font-mono mt-0.5">{getMod(con)}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">({con})</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#091526] border border-sky-900/60 shadow-sm">
                      <div className="text-[10px] uppercase font-mono text-zinc-400 font-bold">INT</div>
                      <div className="text-lg font-black text-sky-300 font-mono mt-0.5">{getMod(int)}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">({int})</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#091526] border border-sky-900/60 shadow-sm">
                      <div className="text-[10px] uppercase font-mono text-zinc-400 font-bold">SAB</div>
                      <div className="text-lg font-black text-sky-300 font-mono mt-0.5">{getMod(wis)}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">({wis})</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#091526] border border-sky-900/60 shadow-sm">
                      <div className="text-[10px] uppercase font-mono text-zinc-400 font-bold">CAR</div>
                      <div className="text-lg font-black text-sky-300 font-mono mt-0.5">{getMod(cha)}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">({cha})</div>
                    </div>
                  </div>
                </div>

                {/* LINHA: DEFESAS (ESQUERDA) & PERCEPÇÃO/HABILIDADES (DIREITA) */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
                  {/* Defesas & Saúde */}
                  <div className="p-5 rounded-2xl bg-[#0c1422] border border-zinc-800/80 space-y-3.5 h-full">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                        <Shield className="w-4 h-4 text-rose-400" />
                        Defesas &amp; Saúde
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
                          {isFieldVisible('hpAndHealth') ? (maxHp !== undefined ? (hp !== maxHp ? `${hp}/${maxHp}` : `${maxHp} PV`) : '—') : '??? PV'}
                        </div>
                      </div>
                    </div>

                    {/* Barra Visual de PV */}
                    {isFieldVisible('hpAndHealth') && maxHp > 0 && (
                      <div className="space-y-1">
                        <div className="w-full h-2.5 rounded-full bg-black/60 overflow-hidden border border-zinc-800">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.max(0, (hp / maxHp) * 100))}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Percepção, Sentidos & Deslocamento */}
                  <div className="p-5 rounded-2xl bg-[#0c1422] border border-zinc-800/80 space-y-3 h-full">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                        <Eye className="w-4 h-4 text-cyan-400" />
                        Percepção, Deslocamento &amp; Recursos
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
                            <Footprints className="w-3.5 h-3.5 text-sky-400" />
                            Deslocamento:
                            {renderEyeToggle('speed', 'Deslocamento', 'all', { compact: true })}
                          </span>
                          <span className="font-mono text-sky-300 font-bold">
                            {isFieldVisible('speed') ? speed : '???'}
                          </span>
                        </div>
                      )}

                      {heroPoints > 0 && (isActualGm || isFieldVisible('heroPoints')) && (
                        <div className="flex items-center justify-between py-1 border-b border-zinc-800/60">
                          <span className="flex items-center gap-1.5 font-semibold text-amber-300">
                            <Award className="w-3.5 h-3.5 text-amber-400" />
                            Pontos Heroicos:
                            {renderEyeToggle('heroPoints', 'Pontos Heroicos', 'all', { compact: true })}
                          </span>
                          <span className="font-mono text-amber-300 font-bold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50">
                            {heroPoints} PH
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
                        <div className="pt-1.5 text-sky-300 text-xs">
                          <div className="flex items-center justify-between mb-0.5">
                            <strong className="text-sky-200 block">Habilidades Especiais &amp; Talentos:</strong>
                            {renderEyeToggle('specialAbilities', 'Habilidades Especiais', 'all', { compact: true })}
                          </div>
                          <span className="leading-relaxed">{isFieldVisible('specialAbilities') ? specialAbilities : '🔒 Oculto'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ATAQUES & MAGIAS */}
                {(attacks.length > 0 || spells) && (
                  <div className="space-y-4 pt-2 border-t border-zinc-800/80">
                    {attacks.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-rose-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                            <Swords className="w-3.5 h-3.5 text-rose-400" />
                            Golpes &amp; Ataques Principais ({attacks.length})
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {attacks.map((atk: any, idx: number) => (
                            <div key={idx} className="p-3 rounded-2xl bg-[#091526] border border-zinc-800 flex items-center justify-between">
                              <div>
                                <div className="font-bold text-zinc-100 text-xs">{atk.name || `Ataque ${idx + 1}`}</div>
                                <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                                  {atk.bonus ? `+${atk.bonus} para acertar` : ''} {atk.damage ? `• ${atk.damage}` : ''} {atk.type ? `(${atk.type})` : ''}
                                </div>
                              </div>
                              {atk.actions && (
                                <span className="text-[10px] px-2 py-0.5 bg-black/40 text-sky-300 border border-sky-800/50 rounded font-mono">
                                  {atk.actions}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
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
                    <div className="p-5 rounded-3xl bg-[#080d16] border border-cyan-900/40 space-y-3.5 shadow-xl">
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
                    <div className="p-5 rounded-3xl bg-[#080d16] border border-teal-900/40 space-y-3.5 shadow-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-teal-300 font-mono flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-teal-400" />
                          Organizações &amp; Facções ({isActualGm ? linkedData.organizations.length : visibleLinkedOrganizations.length})
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
                                  : 'bg-black/40 border-teal-900/40 hover:border-teal-500/60'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => handleOpenEntityDrawer(org)}
                                className="min-w-0 flex items-center gap-2.5 flex-1 text-left cursor-pointer group"
                              >
                                <div className="w-8 h-8 rounded-lg bg-teal-950/60 border border-teal-800/60 flex items-center justify-center text-teal-300 shrink-0">
                                  <EntityIcon icon={org.icon} category="organization" className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-zinc-200 group-hover:text-teal-300 truncate">{org.title}</div>
                                  {org.subtitle && <p className="text-zinc-400 text-[10px] truncate">{org.subtitle}</p>}
                                </div>
                              </button>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEntityDrawer(org)}
                                  className="px-2.5 py-1 rounded-lg bg-teal-950 text-teal-300 border border-teal-800 text-[10px] font-mono hover:bg-teal-900 cursor-pointer"
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
                  <div className="p-5 rounded-3xl bg-[#080d16] border border-sky-900/40 space-y-3.5 shadow-xl h-full">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-sky-300 font-mono flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-sky-400" />
                        Rede Social &amp; Vínculos ({isActualGm ? relationships.length : visibleRelationships.length})
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
                                <span className="text-sky-300 text-[11px] font-mono">({rel.relationshipType})</span>
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
                                  className="px-2.5 py-1 rounded-lg bg-sky-950 text-sky-300 border border-sky-800 text-[10px] font-mono hover:bg-sky-900 cursor-pointer shrink-0"
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
                  <div className="p-5 rounded-3xl bg-[#080d16] border border-amber-900/40 space-y-3.5 shadow-xl h-full">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-300 font-mono flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-amber-400" />
                        Ganchos de Missão &amp; Rumores
                      </span>
                      {renderEyeToggle('questsAndRumors', 'Missões & Rumores')}
                    </div>

                    <div className="space-y-4">
                      {/* Quests Displayed as Cards */}
                      {(isActualGm ? quests : visibleQuests).length > 0 && (
                        <div className="space-y-2.5">
                          <h5 className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                            <Sparkle className="w-3 h-3 text-cyan-400" />
                            Missões Associadas ({(isActualGm ? quests : visibleQuests).length})
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            {(isActualGm ? quests : visibleQuests).map((q) => {
                              const matchedEntity = allEntities.find(
                                (e) =>
                                  (e.category === 'quest' || Boolean(e.questData)) &&
                                  (e.id === q.questEntityId || e.id === q.id || e.title.trim().toLowerCase() === q.title.trim().toLowerCase())
                              );

                              const targetEntity: HecosEntity = matchedEntity || {
                                id: q.questEntityId || q.id,
                                slug: q.id,
                                title: q.title,
                                subtitle: q.description || '',
                                summary: q.description || '',
                                category: 'quest',
                                questData: {
                                  status: 'not_started',
                                  questType: 'Secundária',
                                  difficulty: 'Moderada',
                                  objectives: [],
                                  questGiver: currentEntity.title,
                                  questGiverEntityId: currentEntity.id,
                                },
                                isSecret: q.isSecret,
                                tags: ['quest'],
                                content: q.description || '',
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString(),
                              };

                              const questVisKey = `quest_${q.id || q.questEntityId}`;

                              return (
                                <div key={q.id || q.questEntityId || q.title} className="relative group/questcard">
                                  {isActualGm && (
                                    <div className="absolute top-3 right-10 z-10">
                                      {renderEyeToggle(questVisKey, `Missão: ${q.title}`, 'all', { compact: true })}
                                    </div>
                                  )}
                                  <QuestCard
                                    entity={targetEntity}
                                    onSelect={(id) => {
                                      const targetId = matchedEntity?.id || q.questEntityId || q.id || targetEntity.id;
                                      const targetSlug = matchedEntity?.slug || targetEntity.slug;
                                      if (!isActualGm && matchedEntity && !HecosStorage.canUserAccessItem(matchedEntity)) {
                                        return;
                                      }
                                      window.dispatchEvent(
                                        new CustomEvent('hecos:open-entity-drawer', {
                                          detail: { entityId: targetId, slug: targetSlug },
                                        })
                                      );
                                    }}
                                    onUnlink={
                                      isActualGm
                                        ? () => handleUnlinkQuest(q.questEntityId || q.id || targetEntity.id)
                                        : undefined
                                    }
                                    showRoleBadge={q.roleInQuest}
                                    draggable={false}
                                    compact={false}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Rumors */}
                      {(isActualGm ? rumors : visibleRumors).length > 0 && (
                        <div className="space-y-2">
                          <h5 className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                            <Quote className="w-3 h-3 text-amber-400" />
                            Rumores &amp; Boatos ({(isActualGm ? rumors : visibleRumors).length})
                          </h5>
                          <div className="space-y-2">
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
                                      <p className="leading-relaxed">&quot;{r.text}&quot;</p>
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
                  </div>
                )}
              </div>

              {totalSocialCount === 0 && (
                <div className="p-8 rounded-3xl bg-[#080d16] border border-zinc-800/80 text-center space-y-2 shadow-xl">
                  <Users className="w-10 h-10 text-zinc-600 mx-auto" />
                  <h4 className="text-sm font-bold text-zinc-300">Nenhum Vínculo Registrado</h4>
                  <p className="text-xs text-zinc-500 max-w-md mx-auto">
                    Nenhum relacionamento social, rumor, local ou missão visível para este Personagem no momento.
                  </p>
                  {isActualGm && onEdit && (
                    <button
                      type="button"
                      onClick={onEdit}
                      className="mt-2 px-3 py-1.5 text-xs font-semibold text-sky-300 bg-sky-950/60 hover:bg-sky-900 border border-sky-800 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Vincular Relações &amp; Missões
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ─── ABA 4: INVENTÁRIO & BENS ─── */}
          {activeTab === 'inventory' && (
            <div className="space-y-5 animate-fade-in">
              <div className="p-6 rounded-3xl bg-[#080d16] border border-amber-900/40 space-y-5 shadow-xl">
                <div className="flex items-center justify-between border-b border-amber-950/60 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Coins className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono">
                      Posse de Moedas &amp; Pertences Carregados
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
                          Moedas &amp; Riquezas em Dinheiro
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
                            <div className="p-3 rounded-2xl bg-[#091526] border border-sky-800/60 text-center">
                              <div className="text-[10px] uppercase font-mono text-sky-300 font-bold">Especial</div>
                              <div className="text-xs font-bold text-sky-200 mt-1 truncate">{currency.custom}</div>
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
                        {renderEyeToggle('loot', 'Itens Carregados')}
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
                                  : 'bg-[#091526] border-zinc-800/80 hover:border-amber-500/60 hover:bg-[#0c1c33]'
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
                      <p className="text-xs text-zinc-400">Nenhum item ou equipamento registrado no inventário deste Personagem.</p>
                      {isActualGm && onEdit && (
                        <button
                          type="button"
                          onClick={onEdit}
                          className="px-3 py-1.5 text-xs font-semibold text-amber-300 bg-amber-950/60 hover:bg-amber-900 border border-amber-800 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Adicionar Itens / Equipamento
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
              <div className="rounded-3xl bg-[#080d16] border border-zinc-800/80 p-6 space-y-4 shadow-xl">
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
                            : 'bg-[#091526] border-zinc-800/80 hover:border-cyan-500/60'
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
