import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  HecosEntity,
  QuestAttributes,
  QuestObjective,
  QuestStatus,
  QuestDifficulty,
  QuestType,
  QuestPriority,
  QuestAttachment,
  QuestAttachmentType,
  QuestFieldVisibility,
  QuestRewardItem,
  QuestOrganizationReputation,
  ItemVisibility,
} from '../types';
import { HecosStorage } from '../services/storage';
import { RichContentRenderer } from './RichContentRenderer';
import { AdjustableImage } from './AdjustableImage';
import { ItemDrawer } from './ItemDrawer';
import { MultiImageAlbumUploader } from './MultiImageAlbumUploader';
import { QuestAttachmentModal, formatGoogleDriveAudio } from './QuestAttachmentModal';
import { VisibilityBadgeMenu } from './VisibilityBadgeMenu';
import { TraitBadge } from './TraitBadge';
import { sortTraitsHierarchically } from '../utils/traitUtils';
import {
  CheckSquare,
  Square,
  Clock,
  Coins,
  MapPin,
  User,
  Shield,
  AlertTriangle,
  Flame,
  Award,
  Edit2,
  Edit3,
  Trash2,
  Lock,
  Sparkles,
  ChevronRight,
  Building2,
  Package,
  X,
  ExternalLink,
  Eye,
  EyeOff,
  Folder,
  Tag as TagIcon,
  Play,
  Pause,
  Music,
  Disc,
  Film,
  Image as ImageIcon,
  FileText,
  Map as MapIcon,
  Paperclip,
  Plus,
  Compass,
  CheckCircle2,
  XCircle,
  HelpCircle,
  PlayCircle,
  Download,
  Maximize2,
  Volume2,
  VolumeX,
  Repeat,
  Users,
  Scroll,
  Layers,
  Sparkle,
  BookOpen,
  Send,
  Printer,
  SlidersHorizontal,
} from 'lucide-react';

interface QuestViewProps {
  entity: HecosEntity;
  onEdit?: () => void;
  onDelete?: () => void;
  onNavigate: (id: string) => void;
  onTagClick: (tag: string) => void;
}

export type QuestTabType =
  | 'overview'
  | 'objectives'
  | 'rewards'
  | 'attachments'
  | 'involved'
  | 'secrets'
  | 'backlinks';

const STATUS_CONFIG: Record<
  QuestStatus,
  { label: string; bg: string; border: string; text: string; icon: any; dotColor: string }
> = {
  not_started: {
    label: 'Disponível / Rumor',
    bg: 'bg-amber-950/40',
    border: 'border-amber-700/60',
    text: 'text-amber-300',
    icon: HelpCircle,
    dotColor: 'bg-amber-400',
  },
  in_progress: {
    label: 'Em Andamento',
    bg: 'bg-cyan-950/40',
    border: 'border-cyan-700/60',
    text: 'text-cyan-300',
    icon: PlayCircle,
    dotColor: 'bg-cyan-400 animate-pulse',
  },
  completed: {
    label: 'Concluída',
    bg: 'bg-emerald-950/40',
    border: 'border-emerald-700/60',
    text: 'text-emerald-300',
    icon: CheckCircle2,
    dotColor: 'bg-emerald-400',
  },
  failed: {
    label: 'Falha / Cancelada',
    bg: 'bg-rose-950/40',
    border: 'border-rose-700/60',
    text: 'text-rose-300',
    icon: XCircle,
    dotColor: 'bg-rose-400',
  },
  abandoned: {
    label: 'Abandonada',
    bg: 'bg-zinc-900/60',
    border: 'border-zinc-700/60',
    text: 'text-zinc-400',
    icon: Clock,
    dotColor: 'bg-zinc-500',
  },
};

const DIFFICULTY_CONFIG: Record<
  QuestDifficulty,
  { label: string; badgeCls: string }
> = {
  Trivial: { label: 'Trivial', badgeCls: 'bg-emerald-950/50 text-emerald-300 border-emerald-800/80' },
  Baixa: { label: 'Baixa', badgeCls: 'bg-emerald-950/50 text-emerald-300 border-emerald-800/80' },
  Moderada: { label: 'Moderada', badgeCls: 'bg-amber-950/50 text-amber-300 border-amber-800/80' },
  Severa: { label: 'Severa', badgeCls: 'bg-orange-950/50 text-orange-300 border-orange-800/80' },
  Extrema: { label: 'Extrema', badgeCls: 'bg-rose-950/50 text-rose-300 border-rose-800/80' },
  Lendária: { label: 'Lendária', badgeCls: 'bg-purple-950/50 text-purple-300 border-purple-800/80' },
};

