import { PF2eItemAttributes, ItemCategoryType } from '../types';

/**
 * Returns blank Item data for new item articles
 */
export function getEmptyItemData(): PF2eItemAttributes {
  return {
    level: 1,
    itemType: 'gear',
    subcategories: [],
    price: '1 po',
    bulk: 'L',
    rarity: 'Comum',
    usage: 'empunhado em 1 mão',
    activation: '',
    traits: ['Equipamento'],
    description: '',
    specialProperties: '',
    craftRequirements: '',
    hecosLore: '',
    gmNotes: '',
  };
}

/**
 * Default sample item for Hecos
 */
export function getDefaultItemData(itemName = 'Lâmina de Vidro Estelar'): PF2eItemAttributes {
  return {
    level: 4,
    itemType: 'weapons',
    subcategories: ['Armas Marciais', 'Armas Rúnicas', 'Materiais Especiais (Vidro Estelar, Adamante)'],
    price: '95 po',
    bulk: '1',
    rarity: 'Incomum',
    usage: 'empunhado em 1 mão',
    activation: '[Ação Única] (concentração) Gatilho Rúnico',
    traits: ['Marcial', 'Mágica', 'Acuidade', 'Vidro Estelar'],
    description: 'Uma espada curta forjada com minério condensado de meteoros de Hecos. A lâmina é translúcida e vibra silenciosamente com energia planar.\n\nGolpes desferidos com esta arma causam 1d6 de dano perfurante adicional contra criaturas da escuridão.',
    specialProperties: 'Runa Fundamental: Ataque +1. Runa de Propriedade: Dano Radiante (+1d6).',
    craftRequirements: 'Forja do Lago de Vidro, Artesão Especialista em Vidro Estelar.',
    hecosLore: 'Arma cerimonial concedida aos cavaleiros que guardam as bordas do domo de proteção de Hecos.',
    gmNotes: 'Pode ser aprimorada no nível 8 para receber a runa Maior da Aurora.',
  };
}

/**
 * Serializes PF2e Item attributes into structured HTML
 */
