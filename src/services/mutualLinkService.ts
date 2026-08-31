import { HecosEntity, NPCAttributes, LocationAttributes, OrganizationAttributes, QuestAttributes, ItemVisibility } from '../types';
import { HecosStorage } from './storage';

/**
 * Intelligent Mutual Linking & Entity Relationship Service for Hecos
 * 
 * Rules:
 * 1. Strictly Two-Way (Direto em 2 vias):
 *    - Se NPC A for colocado no Local B e na Organização C:
 *      -> Local B ganha NPC A (e vice-versa)
 *      -> Organização C ganha NPC A (e vice-versa)
 *      -> MAS Local B NÃO ganha Organização C (sem ligação indireta em 3 vias)!
 * 
 * 2. Preenchimento e Exclusão Mútua:
 *    - Adição mútua imediata.
 *    - Remoção mútua imediata (se NPC A desmarcar Local B, Local B remove NPC A da sua lista de habitantes).
 */

export interface LinkedEntitiesForNPC {
  locations: HecosEntity[];
  organizations: HecosEntity[];
  quests: {
    entity?: HecosEntity;
    linkId?: string;
    title: string;
    roleInQuest?: string;
    description?: string;
    isSecret?: boolean;
  }[];
}

export interface LinkedEntitiesForLocation {
  inhabitants: HecosEntity[];
  organizations: HecosEntity[];
  quests: HecosEntity[];
}

export interface LinkedEntitiesForOrganization {
  leaders: HecosEntity[];
  members: HecosEntity[];
  locations: HecosEntity[];
  quests: HecosEntity[];
  allies: HecosEntity[];
  rivals: HecosEntity[];
}

export interface LinkedEntitiesForQuest {
  questGiver?: HecosEntity | null;
  involvedNpcs: HecosEntity[];
  locations: HecosEntity[];
  organizations: HecosEntity[];
}

export class MutualLinkService {
  /**
   * Helper to check if a user is permitted to see an entity based on visibility and secret settings.
   */
  static isVisibleToUser(
    entity: HecosEntity,
    isGm: boolean,
    userId?: string
  ): boolean {
    if (isGm) return true;
    if (entity.isSecret) return false;
    if (entity.visibility === 'gm') return false;
    if (entity.visibility === 'custom') {
      if (!userId) return false;
      return Boolean(entity.allowedUserIds?.includes(userId));
    }
    return true; // 'all'
  }

  /**
   * Match string fuzzy equality (case insensitive, trimmed)
   */
  static matchTitle(a?: string, b?: string): boolean {
    if (!a || !b) return false;
    return a.trim().toLowerCase() === b.trim().toLowerCase();
  }

  /**
   * 1. GET LINKED ENTITIES FOR NPC
   */
  static getLinkedForNPC(
    npcEntity: HecosEntity,
    allEntities: HecosEntity[] = HecosStorage.getEntities()
  ): LinkedEntitiesForNPC {
    const npcData = npcEntity.npcData || {};
    const npcId = npcEntity.id;
    const npcTitle = npcEntity.title;

    // --- Locations ---
    const locationMap = new Map<string, HecosEntity>();

    if (npcData.locationEntityId) {
      const found = allEntities.find((e) => e.id === npcData.locationEntityId);
      if (found) locationMap.set(found.id, found);
    }
    const allLinkedLocIds = [
      ...(npcData.linkedLocationIds || []),
      ...(npcData.locationIds || []),
    ];
    allLinkedLocIds.forEach((locId) => {
      if (locId) {
        const found = allEntities.find((e) => e.id === locId);
        if (found) locationMap.set(found.id, found);
      }
    });

    if (npcData.location && locationMap.size === 0) {
      const found = allEntities.find(
        (e) => (e.category === 'location' || Boolean(e.locationData)) && this.matchTitle(e.title, npcData.location)
      );
      if (found) locationMap.set(found.id, found);
    }

    // Mutual reverse-lookup: Locations that explicitly list this NPC
    allEntities.forEach((ent) => {
      if (ent.category === 'location' || ent.locationData) {
        const loc = ent.locationData;
        if (
          loc?.inhabitantNpcIds?.includes(npcId) ||
          loc?.rulerEntityId === npcId ||
          this.matchTitle(loc?.ruler, npcTitle)
        ) {
          locationMap.set(ent.id, ent);
        }
      }
    });

    // --- Organizations ---
    const orgMap = new Map<string, HecosEntity>();

    const primaryOrgId = npcData.organizationEntityId || npcData.factionEntityId;
    if (primaryOrgId) {
      const found = allEntities.find((e) => e.id === primaryOrgId);
      if (found) orgMap.set(found.id, found);
    }
    const allLinkedOrgIds = [
      ...(npcData.linkedOrganizationIds || []),
      ...(npcData.organizationIds || []),
    ];
    allLinkedOrgIds.forEach((orgId) => {
      if (orgId) {
        const found = allEntities.find((e) => e.id === orgId);
        if (found) orgMap.set(found.id, found);
      }
    });

    const orgName = npcData.organization || npcData.faction;
    if (orgName && orgMap.size === 0) {
      const found = allEntities.find(
        (e) => (e.category === 'organization' || Boolean(e.organizationData)) && this.matchTitle(e.title, orgName)
      );
      if (found) orgMap.set(found.id, found);
    }

    // Mutual reverse-lookup: Organizations that list this NPC as leader or member
    allEntities.forEach((ent) => {
      if (ent.category === 'organization' || ent.organizationData) {
        const org = ent.organizationData;
        if (
          org?.memberNpcIds?.includes(npcId) ||
          org?.leaderEntityId === npcId ||
          this.matchTitle(org?.leader, npcTitle)
        ) {
          orgMap.set(ent.id, ent);
        }
      }
    });

    // --- Quests ---
    const questMap = new Map<string, {
      entity?: HecosEntity;
      linkId?: string;
      title: string;
      roleInQuest?: string;
      description?: string;
      isSecret?: boolean;
    }>();

    // Direct questIds
    (npcData.questIds || []).forEach((qId) => {
      if (qId) {
        const found = allEntities.find((e) => e.id === qId);
        if (found) {
          questMap.set(found.id, {
            entity: found,
            title: found.title,
            roleInQuest: 'Missão Vinculada',
            description: found.subtitle || '',
            isSecret: found.isSecret || found.visibility === 'gm',
          });
        }
      }
    });

    // Explicit quests array in NPC
    (npcData.quests || []).forEach((q) => {
      let matchedEntity: HecosEntity | undefined;
      if (q.questEntityId) {
        matchedEntity = allEntities.find((e) => e.id === q.questEntityId);
      }
      if (!matchedEntity && q.title) {
        matchedEntity = allEntities.find(
          (e) => (e.category === 'quest' || Boolean(e.questData)) && this.matchTitle(e.title, q.title)
        );
      }

      const key = matchedEntity ? matchedEntity.id : `custom-${q.id || q.title}`;
      questMap.set(key, {
        entity: matchedEntity,
        linkId: q.id,
        title: matchedEntity ? matchedEntity.title : q.title,
        roleInQuest: q.roleInQuest || 'Envolvido',
        description: q.description || (matchedEntity?.subtitle || ''),
        isSecret: q.isSecret || matchedEntity?.isSecret,
      });
    });

    // Mutual reverse-lookup: Quests that list this NPC
    allEntities.forEach((ent) => {
      if (ent.category === 'quest' || ent.questData) {
        const qd = ent.questData;
        const isGiver = qd?.questGiverEntityId === npcId || this.matchTitle(qd?.questGiver, npcTitle);
        const isInvolved = qd?.involvedNpcIds?.includes(npcId);

        if (isGiver || isInvolved) {
          if (!questMap.has(ent.id)) {
            questMap.set(ent.id, {
              entity: ent,
              title: ent.title,
              roleInQuest: isGiver ? 'Doador da Missão' : 'NPC Envolvido',
              description: ent.subtitle || '',
              isSecret: ent.isSecret || ent.visibility === 'gm',
            });
          }
        }
      }
    });

    return {
      locations: Array.from(locationMap.values()),
      organizations: Array.from(orgMap.values()),
      quests: Array.from(questMap.values()),
    };
  }

