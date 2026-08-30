import { NPCAttributes, NPCDisposition, NPCRarity, NPCSize } from '../types';

export const DISPOSITION_CONFIG: Record<
  NPCDisposition,
  { label: string; bg: string; text: string; border: string; desc: string }
> = {
  helpful: {
    label: 'Prestativo',
    bg: 'bg-emerald-950/80',
    text: 'text-emerald-300',
    border: 'border-emerald-700/60',
    desc: 'Disposto a assumir riscos significativos ou fazer favores custosos pelo grupo.',
  },
  friendly: {
    label: 'Amigável',
    bg: 'bg-teal-950/80',
    text: 'text-teal-300',
    border: 'border-teal-700/60',
    desc: 'Aberto, cortês e inclinado a ajudar em condições razoáveis.',
  },
  indifferent: {
    label: 'Indiferente',
    bg: 'bg-zinc-800/80',
    text: 'text-zinc-300',
    border: 'border-zinc-700/60',
    desc: 'Neutro, focado em seus próprios interesses; precisa de incentivos ou diplomacia.',
  },
  unfriendly: {
    label: 'Desconfiado',
    bg: 'bg-amber-950/80',
    text: 'text-amber-300',
    border: 'border-amber-700/60',
    desc: 'Hostil a conversas casuais, cauteloso e desconfia das intenções do grupo.',
  },
  hostile: {
    label: 'Hostil',
    bg: 'bg-rose-950/80',
    text: 'text-rose-300',
    border: 'border-rose-700/60',
    desc: 'Ativamente adverso, pronto para combater, sabotar ou trair o grupo.',
  },
  unknown: {
    label: 'Incógnito',
    bg: 'bg-purple-950/80',
    text: 'text-purple-300',
    border: 'border-purple-700/60',
    desc: 'Disposição oculta ou volúvel dependente das circunstâncias.',
  },
};

/**
 * Retorna dados em branco para novos artigos de NPC (campos e traits totalmente limpos)
 */
export function getEmptyNPCData(): NPCAttributes {
  return {
    level: undefined,
    rarity: 'Comum',
    size: 'Médio',
    traits: [],
    subcategories: [],
    portraitImage: '',
    tokenImage: '',
    ancestry: '',
    heritage: '',
    occupation: '',
    organization: '',
    location: '',
    pronouns: '',
    age: '',
    gender: '',
    alignment: '',
    disposition: 'indifferent',
    concept: '',
    voiceAndSpeech: '',
    mannerisms: '',
    firstImpression: '',
    motivations: '',
    triggers: '',
    canOffer: '',
    secrets: '',
    relationships: [],
    quests: [],
    rumors: [],
    loot: [],
    currency: {
      po: '',
      pp: '',
      pc: '',
      custom: '',
    },
    gmSecret: '',
    gmPlotHook: '',
    hasCombatStats: false,
    ac: undefined,
    hp: undefined,
    perception: undefined,
    speed: '',
    saves: {
      fortitude: undefined,
      reflex: undefined,
      will: undefined,
    },
    keySkills: '',
    specialAbilities: '',
    sessionLog: [],
    fieldVisibility: {
      gmSecret: true,
      combatStats: false,
      motivations: false,
      rumors: false,
      relationships: false,
      loot: false,
      quests: false,
      sessionLog: false,
    },
  };
}

/**
 * Retorna um exemplo atmosférico pré-preenchido para Hecos
 */