export function serializeItemToHTML(title: string, data: PF2eItemAttributes): string {
  const jsonPayload = JSON.stringify(data);
  const levelBadge = data.level !== undefined ? `Item ${data.level}` : 'Item';

  // Combat details for weapons
  const hasCombatStats = data.damage || data.weaponGroup || data.weaponRange || data.reload;
  // Armor details
  const hasArmorStats = data.armorBonus !== undefined || data.dexCap !== undefined || data.checkPenalty !== undefined || data.speedPenalty || data.strengthReq !== undefined;
  // Durability stats (Hardness, HP, BT)
  const hasDurability = data.hardness !== undefined || data.hp !== undefined || data.brokenThreshold !== undefined;
  // Activation details
  const hasActivation = data.activation || data.activationAction || data.activationTrigger || data.activationRequirement || data.activationFrequency || data.activationEffect;

  return `<!-- JSON_ITEM_DATA: ${jsonPayload} -->
<div class="pf2e-item-container" style="font-family: inherit;">
    <!-- CABEÇALHO DO ITEM PF2E -->
    <header class="item-header" style="border-bottom: 2px solid #2d3a42; padding-bottom: 12px; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 8px;">
            <h2 style="font-size: 1.65rem; font-weight: 900; margin: 0; color: #cca862; display: flex; align-items: center; gap: 8px;">
                <span>${title || '[NOME DO ITEM]'}</span>
            </h2>
            <div style="font-family: monospace; font-weight: bold; color: #b19ecc; font-size: 0.95rem;">
                ${levelBadge}
            </div>
        </div>

        <!-- TRAÇOS E RARIDADE -->
        <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px;">
            <span class="trait-badge rarity-${(data.rarity || 'comum').toLowerCase()}" style="padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: bold; text-transform: uppercase;">
                ${data.rarity || 'Comum'}
            </span>
            ${(data.traits || []).map(t => `<span class="trait-badge" style="padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: bold; text-transform: uppercase;">${t}</span>`).join(' ')}
        </div>
    </header>

    <!-- METADADOS DE PREÇO, VOLUME E USO -->
    <section class="item-details" style="font-size: 0.9rem; line-height: 1.6; margin-bottom: 16px; display: grid; gap: 4px;">
        ${data.price ? `<div><strong>Preço:</strong> ${data.price}</div>` : ''}
        ${data.usage ? `<div><strong>Uso:</strong> ${data.usage}${data.hands ? ` (${data.hands})` : ''}</div>` : (data.hands ? `<div><strong>Mãos:</strong> ${data.hands}</div>` : '')}
        ${data.bulk ? `<div><strong>Volume (Bulk):</strong> ${data.bulk}</div>` : ''}
    </section>

    <!-- ESTATÍSTICAS DE ARMAS (SE HOUVER) -->
    ${hasCombatStats ? `
    <section class="item-weapon-stats" style="background: rgba(204, 168, 98, 0.08); border-left: 3px solid #cca862; padding: 10px 14px; border-radius: 4px; margin-bottom: 16px; font-size: 0.88rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px;">
        ${data.damage ? `<div><strong>Dano:</strong> ${data.damage}${data.damageType ? ` (${data.damageType})` : ''}</div>` : ''}
        ${data.weaponGroup ? `<div><strong>Grupo:</strong> ${data.weaponGroup}</div>` : ''}
        ${data.weaponRange ? `<div><strong>Alcance:</strong> ${data.weaponRange}</div>` : ''}
        ${data.reload ? `<div><strong>Recarga:</strong> ${data.reload}</div>` : ''}
    </section>` : ''}

    <!-- ESTATÍSTICAS DE ARMADURAS & DEFESA (SE HOUVER) -->
    ${hasArmorStats ? `
    <section class="item-armor-stats" style="background: rgba(116, 182, 194, 0.08); border-left: 3px solid #74b6c2; padding: 10px 14px; border-radius: 4px; margin-bottom: 16px; font-size: 0.88rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px;">
        ${data.armorBonus !== undefined ? `<div><strong>Bônus na CA:</strong> +${data.armorBonus}</div>` : ''}
        ${data.dexCap !== undefined ? `<div><strong>Limite Des:</strong> +${data.dexCap}</div>` : ''}
        ${data.checkPenalty !== undefined ? `<div><strong>Penalidade Teste:</strong> ${data.checkPenalty}</div>` : ''}
        ${data.speedPenalty ? `<div><strong>Velocidade:</strong> ${data.speedPenalty}</div>` : ''}
        ${data.strengthReq !== undefined ? `<div><strong>Força Requerida:</strong> ${data.strengthReq}</div>` : ''}
    </section>` : ''}

    <!-- DUREZA & ESTRUTURA (SE HOUVER) -->
    ${hasDurability ? `
    <section class="item-durability" style="background: rgba(161, 161, 170, 0.08); border: 1px solid rgba(161, 161, 170, 0.2); padding: 8px 12px; border-radius: 6px; margin-bottom: 16px; font-size: 0.85rem; display: flex; gap: 16px; flex-wrap: wrap;">
        ${data.hardness !== undefined ? `<div><strong>Dureza:</strong> ${data.hardness}</div>` : ''}
        ${data.hp !== undefined ? `<div><strong>PV:</strong> ${data.hp}</div>` : ''}
        ${data.brokenThreshold !== undefined ? `<div><strong>Limiar de Quebra (LD):</strong> ${data.brokenThreshold}</div>` : ''}
    </section>` : ''}

    <!-- ATIVAÇÃO DO ITEM -->
    ${hasActivation ? `
    <section class="item-activation" style="background: rgba(211, 159, 224, 0.08); border-left: 3px solid #b19ecc; padding: 12px; border-radius: 4px; margin-bottom: 16px; font-size: 0.88rem; display: grid; gap: 6px;">
        <div style="font-weight: bold; color: #b19ecc; display: flex; align-items: center; gap: 6px;">
            <span>Ativação</span>
            ${data.activationAction ? `<span>[${data.activationAction}]</span>` : ''}
            ${data.activation ? `<span>— ${data.activation}</span>` : ''}
        </div>
        ${data.activationFrequency ? `<div><strong>Frequência:</strong> ${data.activationFrequency}</div>` : ''}
        ${data.activationTrigger ? `<div><strong>Gatilho:</strong> ${data.activationTrigger}</div>` : ''}
        ${data.activationRequirement ? `<div><strong>Requisitos:</strong> ${data.activationRequirement}</div>` : ''}
        ${data.activationEffect ? `<div style="margin-top: 4px; line-height: 1.5;"><strong>Efeito:</strong> ${data.activationEffect.replace(/\n/g, '<br/>')}</div>` : ''}
    </section>` : ''}

    <hr style="border: 0; border-top: 1px solid #1f2937; margin: 16px 0;" />

    <!-- DESCRIÇÃO -->
    <section class="item-description" style="font-size: 0.95rem; line-height: 1.7; margin-bottom: 16px;">
        ${data.description ? data.description.replace(/\n/g, '<br/>') : '<em>Sem descrição fornecida.</em>'}
    </section>

    <!-- PROPRIEDADES ESPECIAIS & RUNAS -->
    ${data.specialProperties ? `
    <section class="item-special" style="background: rgba(204, 168, 98, 0.08); border-left: 3px solid #cca862; padding: 12px; border-radius: 4px; margin-bottom: 16px; font-size: 0.88rem;">
        <strong style="color: #cca862;">Propriedades & Efeitos Especiais:</strong>
        <div style="margin-top: 4px;">${data.specialProperties.replace(/\n/g, '<br/>')}</div>
    </section>` : ''}

    <!-- REQUISITOS DE MANUFATURA / CRAFT -->
    ${(data.craftRequirements || data.craftFormula) ? `
    <section class="item-craft" style="background: rgba(116, 182, 194, 0.08); border: 1px solid rgba(116, 182, 194, 0.2); padding: 10px 14px; border-radius: 6px; margin-bottom: 16px; font-size: 0.9rem;">
        ${data.craftFormula ? `<div><strong style="color: #74b6c2;">Fórmula:</strong> ${data.craftFormula}</div>` : ''}
        ${data.craftRequirements ? `<div style="margin-top: ${data.craftFormula ? '4px' : '0'};"><strong style="color: #74b6c2;">Requisitos de Manufatura:</strong> ${data.craftRequirements}</div>` : ''}
    </section>` : ''}

    <!-- LORE DE HECOS -->
    ${data.hecosLore ? `
    <section class="item-lore" style="background: rgba(203, 131, 148, 0.08); border: 1px dashed rgba(203, 131, 148, 0.4); padding: 12px; border-radius: 6px; margin-bottom: 16px; font-size: 0.88rem;">
        <strong style="color: #cb8394;">História & Forja em Hecos:</strong> ${data.hecosLore}
    </section>` : ''}

    <!-- NOTAS DO MESTRE (GM) -->
    ${data.gmNotes ? `
    <section class="item-gm-notes" style="background: rgba(177, 158, 204, 0.1); border: 1px solid rgba(177, 158, 204, 0.3); padding: 12px; border-radius: 6px; font-size: 0.88rem;">
        <strong style="color: #b19ecc;">🔒 Segredo do Mestre:</strong> ${data.gmNotes}
    </section>` : ''}
</div>`;
}

/**
 * Extracts PF2e Item attributes from raw entity content or HTML
 */
export function parseItemFromContent(content: string, defaultItem?: Partial<PF2eItemAttributes>): PF2eItemAttributes {
  const fallback = { ...getEmptyItemData(), ...defaultItem };
  if (!content) return fallback;

  // 1. Try parsing JSON comment tag
  const match = content.match(/<!--\s*JSON_ITEM_DATA:\s*([\s\S]*?)\s*-->/);
  if (match && match[1]) {
    try {
      const parsed = JSON.parse(match[1]);
      return {
        ...fallback,
        ...parsed,
        subcategories: Array.isArray(parsed.subcategories) ? parsed.subcategories : [],
        traits: Array.isArray(parsed.traits) ? parsed.traits : [],
      };
    } catch (e) {
      console.warn("Failed to parse embedded JSON item data:", e);
    }
  }

  // 2. Parse from simple text if no comment
  const clean = content.replace(/<[^>]*>?/gm, '');
  return {
    ...fallback,
    description: clean.slice(0, 500),
  };
}