  /**
   * 2. GET LINKED ENTITIES FOR LOCATION
   */
  static getLinkedForLocation(
    locEntity: HecosEntity,
    allEntities: HecosEntity[] = HecosStorage.getEntities()
  ): LinkedEntitiesForLocation {
    const locData = locEntity.locationData || {};
    const locId = locEntity.id;
    const locTitle = locEntity.title;

    // Inhabitant / Ruler NPCs
    const npcMap = new Map<string, HecosEntity>();
    if (locData.rulerEntityId) {
      const found = allEntities.find((e) => e.id === locData.rulerEntityId);
      if (found) npcMap.set(found.id, found);
    }
    (locData.inhabitantNpcIds || []).forEach((id) => {
      const found = allEntities.find((e) => e.id === id);
      if (found) npcMap.set(found.id, found);
    });

    allEntities.forEach((ent) => {
      if (ent.category === 'npc' || ent.npcData) {
        const nd = ent.npcData;
        if (
          nd?.locationEntityId === locId ||
          nd?.linkedLocationIds?.includes(locId) ||
          nd?.locationIds?.includes(locId) ||
          this.matchTitle(nd?.location, locTitle)
        ) {
          npcMap.set(ent.id, ent);
        }
      }
    });

    // Organizations directly in this Location
    const orgMap = new Map<string, HecosEntity>();
    (locData.factionEntityIds || []).forEach((id) => {
      const found = allEntities.find((e) => e.id === id);
      if (found) orgMap.set(found.id, found);
    });

    (locData.factionsPresent || []).forEach((facName) => {
      const found = allEntities.find(
        (e) => (e.category === 'organization' || Boolean(e.organizationData)) && this.matchTitle(e.title, facName)
      );
      if (found) orgMap.set(found.id, found);
    });

    allEntities.forEach((ent) => {
      if (ent.category === 'organization' || ent.organizationData) {
        const od = ent.organizationData;
        if (
          od?.headquartersLocationId === locId ||
          od?.affiliatedLocationIds?.includes(locId) ||
          this.matchTitle(od?.headquarters, locTitle)
        ) {
          orgMap.set(ent.id, ent);
        }
      }
    });

    // Quests in this Location
    const questMap = new Map<string, HecosEntity>();
    (locData.questIds || []).forEach((id) => {
      const found = allEntities.find((e) => e.id === id);
      if (found) questMap.set(found.id, found);
    });

    allEntities.forEach((ent) => {
      if (ent.category === 'quest' || ent.questData) {
        const qd = ent.questData;
        if (
          qd?.locationEntityId === locId ||
          qd?.involvedLocationIds?.includes(locId) ||
          qd?.relatedLocationIds?.includes(locId) ||
          this.matchTitle(qd?.location, locTitle)
        ) {
          questMap.set(ent.id, ent);
        }
      }
    });

    return {
      inhabitants: Array.from(npcMap.values()),
      organizations: Array.from(orgMap.values()),
      quests: Array.from(questMap.values()),
    };
  }