export const QuestView: React.FC<QuestViewProps> = ({
  entity,
  onEdit,
  onDelete,
  onNavigate,
  onTagClick,
}) => {
  const [currentEntity, setCurrentEntity] = useState<HecosEntity>(entity);
  const [activeTab, setActiveTab] = useState<QuestTabType>('overview');
  const [selectedDrawerItemId, setSelectedDrawerItemId] = useState<string | null>(null);

  // Audio player state
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Lightbox modal for attachments/images
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string; caption?: string } | null>(null);

  // Attachments modal state
  const [isAddAttachmentOpen, setIsAddAttachmentOpen] = useState(false);
  const [editingAttachment, setEditingAttachment] = useState<QuestAttachment | null>(null);
  const [attachmentFilter, setAttachmentFilter] = useState<'all' | 'image' | 'video' | 'audio' | 'document'>('all');
  const [isMultiImageModalOpen, setIsMultiImageModalOpen] = useState(false);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  // New objective quick input
  const [quickObjText, setQuickObjText] = useState('');
  const [quickObjSecret, setQuickObjSecret] = useState(false);

  useEffect(() => {
    setCurrentEntity(entity);
  }, [entity]);

  // Real-time synchronization
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
  const isActualGm = Boolean(currentUser?.role === 'gm' || HecosStorage.getGmMode() || HecosStorage.isUserGm());
  const allEntities = HecosStorage.getEntities();

  const quest: Partial<QuestAttributes> = currentEntity.questData || {};
  const fieldVis: QuestFieldVisibility = quest.fieldVisibility || {};

  // Visibility resolution helpers
  const isFieldVisible = (fieldKey: string, defaultVis: ItemVisibility = 'all'): boolean => {
    if (isActualGm) return true;
    const itemVis = fieldVis[fieldKey];
    if (itemVis === undefined) return defaultVis === 'all';
    if (typeof itemVis === 'boolean') return itemVis;
    if (itemVis === 'all') return true;
    if (itemVis === 'gm') return false;
    if (itemVis === 'custom') {
      const allowed = fieldVis.allowedUsers?.[fieldKey] || currentEntity.allowedUserIds || [];
      if (!currentUser) return false;
      return allowed.includes(currentUser.id) || allowed.includes(currentUser.username);
    }
    return false;
  };

  const isFieldRevealed = (fieldKey: string, defaultVis: ItemVisibility = 'all'): boolean => {
    const itemVis = fieldVis[fieldKey];
    if (itemVis === undefined) return defaultVis === 'all';
    if (typeof itemVis === 'boolean') return itemVis;
    return itemVis === 'all';
  };

  // Toggle field visibility and save immediately
  const handleToggleFieldVis = (fieldKey: string, defaultVis: ItemVisibility = 'all') => {
    if (!isActualGm) return;
    const currentlyRevealed = isFieldRevealed(fieldKey, defaultVis);
    const nextVis: ItemVisibility = currentlyRevealed ? 'gm' : 'all';

    const updatedFieldVis: QuestFieldVisibility = {
      ...fieldVis,
      [fieldKey]: nextVis,
    };

    const updatedQuestData: QuestAttributes = {
      ...(currentEntity.questData as QuestAttributes),
      fieldVisibility: updatedFieldVis,
    };

    const updatedEntity: HecosEntity = {
      ...currentEntity,
      questData: updatedQuestData,
    };

    HecosStorage.saveEntity(updatedEntity);
    setCurrentEntity(updatedEntity);
  };

  // Bulk visibility changer
  const handleBulkSetVisibility = (mode: 'all_visible' | 'all_hidden' | 'hide_sensitive') => {
    if (!isActualGm) return;
    const newFieldVis: QuestFieldVisibility = { ...fieldVis };

    const coreKeys = [
      'status', 'difficulty', 'recommendedLevel', 'questType', 'priority', 'deadline', 'actOrChapter',
      'subcategories', 'tags', 'questGiver', 'location', 'organization', 'objectivesBlock',
      'objectives', 'narrativeLore', 'briefing', 'rewardsBlock', 'rewardsXp', 'rewardsCurrency',
      'rewardsItems', 'rewardsReputation', 'rewardsOrgReputation', 'attachmentsBlock',
      'attachmentImages', 'attachmentAudio', 'attachmentDocuments', 'attachmentHandouts', 'backlinks'
    ];

    const dynamicKeys: string[] = [];
    (quest.objectives || []).forEach((o) => dynamicKeys.push(`obj_${o.id}`));
    (quest.attachments || []).forEach((a) => dynamicKeys.push(`att_${a.id}`));
    (quest.rewards?.structuredItems || []).forEach((it) => dynamicKeys.push(`item_${it.id || it.name}`));
    (quest.rewards?.organizationReputations || []).forEach((rep) => dynamicKeys.push(`rep_${rep.id || rep.organizationName}`));

    if (mode === 'all_visible') {
      [...coreKeys, ...dynamicKeys].forEach((k) => {
        newFieldVis[k] = 'all';
      });
    } else if (mode === 'all_hidden') {
      [...coreKeys, ...dynamicKeys].forEach((k) => {
        newFieldVis[k] = 'gm';
      });
    } else if (mode === 'hide_sensitive') {
      coreKeys.forEach((k) => {
        newFieldVis[k] = 'all';
      });
      // Hide secret objectives, secret attachments and secret rewards
      (quest.objectives || []).forEach((o) => {
        newFieldVis[`obj_${o.id}`] = o.isSecret ? 'gm' : 'all';
      });
      (quest.attachments || []).forEach((a) => {
        newFieldVis[`att_${a.id}`] = a.isSecret ? 'gm' : 'all';
      });
      (quest.rewards?.structuredItems || []).forEach((it) => {
        newFieldVis[`item_${it.id || it.name}`] = it.isSecret ? 'gm' : 'all';
      });
    }

    const updatedQuestData: QuestAttributes = {
      ...(currentEntity.questData as QuestAttributes),
      fieldVisibility: newFieldVis,
    };

    const updatedEntity: HecosEntity = {
      ...currentEntity,
      questData: updatedQuestData,
    };

    HecosStorage.saveEntity(updatedEntity);
    setCurrentEntity(updatedEntity);
  };

  // Reusable Eye Toggle Button
  const renderEyeToggle = (
    fieldKey: string,
    label: string,
    defaultVis: ItemVisibility = 'all',
    options?: { compact?: boolean; className?: string }
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

  // Status Change Handler
  const handleStatusChange = (newStatus: QuestStatus) => {
    const updatedQuestData: QuestAttributes = {
      ...(currentEntity.questData as QuestAttributes),
      status: newStatus,
    };
    const updatedEntity: HecosEntity = {
      ...currentEntity,
      questData: updatedQuestData,
    };
    HecosStorage.saveEntity(updatedEntity);
    setCurrentEntity(updatedEntity);
  };

  // Objectives Toggle Handler
  const handleToggleObjective = (objId: string) => {
    const currentObjs = quest.objectives || [];
    const updatedObjs = currentObjs.map((o) =>
      o.id === objId ? { ...o, completed: !o.completed } : o
    );
    const updatedQuestData: QuestAttributes = {
      ...(currentEntity.questData as QuestAttributes),
      objectives: updatedObjs,
    };
    const updatedEntity: HecosEntity = {
      ...currentEntity,
      questData: updatedQuestData,
    };
    HecosStorage.saveEntity(updatedEntity);
    setCurrentEntity(updatedEntity);
  };

  // Quick Add Objective
  const handleQuickAddObjective = () => {
    if (!quickObjText.trim()) return;
    const newObj: QuestObjective = {
      id: `obj-${Date.now()}`,
      text: quickObjText.trim(),
      completed: false,
      isSecret: quickObjSecret,
    };
    const updatedQuestData: QuestAttributes = {
      ...(currentEntity.questData as QuestAttributes),
      objectives: [...(quest.objectives || []), newObj],
    };
    const updatedEntity: HecosEntity = {
      ...currentEntity,
      questData: updatedQuestData,
    };
    HecosStorage.saveEntity(updatedEntity);
    setCurrentEntity(updatedEntity);
    setQuickObjText('');
    setQuickObjSecret(false);
  };

  // Delete Objective
  const handleDeleteObjective = (objId: string) => {
    const updatedObjs = (quest.objectives || []).filter((o) => o.id !== objId);
    const updatedQuestData: QuestAttributes = {
      ...(currentEntity.questData as QuestAttributes),
      objectives: updatedObjs,
    };
    const updatedEntity: HecosEntity = {
      ...currentEntity,
      questData: updatedQuestData,
    };
    HecosStorage.saveEntity(updatedEntity);
    setCurrentEntity(updatedEntity);
  };

  // Save/Edit Attachment Modal Handler
  const handleSaveAttachmentModal = (att: QuestAttachment) => {
    const existing = quest.attachments || [];
    const index = existing.findIndex((a) => a.id === att.id);
    let updated: QuestAttachment[];
    if (index >= 0) {
      updated = [...existing];
      updated[index] = att;
    } else {
      updated = [...existing, att];
    }

    const updatedQuestData: QuestAttributes = {
      ...(currentEntity.questData as QuestAttributes),
      attachments: updated,
    };
    const updatedEntity: HecosEntity = {
      ...currentEntity,
      questData: updatedQuestData,
    };
    HecosStorage.saveEntity(updatedEntity);
    setCurrentEntity(updatedEntity);
    setIsAddAttachmentOpen(false);
    setEditingAttachment(null);
  };

  // Multi Image Upload Callback
  const handleImagesUploaded = (uploaded: { url: string; caption?: string }[]) => {
    const newAtts: QuestAttachment[] = uploaded.map((img, idx) => ({
      id: `att-img-${Date.now()}-${idx}`,
      title: img.caption || `${currentEntity.title} - Imagem ${idx + 1}`,
      url: img.url,
      type: 'image',
      caption: img.caption,
      isSecret: false,
      createdAt: Date.now(),
    }));

    const updatedQuestData: QuestAttributes = {
      ...(currentEntity.questData as QuestAttributes),
      attachments: [...(quest.attachments || []), ...newAtts],
    };
    const updatedEntity: HecosEntity = {
      ...currentEntity,
      questData: updatedQuestData,
    };
    HecosStorage.saveEntity(updatedEntity);
    setCurrentEntity(updatedEntity);
    setIsMultiImageModalOpen(false);
  };

  // Delete Attachment
  const handleDeleteAttachment = (attId: string) => {
    const updatedAttachments = (quest.attachments || []).filter((a) => a.id !== attId);
    const updatedQuestData: QuestAttributes = {
      ...(currentEntity.questData as QuestAttributes),
      attachments: updatedAttachments,
    };
    const updatedEntity: HecosEntity = {
      ...currentEntity,
      questData: updatedQuestData,
    };
    HecosStorage.saveEntity(updatedEntity);
    setCurrentEntity(updatedEntity);
  };

  // Audio playback toggle (with Google Drive support)
  const handleToggleAudio = (att: QuestAttachment) => {
    if (playingAudioId === att.id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingAudioId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const driveInfo = att.isDriveAudio || att.url.includes('drive.google.com')
        ? formatGoogleDriveAudio(att.url)
        : null;
      const streamUrl = driveInfo ? driveInfo.streamUrl : att.url;
      const audio = new Audio(streamUrl);
      audioRef.current = audio;
      audio.play().catch((err) => console.warn('Audio playback error:', err));
      audio.onended = () => setPlayingAudioId(null);
      setPlayingAudioId(att.id);
    }
  };

  // Open Drawer Helper
  const handleOpenEntityInDrawer = (targetEntityId: string) => {
    const found = allEntities.find((e) => e.id === targetEntityId);
    if (found) {
      window.dispatchEvent(
        new CustomEvent('hecos:open-entity-drawer', {
          detail: { entityId: found.id, slug: found.slug },
        })
      );
    } else {
      onNavigate(targetEntityId);
    }
  };

  // Giver Entity lookup
  const questGiverEntity = useMemo(() => {
    if (quest.questGiverEntityId) {
      return allEntities.find((e) => e.id === quest.questGiverEntityId);
    }
    if (quest.questGiver) {
      return allEntities.find(
        (e) =>
          e.category === 'npc' &&
          e.title.toLowerCase().trim() === quest.questGiver!.toLowerCase().trim()
      );
    }
    return null;
  }, [allEntities, quest.questGiverEntityId, quest.questGiver]);

  // Location Entity lookup
  const locationEntity = useMemo(() => {
    if (quest.locationEntityId) {
      return allEntities.find((e) => e.id === quest.locationEntityId);
    }
    if (quest.location) {
      return allEntities.find(
        (e) =>
          e.category === 'location' &&
          e.title.toLowerCase().trim() === quest.location!.toLowerCase().trim()
      );
    }
    return null;
  }, [allEntities, quest.locationEntityId, quest.location]);

  // Organization Entity lookup
  const organizationEntity = useMemo(() => {
    const orgId = quest.organizationEntityId || quest.factionEntityId;
    if (orgId) {
      return allEntities.find((e) => e.id === orgId);
    }
    const orgName = quest.organization || quest.faction;
    if (orgName) {
      return allEntities.find(
        (e) =>
          e.category === 'organization' &&
          e.title.toLowerCase().trim() === orgName.toLowerCase().trim()
      );
    }
    return null;
  }, [allEntities, quest.organizationEntityId, quest.factionEntityId, quest.organization, quest.faction]);

  // Involved NPCs
  const involvedNpcs = useMemo(() => {
    const ids = new Set(quest.involvedNpcIds || []);
    if (quest.questGiverEntityId) ids.add(quest.questGiverEntityId);
    return allEntities.filter((e) => ids.has(e.id) && (e.category === 'npc' || e.npcData));
  }, [allEntities, quest.involvedNpcIds, quest.questGiverEntityId]);

  // Involved Locations
  const involvedLocations = useMemo(() => {
    const ids = new Set([
      ...(quest.involvedLocationIds || []),
      ...(quest.relatedLocationIds || []),
    ]);
    if (quest.locationEntityId) ids.add(quest.locationEntityId);
    return allEntities.filter((e) => ids.has(e.id) && (e.category === 'location' || e.locationData));
  }, [allEntities, quest.involvedLocationIds, quest.relatedLocationIds, quest.locationEntityId]);

  // Involved Organizations
  const involvedOrgs = useMemo(() => {
    const ids = new Set([
      ...(quest.involvedOrgIds || []),
      ...(quest.linkedOrganizationIds || []),
    ]);
    if (quest.organizationEntityId) ids.add(quest.organizationEntityId);
    if (quest.factionEntityId) ids.add(quest.factionEntityId);
    return allEntities.filter((e) => ids.has(e.id) && (e.category === 'organization' || e.organizationData));
  }, [allEntities, quest.involvedOrgIds, quest.linkedOrganizationIds, quest.organizationEntityId, quest.factionEntityId]);

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

  // Objectives calculation
  const rawObjectives = quest.objectives || [];
  const visibleObjectives = useMemo(() => {
    if (isActualGm) return rawObjectives;
    if (!isFieldVisible('objectives') || !isFieldVisible('objectivesBlock')) return [];
    return rawObjectives.filter((o) => !o.isSecret && isFieldVisible(`obj_${o.id}`));
  }, [rawObjectives, isActualGm, fieldVis]);

  const completedCount = (isActualGm ? rawObjectives : visibleObjectives).filter((o) => o.completed).length;
  const totalCount = (isActualGm ? rawObjectives : visibleObjectives).length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Attachments calculation
  const rawAttachments = quest.attachments || [];
  const visibleAttachments = useMemo(() => {
    if (isActualGm) return rawAttachments;
    if (!isFieldVisible('attachmentsBlock')) return [];
    return rawAttachments.filter((a) => !a.isSecret && isFieldVisible(`att_${a.id}`));
  }, [rawAttachments, isActualGm, fieldVis]);

  // Rewards calculation
  const rewards = quest.rewards || {};
  const rawItems = rewards.structuredItems || [];
  const visibleItems = useMemo(() => {
    if (isActualGm) return rawItems;
    if (!isFieldVisible('rewardsBlock') || !isFieldVisible('rewardsItems')) return [];
    return rawItems.filter((i) => !i.isSecret && isFieldVisible(`item_${i.id || i.name}`));
  }, [rawItems, isActualGm, fieldVis]);

  const rawReputations = rewards.organizationReputations || [];
  const visibleReputations = useMemo(() => {
    if (isActualGm) return rawReputations;
    if (!isFieldVisible('rewardsBlock') || !isFieldVisible('rewardsOrgReputation')) return [];
    return rawReputations.filter((r) => !r.isSecret && isFieldVisible(`rep_${r.id || r.organizationName}`));
  }, [rawReputations, isActualGm, fieldVis]);

  // Status & Meta properties
  const status: QuestStatus = quest.status || 'not_started';
  const statusInfo = STATUS_CONFIG[status] || STATUS_CONFIG.not_started;
  const StatusIcon = statusInfo.icon;
  const difficulty: QuestDifficulty = quest.difficulty || 'Moderada';
  const diffInfo = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.Moderada;
  const level = quest.recommendedLevel;
  const questType: QuestType = quest.questType || 'Secundária';
  const priority: QuestPriority = quest.priority || 'Normal';

  // Currency breakdown
  const currencyParts: { label: string; value: string | number; color: string }[] = [];
  const curr = rewards.currency;
  if (curr) {
    if (curr.pp && Number(curr.pp) > 0) currencyParts.push({ label: 'PP', value: curr.pp, color: 'text-amber-200 bg-amber-950/60 border-amber-800' });
    if (curr.gp && Number(curr.gp) > 0) currencyParts.push({ label: 'PO', value: curr.gp, color: 'text-yellow-300 bg-yellow-950/60 border-yellow-800' });
    if (curr.sp && Number(curr.sp) > 0) currencyParts.push({ label: 'PP (Prata)', value: curr.sp, color: 'text-zinc-300 bg-zinc-900 border-zinc-700' });
    if (curr.cp && Number(curr.cp) > 0) currencyParts.push({ label: 'PC', value: curr.cp, color: 'text-amber-600 bg-amber-950/40 border-amber-900' });
    if (curr.custom) currencyParts.push({ label: 'Outros', value: curr.custom, color: 'text-purple-300 bg-purple-950/60 border-purple-800' });
  } else if (rewards.gold) {
    currencyParts.push({ label: 'Ouro', value: rewards.gold, color: 'text-yellow-300 bg-yellow-950/60 border-yellow-800' });
  }

  // Traits
  const traits = sortTraitsHierarchically(currentEntity.traits || currentEntity.tags || [], {
    rarity: difficulty === 'Lendária' ? 'Raro' : 'Comum',
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* ─── GM CONTROL PANEL & QUICK ACCESS ─── */}
      {isActualGm && (
        <div className="p-3.5 rounded-2xl bg-[#120e24]/90 border border-purple-900/60 shadow-xl flex items-center justify-between gap-3 flex-wrap backdrop-blur-md">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-950/80 border border-purple-800">
              <Shield className="w-3.5 h-3.5 text-purple-400" /> Painel de Mestre da Quest
            </span>

            <VisibilityBadgeMenu
              visibility={currentEntity.visibility}
              allowedUserIds={currentEntity.allowedUserIds}
              isSecret={currentEntity.isSecret}
              onChange={(newVis, newAllowed) => {
                HecosStorage.setEntityVisibility(currentEntity.id, newVis, newAllowed);
              }}
            />

            <div className="h-4 w-px bg-zinc-800 hidden sm:block" />

            {/* Quick Bulk Visibility Buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleBulkSetVisibility('all_visible')}
                className="px-2 py-1 rounded text-[11px] font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-800 hover:bg-emerald-900 transition-colors flex items-center gap-1 cursor-pointer"
                title="Tornar todos os campos, objetivos e anexos visíveis para todos os jogadores"
              >
                <Eye className="w-3 h-3 text-emerald-400" /> Revelar Tudo
              </button>
              <button
                type="button"
                onClick={() => handleBulkSetVisibility('hide_sensitive')}
                className="px-2 py-1 rounded text-[11px] font-mono bg-amber-950/80 text-amber-300 border border-amber-800 hover:bg-amber-900 transition-colors flex items-center gap-1 cursor-pointer"
                title="Ocultar objetivos secretos, segredos e anexos confidenciais"
              >
                <Lock className="w-3 h-3 text-amber-400" /> Ocultar Segredos
              </button>
              <button
                type="button"
                onClick={() => handleBulkSetVisibility('all_hidden')}
                className="px-2 py-1 rounded text-[11px] font-mono bg-rose-950/80 text-rose-300 border border-rose-800 hover:bg-rose-900 transition-colors flex items-center gap-1 cursor-pointer"
                title="Ocultar toda a missão dos jogadores (Apenas GM)"
              >
                <EyeOff className="w-3 h-3 text-rose-400" /> Ocultar Tudo
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="px-3 py-1 rounded-lg text-xs font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800 hover:bg-cyan-900 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" /> Editar Missão
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="p-1.5 rounded-lg text-xs bg-rose-950/80 text-rose-400 border border-rose-800/80 hover:bg-rose-900 transition-colors cursor-pointer"
                title="Excluir Missão"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─── BANNER / COVER HEADER ─── */}
      <div className="relative rounded-3xl overflow-hidden bg-[#0a0814] border border-cyan-900/40 shadow-2xl">
        {currentEntity.coverImage ? (
          <div className="h-52 sm:h-64 w-full overflow-hidden relative">
            <AdjustableImage
              src={currentEntity.coverImage}
              alt={currentEntity.title}
              imageKey={`quest-cover-${currentEntity.id}`}
              isGm={isActualGm}
              containerClassName="relative w-full h-full"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0814] via-[#0a0814]/70 to-transparent pointer-events-none" />
          </div>
        ) : (
          <div className="h-32 sm:h-40 w-full bg-[radial-gradient(circle_at_15%_50%,rgba(6,182,212,0.18),transparent_70%),radial-gradient(circle_at_85%_50%,rgba(168,85,247,0.15),transparent_70%)] relative flex items-center px-6">
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0814] to-transparent pointer-events-none" />
          </div>
        )}

        <div className="p-6 relative z-10 -mt-12 sm:-mt-16 space-y-4">
          <div className="flex items-start gap-4 flex-wrap sm:flex-nowrap">
            {/* Quest Category Icon */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#140e28] border-2 border-cyan-500/60 flex items-center justify-center shadow-[0_0_25px_rgba(6,182,212,0.3)] shrink-0 text-cyan-300">
              <CheckSquare className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-400" />
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              {/* Badges Bar */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded border bg-cyan-950/80 border-cyan-800 text-cyan-300">
                  MISSÃO / QUEST
                </span>

                <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border bg-purple-950/80 border-purple-800 text-purple-300">
                  {questType}
                </span>

                {isFieldVisible('difficulty') && (
                  <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded border ${diffInfo.badgeCls}`}>
                    Dificuldade: {difficulty}
                  </span>
                )}

                {isFieldVisible('recommendedLevel') && level !== undefined && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-cyan-300 border border-zinc-700">
                    Nível Recomendado: {level}
                  </span>
                )}

                {isFieldVisible('priority') && priority === 'Urgente' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-700 flex items-center gap-1 animate-pulse">
                    <Flame className="w-3 h-3 text-rose-400" /> URGENTE
                  </span>
                )}

                {renderEyeToggle('status', 'Status e Nível', 'all', { compact: true })}
              </div>

              {/* Quest Main Title */}
              <div className="flex items-center justify-between gap-3">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-serif text-white tracking-wide flex items-center gap-2.5 drop-shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                  <span>{currentEntity.title}</span>
                </h1>
              </div>

              {currentEntity.subtitle && (
                <p className="text-sm sm:text-base text-zinc-300 italic font-medium">
                  {currentEntity.subtitle}
                </p>
              )}
            </div>

            {/* Status Selector & Live Indicator */}
            <div className="shrink-0 flex flex-col sm:items-end gap-2 bg-[#120e24]/90 p-3 rounded-2xl border border-zinc-800/90 shadow-xl">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${statusInfo.dotColor}`} />
                <span className={`text-xs font-bold uppercase tracking-wider font-mono ${statusInfo.text}`}>
                  {statusInfo.label}
                </span>
              </div>

              {isActualGm ? (
                <select
                  value={status}
                  onChange={(e) => handleStatusChange(e.target.value as QuestStatus)}
                  className="bg-black/90 border border-cyan-800/80 text-xs text-cyan-300 font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-400 cursor-pointer shadow-inner"
                >
                  <option value="not_started">Disponível / Rumor</option>
                  <option value="in_progress">Em Andamento</option>
                  <option value="completed">Concluída</option>
                  <option value="failed">Falha / Cancelada</option>
                  <option value="abandoned">Abandonada</option>
                </select>
              ) : (
                <span className={`px-3 py-1 text-xs font-bold rounded-lg border ${statusInfo.bg} ${statusInfo.border} ${statusInfo.text}`}>
                  {statusInfo.label}
                </span>
              )}
            </div>
          </div>

          {/* Quick Key Facts Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-zinc-800/80">
            {/* Quest Giver */}
            {isFieldVisible('questGiver') && (
              <div className="p-2.5 rounded-xl bg-black/40 border border-zinc-800 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-mono text-zinc-400 block">Doador da Missão</span>
                  {questGiverEntity ? (
                    <button
                      type="button"
                      onClick={() => handleOpenEntityInDrawer(questGiverEntity.id)}
                      className="text-xs font-bold text-purple-300 hover:text-purple-200 hover:underline flex items-center gap-1 truncate text-left cursor-pointer"
                      title={`Ver NPC: ${questGiverEntity.title}`}
                    >
                      <User className="w-3 h-3 text-purple-400 shrink-0" />
                      <span className="truncate">{questGiverEntity.title}</span>
                    </button>
                  ) : quest.questGiver ? (
                    <span className="text-xs font-bold text-zinc-200 flex items-center gap-1 truncate">
                      <User className="w-3 h-3 text-purple-400 shrink-0" />
                      <span className="truncate">{quest.questGiver}</span>
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-500 italic">Não informado</span>
                  )}
                </div>
                {renderEyeToggle('questGiver', 'Doador', 'all', { compact: true })}
              </div>
            )}

            {/* Location */}
            {isFieldVisible('location') && (
              <div className="p-2.5 rounded-xl bg-black/40 border border-zinc-800 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-mono text-zinc-400 block">Local Principal</span>
                  {locationEntity ? (
                    <button
                      type="button"
                      onClick={() => handleOpenEntityInDrawer(locationEntity.id)}
                      className="text-xs font-bold text-cyan-300 hover:text-cyan-200 hover:underline flex items-center gap-1 truncate text-left cursor-pointer"
                      title={`Ver Local: ${locationEntity.title}`}
                    >
                      <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span className="truncate">{locationEntity.title}</span>
                    </button>
                  ) : quest.location ? (
                    <span className="text-xs font-bold text-zinc-200 flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span className="truncate">{quest.location}</span>
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-500 italic">Terras Ermas</span>
                  )}
                </div>
                {renderEyeToggle('location', 'Local', 'all', { compact: true })}
              </div>
            )}

            {/* Organization / Faction */}
            {isFieldVisible('organization') && (
              <div className="p-2.5 rounded-xl bg-black/40 border border-zinc-800 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-mono text-zinc-400 block">Facção / Patrono</span>
                  {organizationEntity ? (
                    <button
                      type="button"
                      onClick={() => handleOpenEntityInDrawer(organizationEntity.id)}
                      className="text-xs font-bold text-emerald-300 hover:text-emerald-200 hover:underline flex items-center gap-1 truncate text-left cursor-pointer"
                      title={`Ver Organização: ${organizationEntity.title}`}
                    >
                      <Building2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="truncate">{organizationEntity.title}</span>
                    </button>
                  ) : quest.organization || quest.faction ? (
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1 truncate">
                      <Building2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="truncate">{quest.organization || quest.faction}</span>
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-500 italic">Independente</span>
                  )}
                </div>
                {renderEyeToggle('organization', 'Organização', 'all', { compact: true })}
              </div>
            )}

            {/* Deadline / Act */}
            {isFieldVisible('deadline') && (
              <div className="p-2.5 rounded-xl bg-black/40 border border-zinc-800 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-mono text-zinc-400 block">Prazo / Capítulo</span>
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1 truncate">
                    <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                    <span className="truncate">{quest.deadline || quest.actOrChapter || 'Sem limite fixado'}</span>
                  </span>
                </div>
                {renderEyeToggle('deadline', 'Prazo e Capítulo', 'all', { compact: true })}
              </div>
            )}
          </div>

          {/* Objectives Progress Bar Strip */}
          {isFieldVisible('objectivesBlock') && totalCount > 0 && (
            <div className="p-3 rounded-2xl bg-black/50 border border-cyan-900/50 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-cyan-400" /> Progresso das Etapas
                </span>
                <span className="font-mono text-cyan-300 font-bold">
                  {completedCount} de {totalCount} concluídos ({progressPercent}%)
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-zinc-900 overflow-hidden border border-zinc-800">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(6,182,212,0.5)]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── NAVIGATION TABS ─── */}
      <div className="flex items-center gap-1.5 border-b border-zinc-800/90 pb-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', label: 'Visão Geral & Enredo', icon: BookOpen, count: undefined },
          { id: 'objectives', label: 'Objetivos & Etapas', icon: CheckSquare, count: totalCount },
          { id: 'rewards', label: 'Recompensas & Tesouro', icon: Coins, count: (rewards.xp ? 1 : 0) + currencyParts.length + visibleItems.length },
          { id: 'attachments', label: 'Anexos & Multimídia', icon: Paperclip, count: visibleAttachments.length },
          { id: 'involved', label: 'Envolvidos (NPCs & Locais)', icon: Users, count: involvedNpcs.length + involvedLocations.length + involvedOrgs.length },
          ...(isActualGm || quest.gmNotes || quest.gmSecrets
            ? [{ id: 'secrets', label: 'Câmara do Mestre (GM)', icon: Lock, count: undefined }]
            : []),
          { id: 'backlinks', label: 'Menções & Backlinks', icon: Scroll, count: backlinks.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as QuestTabType)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-950 to-purple-950 text-cyan-300 border border-cyan-700/80 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                  : 'bg-zinc-900/40 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-zinc-500'}`} />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`px-1.5 py-0.2 text-[10px] font-mono rounded-full ${
                  isActive ? 'bg-cyan-900 text-cyan-200' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─── TAB CONTENT ─── */}
      <div className="space-y-6">
        {/* ─── TAB 1: OVERVIEW ─── */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Narrative Briefing & Core Objectives */}
            <div className="lg:col-span-2 space-y-6">
              {/* Narrative Lore */}
              {isFieldVisible('narrativeLore') && (
                <div className="p-6 rounded-3xl bg-[#0d0a1a] border border-cyan-950/80 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-cyan-300 font-mono uppercase tracking-wider flex items-center gap-2">
                      <Scroll className="w-4 h-4 text-cyan-400" />
                      Briefing da Missão & Enredo
                    </h3>
                    <div className="flex items-center gap-2">
                      {isActualGm && onEdit && (
                        <button
                          type="button"
                          onClick={onEdit}
                          className="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" /> Editar
                        </button>
                      )}
                      {renderEyeToggle('narrativeLore', 'Briefing e Conteúdo')}
                    </div>
                  </div>

                  <div className="prose prose-invert max-w-none text-zinc-300 leading-relaxed text-sm">
                    {(() => {
                      const rawText = (quest.briefing || quest.narrativeLore || currentEntity.content || '').trim();
                      const isDefaultEmpty = !rawText ||
                        /^<p>\s*Nenhum detalhe (?:de|da) miss[aã]o registrado\.?\s*<\/p>$/i.test(rawText) ||
                        /^Nenhum detalhe (?:de|da) miss[aã]o registrado\.?$/i.test(rawText);

                      if (isDefaultEmpty) {
                        return <p className="text-zinc-500 italic">Nenhum texto de briefing ou enredo registrado.</p>;
                      }

                      return (
                        <RichContentRenderer
                          content={rawText}
                          onNavigate={onNavigate}
                          onTagClick={onTagClick}
                        />
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Objectives Fast Checklist */}
              {isFieldVisible('objectivesBlock') && (
                <div className="p-6 rounded-3xl bg-[#0d0a1a] border border-cyan-950/80 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-cyan-300 font-mono uppercase tracking-wider flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-cyan-400" />
                      Objetivos Principais ({(isActualGm ? rawObjectives : visibleObjectives).length})
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveTab('objectives')}
                        className="text-xs font-semibold text-cyan-400 hover:underline flex items-center gap-1"
                      >
                        Gerenciar Etapas <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      {renderEyeToggle('objectivesBlock', 'Bloco de Objetivos')}
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {(isActualGm ? rawObjectives : visibleObjectives).map((obj) => (
                      <div
                        key={obj.id}
                        onClick={() => handleToggleObjective(obj.id)}
                        className={`p-3 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer select-none ${
                          obj.completed
                            ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
                            : 'bg-black/40 border-zinc-800 hover:border-zinc-700 text-zinc-200'
                        }`}
                      >
                        <button
                          type="button"
                          className="mt-0.5 text-cyan-400 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleObjective(obj.id);
                          }}
                        >
                          {obj.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <Square className="w-5 h-5 text-zinc-600 hover:text-cyan-400" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <p className={`text-sm leading-snug ${obj.completed ? 'line-through opacity-70' : 'font-medium'}`}>
                            {obj.text}
                          </p>
                          {obj.isSecret && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-400 mt-1">
                              <Lock className="w-2.5 h-2.5" /> Objetivo Secreto do Mestre
                            </span>
                          )}
                        </div>

                        {renderEyeToggle(`obj_${obj.id}`, `Objetivo: ${obj.text.slice(0, 20)}`, 'all', { compact: true })}
                      </div>
                    ))}

                    {(isActualGm ? rawObjectives : visibleObjectives).length === 0 && (
                      <p className="text-zinc-500 italic text-xs">Nenhum objetivo visível.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Col: Rewards Summary & Key Attachments */}
            <div className="space-y-6">
              {/* Rewards Box */}
              {isFieldVisible('rewardsBlock') && (
                <div className="p-6 rounded-3xl bg-[#0d0a1a] border border-amber-900/40 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-amber-300 font-mono uppercase tracking-wider flex items-center gap-2">
                      <Coins className="w-4 h-4 text-amber-400" />
                      Recompensas Prometidas
                    </h3>
                    {renderEyeToggle('rewardsBlock', 'Bloco de Recompensas')}
                  </div>

                  <div className="space-y-3">
                    {/* XP Tag */}
                    {isFieldVisible('rewardsXp') && rewards.xp !== undefined && (
                      <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-800/80 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          <span className="text-xs text-amber-200 font-semibold">Experiência (XP)</span>
                        </div>
                        <span className="text-sm font-bold font-mono text-amber-300">+{rewards.xp} XP</span>
                      </div>
                    )}

                    {/* Currency */}
                    {isFieldVisible('rewardsCurrency') && currencyParts.length > 0 && (
                      <div className="p-3 rounded-2xl bg-black/40 border border-zinc-800 space-y-2">
                        <span className="text-[11px] font-mono text-zinc-400 uppercase block">Moedas & Valores</span>
                        <div className="flex flex-wrap gap-1.5">
                          {currencyParts.map((cp, idx) => (
                            <span
                              key={idx}
                              className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg border ${cp.color}`}
                            >
                              {cp.value} {cp.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Items Preview */}
                    {isFieldVisible('rewardsItems') && (isActualGm ? rawItems : visibleItems).length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[11px] font-mono text-zinc-400 uppercase block">Itens & Relíquias</span>
                        <div className="space-y-1.5">
                          {(isActualGm ? rawItems : visibleItems).slice(0, 3).map((item) => (
                            <div
                              key={item.id || item.name}
                              onClick={() => {
                                if (item.itemEntityId) setSelectedDrawerItemId(item.itemEntityId);
                              }}
                              className="p-2.5 rounded-xl bg-black/40 border border-zinc-800 hover:border-cyan-800 flex items-center justify-between cursor-pointer"
                            >
                              <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                                <Package className="w-3.5 h-3.5 text-cyan-400" />
                                {item.quantity && Number(item.quantity) > 1 ? `${item.quantity}x ` : ''}
                                {item.name}
                              </span>
                              <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Attachments Preview Box */}
              {isFieldVisible('attachmentsBlock') && (isActualGm ? rawAttachments : visibleAttachments).length > 0 && (
                <div className="p-6 rounded-3xl bg-[#0d0a1a] border border-cyan-950/80 shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-cyan-300 font-mono uppercase tracking-wider flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-cyan-400" />
                      Anexos Recentes
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab('attachments')}
                      className="text-xs font-semibold text-cyan-400 hover:underline"
                    >
                      Ver Todos ({visibleAttachments.length})
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {(isActualGm ? rawAttachments : visibleAttachments).slice(0, 4).map((att) => (
                      <div
                        key={att.id}
                        onClick={() => {
                          if (att.type === 'image') {
                            setLightboxImage({ url: att.url, title: att.title, caption: att.caption });
                          } else if (att.type === 'audio') {
                            handleToggleAudio(att);
                          } else {
                            window.open(att.url, '_blank');
                          }
                        }}
                        className="group/att relative h-24 rounded-2xl overflow-hidden border border-zinc-800 bg-black/60 cursor-pointer"
                      >
                        {att.type === 'image' ? (
                          <img
                            src={att.url}
                            alt={att.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover/att:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
                            {att.type === 'audio' ? (
                              <Music className="w-6 h-6 text-purple-400 mb-1" />
                            ) : (
                              <FileText className="w-6 h-6 text-cyan-400 mb-1" />
                            )}
                            <span className="text-[10px] text-zinc-300 font-semibold line-clamp-1">{att.title}</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1.5">
                          <span className="text-[9px] font-bold text-zinc-200 truncate">{att.title}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 2: OBJECTIVES TRACKER ─── */}
        {activeTab === 'objectives' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-[#0d0a1a] border border-cyan-950 shadow-2xl space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="text-lg font-bold text-cyan-300 font-mono uppercase tracking-wider flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-cyan-400" />
                    Quadro Geral de Objetivos & Etapas
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Marque as caixas de seleção conforme os jogadores progridem na missão. O status é salvo instantaneamente.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {renderEyeToggle('objectivesBlock', 'Bloco Geral de Objetivos')}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="p-4 rounded-2xl bg-black/60 border border-zinc-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-zinc-300">Conclusão dos Objetivos da Missão</span>
                  <span className="font-mono text-cyan-300 font-bold">
                    {completedCount}/{totalCount} Etapas ({progressPercent}%)
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-zinc-900 overflow-hidden border border-zinc-800">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 rounded-full transition-all duration-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Objectives List */}
              <div className="space-y-3">
                {(isActualGm ? rawObjectives : visibleObjectives).map((obj, idx) => (
                  <div
                    key={obj.id}
                    className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                      obj.completed
                        ? 'bg-emerald-950/20 border-emerald-800/50'
                        : 'bg-black/50 border-zinc-800/90 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleToggleObjective(obj.id)}
                        className="mt-0.5 text-cyan-400 shrink-0 cursor-pointer"
                        title={obj.completed ? 'Marcar como pendente' : 'Marcar como concluído'}
                      >
                        {obj.completed ? (
                          <CheckCircle2 className="w-6 h-6 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                        ) : (
                          <Square className="w-6 h-6 text-zinc-600 hover:text-cyan-400 transition-colors" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-bold text-zinc-500">#{idx + 1}</span>
                          <span className={`text-sm sm:text-base ${obj.completed ? 'line-through text-zinc-400 font-normal' : 'text-zinc-100 font-semibold'}`}>
                            {obj.text}
                          </span>
                        </div>

                        {obj.isSecret && (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 mt-2 rounded bg-amber-950/60 border border-amber-800/80 text-[10px] font-mono text-amber-300">
                            <Lock className="w-3 h-3 text-amber-400" />
                            CONFIDENCIAL GM: Este objetivo é oculto até ser revelado.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {renderEyeToggle(`obj_${obj.id}`, `Objetivo #${idx + 1}`, 'all', { compact: false })}

                      {isActualGm && (
                        <button
                          type="button"
                          onClick={() => handleDeleteObjective(obj.id)}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/60 transition-colors cursor-pointer"
                          title="Remover este objetivo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {(isActualGm ? rawObjectives : visibleObjectives).length === 0 && (
                  <div className="p-8 text-center rounded-2xl bg-black/30 border border-dashed border-zinc-800 text-zinc-500 text-sm">
                    Nenhum objetivo cadastrado nesta missão.
                  </div>
                )}
              </div>

              {/* Quick Add Objective (GM) */}
              {isActualGm && (
                <div className="p-4 rounded-2xl bg-black/60 border border-purple-900/50 space-y-3">
                  <span className="text-xs font-mono font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-purple-400" /> Adicionar Novo Objetivo Rápido
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={quickObjText}
                      onChange={(e) => setQuickObjText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleQuickAddObjective();
                      }}
                      placeholder="Descreva a nova etapa ou objetivo..."
                      className="flex-1 bg-black/80 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-400"
                    />
                    <label className="flex items-center gap-1.5 text-xs text-amber-300 font-mono cursor-pointer px-2 py-2 rounded-xl bg-amber-950/40 border border-amber-800/60 shrink-0">
                      <input
                        type="checkbox"
                        checked={quickObjSecret}
                        onChange={(e) => setQuickObjSecret(e.target.checked)}
                        className="rounded border-zinc-700 text-purple-600 focus:ring-purple-500"
                      />
                      <Lock className="w-3 h-3 text-amber-400" /> Secreto GM
                    </label>
                    <button
                      type="button"
                      onClick={handleQuickAddObjective}
                      className="px-4 py-2 rounded-xl font-bold text-xs bg-purple-700 hover:bg-purple-600 text-purple-100 transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Adicionar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 3: REWARDS VAULT ─── */}
        {activeTab === 'rewards' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-[#0d0a1a] border border-amber-900/50 shadow-2xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-amber-300 font-mono uppercase tracking-wider flex items-center gap-2">
                    <Coins className="w-5 h-5 text-amber-400" />
                    Cofre de Recompensas & Tesouros
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Tesouros prometidos, pontos de experiência, itens mágicos e honrarias de facção.
                  </p>
                </div>
                {renderEyeToggle('rewardsBlock', 'Bloco Geral de Recompensas')}
              </div>

              {/* XP & Currency Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* XP Card */}
                {isFieldVisible('rewardsXp') && (
                  <div className="p-5 rounded-2xl bg-amber-950/30 border border-amber-800/60 flex items-center justify-between">
                    <div>
                      <span className="text-xs uppercase font-mono text-amber-400 block font-bold">Experiência Concedida</span>
                      <p className="text-2xl font-bold font-mono text-amber-200 mt-1">
                        +{rewards.xp ?? 0} XP
                      </p>
                    </div>
                    {renderEyeToggle('rewardsXp', 'XP da Missão', 'all')}
                  </div>
                )}

                {/* Currency Card */}
                {isFieldVisible('rewardsCurrency') && (
                  <div className="p-5 rounded-2xl bg-black/40 border border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase font-mono text-zinc-400 block font-bold">Moedas de Recompensa</span>
                      {renderEyeToggle('rewardsCurrency', 'Moedas', 'all')}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {currencyParts.length > 0 ? (
                        currencyParts.map((cp, idx) => (
                          <div
                            key={idx}
                            className={`px-3 py-1.5 rounded-xl border text-sm font-mono font-bold ${cp.color}`}
                          >
                            {cp.value} {cp.label}
                          </div>
                        ))
                      ) : (
                        <span className="text-zinc-500 italic text-xs">Nenhum valor monetário estipulado.</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Items Compendium List */}
              {isFieldVisible('rewardsItems') && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-cyan-300 font-mono uppercase tracking-wider flex items-center gap-2">
                      <Package className="w-4 h-4 text-cyan-400" />
                      Itens & Equipamentos Recompensados ({(isActualGm ? rawItems : visibleItems).length})
                    </h4>
                    {renderEyeToggle('rewardsItems', 'Itens Recompensados')}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {(isActualGm ? rawItems : visibleItems).map((item) => (
                      <div
                        key={item.id || item.name}
                        onClick={() => {
                          if (item.itemEntityId) setSelectedDrawerItemId(item.itemEntityId);
                        }}
                        className="p-4 rounded-2xl bg-black/50 border border-zinc-800 hover:border-cyan-700/80 transition-all flex flex-col justify-between cursor-pointer group shadow-lg"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-sm font-bold text-zinc-100 group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                              <Package className="w-4 h-4 text-cyan-400 shrink-0" />
                              {item.quantity && Number(item.quantity) > 1 ? `${item.quantity}x ` : ''}
                              {item.name}
                            </span>
                            {item.rarity && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300">
                                {item.rarity}
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-xs text-zinc-400 line-clamp-2">{item.description}</p>
                          )}
                        </div>

                        <div className="pt-3 mt-3 border-t border-zinc-900 flex items-center justify-between text-[10px]">
                          <span className="text-cyan-400 group-hover:underline flex items-center gap-1 font-semibold">
                            Ver Detalhes do Item <ChevronRight className="w-3 h-3" />
                          </span>
                          {renderEyeToggle(`item_${item.id || item.name}`, `Item: ${item.name}`, 'all', { compact: true })}
                        </div>
                      </div>
                    ))}

                    {(isActualGm ? rawItems : visibleItems).length === 0 && (
                      <div className="col-span-full p-6 text-center rounded-2xl bg-black/20 border border-zinc-800 text-zinc-500 text-xs italic">
                        Nenhum item especial registrado como recompensa.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Organization Reputations */}
              {isFieldVisible('rewardsOrgReputation') && (
                <div className="space-y-3 pt-4 border-t border-zinc-800/80">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-indigo-300 font-mono uppercase tracking-wider flex items-center gap-2">
                      <Award className="w-4 h-4 text-indigo-400" />
                      Reputação & Favores com Facções
                    </h4>
                    {renderEyeToggle('rewardsOrgReputation', 'Reputações')}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(isActualGm ? rawReputations : visibleReputations).map((rep) => (
                      <div
                        key={rep.id || rep.organizationName}
                        className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-900/60 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-700 flex items-center justify-center text-indigo-300">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-sm font-bold text-indigo-200 block">{rep.organizationName}</span>
                            <span className="text-xs font-mono font-bold text-emerald-400">{rep.reputationChange}</span>
                            {rep.notes && <p className="text-[11px] text-zinc-400 mt-0.5">{rep.notes}</p>}
                          </div>
                        </div>

                        {renderEyeToggle(`rep_${rep.id || rep.organizationName}`, `Reputação: ${rep.organizationName}`, 'all', { compact: true })}
                      </div>
                    ))}

                    {(isActualGm ? rawReputations : visibleReputations).length === 0 && (
                      <div className="col-span-full p-4 text-center rounded-2xl bg-black/20 border border-zinc-800 text-zinc-500 text-xs italic">
                        Nenhuma alteração de reputação configurada.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 4: ATTACHMENTS & MULTIMEDIA (IMAGENS, MÚSICAS, VÍDEOS, PISTAS) ─── */}
        {activeTab === 'attachments' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-[#0d0a1a] border border-cyan-950 shadow-2xl space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="text-lg font-bold text-cyan-300 font-mono uppercase tracking-wider flex items-center gap-2">
                    <Paperclip className="w-5 h-5 text-cyan-400" />
                    Central de Anexos & Arquivos Multimídia
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Imagens (ImgBB), Vídeos do YouTube, Músicas (Google Drive), Mapas e Pistas desta missão.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {isActualGm && (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsMultiImageModalOpen(true)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-900/80 hover:bg-purple-800 text-purple-200 border border-purple-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <ImageIcon className="w-4 h-4" /> Álbum de Imagens
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingAttachment(null);
                          setIsAddAttachmentOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-zinc-950 transition-colors flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                      >
                        <Plus className="w-4 h-4" /> Adicionar Anexo / Mídia
                      </button>
                    </>
                  )}
                  {renderEyeToggle('attachmentsBlock', 'Bloco Geral de Anexos')}
                </div>
              </div>

              {/* Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {[
                  { id: 'all', label: 'Todos os Anexos', icon: Paperclip },
                  { id: 'image', label: 'Imagens', icon: ImageIcon },
                  { id: 'video', label: 'Vídeos (YouTube)', icon: Film },
                  { id: 'audio', label: 'Músicas (Drive/Áudio)', icon: Disc },
                  { id: 'document', label: 'Documentos & Mapas', icon: FileText },
                ].map((flt) => {
                  const Icon = flt.icon;
                  const active = attachmentFilter === flt.id;
                  const allAtts = isActualGm ? rawAttachments : visibleAttachments;
                  const count =
                    flt.id === 'all'
                      ? allAtts.length
                      : flt.id === 'document'
                      ? allAtts.filter((a) => a.type === 'document' || a.type === 'map' || a.type === 'handout' || a.type === 'other').length
                      : allAtts.filter((a) => a.type === flt.id).length;

                  return (
                    <button
                      key={flt.id}
                      type="button"
                      onClick={() => setAttachmentFilter(flt.id as any)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                        active
                          ? 'bg-cyan-950 border border-cyan-700 text-cyan-300 shadow-sm'
                          : 'bg-black/50 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{flt.label}</span>
                      <span className={`px-1.5 py-0.2 text-[10px] font-mono rounded-full ${
                        active ? 'bg-cyan-900 text-cyan-200' : 'bg-zinc-800 text-zinc-500'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Attachments Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(isActualGm ? rawAttachments : visibleAttachments)
                  .filter((att) => {
                    if (attachmentFilter === 'all') return true;
                    if (attachmentFilter === 'document') {
                      return att.type === 'document' || att.type === 'map' || att.type === 'handout' || att.type === 'other';
                    }
                    return att.type === attachmentFilter;
                  })
                  .map((att) => {
                    const isAudioPlaying = playingAudioId === att.id;
                    const isVideoPlaying = playingVideoId === att.id;

                    return (
                      <div
                        key={att.id}
                        className="group/attCard rounded-2xl overflow-hidden bg-black/60 border border-zinc-800 hover:border-cyan-800/80 transition-all flex flex-col justify-between shadow-xl"
                      >
                        {/* Media Header / Preview */}
                        {att.type === 'video' ? (
                          <div className="w-full bg-black relative">
                            {isVideoPlaying && att.videoId ? (
                              <div className="relative aspect-video w-full">
                                <iframe
                                  src={`https://www.youtube.com/embed/${att.videoId}?autoplay=1&rel=0`}
                                  title={att.title}
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                  className="w-full h-full border-0"
                                />
                              </div>
                            ) : (
                              <div
                                onClick={() => setPlayingVideoId(att.id)}
                                className="h-44 w-full relative overflow-hidden bg-zinc-950 cursor-pointer group/vid"
                              >
                                <img
                                  src={
                                    att.videoId
                                      ? `https://img.youtube.com/vi/${att.videoId}/hqdefault.jpg`
                                      : 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?w=600&auto=format&fit=crop&q=80'
                                  }
                                  alt={att.title}
                                  className="w-full h-full object-cover group-hover/vid:scale-105 transition-transform duration-300 opacity-80"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-between p-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-rose-600/90 text-white flex items-center gap-1 shadow">
                                      <Film className="w-3 h-3" /> YouTube
                                    </span>
                                    {att.caption && (
                                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/80 text-zinc-300">
                                        {att.caption}
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center justify-center py-2">
                                    <div className="w-12 h-12 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-[0_0_20px_rgba(225,29,72,0.6)] group-hover/vid:scale-110 transition-transform">
                                      <Play className="w-5 h-5 ml-0.5 fill-white" />
                                    </div>
                                  </div>

                                  <span className="text-xs font-bold text-white drop-shadow truncate">{att.title}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : att.type === 'image' || att.type === 'map' || att.type === 'handout' ? (
                          <div
                            onClick={() => setLightboxImage({ url: att.url, title: att.title, caption: att.caption })}
                            className="h-44 w-full relative overflow-hidden bg-zinc-950 cursor-pointer"
                          >
                            <img
                              src={att.url}
                              alt={att.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover/attCard:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                              <span className="text-xs font-bold text-white drop-shadow truncate">{att.title}</span>
                            </div>
                            <div className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 text-zinc-300 opacity-0 group-hover/attCard:opacity-100 transition-opacity">
                              <Maximize2 className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        ) : att.type === 'audio' ? (
                          <div className="p-4 bg-gradient-to-br from-purple-950/60 to-indigo-950/50 border-b border-purple-900/40 space-y-3">
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => handleToggleAudio(att)}
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                                  isAudioPlaying
                                    ? 'bg-purple-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.6)] scale-105 animate-pulse'
                                    : 'bg-purple-950 border border-purple-700 text-purple-300 hover:bg-purple-900'
                                }`}
                                title={isAudioPlaying ? 'Pausar Áudio' : 'Tocar Trilha Sonora'}
                              >
                                {isAudioPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                              </button>
                              <div className="min-w-0 flex-1">
                                <span className="text-xs font-bold text-purple-200 block truncate">{att.title}</span>
                                <span className="text-[10px] font-mono text-purple-400 flex items-center gap-1 mt-0.5">
                                  <Disc className={`w-3 h-3 ${isAudioPlaying ? 'animate-spin' : ''}`} />
                                  {att.isDriveAudio ? 'Música (Google Drive)' : 'Trilha Sonora'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-300">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-bold text-zinc-200 block truncate">{att.title}</span>
                              <span className="text-[10px] font-mono text-zinc-500 uppercase">{att.type}</span>
                            </div>
                          </div>
                        )}

                        {/* Card Info & Actions */}
                        <div className="p-3.5 space-y-2">
                          {att.caption && (
                            <p className="text-xs text-zinc-400 italic line-clamp-2">{att.caption}</p>
                          )}
                          {att.description && (
                            <p className="text-xs text-zinc-300 line-clamp-2">{att.description}</p>
                          )}

                          {att.isSecret && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-400">
                              <Lock className="w-2.5 h-2.5" /> Anexo Confidencial GM
                            </span>
                          )}

                          <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <a
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                              >
                                <ExternalLink className="w-3 h-3" />
                                {att.type === 'video' ? 'YouTube' : att.type === 'audio' ? 'Drive' : 'Abrir'}
                              </a>

                              {isActualGm && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingAttachment(att);
                                    setIsAddAttachmentOpen(true);
                                  }}
                                  className="text-zinc-400 hover:text-cyan-300 flex items-center gap-1 font-medium cursor-pointer"
                                >
                                  <Edit2 className="w-3 h-3" /> Editar
                                </button>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              {renderEyeToggle(`att_${att.id}`, `Anexo: ${att.title}`, 'all', { compact: true })}

                              {isActualGm && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAttachment(att.id)}
                                  className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-950 transition-colors cursor-pointer"
                                  title="Excluir Anexo"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                {(isActualGm ? rawAttachments : visibleAttachments).length === 0 && (
                  <div className="col-span-full p-12 text-center rounded-2xl bg-black/20 border border-dashed border-zinc-800 text-zinc-500 text-sm">
                    Nenhum arquivo ou anexo cadastrado nesta missão.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 5: INVOLVED NETWORK (NPCS, LOCATIONS, FACTIONS) ─── */}
        {activeTab === 'involved' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-[#0d0a1a] border border-cyan-950 shadow-2xl space-y-6">
              <div>
                <h3 className="text-lg font-bold text-cyan-300 font-mono uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-400" />
                  Rede de Envolvidos & Locais de Ação
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Clique nos cards para abrir os dados completos de cada entidade na gaveta (Drawer).
                </p>
              </div>

              {/* NPCs */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-purple-300 font-mono uppercase tracking-wider flex items-center gap-2">
                    <User className="w-4 h-4 text-purple-400" />
                    Personagens & NPCs Envolvidos ({involvedNpcs.length})
                  </h4>
                  {renderEyeToggle('involvedNpcs', 'NPCs Envolvidos')}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {involvedNpcs.map((npc) => (
                    <div
                      key={npc.id}
                      onClick={() => handleOpenEntityInDrawer(npc.id)}
                      className="p-3.5 rounded-2xl bg-black/40 border border-zinc-800 hover:border-purple-700/80 transition-all flex items-center justify-between cursor-pointer group shadow-lg"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {npc.coverImage || npc.npcData?.portraitImage ? (
                          <img
                            src={npc.coverImage || npc.npcData?.portraitImage}
                            alt={npc.title}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-xl object-cover border border-purple-900"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-300">
                            <User className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="text-sm font-bold text-zinc-100 group-hover:text-purple-300 transition-colors block truncate">
                            {npc.title}
                          </span>
                          <span className="text-xs text-zinc-400 block truncate">{npc.subtitle || 'NPC'}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-purple-400 transition-colors shrink-0" />
                    </div>
                  ))}
                  {involvedNpcs.length === 0 && (
                    <p className="text-zinc-500 italic text-xs col-span-full">Nenhum NPC vinculado.</p>
                  )}
                </div>
              </div>

              {/* Locations */}
              <div className="space-y-3 pt-4 border-t border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-cyan-300 font-mono uppercase tracking-wider flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-cyan-400" />
                    Locais & Pontos de Interesse ({involvedLocations.length})
                  </h4>
                  {renderEyeToggle('involvedLocations', 'Locais Envolvidos')}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {involvedLocations.map((loc) => (
                    <div
                      key={loc.id}
                      onClick={() => handleOpenEntityInDrawer(loc.id)}
                      className="p-3.5 rounded-2xl bg-black/40 border border-zinc-800 hover:border-cyan-700/80 transition-all flex items-center justify-between cursor-pointer group shadow-lg"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-300">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm font-bold text-zinc-100 group-hover:text-cyan-300 transition-colors block truncate">
                            {loc.title}
                          </span>
                          <span className="text-xs text-zinc-400 block truncate">{loc.subtitle || 'Local'}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-cyan-400 transition-colors shrink-0" />
                    </div>
                  ))}
                  {involvedLocations.length === 0 && (
                    <p className="text-zinc-500 italic text-xs col-span-full">Nenhum local vinculado.</p>
                  )}
                </div>
              </div>

              {/* Organizations */}
              <div className="space-y-3 pt-4 border-t border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-emerald-300 font-mono uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-400" />
                    Facções & Organizações Patrocinadoras ({involvedOrgs.length})
                  </h4>
                  {renderEyeToggle('involvedOrgs', 'Organizações Envolvidas')}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {involvedOrgs.map((org) => (
                    <div
                      key={org.id}
                      onClick={() => handleOpenEntityInDrawer(org.id)}
                      className="p-3.5 rounded-2xl bg-black/40 border border-zinc-800 hover:border-emerald-700/80 transition-all flex items-center justify-between cursor-pointer group shadow-lg"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-300">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm font-bold text-zinc-100 group-hover:text-emerald-300 transition-colors block truncate">
                            {org.title}
                          </span>
                          <span className="text-xs text-zinc-400 block truncate">{org.subtitle || 'Facção'}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 transition-colors shrink-0" />
                    </div>
                  ))}
                  {involvedOrgs.length === 0 && (
                    <p className="text-zinc-500 italic text-xs col-span-full">Nenhuma organização vinculada.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 6: SECRETS (GM ONLY) ─── */}
        {activeTab === 'secrets' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-[#14081c] border border-purple-800/80 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-purple-300 font-mono uppercase tracking-wider flex items-center gap-2">
                  <Lock className="w-5 h-5 text-purple-400" />
                  Câmara de Segredos do Mestre (Confidencial GM)
                </h3>
                <span className="px-2.5 py-0.5 text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-700 rounded-full font-bold">
                  APENAS GM
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-black/60 border border-purple-900/60 space-y-3">
                <span className="text-xs font-mono font-bold text-purple-400 uppercase">
                  Notas de Enredo, Reviravoltas & Verdades Ocultas
                </span>
                <div className="prose prose-invert max-w-none text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap">
                  {quest.gmSecrets || quest.gmNotes || currentEntity.gmNotes || 'Nenhuma anotação confidencial registrada para esta missão.'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 7: BACKLINKS ─── */}
        {activeTab === 'backlinks' && (
          <div className="space-y-4">
            <div className="p-6 rounded-3xl bg-[#0d0a1a] border border-cyan-950 shadow-2xl space-y-4">
              <h3 className="text-base font-bold text-cyan-300 font-mono uppercase tracking-wider flex items-center gap-2">
                <Scroll className="w-4 h-4 text-cyan-400" />
                Artigos que mencionam esta Missão ({backlinks.length})
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {backlinks.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => handleOpenEntityInDrawer(b.id)}
                    className="p-4 rounded-2xl bg-black/40 border border-zinc-800 hover:border-cyan-800 flex items-center justify-between cursor-pointer group transition-all"
                  >
                    <div>
                      <span className="text-sm font-bold text-zinc-100 group-hover:text-cyan-300 transition-colors block">
                        {b.title}
                      </span>
                      <span className="text-xs text-zinc-400 capitalize">{b.category}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-cyan-400" />
                  </div>
                ))}

                {backlinks.length === 0 && (
                  <p className="text-zinc-500 italic text-xs col-span-full">Nenhum backlink encontrado.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── ITEM DRAWER FOR REWARD ITEMS ─── */}
      {selectedDrawerItemId && (
        <ItemDrawer
          itemId={selectedDrawerItemId}
          entities={allEntities}
          isOpen={Boolean(selectedDrawerItemId)}
          onClose={() => setSelectedDrawerItemId(null)}
          onNavigateFullPage={(id) => {
            setSelectedDrawerItemId(null);
            onNavigate(id);
          }}
          isGmMode={isActualGm}
        />
      )}

      {/* ─── LIGHTBOX MODAL FOR IMAGES / MAPS ─── */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="max-w-4xl max-h-[90vh] bg-[#0d0a1a] border border-cyan-900 rounded-3xl overflow-hidden p-4 space-y-3 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-zinc-100">{lightboxImage.title}</h4>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-hidden rounded-2xl flex items-center justify-center bg-black">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.title}
                referrerPolicy="no-referrer"
                className="max-h-[70vh] max-w-full object-contain"
              />
            </div>
            {lightboxImage.caption && (
              <p className="text-xs text-zinc-400 italic text-center">{lightboxImage.caption}</p>
            )}
          </div>
        </div>
      )}

      {/* ─── ADD / EDIT ATTACHMENT MODAL ─── */}
      {isAddAttachmentOpen && (
        <QuestAttachmentModal
          initialData={editingAttachment || undefined}
          onSave={handleSaveAttachmentModal}
          onClose={() => {
            setIsAddAttachmentOpen(false);
            setEditingAttachment(null);
          }}
          questTitle={currentEntity.title}
        />
      )}

      {/* ─── MULTI-IMAGE ALBUM UPLOADER MODAL ─── */}
      {isMultiImageModalOpen && (
        <MultiImageAlbumUploader
          onImagesUploaded={handleImagesUploaded}
          onCancel={() => setIsMultiImageModalOpen(false)}
          title={`Álbum de Imagens: ${currentEntity.title}`}
          description="Arraste ou selecione múltiplas imagens para anexar à missão de uma vez."
          category="quest"
          entityName={currentEntity.title}
        />
      )}
    </div>
  );
};
