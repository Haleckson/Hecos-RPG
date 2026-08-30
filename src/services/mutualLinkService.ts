import { HecosEntity, NPCAttributes, LocationAttributes, OrganizationAttributes, QuestAttributes, ItemVisibility } from '../types';
import { HecosStorage } from './storage';

/**
 * Intelligent Mutual Linking & Entity Relationship Service for Hecos
 * Automatically synchronizes and queries bidirectional relations between:
 * - NPCs
 * - Locations (Locais)
 * - Organizations (Organizações & Facções)
 * - Quests (Missões & Ganchos)
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

    // Direct ID references
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

    // Direct Title reference if no ID matched
    if (npcData.location) {
      const found = allEntities.find(
        (e) => (e.category === 'location' || Boolean(e.locationData)) && this.matchTitle(e.title, npcData.location)
      );
      if (found) locationMap.set(found.id, found);
    }

    // Mutual reverse-lookup: Locations that list this NPC as inhabitant or ruler
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

    // Direct ID references
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

    // Direct Title reference
    const orgName = npcData.organization || npcData.faction;
    if (orgName) {
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

    // From NPC's explicit questIds
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

    // From NPC's explicit quests array
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

    // Mutual reverse-lookup: Quests that list this NPC as questGiver or involvedNpc
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

    // --- Inhabitant / Ruler NPCs ---
    const npcMap = new Map<string, HecosEntity>();

    // From Location's explicit IDs
    if (locData.rulerEntityId) {
      const found = allEntities.find((e) => e.id === locData.rulerEntityId);
      if (found) npcMap.set(found.id, found);
    }
    (locData.inhabitantNpcIds || []).forEach((id) => {
      const found = allEntities.find((e) => e.id === id);
      if (found) npcMap.set(found.id, found);
    });

    // Mutual reverse-lookup: NPCs that list this Location
    allEntities.forEach((ent) => {
      if (ent.category === 'npc' || ent.npcData) {
        const nd = ent.npcData;
        if (
          nd?.locationEntityId === locId ||
          nd?.linkedLocationIds?.includes(locId) ||
          this.matchTitle(nd?.location, locTitle)
        ) {
          npcMap.set(ent.id, ent);
        }
      }
    });

    // --- Organizations Present ---
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

    // Mutual reverse-lookup: Organizations headquartered or affiliated here
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

    // --- Quests in this Location ---
    const questMap = new Map<string, HecosEntity>();

    (locData.questIds || []).forEach((id) => {
      const found = allEntities.find((e) => e.id === id);
      if (found) questMap.set(found.id, found);
    });

    // Mutual reverse-lookup: Quests that take place here
    allEntities.forEach((ent) => {
      if (ent.category === 'quest' || ent.questData) {
        const qd = ent.questData;
        if (
          qd?.locationEntityId === locId ||
          qd?.involvedLocationIds?.includes(locId) ||
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

    // --- Leaders & Members ---
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

    // Mutual reverse-lookup: NPCs affiliated with this org
    allEntities.forEach((ent) => {
      if (ent.category === 'npc' || ent.npcData) {
        const nd = ent.npcData;
        const matchesOrg =
          nd?.organizationEntityId === orgId ||
          nd?.factionEntityId === orgId ||
          nd?.linkedOrganizationIds?.includes(orgId) ||
          this.matchTitle(nd?.organization, orgTitle) ||
          this.matchTitle(nd?.faction, orgTitle);

        if (matchesOrg) {
          if (!leaderMap.has(ent.id)) {
            memberMap.set(ent.id, ent);
          }
        }
      }
    });

    // --- Locations ---
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

    // Reverse lookup: Locations listing this org
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

    // --- Quests ---
    const questMap = new Map<string, HecosEntity>();

    (orgData.questIds || []).forEach((id) => {
      const found = allEntities.find((e) => e.id === id);
      if (found) questMap.set(found.id, found);
    });

    // Reverse lookup: Quests linked to this org
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

    // --- Allies & Rivals ---
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

    // --- Quest Giver & Involved NPCs ---
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

    // Reverse lookup: NPCs whose quests array references this quest
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

    // --- Locations ---
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

    // Reverse lookup: Locations that list this quest
    allEntities.forEach((ent) => {
      if (ent.category === 'location' || ent.locationData) {
        const ld = ent.locationData;
        if (ld?.questIds?.includes(questId)) {
          locMap.set(ent.id, ent);
        }
      }
    });

    // --- Organizations ---
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

    // Reverse lookup: Organizations listing this quest
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
   * 5. SYNC MUTUAL LINKS ON SAVE
   * Synchronizes data back-references when an entity is created or updated.
   */
  static syncMutualLinksOnSave(savedEntity: HecosEntity): void {
    const allEntities = HecosStorage.getEntities();
    const entityId = savedEntity.id;

    // ─────────────────────────────────────────────────────────────
    // CASE A: NPC SAVED -> Update Location, Org, Quests
    // ─────────────────────────────────────────────────────────────
    if (savedEntity.category === 'npc' || savedEntity.npcData) {
      const nd = savedEntity.npcData || {};
      const targetLocIds = [
        nd.locationEntityId,
        ...(nd.linkedLocationIds || []),
        ...(nd.locationIds || []),
      ].filter(Boolean) as string[];

      const targetOrgIds = [
        nd.organizationEntityId,
        nd.factionEntityId,
        ...(nd.linkedOrganizationIds || []),
        ...(nd.organizationIds || []),
      ].filter(Boolean) as string[];

      const questLinks = nd.quests || [];
      const directQuestIds = nd.questIds || [];

      // 1. Sync Locations
      allEntities.forEach((ent) => {
        if (ent.category === 'location' || ent.locationData) {
          const loc = ent.locationData || {};
          const currentInhabitants = loc.inhabitantNpcIds || [];
          const isTargetLoc =
            targetLocIds.includes(ent.id) ||
            (!targetLocIds.length && nd.location && this.matchTitle(ent.title, nd.location));

          if (isTargetLoc) {
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
          }
        }
      });

      // 2. Sync Organizations
      allEntities.forEach((ent) => {
        if (ent.category === 'organization' || ent.organizationData) {
          const org = ent.organizationData || {};
          const currentMembers = org.memberNpcIds || [];
          const isTargetOrg =
            targetOrgIds.includes(ent.id) ||
            (!targetOrgIds.length && (nd.organization || nd.faction) && (this.matchTitle(ent.title, nd.organization) || this.matchTitle(ent.title, nd.faction)));

          if (isTargetOrg) {
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
          }
        }
      });

      // 3. Sync Direct Quest IDs
      directQuestIds.forEach((qId) => {
        const questEnt = allEntities.find((e) => e.id === qId);
        if (questEnt && (questEnt.category === 'quest' || questEnt.questData)) {
          const qd = questEnt.questData || { status: 'not_started', objectives: [] };
          const involved = qd.involvedNpcIds || [];
          if (!involved.includes(entityId)) {
            const updatedQuest: HecosEntity = {
              ...questEnt,
              questData: {
                ...qd,
                involvedNpcIds: [...involved, entityId],
              },
              updatedAt: new Date().toISOString(),
            };
            HecosStorage.saveEntity(updatedQuest);
          }
        }
      });

      // 4. Sync Quests Links
      questLinks.forEach((qLink) => {
        if (qLink.questEntityId) {
          const questEnt = allEntities.find((e) => e.id === qLink.questEntityId);
          if (questEnt && (questEnt.category === 'quest' || questEnt.questData)) {
            const qd = questEnt.questData || { status: 'not_started', objectives: [] };
            const isGiver = qLink.roleInQuest?.toLowerCase().includes('doador') || qLink.roleInQuest?.toLowerCase().includes('giver');
            const involved = qd.involvedNpcIds || [];

            let needsUpdate = false;
            let updatedGiverId = qd.questGiverEntityId;
            let updatedGiverName = qd.questGiver;
            let updatedInvolved = [...involved];

            if (isGiver && qd.questGiverEntityId !== entityId) {
              updatedGiverId = entityId;
              updatedGiverName = savedEntity.title;
              needsUpdate = true;
            } else if (!isGiver && !involved.includes(entityId)) {
              updatedInvolved.push(entityId);
              needsUpdate = true;
            }

            if (needsUpdate) {
              const updatedQuest: HecosEntity = {
                ...questEnt,
                questData: {
                  ...qd,
                  questGiverEntityId: updatedGiverId,
                  questGiver: updatedGiverName,
                  involvedNpcIds: updatedInvolved,
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
    // CASE B: LOCATION SAVED -> Update Inhabitant NPCs, Quests, Orgs
    // ─────────────────────────────────────────────────────────────
    if (savedEntity.category === 'location' || savedEntity.locationData) {
      const ld = savedEntity.locationData || {};
      const inhabitantIds = ld.inhabitantNpcIds || [];
      const questIds = ld.questIds || [];
      const factionIds = ld.factionEntityIds || [];

      // 1. Sync Inhabitant NPCs
      inhabitantIds.forEach((npcId) => {
        const npcEnt = allEntities.find((e) => e.id === npcId);
        if (npcEnt && (npcEnt.category === 'npc' || npcEnt.npcData)) {
          const nd = npcEnt.npcData || {};
          if (nd.locationEntityId !== entityId) {
            const updatedNpc: HecosEntity = {
              ...npcEnt,
              npcData: {
                ...nd,
                locationEntityId: entityId,
                location: savedEntity.title,
              },
              updatedAt: new Date().toISOString(),
            };
            HecosStorage.saveEntity(updatedNpc);
          }
        }
      });

      // 2. Sync Quests
      questIds.forEach((qId) => {
        const qEnt = allEntities.find((e) => e.id === qId);
        if (qEnt && (qEnt.category === 'quest' || qEnt.questData)) {
          const qd = qEnt.questData || { status: 'not_started', objectives: [] };
          if (qd.locationEntityId !== entityId) {
            const updatedQuest: HecosEntity = {
              ...qEnt,
              questData: {
                ...qd,
                locationEntityId: entityId,
                location: savedEntity.title,
              },
              updatedAt: new Date().toISOString(),
            };
            HecosStorage.saveEntity(updatedQuest);
          }
        }
      });

      // 3. Sync Organizations Present
      factionIds.forEach((orgId) => {
        const orgEnt = allEntities.find((e) => e.id === orgId);
        if (orgEnt && (orgEnt.category === 'organization' || orgEnt.organizationData)) {
          const od = orgEnt.organizationData || {};
          const affLocs = od.affiliatedLocationIds || [];
          if (!affLocs.includes(entityId)) {
            const updatedOrg: HecosEntity = {
              ...orgEnt,
              organizationData: {
                ...od,
                affiliatedLocationIds: [...affLocs, entityId],
              },
              updatedAt: new Date().toISOString(),
            };
            HecosStorage.saveEntity(updatedOrg);
          }
        }
      });
    }

    // ─────────────────────────────────────────────────────────────
    // CASE C: ORGANIZATION SAVED -> Update Member NPCs, HQ Location, Quests
    // ─────────────────────────────────────────────────────────────
    if (savedEntity.category === 'organization' || savedEntity.organizationData) {
      const od = savedEntity.organizationData || {};
      const memberIds = od.memberNpcIds || [];
      const leaderId = od.leaderEntityId;
      const hqLocId = od.headquartersLocationId;
      const questIds = od.questIds || [];

      // 1. Sync Member & Leader NPCs
      const allAssociatedNpcIds = Array.from(new Set([...memberIds, ...(leaderId ? [leaderId] : [])]));
      allAssociatedNpcIds.forEach((npcId) => {
        const npcEnt = allEntities.find((e) => e.id === npcId);
        if (npcEnt && (npcEnt.category === 'npc' || npcEnt.npcData)) {
          const nd = npcEnt.npcData || {};
          if (nd.organizationEntityId !== entityId && nd.factionEntityId !== entityId) {
            const updatedNpc: HecosEntity = {
              ...npcEnt,
              npcData: {
                ...nd,
                organizationEntityId: entityId,
                factionEntityId: entityId,
                organization: savedEntity.title,
                faction: savedEntity.title,
              },
              updatedAt: new Date().toISOString(),
            };
            HecosStorage.saveEntity(updatedNpc);
          }
        }
      });

      // 2. Sync Headquarters Location
      if (hqLocId) {
        const locEnt = allEntities.find((e) => e.id === hqLocId);
        if (locEnt && (locEnt.category === 'location' || locEnt.locationData)) {
          const ld = locEnt.locationData || {};
          const factions = ld.factionEntityIds || [];
          if (!factions.includes(entityId)) {
            const updatedLoc: HecosEntity = {
              ...locEnt,
              locationData: {
                ...ld,
                factionEntityIds: [...factions, entityId],
              },
              updatedAt: new Date().toISOString(),
            };
            HecosStorage.saveEntity(updatedLoc);
          }
        }
      }

      // 3. Sync Quests
      questIds.forEach((qId) => {
        const qEnt = allEntities.find((e) => e.id === qId);
        if (qEnt && (qEnt.category === 'quest' || qEnt.questData)) {
          const qd = qEnt.questData || { status: 'not_started', objectives: [] };
          if (qd.organizationEntityId !== entityId) {
            const updatedQuest: HecosEntity = {
              ...qEnt,
              questData: {
                ...qd,
                organizationEntityId: entityId,
                organization: savedEntity.title,
              },
              updatedAt: new Date().toISOString(),
            };
            HecosStorage.saveEntity(updatedQuest);
          }
        }
      });
    }

    // ─────────────────────────────────────────────────────────────
    // CASE D: QUEST SAVED -> Update Quest Giver & Involved NPCs, Location, Org
    // ─────────────────────────────────────────────────────────────
    if (savedEntity.category === 'quest' || savedEntity.questData) {
      const qd = savedEntity.questData || { status: 'not_started', objectives: [] };
      const giverId = qd.questGiverEntityId;
      const involvedNpcIds = qd.involvedNpcIds || [];
      const locId = qd.locationEntityId;
      const orgId = qd.organizationEntityId;

      // 1. Sync Giver NPC
      if (giverId) {
        const giverEnt = allEntities.find((e) => e.id === giverId);
        if (giverEnt && (giverEnt.category === 'npc' || giverEnt.npcData)) {
          const nd = giverEnt.npcData || {};
          const currentQuests = nd.quests || [];
          const hasQuest = currentQuests.some((q) => q.questEntityId === entityId);
          if (!hasQuest) {
            const updatedNpc: HecosEntity = {
              ...giverEnt,
              npcData: {
                ...nd,
                quests: [
                  ...currentQuests,
                  {
                    id: 'q-' + Date.now(),
                    questEntityId: entityId,
                    title: savedEntity.title,
                    roleInQuest: 'Doador da Missão',
                    description: savedEntity.subtitle || '',
                    isSecret: savedEntity.isSecret || savedEntity.visibility === 'gm',
                  },
                ],
              },
              updatedAt: new Date().toISOString(),
            };
            HecosStorage.saveEntity(updatedNpc);
          }
        }
      }

      // 2. Sync Involved NPCs
      involvedNpcIds.forEach((npcId) => {
        if (npcId === giverId) return;
        const npcEnt = allEntities.find((e) => e.id === npcId);
        if (npcEnt && (npcEnt.category === 'npc' || npcEnt.npcData)) {
          const nd = npcEnt.npcData || {};
          const currentQuests = nd.quests || [];
          const hasQuest = currentQuests.some((q) => q.questEntityId === entityId);
          if (!hasQuest) {
            const updatedNpc: HecosEntity = {
              ...npcEnt,
              npcData: {
                ...nd,
                quests: [
                  ...currentQuests,
                  {
                    id: 'q-' + Date.now(),
                    questEntityId: entityId,
                    title: savedEntity.title,
                    roleInQuest: 'NPC Envolvido',
                    description: savedEntity.subtitle || '',
                    isSecret: savedEntity.isSecret || savedEntity.visibility === 'gm',
                  },
                ],
              },
              updatedAt: new Date().toISOString(),
            };
            HecosStorage.saveEntity(updatedNpc);
          }
        }
      });

      // 3. Sync Location
      if (locId) {
        const locEnt = allEntities.find((e) => e.id === locId);
        if (locEnt && (locEnt.category === 'location' || locEnt.locationData)) {
          const ld = locEnt.locationData || {};
          const currentQuests = ld.questIds || [];
          if (!currentQuests.includes(entityId)) {
            const updatedLoc: HecosEntity = {
              ...locEnt,
              locationData: {
                ...ld,
                questIds: [...currentQuests, entityId],
              },
              updatedAt: new Date().toISOString(),
            };
            HecosStorage.saveEntity(updatedLoc);
          }
        }
      }

      // 4. Sync Organization
      if (orgId) {
        const orgEnt = allEntities.find((e) => e.id === orgId);
        if (orgEnt && (orgEnt.category === 'organization' || orgEnt.organizationData)) {
          const od = orgEnt.organizationData || {};
          const currentQuests = od.questIds || [];
          if (!currentQuests.includes(entityId)) {
            const updatedOrg: HecosEntity = {
              ...orgEnt,
              organizationData: {
                ...od,
                questIds: [...currentQuests, entityId],
              },
              updatedAt: new Date().toISOString(),
            };
            HecosStorage.saveEntity(updatedOrg);
          }
        }
      }
    }
  }
}