  /**
   * 3. GET LINKED ENTITIES FOR ORGANIZATION
   */
  static getLinkedForOrganization(
    orgEntity: HecosEntity,
    allEntities: HecosEntity[] = HecosStorage.getEntities()
  ): LinkedEntitiesForOrganization {
    const orgData = orgEntity.organizationData || {};
    const orgId = orgEntity.id;
    const orgTitle = orgEntity.title;

    // Leaders & Members
    const leaderMap = new Map<string, HecosEntity>();
    const memberMap = new Map<string, HecosEntity>();

    if (orgData.leaderEntityId) {
      const found = allEntities.find((e) => e.id === orgData.leaderEntityId);
      if (found) leaderMap.set(found.id, found);
    } else if (orgData.leader) {
      const found = allEntities.find(
        (e) => (e.category === 'npc' || Boolean(e.npcData)) && this.matchTitle(e.title, orgData.leader)
      );
      if (found) leaderMap.set(found.id, found);
    }

    (orgData.memberNpcIds || []).forEach((id) => {
      const found = allEntities.find((e) => e.id === id);
      if (found && !leaderMap.has(found.id)) memberMap.set(found.id, found);
    });

    allEntities.forEach((ent) => {
      if (ent.category === 'npc' || ent.npcData) {
        const nd = ent.npcData;
        const matchesOrg =
          nd?.organizationEntityId === orgId ||
          nd?.factionEntityId === orgId ||
          nd?.linkedOrganizationIds?.includes(orgId) ||
          nd?.organizationIds?.includes(orgId) ||
          this.matchTitle(nd?.organization, orgTitle) ||
          this.matchTitle(nd?.faction, orgTitle);

        if (matchesOrg) {
          if (!leaderMap.has(ent.id)) {
            memberMap.set(ent.id, ent);
          }
        }
      }
    });

    // Locations
    const locMap = new Map<string, HecosEntity>();
    if (orgData.headquartersLocationId) {
      const found = allEntities.find((e) => e.id === orgData.headquartersLocationId);
      if (found) locMap.set(found.id, found);
    } else if (orgData.headquarters) {
      const found = allEntities.find(
        (e) => (e.category === 'location' || Boolean(e.locationData)) && this.matchTitle(e.title, orgData.headquarters)
      );
      if (found) locMap.set(found.id, found);
    }

    (orgData.affiliatedLocationIds || []).forEach((id) => {
      const found = allEntities.find((e) => e.id === id);
      if (found) locMap.set(found.id, found);
    });

    allEntities.forEach((ent) => {
      if (ent.category === 'location' || ent.locationData) {
        const ld = ent.locationData;
        if (
          ld?.factionEntityIds?.includes(orgId) ||
          ld?.factionsPresent?.some((f) => this.matchTitle(f, orgTitle))
        ) {
          locMap.set(ent.id, ent);
        }
      }
    });

    // Quests
    const questMap = new Map<string, HecosEntity>();
    (orgData.questIds || []).forEach((id) => {
      const found = allEntities.find((e) => e.id === id);
      if (found) questMap.set(found.id, found);
    });

    allEntities.forEach((ent) => {
      if (ent.category === 'quest' || ent.questData) {
        const qd = ent.questData;
        if (
          qd?.organizationEntityId === orgId ||
          qd?.involvedOrgIds?.includes(orgId) ||
          this.matchTitle(qd?.organization, orgTitle)
        ) {
          questMap.set(ent.id, ent);
        }
      }
    });

    // Allies & Rivals
    const allyMap = new Map<string, HecosEntity>();
    const rivalMap = new Map<string, HecosEntity>();

    (orgData.alliedOrgIds || []).forEach((id) => {
      const found = allEntities.find((e) => e.id === id);
      if (found) allyMap.set(found.id, found);
    });
    (orgData.allies || []).forEach((name) => {
      const found = allEntities.find(
        (e) => (e.category === 'organization' || Boolean(e.organizationData)) && this.matchTitle(e.title, name)
      );
      if (found) allyMap.set(found.id, found);
    });

    (orgData.rivalOrgIds || []).forEach((id) => {
      const found = allEntities.find((e) => e.id === id);
      if (found) rivalMap.set(found.id, found);
    });
    (orgData.rivals || []).forEach((name) => {
      const found = allEntities.find(
        (e) => (e.category === 'organization' || Boolean(e.organizationData)) && this.matchTitle(e.title, name)
      );
      if (found) rivalMap.set(found.id, found);
    });

    return {
      leaders: Array.from(leaderMap.values()),
      members: Array.from(memberMap.values()),
      locations: Array.from(locMap.values()),
      quests: Array.from(questMap.values()),
      allies: Array.from(allyMap.values()),
      rivals: Array.from(rivalMap.values()),
    };
  }