export function getDefaultNPCData(npcName = 'Malthus, O Vidreiro da Obsidiana'): NPCAttributes {
  return {
    level: 4,
    rarity: 'Incomum',
    size: 'Médio',
    traits: ['Humanoide', 'Humano', 'Artesão', 'Alquimia'],
    subcategories: ['Comerciantes', 'Distrito de Quartzo'],
    portraitImage: '',
    tokenImage: '',
    ancestry: 'Humano de Hecos',
    heritage: 'Linhagem das Brumas',
    occupation: 'Mestre Alquimista & Forjador de Prismas',
    organization: 'Irmandade do Vidro Negro',
    location: 'Ateliê dos Reflexos, Distrito Baixo',
    pronouns: 'Ele/Dele',
    age: '52 anos',
    gender: 'Masculino',
    alignment: 'Neutro e Bom',
    disposition: 'friendly',
    concept: 'Um artesão metódico e enigmático fascinado por fragmentos de memórias retidas em vidros vulcânicos.',
    voiceAndSpeech: 'Grave e cadenciada, sussurra ao falar de segredos e faz pausas longas enquanto examina lentes.',
    mannerisms: 'Ajusta constantemente monóculos de graus variados e limpa as mãos com panos impregnados de óleo de lavanda.',
    firstImpression: 'Um cheiro penetrante de enxofre e resina vegetal o precede antes mesmo de emergir da fumaça do ateliê.',
    motivations: 'Encontrar um prisma perfeito capaz de aprisionar a luz do Eclipse antes da próxima lua sangrenta.',
    triggers: 'Fica extremamente irritado com quem quebra vidros descuidadamente ou zomba de lendas ancestrais.',
    canOffer: 'Poções de cura refinadas, lentes de visão no escuro, restauração de gemas e informações sobre rotas subterrâneas.',
    secrets: 'Conhece uma passagem secreta sob a fundição que leva direto às catacumbas da cidade.',
    relationships: [
      {
        id: 'rel-1',
        targetName: 'Valéria Solarium',
        targetCategory: 'npc',
        relationshipType: 'Cliente e Financiadora Secreta',
        attitude: 'friendly',
        notes: 'Envia minérios raros do alto do penhasco em troca de elixires de preservação.',
      },
    ],
    quests: [
      {
        id: 'quest-1',
        title: 'A Areia de Quartzo Roubada',
        roleInQuest: 'Doador da Missão',
        description: 'Contrata os aventureiros para resgatar uma carga de areia de quartzo roubada por ladrões de túmulos.',
        isSecret: false,
      },
    ],
    loot: [
      {
        id: 'loot-1',
        name: 'Monóculo de Quartzo Prismático',
        quantity: 1,
        priceOrValue: '35 PO',
        description: 'Concede +1 de bônus em testes de Percepção para examinar minerais.',
        isEquipped: true,
      },
      {
        id: 'loot-2',
        name: 'Elixir da Visão Noturna Refinado',
        quantity: 2,
        priceOrValue: '12 PO',
        description: 'Frasco de vidro negro com essência bioluminescente.',
        isEquipped: false,
      },
    ],
    currency: {
      po: 42,
      pp: 15,
      pc: 8,
      custom: '3 Fragmentos de Obsidiana Lapidada',
    },
    gmSecret: 'Está secretamente sintetizando um antídoto contra a praga cósmica a pedido de uma seita proibida.',
    gmPlotHook: 'Ele oferece descontos substanciais se os jogadores trouxerem poeira estelar encontrada nas ruínas.',
    rumors: [
      {
        id: 'rumor-1',
        text: 'Dizem que seus espelhos mostram não o reflexo atual, mas a morte de quem os contempla.',
        isTrue: false,
        source: 'Taverna do Corvo Cego',
      },
      {
        id: 'rumor-2',
        text: 'Ele já foi conselheiro arcano de uma casa nobre antes de se isolar no distrito industrial.',
        isTrue: true,
        source: 'Guarda do Portão Norte',
      },
    ],
    hasCombatStats: true,
    ac: 20,
    hp: 55,
    perception: 11,
    speed: '7,5m',
    saves: {
      fortitude: 12,
      reflex: 9,
      will: 13,
    },
    keySkills: 'Manufatura +16, Arcanismo +14, Percepção +11, Diplomacia +10',
    specialAbilities: 'Vidro Explosivo (2 Ações): Arremessa um frasco de estilhaços causando 3d6 de dano perfurante (Reflexos CD 20).',
    sessionLog: [
      {
        id: 'mem-1',
        sessionTitleOrNumber: 'Sessão 03',
        date: '2026-08-15',
        note: 'O grupo comprou 2 elixires de visão noturna e prometeu investigar os barulhos nas catacumbas sob a loja.',
      },
    ],
    fieldVisibility: {
      gmSecret: true,
      combatStats: false,
      motivations: false,
      rumors: false,
      relationships: false,
      loot: false,
      quests: false,
      sessionLog: false,
    },
  };
}

