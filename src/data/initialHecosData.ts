import { HecosEntity, InteractiveMapData, YouTubeAmbianceTrack, GoogleDriveResource } from '../types';

export const INITIAL_ENTITIES: HecosEntity[] = [
  // --- PC (Player Characters) ---
  {
    id: 'pc-kaelith',
    slug: 'kaelith-umbraespada',
    title: 'Kaelith, a Lâmina Eclipsada',
    subtitle: 'PC • Thaumaturge Nível 4 • Umbralis',
    category: 'pc',
    tags: ['PC', 'Thaumaturge', 'Umbralis', 'Eclipse', 'Lâmina'],
    summary: 'Portadora de um medalhão forjado na cinza do Eclipse Menor. Seus reflexos são guiados pela penumbra ciana.',
    coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    icon: 'Sword',
    createdAt: '2026-08-10T10:00:00Z',
    updatedAt: '2026-08-16T14:30:00Z',
    content: `# Kaelith, a Lâmina Eclipsada

**Jogador:** Rodrigo  
**Conceito:** Uma guerreira investigadora ligada às energias malva e ciano de Hecos.  
**Implemento Thaumaturge:** *O Cálice de Sangue Bordô* e *Espelho de Penumbra*.

---

## Biografia & Origem
Nascida sob o reflexo do @salgueiro-do-eclipse, Kaelith foi consagrada no templo de @monolitico-de-khaz. Ela busca respostas sobre a praga da *Pústula Carmesim* que assolou sua aldeia natal.

> "A escuridão de Hecos não é vazia; ela sussurra em tons de ciano e canta em bordô."

### Relações de Campanha
- Guarda profunda lealdade a @npc-vane-o-eremita.
- Desconfia abertamente da facção @org-circulo-carmim.
- Carrega a relíquia @item-relicario-penumbra.

---

## Estatísticas de Combate
- **CA:** 21 | **PV:** 54/54
- **Percepção:** +10 (Visão no Escuro Superior)
- **Ataque Principal:** Florete de Prata Malva +1 (+12, 1d6+4 Perfurante + 2d6 Exploração de Fraqueza)
`,
    statblock: {
      level: 4,
      traits: ['Humanoide', 'Umbralis', 'Médio'],
      alignmentOrTradition: 'Neutro Bom',
      ac: 21,
      fort: 10,
      ref: 11,
      will: 12,
      hp: 54,
      speed: '25 pés',
      abilities: { str: 10, dex: 16, con: 14, int: 12, wis: 14, cha: 18 },
      perception: 10,
      senses: 'Visão no Escuro',
      actions: [
        {
          id: 'act-1',
          name: 'Explorar Fraqueza (Esoteric Lore)',
          cost: 1,
          traits: ['Concentração', 'Esotérico'],
          description: 'Kaelith estuda o alvo contra o DC de conhecimento para aplicar dano de fraqueza mortal a cada golpe.'
        },
        {
          id: 'act-2',
          name: 'Investida Malva',
          cost: 2,
          traits: ['Ataque', 'Transmutação'],
          description: 'Avança até seu deslocamento e desfere um golpe preciso revestido de centelhas ciano.'
        }
      ]
    }
  },

  // --- NPC (Non-Player Characters) ---
  {
    id: 'npc-vane-o-eremita',
    slug: 'vane-o-eremita',
    title: 'Vane, o Observador do Eclipse',
    subtitle: 'NPC • Arquivista Cego • Aliado Enigmático',
    category: 'npc',
    tags: ['NPC', 'Arquivista', 'Eremita', 'Guia', 'Lore'],
    summary: 'Guardião dos tomos proibidos nas margens do Lago Carmesim. Cego para o mundo físico, mas enxerga as correntes arcanas de Hecos.',
    coverImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80',
    icon: 'User',
    createdAt: '2026-08-11T12:00:00Z',
    updatedAt: '2026-08-16T18:00:00Z',
    content: `# Vane, o Observador do Eclipse

> "Não olhe fixamente para a coroa rubra do sol negro. Ela consome a sanidade e devolve apenas presságios de vidro."

## Papel na Campanha
Vane habita uma cabana suspensa nas raízes do @salgueiro-do-eclipse. Ele serve como patrono e historiador para o grupo, fornecendo traduções de pergaminhos ancestrais e avisos sobre o @monstro-devorador-malva.

### Segredos do GM (Mestre)
- Vane já foi o Sumo-Sacerdote do @org-circulo-carmim antes do cisma.
- Ele possui a chave para o portal submarino nas @local-abismo-azul.
`,
    statblock: {
      level: 8,
      traits: ['Humano', 'Ocultista', 'Neutro'],
      ac: 26,
      fort: 14,
      ref: 15,
      will: 19,
      hp: 110,
      speed: '20 pés',
      abilities: { str: 8, dex: 12, con: 14, int: 19, wis: 20, cha: 16 },
      actions: [
        {
          id: 'vane-1',
          name: 'Presságio do Vazio',
          cost: 'reaction',
          traits: ['Adivinhação', 'Oculto'],
          trigger: 'Um aliado a até 30 pés falha em um teste de resistência',
          description: 'Vane sussurra uma correção temporal concedendo +2 de bônus de circunstância à rolagem.'
        }
      ]
    }
  },

  // --- CODEX: CRIATURAS ---
  {
    id: 'monstro-devorador-malva',
    slug: 'devorador-das-raizes-malva',
    title: 'Devorador das Raízes Malva',
    subtitle: 'Criatura 5 • Aberração • Predador do Eclipse',
    category: 'creature',
    subcategory: 'Criaturas',
    tags: ['Criatura', 'Aberração', 'Chefe', 'Malva', 'Eclipse', 'Pathfinder2e'],
    summary: 'Uma massa serpentina de gavinhas luminescentes e mandíbulas quitinosas que habita as águas profundas do lago sob a lua negra.',
    coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    icon: 'Skull',
    createdAt: '2026-08-12T09:00:00Z',
    updatedAt: '2026-08-15T11:20:00Z',
    content: `# Devorador das Raízes Malva (Criatura 5)

As lendas dos pescadores de @local-lago-carmim contam que quando o eclipse atinge seu zênite, o lago ferve com luminescência malva. É o sinal de que o Devorador desperta.

### Táticas de Combate
- **Emboscada Aquática:** Inicia a luta submerso usando @feitico-onda-penumbra para puxar alvos para a água.
- **Constrição Ciana:** Seus tentáculos emitem pulsos de choque ciano que drenam a vitalidade dos aventureiros.

Consulte as regras de ação em @regras-combate-pf2e e os venenos em @flora-lirio-do-abismo.
`,
    statblock: {
      level: 5,
      traits: ['Incomum', 'Médio', 'Aberração', 'Aquático'],
      alignmentOrTradition: 'Caótico e Maligno',
      perception: 13,
      senses: 'Visão no Escuro, Sentido de Vibração 60 pés',
      ac: 22,
      fort: 15,
      ref: 13,
      will: 11,
      hp: 78,
      weaknesses: ['Fogo Bordô 5', 'Dano Positivo/Vitalidade 5'],
      resistances: ['Frio 5', 'Eletricidade 5'],
      speed: '20 pés, Natação 40 pés',
      abilities: { str: 18, dex: 14, con: 16, int: 6, wis: 12, cha: 10 },
      actions: [
        {
          id: 'dev-1',
          name: 'Mordida Abissal',
          cost: 1,
          traits: ['Ataque'],
          description: '+15 corpo a corpo (alcance 10 pés), Dano: 2d8+6 perfurante mais 1d6 negativo.'
        },
        {
          id: 'dev-2',
          name: 'Gavinhas do Eclipse (Agarrar)',
          cost: 1,
          traits: ['Ataque', 'Agarrar'],
          description: '+13 corpo a corpo (ágil, alcance 15 pés), Dano: 1d10+4 concussão e o alvo fica Agarrado (CD 22 para escapar).'
        },
        {
          id: 'dev-3',
          name: 'Descarga de Pulso Ciano',
          cost: 2,
          traits: ['Evocação', 'Eletricidade', 'Arcano'],
          description: 'Libera um raio esférico de 20 pés de raio. Todas as criaturas na área sofrem 4d6 de dano elétrico ciano (Reflexos CD 21 básico).'
        }
      ]
    }
  },

  // --- CODEX: FEITIÇOS ---
  {
    id: 'feitico-onda-penumbra',
    slug: 'onda-de-penumbra-ciana',
    title: 'Onda de Penumbra Ciana',
    subtitle: 'Feitiço 2 • Etérea / Biológica • Manipulação e Luz Fria',
    category: 'spell',
    subcategory: 'Feitiços',
    tags: ['Feitiço', 'Rank 2', 'Etérea', 'Biológica', 'Ciano', 'Controle'],
    summary: 'Uma maré de partículas azuis-cianadas e malva que arrasta inimigos e cega temporariamente os que olham diretamente.',
    icon: 'Sparkles',
    createdAt: '2026-08-12T14:00:00Z',
    updatedAt: '2026-08-15T15:00:00Z',
    content: `# Onda de Penumbra Ciana (Feitiço 2)

**Tradições:** Etérea, Biológica  
**Conjuração:** 2 ações (Gesticular, Verbalizar)  
**Alcance:** Cone de 30 pés  
**Teste de Resistência:** Reflexos básico e Fortitude contra Ofuscação  

---

### Efeito
Você estende as mãos invocando a luz fria do subsolo de @local-lago-carmim. Uma torrente etérea irrompe à sua frente.

- **Dano:** 3d6 de dano de Força gélida.
- **Efeito Secundário:** Inimigos que falharem no teste de Fortitude ficam com a condição **Ofuscado** por 1 rodada devido ao brilho ciano ofuscante.

**Aprimorado (+1):** O dano aumenta em 1d6 e o cone expande em +5 pés.
`,
    spellData: {
      rank: 2,
      traditions: ['Etérea', 'Biológica'],
      castTime: '2 ações',
      range: 'Cone de 30 pés',
      savingThrow: 'Reflexos Básico / Fortitude',
      traits: ['Incomum', 'Evocação', 'Luz Fria', 'Força'],
      description: 'Uma onda de matéria condensada de luz ciana e névoa malva varre a área.',
      heightened: '+1 Rank: +1d6 de dano e +5 pés ao alcance do cone.'
    }
  },

  // --- CODEX: ITENS ---
  {
    id: 'item-relicario-penumbra',
    slug: 'relicario-da-coroa-eclipsada',
    title: 'Relicário da Coroa Eclipsada',
    subtitle: 'Item 6 • Raro • Investido • Mágico',
    category: 'item',
    subcategory: 'Itens',
    tags: ['Item', 'Nível 6', 'Relíquia', 'Bordô', 'Ciano', 'Investido'],
    summary: 'Um amuleto forjado em ouro negro incrustado com um rubi bordô que pulsa em sincronia com o sol negro de Hecos.',
    icon: 'Gem',
    createdAt: '2026-08-13T10:00:00Z',
    updatedAt: '2026-08-16T12:00:00Z',
    content: `# Relicário da Coroa Eclipsada (Item 6)

**Preço:** 240 PO  
**Uso:** Usado como amuleto no peito  
**Volume:** L (Leve)  
**Raridade:** Raro  

---

## Propriedades
Quando investido, as bordas da visão do usuário assumem um suave matiz bordô e ciano.

- **Passivo:** Concede +1 de bônus de item em testes de Percepção contra ilusões e efeitos de escuridão.
- **Ativação (1 Ação - Comando):** Uma vez por dia, o portador pode conjurar @feitico-onda-penumbra como feitiço inato de 2º rank.
- **Reação de Sangue:** Quando o portador sofre dano crítico, o relicário emite uma névoa carmesim que concede ocultação até o final do próximo turno.
`,
    itemData: {
      level: 6,
      price: '240 PO',
      bulk: 'Leve (L)',
      rarity: 'Raro',
      usage: 'Usado amuleto',
      activation: '1 Ação (Comando)',
      traits: ['Mágico', 'Investido', 'Ilusão', 'Oculto']
    }
  },

  // --- CODEX: LOCAIS ---
  {
    id: 'salgueiro-do-eclipse',
    slug: 'salgueiro-do-eclipse',
    title: 'O Salgueiro do Eclipse',
    subtitle: 'Local • Marco Cósmico • Ilha Central do Lago',
    category: 'location',
    subcategory: 'Locais',
    tags: ['Local', 'Salgueiro', 'Eclipse', 'Santuário', 'Lendário', 'Malva'],
    summary: 'Uma colossal árvore ancestral com folhagens em cascata violeta e ciano, enraizada no centro do lago sob o eterno sol negro.',
    coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    icon: 'TreePine',
    createdAt: '2026-08-09T08:00:00Z',
    updatedAt: '2026-08-16T19:00:00Z',
    content: `# O Salgueiro do Eclipse (Aetheris Salix)

O coração espiritual e arcano de **Hecos**. Sob o horizonte rubro e o anel solar eclipsado, o salgueiro banha as águas calmas com suas folhas luminescentes.

---

## Características Notáveis
1. **O Espelho D'Água:** O reflexo sob o salgueiro não mostra o céu, mas sim eventos que ocorreram há séculos ou visões do futuro de Hecos.
2. **Ninhos dos Corvos de Vidro:** Pássaros de penas de cristal azul nidificam nas copas superiores, vigiados por @npc-vane-o-eremita.
3. **As Raízes Submarinas:** Mergulham até as profundezas onde o @monstro-devorador-malva dorme.

### Encontros Prováveis
- Peregrinos do @org-circulo-carmim
- Espíritos de névoa malva
- Guardiões Umbralis
`,
    locationData: {
      settlementType: 'Marco Sagrado / Anomalia Cósmica',
      ruler: 'Espírito da Árvore & Vane',
      population: '1 (Eremita) + Entidades Espirituais',
      dangerLevel: 'Moderado a Letal (durante o Zênite)',
      planeOrRegion: 'Hecos Central • Bacia Carmesim',
      districts: ['Ilha das Raízes', 'Copas Luminescentes', 'Espelho do Vazio']
    }
  },
  {
    id: 'local-lago-carmim',
    slug: 'lago-carmim',
    title: 'O Lago Carmesim',
    subtitle: 'Local • Região Aquática • Espelho Vermelho',
    category: 'location',
    subcategory: 'Locais',
    tags: ['Local', 'Lago', 'Bordô', 'Água', 'Região'],
    summary: 'Uma vasta extensão de água tingida pelo reflexo rubro da coroa solar. Suas margens são ricas em @flora-lirio-do-abismo.',
    icon: 'Compass',
    createdAt: '2026-08-09T09:00:00Z',
    updatedAt: '2026-08-15T10:00:00Z',
    content: `# O Lago Carmesim

O lago circunda @salgueiro-do-eclipse e estende-se até os sopés das montanhas de obsidiana. Suas correntes são mornas e ricas em minérios arcanos.
`
  },

  // --- CODEX: FAUNA & FLORA ---
  {
    id: 'flora-lirio-do-abismo',
    slug: 'lirio-do-abismo',
    title: 'Lírio do Abismo Malva',
    subtitle: 'Flora • Planta Alquímica Rara',
    category: 'flora',
    subcategory: 'Flora',
    tags: ['Flora', 'Alquimia', 'Veneno', 'Cura', 'Malva'],
    summary: 'Flor aquática que desabrocha apenas sob a escuridão do eclipse. Utilizada para poções de visão na penumbra e venenos paralisantes.',
    icon: 'Flower2',
    createdAt: '2026-08-10T11:00:00Z',
    updatedAt: '2026-08-14T08:00:00Z',
    content: `# Lírio do Abismo Malva

Cresce nas margens de @local-lago-carmim. Se colhida com lâmina de prata, retém seu brilho ciano por até 3 luas.
`
  },

  // --- CODEX: ORGANIZAÇÕES ---
  {
    id: 'org-circulo-carmim',
    slug: 'circulo-carmim-do-eclipse',
    title: 'O Círculo Carmim do Eclipse',
    subtitle: 'Organização • Ordem Ocultista & Mística',
    category: 'organization',
    subcategory: 'Organizações',
    tags: ['Organização', 'Culto', 'Facção', 'Bordô', 'Magia'],
    summary: 'Uma ordem de sábios e inquisidores que acreditam que o sol negro é um ovo cósmico prestes a eclodir.',
    icon: 'ShieldAlert',
    createdAt: '2026-08-11T16:00:00Z',
    updatedAt: '2026-08-16T21:00:00Z',
    content: `# O Círculo Carmim do Eclipse

Liderados pela Grã-Matriarca de Véu Escarlate. Eles controlam os acessos terrestres aos monólitos de Hecos.
`
  },

  // --- ANCESTRALIDADES DE HECOS ---
  {
    id: 'ancestry-pirmadin',
    slug: 'pirmadin',
    title: 'Pirmadin',
    subtitle: 'Ancestralidade • Pequeno • Ágil & Instintivo',
    category: 'ancestry',
    subcategory: 'Ancestralidades',
    tags: ['Ancestralidade', 'Pirmadin', 'PF2e', 'Hecos', 'Herança', 'Pequeno'],
    summary: 'Povo ágil e sensorialmente apurado. Possuem olfato impreciso aguçado e afinidade natural com magias primordiais.',
    icon: 'Dna',
    createdAt: '2026-08-08T10:00:00Z',
    updatedAt: '2026-08-17T12:00:00Z',
    content: `# Ancestralidade: Pirmadin

> Povo ágil de passos leves e faro apurado, capazes de farejar perigos e trilhas ocultas antes mesmo de vê-los.

---

## Características Raciais Básicas
- **🩸 Pontos de Vida (HP):** 6 PV
- **📏 Tamanho:** Pequeno (Small)
- **🏃 Deslocamento (Speed):** 30 pés (≈ 9 m)
- **🧠 Atributo Chave:** Destreza (Dex)
- **🗣️ Idiomas:** Primordial, Humani
- **🏷️ Traços:** Humanoide, Pirmadin
- **🛠️ Habilidades Especiais Inatas:** 
  - **Faro Impreciso (Imprecise Scent):** 30 pés (9m).
  - **Truque Mágico:** +1 Cantrip à escolha.

---

### Visão Geral & Filosofia
Os Pirmadin navegam pelos ermos de Hecos guiados por instintos ancestrais aguçados e uma conexão profunda com as forças elementais primordiais.
`,
    statblock: {
      level: 1,
      traits: ['Humanoide', 'Pirmadin', 'Pequeno'],
      hp: 6,
      speed: '30 pés',
      senses: 'Faro Impreciso 30 pés'
    }
  },
  {
    id: 'ancestry-diminuto',
    slug: 'diminuto',
    title: 'Diminuto',
    subtitle: 'Ancestralidade • Pequeno • Anima Espiritual',
    category: 'ancestry',
    subcategory: 'Ancestralidades',
    tags: ['Ancestralidade', 'Diminuto', 'PF2e', 'Hecos', 'Espírito', 'Pequeno'],
    summary: 'Seres de estatura diminuta imbuídos de sabedoria ancestral e forte conexão com a anima espiritual do mundo.',
    icon: 'Dna',
    createdAt: '2026-08-08T10:00:00Z',
    updatedAt: '2026-08-17T12:00:00Z',
    content: `# Ancestralidade: Diminuto

> Pequenos em estatura, mas portadores de uma sabedoria transcendental ligada aos fluxos espirituais de Hecos.

---

## Características Raciais Básicas
- **🩸 Pontos de Vida (HP):** 8 PV
- **📏 Tamanho:** Pequeno (Small)
- **🏃 Deslocamento (Speed):** 25 pés (≈ 7,5 m)
- **🧠 Atributo Chave:** Sabedoria (Wis)
- **🗣️ Idiomas:** Spirit, Humani
- **🏷️ Traços:** Humanoide, Diminuto
- **🛠️ Habilidades Especiais Inatas:** 
  - **Anima Espiritual (Spiritual Anima):** Conexão íntima com a essência e espíritos do ambiente.
  - **Truque Mágico:** +1 Cantrip à escolha.

---

### Visão Geral & Filosofia
Guardam tradições xamânicas e filosóficas sobre a transitoriedade da vida e a eternidade dos espíritos de Hecos.
`,
    statblock: {
      level: 1,
      traits: ['Humanoide', 'Diminuto', 'Pequeno'],
      hp: 8,
      speed: '25 pés',
      senses: 'Percepção Espiritual'
    }
  },
  {
    id: 'ancestry-dhurno',
    slug: 'dhurno',
    title: 'Dhurno',
    subtitle: 'Ancestralidade • Médio • Sensibilidade à Matéria',
    category: 'ancestry',
    subcategory: 'Ancestralidades',
    tags: ['Ancestralidade', 'Dhurno', 'PF2e', 'Hecos', 'Matéria', 'Constituição'],
    summary: 'Povo resiliente e telúrico, dotado da habilidade Materia Feel para pressentir tipos de matéria ligados à sua herança.',
    icon: 'Dna',
    createdAt: '2026-08-08T10:00:00Z',
    updatedAt: '2026-08-17T12:00:00Z',
    content: `# Ancestralidade: Dhurno

> Robustos, resistentes e sintonizados com a substância física do mundo e os minérios do eclipse.

---

## Características Raciais Básicas
- **🩸 Pontos de Vida (HP):** 10 PV
- **📏 Tamanho:** Médio (Medium)
- **🏃 Deslocamento (Speed):** 20 pés (≈ 6 m)
- **🧠 Atributo Chave:** Constituição (Con)
- **🗣️ Idiomas:** Materia, Humani
- **🏷️ Traços:** Humanoide, Dhurno
- **🛠️ Habilidades Especiais Inatas:** 
  - **Sentir Matéria (Materia Feel):** Percebe instintivamente se há ou não um tipo de matéria relacionado à sua herança na área (embora não aponte o local exato apenas com esta habilidade).
  - **Truque Mágico:** +1 Cantrip à escolha.

---

### Visão Geral & Filosofia
Os Dhurno são os mestres da forja, da pedra e da estabilidade material em Hecos, inabaláveis como as montanhas de obsidiana.
`,
    statblock: {
      level: 1,
      traits: ['Humanoide', 'Dhurno', 'Médio'],
      hp: 10,
      speed: '20 pés',
      senses: 'Materia Feel'
    }
  },
  {
    id: 'ancestry-yai',
    slug: 'yai',
    title: 'Yai',
    subtitle: 'Ancestralidade • Médio • Força & Faro de Sangue',
    category: 'ancestry',
    subcategory: 'Ancestralidades',
    tags: ['Ancestralidade', 'Yai', 'PF2e', 'Hecos', 'Sangue', 'Força'],
    summary: 'Guerreiros de presença imponente que possuem faro impreciso psíquico para sangue e grande vigor físico.',
    icon: 'Dna',
    createdAt: '2026-08-08T10:00:00Z',
    updatedAt: '2026-08-17T12:00:00Z',
    content: `# Ancestralidade: Yai

> Dotados de força monumental e uma sensibilidade psíquica ao sangue de seres vivos e feridos.

---

## Características Raciais Básicas
- **🩸 Pontos de Vida (HP):** 10 PV
- **📏 Tamanho:** Médio (Medium)
- **🏃 Deslocamento (Speed):** 25 pés (≈ 7,5 m)
- **🧠 Atributo Chave:** Força (Str)
- **🗣️ Idiomas:** Humani, Psychic Blood
- **🏷️ Traços:** Humanoide, Yai
- **🛠️ Habilidades Especiais Inatas:** 
  - **Faro de Sangue Impreciso (Blood Imprecise Scent):** 30 pés (9m).
  - **Truque Mágico:** +1 Cantrip à escolha.

---

### Visão Geral & Filosofia
Guerreiros honrados e caçadores temíveis cujos sentidos psíquicos reagem à pulsação sanguínea das criaturas ao redor.
`,
    statblock: {
      level: 1,
      traits: ['Humanoide', 'Yai', 'Médio'],
      hp: 10,
      speed: '25 pés',
      senses: 'Faro de Sangue 30 pés'
    }
  },
  {
    id: 'ancestry-humani',
    slug: 'humani',
    title: 'Humani',
    subtitle: 'Ancestralidade • Médio • Intelecto & Magia Inata',
    category: 'ancestry',
    subcategory: 'Ancestralidades',
    tags: ['Ancestralidade', 'Humani', 'PF2e', 'Hecos', 'Arcano', 'Inteligência'],
    summary: 'A linhagem estudiosa e versátil de Hecos, nascida com aptidão mágica inata com acesso a 2 truques arcanos.',
    icon: 'Dna',
    createdAt: '2026-08-08T10:00:00Z',
    updatedAt: '2026-08-17T12:00:00Z',
    content: `# Ancestralidade: Humani

> Estudiosos, adaptáveis e eruditos, os Humani desvendam os mistérios arcaicos de Hecos com engenho e intelecto.

---

## Características Raciais Básicas
- **🩸 Pontos de Vida (HP):** 8 PV
- **📏 Tamanho:** Médio (Medium)
- **🏃 Deslocamento (Speed):** 25 pés (≈ 7,5 m)
- **🧠 Atributo Chave:** Inteligência (Int)
- **🗣️ Idiomas:** Humani, Arcaic
- **🏷️ Traços:** Humanoide, Humani
- **🛠️ Habilidades Especiais Inatas:** 
  - **Magia Inata:** 2 Cantrips de natureza conhecidos por todo Humani.

---

### Visão Geral & Filosofia
Pesquisadores incansáveis dos fenômenos cósmicos e arquitetos das grandes bibliotecas e enclaves de Hecos.
`,
    statblock: {
      level: 1,
      traits: ['Humanoide', 'Humani', 'Médio'],
      hp: 8,
      speed: '25 pés',
      senses: 'Percepção Arcana'
    }
  },
  {
    id: 'ancestry-corine',
    slug: 'corine',
    title: 'Corine',
    subtitle: 'Ancestralidade • Pequeno/Médio • Presença & Elo de Almas',
    category: 'ancestry',
    subcategory: 'Ancestralidades',
    tags: ['Ancestralidade', 'Corine', 'PF2e', 'Hecos', 'Carisma', 'Almas'],
    summary: 'Povo carismático e empático com a capacidade singular de sentir o elo com almas gêmeas a até 1 km de distância.',
    icon: 'Dna',
    createdAt: '2026-08-08T10:00:00Z',
    updatedAt: '2026-08-17T12:00:00Z',
    content: `# Ancestralidade: Corine

> Seres magnéticos de profundo carisma, unidos por fios invisíveis de empatia e ressonância de almas.

---

## Características Raciais Básicas
- **🩸 Pontos de Vida (HP):** 8 PV
- **📏 Tamanho:** Pequeno ou Médio (Small / Medium - à escolha)
- **🏃 Deslocamento (Speed):** 25 pés (≈ 7,5 m)
- **🧠 Atributo Chave:** Carisma (Cha)
- **🗣️ Idiomas:** Humani
- **🏷️ Traços:** Humanoide, Corine
- **🛠️ Habilidades Especiais Inatas:** 
  - **Sentido de Alma Gêmea (Soulmate Sense):** Alcance de 1 km.
  - **Truque Mágico:** +1 Cantrip à escolha.

---

### Visão Geral & Filosofia
Diplomatas natos, artistas e líderes espirituais capazes de formar laços inquebráveis com seus companheiros.
`,
    statblock: {
      level: 1,
      traits: ['Humanoide', 'Corine', 'Médio'],
      hp: 8,
      speed: '25 pés',
      senses: 'Soulmate Sense (1km)'
    }
  },

  // --- CLASSES & ARQUÉTIPOS ---
  {
    id: 'class-caminhante-penumbra',
    slug: 'classe-caminhante-da-penumbra',
    title: 'Caminhante da Penumbra (Arquétipo de Classe)',
    subtitle: 'Arquétipo / Dedicação • Magia & Lâmina',
    category: 'archetype',
    tags: ['Arquétipo', 'Dedicação', 'Ciano', 'Magia', 'Lâmina', 'PF2e'],
    summary: 'Um guerreiro místico que canaliza a luz fria do eclipse em suas armas para cortar através do espaço e da mente.',
    icon: 'Flame',
    createdAt: '2026-08-08T15:00:00Z',
    updatedAt: '2026-08-14T20:00:00Z',
    content: `# Dedicação de Caminhante da Penumbra (Nível 2)

**Pré-requisitos:** Treinado em Ocultismo e Armas Marciais.  
**Benefício:** Seus ataques corpo a corpo podem converter dano físico em dano de Força Fria. Você aprende o truque *Luz de Hecos*.
`
  },

  // --- DIÁRIO DE CAMPANHA ---
  {
    id: 'session-01',
    slug: 'sessao-01-sob-a-coroa-rubra',
    title: 'Sessão 01: Sob a Coroa Rubra',
    subtitle: 'Diário de Campanha • 14 de Agosto, 2026',
    category: 'session',
    tags: ['Sessão', 'Diário', 'Campanha', 'Nível 1', 'Início'],
    summary: 'O grupo chegou às margens do Lago Carmesim e encontrou a cabana de Vane sob o ataque de larvas abissais.',
    icon: 'BookOpen',
    createdAt: '2026-08-14T22:00:00Z',
    updatedAt: '2026-08-15T01:00:00Z',
    content: `# Sessão 01: Sob a Coroa Rubra

**Data no Jogo:** 12º dia do Mês do Eclipse, Ano 412  
**Participantes:** @pc-kaelith, Varek e Lyra  
**XP Concedido:** 120 XP  
**Loot:** 45 PO, 2x @flora-lirio-do-abismo, 1 Pergaminho de @feitico-onda-penumbra

---

## Resumo dos Acontecimentos
O grupo começou sua jornada navegando em um barco de madeira negra pelo @local-lago-carmim. Durante a travessia, as águas começaram a borbulhar com uma luminescência ciana bizarra.

1. **O Ataque nas Raízes:** Duas crias menores do @monstro-devorador-malva saltaram sobre o convés. @pc-kaelith usou sua lâmina para repelir os monstros com precisão.
2. **Chegada ao Salgueiro:** O grupo aportou na ilha onde avistaram @salgueiro-do-eclipse em toda sua magnificência púrpura.
3. **O Encontro com o Eremita:** @npc-vane-o-eremita acolheu os viajantes e revelou uma profecia gravada no @item-relicario-penumbra.
`,
    sessionData: {
      sessionNumber: 1,
      inGameDate: '12º dia do Mês do Eclipse, Ano 412',
      realDate: '2026-08-14',
      attendees: ['Kaelith (Rodrigo)', 'Varek (Lucas)', 'Lyra (Mariana)'],
      xpAwarded: 120,
      lootAwarded: ['45 PO', '2x Lírios do Abismo', 'Pergaminho Arcano'],
      locationsVisited: ['Lago Carmesim', 'O Salgueiro do Eclipse']
    }
  },

  // --- NOTAS DO GM (SECRET) ---
  {
    id: 'gm-note-o-segredo-do-sol',
    slug: 'gm-o-segredo-do-sol-negro',
    title: 'O Verdadeiro Propósito do Sol Negro',
    subtitle: 'Nota Secreta do Mestre • Confidencial',
    category: 'gm_note',
    tags: ['GM', 'Segredo', 'Plot', 'Revelação', 'Final'],
    isSecret: true,
    summary: 'A verdadeira natureza do eclipse em Hecos: não é um fenômeno astronômico, mas uma prisão planar para a divindade adormecida Malakar.',
    icon: 'Lock',
    createdAt: '2026-08-07T12:00:00Z',
    updatedAt: '2026-08-16T22:00:00Z',
    content: `# [CONFIDENCIAL - GM ONLY] O Segredo do Sol Negro

> ⚠️ **Apenas para os olhos do Mestre.**

## A Trama Principal
O eclipse eterno de Hecos não é fruto de magia estelar comum. Há 1.000 anos, os arcanistas do império primordial sacrificaram uma lua inteira para prender a entidade de fogo frio **Malakar** dentro do núcleo solar.

- @salgueiro-do-eclipse atua como o catalisador que drena a energia ciana para manter os grilhões estáveis.
- A facção @org-circulo-carmim está sendo manipulada por cultistas que desejam romper o selo e iniciar o "Despertar Carmesim".
- Se @npc-vane-o-eremita morrer, o selo enfraquecerá em 30% instantaneamente.
`,
    gmNoteData: {
      category: 'plot',
      isRevealedToPlayers: false,
      linkedQuests: ['A Busca pelo Coração de Obsidiana', 'O Resgate de Vane']
    }
  },

  // --- TALENTOS ---
  {
    id: 'feat-olhar-do-eclipse',
    slug: 'talento-olhar-do-eclipse',
    title: 'Olhar do Eclipse (Talento de Ancestralidade)',
    subtitle: 'Talento 1 • Umbralis',
    category: 'feat',
    tags: ['Talento', 'Nível 1', 'Umbralis', 'Visão', 'PF2e'],
    summary: 'Você desenvolve imunidade à cegueira temporária causada por luzes mágicas cianas e +2 contra efeitos visuais.',
    icon: 'Eye',
    createdAt: '2026-08-08T18:00:00Z',
    updatedAt: '2026-08-12T10:00:00Z',
    content: `# Olhar do Eclipse (Talento 1)

Seus olhos adaptaram-se aos contrastes violentos entre a sombra e as auroras de Hecos.
`
  },

  // --- REGRAS ---
  {
    id: 'regras-combate-pf2e',
    slug: 'regras-house-rules-hecos-pf2e',
    title: 'Regras da Casa & Sistema de Ações PF2e em Hecos',
    subtitle: 'Regras • Pathfinder 2e Modificado para Hecos',
    category: 'rule',
    tags: ['Regras', 'Pathfinder2e', 'HouseRules', 'Combate', 'Penumbra'],
    summary: 'Guia rápido de ações (1, 2, 3 ações, reações), pontos de foco do Eclipse e regras de visibilidade na penumbra malva.',
    icon: 'Scroll',
    createdAt: '2026-08-07T08:00:00Z',
    updatedAt: '2026-08-16T15:00:00Z',
    content: `# Regras da Casa: Hecos RPG (Base Pathfinder 2e)

## 1. Sistema de 3 Ações
A cada rodada no seu turno, cada personagem possui **3 Ações (⬡ ⬡ ⬡)** e **1 Reação (⮌)**.

- **Golpear (Strike):** 1 Ação (aplica penalidade por ataque múltiplo: -5 no segundo, -10 no terceiro).
- **Mover-se (Stride):** 1 Ação (desloca-se até sua velocidade).
- **Conjurar Feitiço:** Geralmente 2 Ações (ex: @feitico-onda-penumbra).
- **Erguer Escudo:** 1 Ação (+2 CA de circunstância e habilidade de Bloqueio de Escudo).

---

## 2. Regra da Penumbra Malva (House Rule)
Em Hecos, a escuridão não é simplesmente a ausência de luz.
- Todas as criaturas recebem camuflagem contra ataques a mais de 60 pés a menos que possuam *Visão no Escuro Superior*.
- Feitiços com o traço **Oculto** ou **Frio** causam +1 ponto de dano por dado durante o Zênite do Eclipse.
`
  },

  // --- TIMELINE EVENT ---
  {
    id: 'timeline-o-grande-eclipse',
    slug: 'timeline-o-grande-eclipse-primordial',
    title: 'O Grande Eclipse Primordial',
    subtitle: 'Ano 0 • O Surgimento de Hecos',
    category: 'timeline',
    tags: ['Timeline', 'Ano 0', 'História', 'Cosmologia', 'Evento Maior'],
    summary: 'O dia em que o sol dourado foi obscurecido para sempre pelo orbe negro com coroa rubra, transformando o mundo em Hecos.',
    icon: 'Calendar',
    createdAt: '2026-08-06T10:00:00Z',
    updatedAt: '2026-08-15T09:00:00Z',
    content: `# O Grande Eclipse Primordial (Ano 0)

Segundo os registros mais antigos preservados por @npc-vane-o-eremita, o mundo anterior pereceu quando o céu sangrou em tons de bordô e ciano.

Naquele dia, brotou @salgueiro-do-eclipse no meio das águas ferventes, ancorando a realidade de **Hecos**.
`,
    timelineData: {
      era: 'Era Primordial',
      year: 'Ano 0',
      order: 1,
      importance: 'cosmic',
      relatedEntityIds: ['salgueiro-do-eclipse', 'npc-vane-o-eremita']
    }
  },
  {
    id: 'timeline-a-fundacao-do-circulo',
    slug: 'timeline-fundacao-circulo-carmim',
    title: 'A Fundação do Círculo Carmim',
    subtitle: 'Ano 240 • O Surgimento dos Cultos de Sangue',
    category: 'timeline',
    tags: ['Timeline', 'Ano 240', 'História', 'Culto'],
    summary: 'Os arcanistas dissidentes criam @org-circulo-carmim para tentar decodificar a linguagem da coroa solar.',
    icon: 'Calendar',
    createdAt: '2026-08-06T12:00:00Z',
    updatedAt: '2026-08-14T11:00:00Z',
    content: `# A Fundação do Círculo Carmim (Ano 240)

O cisma que dividiu os guardiões do saber e deu origem à principal ordem mística de @local-lago-carmim.
`,
    timelineData: {
      era: 'Era do Florescer Malva',
      year: 'Ano 240',
      order: 2,
      importance: 'major',
      relatedEntityIds: ['org-circulo-carmim']
    }
  },
  {
    id: 'timeline-o-despertar-recente',
    slug: 'timeline-o-despertar-das-profundezas',
    title: 'O Primeiro Ataque do Devorador',
    subtitle: 'Ano 410 • Presságios Sombrios',
    category: 'timeline',
    tags: ['Timeline', 'Ano 410', 'História', 'Monstro'],
    summary: 'O @monstro-devorador-malva acorda pela primeira vez em séculos e ataca barcos perto do salgueiro.',
    icon: 'Calendar',
    createdAt: '2026-08-06T14:00:00Z',
    updatedAt: '2026-08-15T16:00:00Z',
    content: `# O Ataque das Profundezas (Ano 410)

Dois anos antes do início da campanha de @pc-kaelith.
`,
    timelineData: {
      era: 'Era Atual (A Penumbra Inquieta)',
      year: 'Ano 410',
      order: 3,
      importance: 'minor',
      relatedEntityIds: ['monstro-devorador-malva', 'salgueiro-do-eclipse']
    }
  }
];