  /**
   * 4. GET LINKED ENTITIES FOR QUEST
   */
  static getLinkedForQuest(
    questEntity: HecosEntity,
    allEntities: HecosEntity[] = HecosStorage.getEntities()
  ): LinkedEntitiesForQuest {
    const questData: Partial<QuestAttributes> = questEntity.questData || {};
    const questId = questEntity.id;
    const questTitle = questEntity.title;

    let questGiver: HecosEntity | null = null;
    const npcMap = new Map<string, HecosEntity>();

    if (questData.questGiverEntityId) {
      const found = allEntities.find((e) => e.id === questData.questGiverEntityId);
      if (found) questGiver = found;
    } else if (questData.questGiver) {
      const found = allEntities.find(
        (e) => (e.category === 'npc' || Boolean(e.npcData)) && this.matchTitle(e.title, questData.questGiver)
      );
      if (found) questGiver = found;
    }

    (questData.involvedNpcIds || []).forEach((id) => {
      const found = allEntities.find((e) => e.id === id);
      if (found && found.id !== questGiver?.id) npcMap.set(found.id, found);
    });

    allEntities.forEach((ent) => {
      if (ent.category === 'npc' || ent.npcData) {
        const nd = ent.npcData;
        const isLinked = (nd?.quests || []).some(
          (q) => q.questEntityId === questId || this.matchTitle(q.title, questTitle)
        );
        if (isLinked) {
          if (!questGiver) {
            const role = (nd?.quests || []).find(
              (q) => q.questEntityId === questId || this.matchTitle(q.title, questTitle)
            )?.roleInQuest;
            if (role?.toLowerCase().includes('doador') || role?.toLowerCase().includes('giver')) {
              questGiver = ent;
            } else {
              npcMap.set(ent.id, ent);
            }
          } else if (ent.id !== questGiver.id) {
            npcMap.set(ent.id, ent);
          }
        }
      }
    });

    const locMap = new Map<string, HecosEntity>();
    if (questData.locationEntityId) {
      const found = allEntities.find((e) => e.id === questData.locationEntityId);
      if (found) locMap.set(found.id, found);
    } else if (questData.location) {
      const found = allEntities.find(
        (e) => (e.category === 'location' || Boolean(e.locationData)) && this.matchTitle(e.title, questData.location)
      );
      if (found) locMap.set(found.id, found);
    }

    (questData.involvedLocationIds || []).forEach((id) => {
      const found = allEntities.find((e) => e.id === id);
      if (found) locMap.set(found.id, found);
    });

    allEntities.forEach((ent) => {
      if (ent.category === 'location' || ent.locationData) {
        const ld = ent.locationData;
        if (ld?.questIds?.includes(questId)) {
          locMap.set(ent.id, ent);
        }
      }
    });

    const orgMap = new Map<string, HecosEntity>();
    if (questData.organizationEntityId) {
      const found = allEntities.find((e) => e.id === questData.organizationEntityId);
      if (found) orgMap.set(found.id, found);
    } else if (questData.organization) {
      const found = allEntities.find(
        (e) => (e.category === 'organization' || Boolean(e.organizationData)) && this.matchTitle(e.title, questData.organization)
      );
      if (found) orgMap.set(found.id, found);
    }

    (questData.involvedOrgIds || []).forEach((id) => {
      const found = allEntities.find((e) => e.id === id);
      if (found) orgMap.set(found.id, found);
    });

    allEntities.forEach((ent) => {
      if (ent.category === 'organization' || ent.organizationData) {
        const od = ent.organizationData;
        if (od?.questIds?.includes(questId)) {
          orgMap.set(ent.id, ent);
        }
      }
    });

    return {
      questGiver,
      involvedNpcs: Array.from(npcMap.values()),
      locations: Array.from(locMap.values()),
      organizations: Array.from(orgMap.values()),
    };
  }