/**
 * Serializa os dados do NPC em Markdown enriquecido
 */
export function serializeNPCToHTML(title: string, data: NPCAttributes, customContent?: string): string {
  if (customContent && customContent.trim()) {
    return customContent;
  }

  const lines: string[] = [];

  lines.push(`### Conceito & Papel`);
  if (data.concept) {
    lines.push(`> *"${data.concept}"*`);
    lines.push('');
  }

  if (data.occupation || data.organization || data.location) {
    lines.push(`- **Ocupação:** ${data.occupation || '—'}`);
    lines.push(`- **Afiliação / Organização:** ${data.organization || '—'}`);
    lines.push(`- **Localização / Residência:** ${data.location || '—'}`);
    lines.push(`- **Ascendência & Herança:** ${data.ancestry || '—'} ${data.heritage ? `(${data.heritage})` : ''}`);
    lines.push('');
  }

  lines.push(`### Guia de Interpretação`);
  if (data.voiceAndSpeech) lines.push(`- **Voz & Tom de Fala:** ${data.voiceAndSpeech}`);
  if (data.mannerisms) lines.push(`- **Gestos & Maneirismos:** ${data.mannerisms}`);
  if (data.firstImpression) lines.push(`- **Primeira Impressão:** ${data.firstImpression}`);
  lines.push('');

  lines.push(`### Interação & Narrativa`);
  if (data.motivations) lines.push(`- **O que busca / Motivação:** ${data.motivations}`);
  if (data.triggers) lines.push(`- **Gatilhos emocionais:** ${data.triggers}`);
  if (data.canOffer) lines.push(`- **Pode oferecer aos aventureiros:** ${data.canOffer}`);
  if (data.secrets) lines.push(`- **Segredos & Conexões:** ${data.secrets}`);
  lines.push('');

  if (data.relationships && data.relationships.length > 0) {
    lines.push(`### Relacionamentos & Vínculos`);
    data.relationships.forEach((rel) => {
      lines.push(`- **${rel.targetName}:** *${rel.relationshipType}* ${rel.notes ? `— ${rel.notes}` : ''}`);
    });
    lines.push('');
  }

  if (data.quests && data.quests.length > 0) {
    lines.push(`### Missões & Ganchos de Aventura`);
    data.quests.forEach((q) => {
      lines.push(`- **${q.title}** (${q.roleInQuest || 'Gancho'}): ${q.description || ''}`);
    });
    lines.push('');
  }

  if (data.rumors && data.rumors.length > 0) {
    lines.push(`### Rumores & Histórias Populares`);
    data.rumors.forEach((r) => {
      lines.push(`- "${r.text}" *(Ouvido em: ${r.source || 'Locais diversos'})*`);
    });
    lines.push('');
  }

  if (data.loot && data.loot.length > 0) {
    lines.push(`### Loot & Inventário`);
    data.loot.forEach((item) => {
      lines.push(`- **${item.name}** ${item.quantity ? `(x${item.quantity})` : ''} ${item.priceOrValue ? `— ${item.priceOrValue}` : ''} ${item.isEquipped ? '[Equipado]' : ''}`);
    });
    lines.push('');
  }

  if (data.gmSecret || data.gmPlotHook) {
    lines.push(`### [CONFIDENCIAL DO MESTRE]`);
    if (data.gmSecret) lines.push(`- **Segredo Oculto:** ${data.gmSecret}`);
    if (data.gmPlotHook) lines.push(`- **Gancho de Aventura:** ${data.gmPlotHook}`);
    lines.push('');
  }

  lines.push(`### Biografia & Detalhes`);
  lines.push(`Escreva o histórico completo e passagens marcantes da vida deste personagem.`);

  return lines.join('\n');
}