export const INITIAL_MAPS: InteractiveMapData[] = [
  {
    id: 'map-hecos-central',
    title: 'Hecos: A Bacia do Eclipse & Lago Carmesim',
    description: 'Mapa detalhado da região central de Hecos onde o sol negro se reflete nas águas bordô e o salgueiro ancestral domina o horizonte.',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
    pins: [
      {
        id: 'pin-1',
        x: 48,
        y: 45,
        title: 'O Salgueiro do Eclipse',
        category: 'landmark',
        description: 'A colossal árvore ancestral com folhagens em cascata violeta e ciano.',
        linkedEntityId: 'salgueiro-do-eclipse',
        dangerLevel: 'Moderado',
        color: '#b877db'
      },
      {
        id: 'pin-2',
        x: 62,
        y: 52,
        title: 'Cabana do Observador (Vane)',
        category: 'poi',
        description: 'O eremitério de Vane suspenso nas raízes aéreas.',
        linkedEntityId: 'npc-vane-o-eremita',
        dangerLevel: 'Seguro',
        color: '#00f0ff'
      },
      {
        id: 'pin-3',
        x: 35,
        y: 65,
        title: 'Fossa das Gavinhas Malva',
        category: 'dungeon',
        description: 'Covil submerso onde o Devorador das Raízes habita.',
        linkedEntityId: 'monstro-devorador-malva',
        dangerLevel: 'Mortal',
        color: '#be123c'
      },
      {
        id: 'pin-4',
        x: 75,
        y: 28,
        title: 'Fortaleza do Círculo Carmim',
        category: 'city',
        description: 'Quartel-general e templo do culto que estuda a coroa do eclipse.',
        linkedEntityId: 'org-circulo-carmim',
        dangerLevel: 'Perigoso',
        color: '#be123c'
      },
      {
        id: 'pin-5',
        x: 20,
        y: 35,
        title: 'Campos de Lírios do Abismo',
        category: 'nature',
        description: 'Bancos de flores medicinais e venenosas sob a névoa fria.',
        linkedEntityId: 'flora-lirio-do-abismo',
        dangerLevel: 'Moderado',
        color: '#b877db'
      }
    ]
  }
];