  /**
   * 5. SYNC MUTUAL LINKS ON SAVE (Strictly Two-Way & Handles Mutual Removal)
   * 
   * Synchronizes data back-references when an entity is created or updated.
   * - Only updates direct counterparts (2-way strictly, preventing 3-way contamination).
   * - If an entity was unlinked from target, removes the back-reference automatically.
   */
  static syncMutualLinksOnSave(savedEntity: HecosEntity): void {
    const allEntities = HecosStorage.getEntities();
    const entityId = savedEntity.id;

    // ─────────────────────────────────────────────────────────────
    // CASE A: NPC SAVED -> Synchronize Locations, Organizations, Quests (2-way)
    // ─────────────────────────────────────────────────────────────
    if (savedEntity.category === 'npc' || savedEntity.npcData) {
      const nd = savedEntity.npcData || {};
      const targetLocIds = new Set<string>(
        [
          nd.locationEntityId,
          ...(nd.linkedLocationIds || []),
          ...(nd.locationIds || []),
        ].filter(Boolean) as string[]
      );

      const targetOrgIds = new Set<string>(
        [
          nd.organizationEntityId,
          nd.factionEntityId,
          ...(nd.linkedOrganizationIds || []),
          ...(nd.organizationIds || []),
        ].filter(Boolean) as string[]
      );

      const directQuestIds = new Set<string>((nd.questIds || []).filter(Boolean) as string[]);
      (nd.quests || []).forEach((q) => {
        if (q.questEntityId) directQuestIds.add(q.questEntityId);
      });

      // 1. Sync Locations: Add to selected locations, Remove from previously linked locations not selected
      allEntities.forEach((ent) => {
        if (ent.category === 'location' || ent.locationData) {
          const loc = ent.locationData || {};
          const currentInhabitants = loc.inhabitantNpcIds || [];
          const isTargetLoc =
            targetLocIds.has(ent.id) ||
            (!targetLocIds.size && nd.location && this.matchTitle(ent.title, nd.location));

          if (isTargetLoc) {
            // Add if missing
            if (!currentInhabitants.includes(entityId)) {
              const updatedLoc: HecosEntity = {
                ...ent,
                locationData: {
                  ...loc,
                  inhabitantNpcIds: [...currentInhabitants, entityId],
                },
                updatedAt: new Date().toISOString(),
              };
              HecosStorage.saveEntity(updatedLoc);
            }
          } else {
            // Remove if no longer linked
            if (currentInhabitants.includes(entityId)) {
              const updatedLoc: HecosEntity = {
                ...ent,
                locationData: {
                  ...loc,
                  inhabitantNpcIds: currentInhabitants.filter((id) => id !== entityId),
                },
                updatedAt: new Date().toISOString(),
              };
              HecosStorage.saveEntity(updatedLoc);
            }
          }
        }
      });

      // 2. Sync Organizations: Add to selected orgs, Remove from unselected
      allEntities.forEach((ent) => {
        if (ent.category === 'organization' || ent.organizationData) {
          const org = ent.organizationData || {};
          const currentMembers = org.memberNpcIds || [];
          const isTargetOrg =
            targetOrgIds.has(ent.id) ||
            (!targetOrgIds.size && (nd.organization || nd.faction) && (this.matchTitle(ent.title, nd.organization) || this.matchTitle(ent.title, nd.faction)));

          if (isTargetOrg) {
            // Add if missing
            if (!currentMembers.includes(entityId)) {
              const updatedOrg: HecosEntity = {
                ...ent,
                organizationData: {
                  ...org,
                  memberNpcIds: [...currentMembers, entityId],
                },
                updatedAt: new Date().toISOString(),
              };
              HecosStorage.saveEntity(updatedOrg);
            }
          } else {
            // Remove if no longer linked
            if (currentMembers.includes(entityId) || org.leaderEntityId === entityId) {
              const updatedOrg: HecosEntity = {
                ...ent,
                organizationData: {
                  ...org,
                  memberNpcIds: currentMembers.filter((id) => id !== entityId),
                  leaderEntityId: org.leaderEntityId === entityId ? undefined : org.leaderEntityId,
                  leader: org.leaderEntityId === entityId ? undefined : org.leader,
                },
                updatedAt: new Date().toISOString(),
              };
              HecosStorage.saveEntity(updatedOrg);
            }
          }
        }
      });

      // 3. Sync Quests: Add to selected quests, Remove from unselected
      allEntities.forEach((ent) => {
        if (ent.category === 'quest' || ent.questData) {
          const qd = ent.questData || { status: 'not_started', objectives: [] };
          const involved = qd.involvedNpcIds || [];
          const isTargetQuest = directQuestIds.has(ent.id);

          if (isTargetQuest) {
            if (!involved.includes(entityId) && qd.questGiverEntityId !== entityId) {
              const updatedQuest: HecosEntity = {
                ...ent,
                questData: {
                  ...qd,
                  involvedNpcIds: [...involved, entityId],
                },
                updatedAt: new Date().toISOString(),
              };
              HecosStorage.saveEntity(updatedQuest);
            }
          } else {
            // Remove if no longer linked
            if (involved.includes(entityId) || qd.questGiverEntityId === entityId) {
              const updatedQuest: HecosEntity = {
                ...ent,
                questData: {
                  ...qd,
                  involvedNpcIds: involved.filter((id) => id !== entityId),
                  questGiverEntityId: qd.questGiverEntityId === entityId ? undefined : qd.questGiverEntityId,
                  questGiver: qd.questGiverEntityId === entityId ? undefined : qd.questGiver,
                },
                updatedAt: new Date().toISOString(),
              };
              HecosStorage.saveEntity(updatedQuest);
            }
          }
        }
      });
    }

    // ─────────────────────────────────────────────────────────────
    // CASE B: LOCATION SAVED -> Synchronize Inhabitant NPCs, Quests, Orgs Present
    // ─────────────────────────────────────────────────────────────
    if (savedEntity.category === 'location' || savedEntity.locationData) {
      const ld = savedEntity.locationData || {};
      const targetInhabitantIds = new Set<string>(ld.inhabitantNpcIds || []);
      const targetQuestIds = new Set<string>(ld.questIds || []);
      const targetFactionIds = new Set<string>(ld.factionEntityIds || []);

      // 1. Sync Inhabitant NPCs
      allEntities.forEach((ent) => {
        if (ent.category === 'npc' || ent.npcData) {
          const nd = ent.npcData || {};
          const isTargetNpc = targetInhabitantIds.has(ent.id);

          if (isTargetNpc) {
            const locIds = new Set<string>([...(nd.linkedLocationIds || []), ...(nd.locationIds || [])]);
            if (nd.locationEntityId) locIds.add(nd.locationEntityId);
            if (!locIds.has(entityId)) {
              locIds.add(entityId);
              const updatedNpc: HecosEntity = {
                ...ent,
                npcData: {
                  ...nd,
                  locationEntityId: nd.locationEntityId || entityId,
                  location: nd.location || savedEntity.title,
                  linkedLocationIds: Array.from(locIds),
                  locationIds: Array.from(locIds),
                },
                updatedAt: new Date().toISOString(),
              };
              HecosStorage.saveEntity(updatedNpc);
            }
          } else {
            // Check if NPC has this location and should be unlinked
            const hasLocationLink =
              nd.locationEntityId === entityId ||
              nd.linkedLocationIds?.includes(entityId) ||
              nd.locationIds?.includes(entityId);

            if (hasLocationLink) {
              const updatedLinked = (nd.linkedLocationIds || []).filter((id) => id !== entityId);
              const updatedLocIds = (nd.locationIds || []).filter((id) => id !== entityId);
              const updatedEntityId = nd.locationEntityId === entityId ? (updatedLinked[0] || undefined) : nd.locationEntityId;

              const updatedNpc: HecosEntity = {
                ...ent,
                npcData: {
                  ...nd,
                  locationEntityId: updatedEntityId,
                  location: updatedEntityId ? nd.location : undefined,
                  linkedLocationIds: updatedLinked,
                  locationIds: updatedLocIds,
                },
                updatedAt: new Date().toISOString(),
              };
              HecosStorage.saveEntity(updatedNpc);
            }
          }
        }
      });

      // 2. Sync Quests
      allEntities.forEach((ent) => {
        if (ent.category === 'quest' || ent.questData) {
          const qd = ent.questData || { status: 'not_started', objectives: [] };
          const isTargetQuest = targetQuestIds.has(ent.id);

          if (isTargetQuest) {
            if (qd.locationEntityId !== entityId) {
              const updatedQuest: HecosEntity = {
                ...ent,
                questData: {
                  ...qd,
                  locationEntityId: entityId,
                  location: savedEntity.title,
                },
                updatedAt: new Date().toISOString(),
              };
              HecosStorage.saveEntity(updatedQuest);
            }
          } else if (qd.locationEntityId === entityId) {
            const updatedQuest: HecosEntity = {
              ...ent,
              questData: {
                ...qd,
                locationEntityId: undefined,
                location: undefined,
              },
              updatedAt: new Date().toISOString(),
            };
            HecosStorage.saveEntity(updatedQuest);
          }
        }
      });

      // 3. Sync Organizations Present
      allEntities.forEach((ent) => {
        if (ent.category === 'organization' || ent.organizationData) {
          const od = ent.organizationData || {};
          const affLocs = od.affiliatedLocationIds || [];
          const isTargetOrg = targetFactionIds.has(ent.id);

          if (isTargetOrg) {
            if (!affLocs.includes(entityId)) {
              const updatedOrg: HecosEntity = {
                ...ent,
                organizationData: {
                  ...od,
                  affiliatedLocationIds: [...affLocs, entityId],
                },
                updatedAt: new Date().toISOString(),
              };
              HecosStorage.saveEntity(updatedOrg);
            }
          } else if (affLocs.includes(entityId) || od.headquartersLocationId === entityId) {
            const updatedOrg: HecosEntity = {
              ...ent,
              organizationData: {
                ...od,
                headquartersLocationId: od.headquartersLocationId === entityId ? undefined : od.headquartersLocationId,
                headquarters: od.headquartersLocationId === entityId ? undefined : od.headquarters,
                affiliatedLocationIds: affLocs.filter((id) => id !== entityId),
              },
              updatedAt: new Date().toISOString(),
            };
            HecosStorage.saveEntity(updatedOrg);
          }
        }
      });
    }

    // ─────────────────────────────────────────────────────────────
    // CASE C: ORGANIZATION SAVED -> Synchronize Members, HQ Location, Quests
    // ─────────────────────────────────────────────────────────────
    if (savedEntity.category === 'organization' || savedEntity.organizationData) {
      const od = savedEntity.organizationData || {};
      const targetMemberIds = new Set<string>(od.memberNpcIds || []);
      if (od.leaderEntityId) targetMemberIds.add(od.leaderEntityId);

      const targetHqLocId = od.headquartersLocationId;
      const targetAffiliatedLocIds = new Set<string>(od.affiliatedLocationIds || []);
      if (targetHqLocId) targetAffiliatedLocIds.add(targetHqLocId);

      const targetQuestIds = new Set<string>(od.questIds || []);

      // 1. Sync Member & Leader NPCs
      allEntities.forEach((ent) => {
        if (ent.category === 'npc' || ent.npcData) {
          const nd = ent.npcData || {};
          const isTargetMember = targetMemberIds.has(ent.id);

          if (isTargetMember) {
            const orgIds = new Set(nd.linkedOrganizationIds || nd.organizationIds || []);
            if (nd.organizationEntityId) orgIds.add(nd.organizationEntityId);
            if (nd.factionEntityId) orgIds.add(nd.factionEntityId);

            if (!orgIds.has(entityId)) {
              orgIds.add(entityId);
              const updatedNpc: HecosEntity = {
                ...ent,
                npcData: {
                  ...nd,
                  organizationEntityId: nd.organizationEntityId || entityId,
                  factionEntityId: nd.factionEntityId || entityId,
                  organization: nd.organization || savedEntity.title,
                  faction: nd.faction || savedEntity.title,
                  linkedOrganizationIds: Array.from(orgIds),
                  organizationIds: Array.from(orgIds),
                },
                updatedAt: new Date().toISOString(),
              };
              HecosStorage.saveEntity(updatedNpc);
            }
          } else {
            const hasOrgLink =
              nd.organizationEntityId === entityId ||
              nd.factionEntityId === entityId ||
              nd.linkedOrganizationIds?.includes(entityId) ||
              nd.organizationIds?.includes(entityId);

            if (hasOrgLink) {
              const updatedLinked = (nd.linkedOrganizationIds || []).filter((id) => id !== entityId);
              const updatedOrgIds = (nd.organizationIds || []).filter((id) => id !== entityId);
              const updatedPrimary = nd.organizationEntityId === entityId ? (updatedLinked[0] || undefined) : nd.organizationEntityId;

              const updatedNpc: HecosEntity = {
                ...ent,
                npcData: {
                  ...nd,
                  organizationEntityId: updatedPrimary,
                  factionEntityId: updatedPrimary,
                  organization: updatedPrimary ? nd.organization : undefined,
                  faction: updatedPrimary ? nd.faction : undefined,
                  linkedOrganizationIds: updatedLinked,
                  organizationIds: updatedOrgIds,
                },
                updatedAt: new Date().toISOString(),
              };
              HecosStorage.saveEntity(updatedNpc);
            }
          }
        }
      });

      // 2. Sync Locations affiliated/HQ
      allEntities.forEach((ent) => {
        if (ent.category === 'location' || ent.locationData) {
          const ld = ent.locationData || {};
          const factions = ld.factionEntityIds || [];
          const isTargetLoc = targetAffiliatedLocIds.has(ent.id);

          if (isTargetLoc) {
            if (!factions.includes(entityId)) {
              const updatedLoc: HecosEntity = {
                ...ent,
                locationData: {
                  ...ld,
                  factionEntityIds: [...factions, entityId],
                },
                updatedAt: new Date().toISOString(),
              };
              HecosStorage.saveEntity(updatedLoc);
            }
          } else if (factions.includes(entityId)) {
            const updatedLoc: HecosEntity = {
              ...ent,
              locationData: {
                ...ld,
                factionEntityIds: factions.filter((id) => id !== entityId),
              },
              updatedAt: new Date().toISOString(),
            };
            HecosStorage.saveEntity(updatedLoc);
          }
        }
      });

      // 3. Sync Quests
      allEntities.forEach((ent) => {
        if (ent.category === 'quest' || ent.questData) {
          const qd = ent.questData || { status: 'not_started', objectives: [] };
          const isTargetQuest = targetQuestIds.has(ent.id);

          if (isTargetQuest) {
            if (qd.organizationEntityId !== entityId) {
              const updatedQuest: HecosEntity = {
                ...ent,
                questData: {
                  ...qd,
                  organizationEntityId: entityId,
                  organization: savedEntity.title,
                },
                updatedAt: new Date().toISOString(),
              };
              HecosStorage.saveEntity(updatedQuest);
            }
          } else if (qd.organizationEntityId === entityId) {
            const updatedQuest: HecosEntity = {
              ...ent,
              questData: {
                ...qd,
                organizationEntityId: undefined,
                organization: undefined,
              },
              updatedAt: new Date().toISOString(),
            };
            HecosStorage.saveEntity(updatedQuest);
          }
        }
      });
    }

    // ─────────────────────────────────────────────────────────────
    // CASE D: QUEST SAVED -> Synchronize Giver & Involved NPCs, Location, Org
    // ─────────────────────────────────────────────────────────────
    if (savedEntity.category === 'quest' || savedEntity.questData) {
      const qd = savedEntity.questData || { status: 'not_started', objectives: [] };
      const giverId = qd.questGiverEntityId;
      const targetNpcIds = new Set<string>(qd.involvedNpcIds || []);
      if (giverId) targetNpcIds.add(giverId);

      const targetLocId = qd.locationEntityId;
      const targetOrgId = qd.organizationEntityId;

      // 1. Sync NPCs
      allEntities.forEach((ent) => {
        if (ent.category === 'npc' || ent.npcData) {
          const nd = ent.npcData || {};
          const currentQuests = nd.quests || [];
          const currentQuestIds = nd.questIds || [];
          const isTarget = targetNpcIds.has(ent.id);
          const hasQuestLink = currentQuests.some((q) => q.questEntityId === entityId) || currentQuestIds.includes(entityId);

          if (isTarget) {
            if (!hasQuestLink) {
              const isGiver = ent.id === giverId;
              const updatedNpc: HecosEntity = {
                ...ent,
                npcData: {
                  ...nd,
                  questIds: Array.from(new Set([...currentQuestIds, entityId])),
                  quests: [
                    ...currentQuests,
                    {
                      id: 'q-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
                      questEntityId: entityId,
                      title: savedEntity.title,
                      roleInQuest: isGiver ? 'Doador da Missão' : 'NPC Envolvido',
                      description: savedEntity.subtitle || '',
                      isSecret: savedEntity.isSecret || savedEntity.visibility === 'gm',
                    },
                  ],
                },
                updatedAt: new Date().toISOString(),
              };
              HecosStorage.saveEntity(updatedNpc);
            }
          } else if (hasQuestLink) {
            const updatedNpc: HecosEntity = {
              ...ent,
              npcData: {
                ...nd,
                questIds: currentQuestIds.filter((id) => id !== entityId),
                quests: currentQuests.filter((q) => q.questEntityId !== entityId),
              },
              updatedAt: new Date().toISOString(),
            };
            HecosStorage.saveEntity(updatedNpc);
          }
        }
      });

      // 2. Sync Location
      allEntities.forEach((ent) => {
        if (ent.category === 'location' || ent.locationData) {
          const ld = ent.locationData || {};
          const currentQuests = ld.questIds || [];
          const isTargetLoc = ent.id === targetLocId;

          if (isTargetLoc) {
            if (!currentQuests.includes(entityId)) {
              const updatedLoc: HecosEntity = {
                ...ent,
                locationData: {
                  ...ld,
                  questIds: [...currentQuests, entityId],
                },
                updatedAt: new Date().toISOString(),
              };
              HecosStorage.saveEntity(updatedLoc);
            }
          } else if (currentQuests.includes(entityId)) {
            const updatedLoc: HecosEntity = {
              ...ent,
              locationData: {
                ...ld,
                questIds: currentQuests.filter((id) => id !== entityId),
              },
              updatedAt: new Date().toISOString(),
            };
            HecosStorage.saveEntity(updatedLoc);
          }
        }
      });

      // 3. Sync Organization
      allEntities.forEach((ent) => {
        if (ent.category === 'organization' || ent.organizationData) {
          const od = ent.organizationData || {};
          const currentQuests = od.questIds || [];
          const isTargetOrg = ent.id === targetOrgId;

          if (isTargetOrg) {
            if (!currentQuests.includes(entityId)) {
              const updatedOrg: HecosEntity = {
                ...ent,
                organizationData: {
                  ...od,
                  questIds: [...currentQuests, entityId],
                },
                updatedAt: new Date().toISOString(),
              };
              HecosStorage.saveEntity(updatedOrg);
            }
          } else if (currentQuests.includes(entityId)) {
            const updatedOrg: HecosEntity = {
              ...ent,
              organizationData: {
                ...od,
                questIds: currentQuests.filter((id) => id !== entityId),
              },
              updatedAt: new Date().toISOString(),
            };
            HecosStorage.saveEntity(updatedOrg);
          }
        }
      });
    }
  }

  /**
   * 6. REMOVE MUTUAL LINKS ON DELETE
   * Cleans up all back-references across the system when an entity is deleted or trashed.
   */
  static cleanMutualLinksOnDelete(deletedEntityId: string): void {
    const allEntities = HecosStorage.getEntities();

    allEntities.forEach((ent) => {
      let changed = false;
      const updated: HecosEntity = { ...ent };

      // 1. If NPC was deleted, clean from Location, Org, Quest
      if (updated.locationData) {
        const ld = { ...updated.locationData };
        if (ld.inhabitantNpcIds?.includes(deletedEntityId)) {
          ld.inhabitantNpcIds = ld.inhabitantNpcIds.filter((id) => id !== deletedEntityId);
          changed = true;
        }
        if (ld.rulerEntityId === deletedEntityId) {
          ld.rulerEntityId = undefined;
          changed = true;
        }
        if (ld.questIds?.includes(deletedEntityId)) {
          ld.questIds = ld.questIds.filter((id) => id !== deletedEntityId);
          changed = true;
        }
        if (ld.factionEntityIds?.includes(deletedEntityId)) {
          ld.factionEntityIds = ld.factionEntityIds.filter((id) => id !== deletedEntityId);
          changed = true;
        }
        if (changed) updated.locationData = ld;
      }

      if (updated.organizationData) {
        const od = { ...updated.organizationData };
        if (od.memberNpcIds?.includes(deletedEntityId)) {
          od.memberNpcIds = od.memberNpcIds.filter((id) => id !== deletedEntityId);
          changed = true;
        }
        if (od.leaderEntityId === deletedEntityId) {
          od.leaderEntityId = undefined;
          changed = true;
        }
        if (od.headquartersLocationId === deletedEntityId) {
          od.headquartersLocationId = undefined;
          changed = true;
        }
        if (od.affiliatedLocationIds?.includes(deletedEntityId)) {
          od.affiliatedLocationIds = od.affiliatedLocationIds.filter((id) => id !== deletedEntityId);
          changed = true;
        }
        if (od.questIds?.includes(deletedEntityId)) {
          od.questIds = od.questIds.filter((id) => id !== deletedEntityId);
          changed = true;
        }
        if (od.alliedOrgIds?.includes(deletedEntityId)) {
          od.alliedOrgIds = od.alliedOrgIds.filter((id) => id !== deletedEntityId);
          changed = true;
        }
        if (od.rivalOrgIds?.includes(deletedEntityId)) {
          od.rivalOrgIds = od.rivalOrgIds.filter((id) => id !== deletedEntityId);
          changed = true;
        }
        if (changed) updated.organizationData = od;
      }

      if (updated.npcData) {
        const nd = { ...updated.npcData };
        if (nd.locationEntityId === deletedEntityId) {
          nd.locationEntityId = undefined;
          changed = true;
        }
        if (nd.linkedLocationIds?.includes(deletedEntityId)) {
          nd.linkedLocationIds = nd.linkedLocationIds.filter((id) => id !== deletedEntityId);
          changed = true;
        }
        if (nd.locationIds?.includes(deletedEntityId)) {
          nd.locationIds = nd.locationIds.filter((id) => id !== deletedEntityId);
          changed = true;
        }
        if (nd.organizationEntityId === deletedEntityId) {
          nd.organizationEntityId = undefined;
          changed = true;
        }
        if (nd.factionEntityId === deletedEntityId) {
          nd.factionEntityId = undefined;
          changed = true;
        }
        if (nd.linkedOrganizationIds?.includes(deletedEntityId)) {
          nd.linkedOrganizationIds = nd.linkedOrganizationIds.filter((id) => id !== deletedEntityId);
          changed = true;
        }
        if (nd.organizationIds?.includes(deletedEntityId)) {
          nd.organizationIds = nd.organizationIds.filter((id) => id !== deletedEntityId);
          changed = true;
        }
        if (nd.questIds?.includes(deletedEntityId)) {
          nd.questIds = nd.questIds.filter((id) => id !== deletedEntityId);
          changed = true;
        }
        if (nd.quests?.some((q) => q.questEntityId === deletedEntityId)) {
          nd.quests = nd.quests.filter((q) => q.questEntityId !== deletedEntityId);
          changed = true;
        }
        if (changed) updated.npcData = nd;
      }

      if (updated.questData) {
        const qd = { ...updated.questData };
        if (qd.questGiverEntityId === deletedEntityId) {
          qd.questGiverEntityId = undefined;
          changed = true;
        }
        if (qd.involvedNpcIds?.includes(deletedEntityId)) {
          qd.involvedNpcIds = qd.involvedNpcIds.filter((id) => id !== deletedEntityId);
          changed = true;
        }
        if (qd.locationEntityId === deletedEntityId) {
          qd.locationEntityId = undefined;
          changed = true;
        }
        if (qd.involvedLocationIds?.includes(deletedEntityId)) {
          qd.involvedLocationIds = qd.involvedLocationIds.filter((id) => id !== deletedEntityId);
          changed = true;
        }
        if (qd.organizationEntityId === deletedEntityId) {
          qd.organizationEntityId = undefined;
          changed = true;
        }
        if (qd.involvedOrgIds?.includes(deletedEntityId)) {
          qd.involvedOrgIds = qd.involvedOrgIds.filter((id) => id !== deletedEntityId);
          changed = true;
        }
        if (changed) updated.questData = qd;
      }

      if (changed) {
        updated.updatedAt = new Date().toISOString();
        HecosStorage.saveEntity(updated);
      }
    });
  }
}