export const INITIAL_YOUTUBE_TRACKS: YouTubeAmbianceTrack[] = [
  {
    id: 'track-1',
    title: 'Hecos: Noite do Eclipse & Lago Carmesim (Ambiance)',
    videoId: '0m4sT68tBvo',
    url: 'https://www.youtube.com/watch?v=0m4sT68tBvo',
    category: 'ambient',
    description: 'Som ambiente misterioso de ventos noturnos, água mística e sintetizadores etéreos.'
  },
  {
    id: 'track-2',
    title: 'Combate Sob a Coroa Rubra (Pathfinder 2e Battle)',
    videoId: 'kJQP7kiw5Fk',
    url: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
    category: 'combat',
    description: 'Percussão épica com cordas dramáticas para combates perigosos.'
  },
  {
    id: 'track-3',
    title: 'Taverna das Sombras & Eremitas (Descanso & Roleplay)',
    videoId: 'jfKfPfyJRdk',
    url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
    category: 'tavern',
    description: 'Música acústica melancólica para momentos de diálogo e planejamento.'
  },
  {
    id: 'track-4',
    title: 'Presença Abissal do Devorador (Horror Cósmico)',
    videoId: 'dQw4w9WgXcQ',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    category: 'eerie',
    description: 'Ecos subterrâneos e pulsações arcanas de tensão.'
  }
];

export const INITIAL_DRIVE_RESOURCES: GoogleDriveResource[] = [
  {
    id: 'drive-1',
    title: 'Pasta Raiz: Hecos RPG - Campanha & Fichas',
    url: 'https://drive.google.com/drive/folders/hecos-rpg-campaign',
    type: 'folder',
    description: 'Diretório no Google Drive contendo PDFs do Pathfinder 2e Remaster, fichas e mapas de batalha.'
  },
  {
    id: 'drive-2',
    title: 'Ficha de Personagem Oficial (Pathfinder 2e)',
    url: 'https://docs.google.com/spreadsheets/d/1hecos-character-sheet',
    type: 'sheet',
    description: 'Planilha sincronizada para cálculos automáticos de atributos e perícias.'
  },
  {
    id: 'drive-3',
    title: 'Grimório de Feitiços de Hecos (PDF)',
    url: 'https://docs.google.com/document/d/1hecos-spells-lore',
    type: 'document',
    description: 'Documento com descrições ampliadas dos feitiços e rituais arcanos.'
  }
];
