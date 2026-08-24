import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Sparkles, HelpCircle } from 'lucide-react';
import { HecosStorage } from '../services/storage';

interface TraitBadgeProps {
  trait: string;
  className?: string;
  onClick?: () => void;
}

// Common PF2e trait descriptions dictionary
const TRAIT_DESCRIPTIONS: Record<string, { category: string; description: string; color: string }> = {
  'humanoide': { category: 'Ancestralidade e Herança', description: 'Criaturas humanóides com duas pernas, dois braços e postura bípede.', color: 'border-zinc-700 bg-zinc-900 text-zinc-300' },
  'comum': { category: 'Raridade', description: 'Geralmente disponível e acessível para qualquer personagem ou contexto regular.', color: 'border-zinc-700 bg-zinc-900 text-zinc-300' },
  'incomum': { category: 'Raridade', description: 'Algo incomum no mundo de Hecos. Exige acesso narrativo, treinamento específico ou aprovação do Mestre.', color: 'border-amber-700/80 bg-amber-950/80 text-amber-300' },
  'raro': { category: 'Raridade', description: 'Muito difícil de encontrar ou aprender. Requer aprovação expressa do GM ou evento de campanha.', color: 'border-blue-700/80 bg-blue-950/80 text-blue-300' },
  'unico': { category: 'Raridade', description: 'Existe apenas um exemplar deste item, criatura ou efeito em todo o cosmos.', color: 'border-purple-700/80 bg-purple-950/80 text-purple-300' },
  'fogo': { category: 'Dano e Elementos', description: 'Efeitos com este traço manipulam energia térmica, causam dano por fogo ou pertencem ao plano ígneo.', color: 'border-rose-700/80 bg-rose-950/80 text-rose-300' },
  'agua': { category: 'Dano e Elementos', description: 'Manipulação de água, correntes líquidas e pressões aquáticas.', color: 'border-cyan-700/80 bg-cyan-950/80 text-cyan-300' },
  'terra': { category: 'Dano e Elementos', description: 'Magias e poderes ligados a minerais, rochas, areia e solidez telúrica.', color: 'border-amber-800/80 bg-amber-950/70 text-amber-200' },
  'ar': { category: 'Dano e Elementos', description: 'Efeitos de ventania, tempestade, vácuo ou gás.', color: 'border-teal-700/80 bg-teal-950/80 text-teal-300' },
  'luz': { category: 'Dano e Elementos', description: 'Efeitos radiantes capazes de dissipar escuridão mágica de nível igual ou menor.', color: 'border-yellow-600/80 bg-yellow-950/80 text-yellow-300' },
  'escuridao': { category: 'Dano e Elementos', description: 'Efeitos de penumbra profunda, sombras vivas e supressão de luz.', color: 'border-zinc-800 bg-[#0c0914] text-purple-300' },
  'sombrio': { category: 'Dano e Elementos', description: 'Conectado à energia umbrosa e à penumbra perpétua de Hecos.', color: 'border-purple-900/80 bg-purple-950/80 text-purple-200' },
  'mental': { category: 'Magias e Tradições', description: 'Afeta diretamente a mente, psique ou pensamentos do alvo.', color: 'border-indigo-700/80 bg-indigo-950/80 text-indigo-300' },
  'emocao': { category: 'Magias e Tradições', description: 'Altera o estado emocional (medo, coragem, fúria, desespero).', color: 'border-pink-700/80 bg-pink-950/80 text-pink-300' },
  'medo': { category: 'Condições', description: 'Efeito mental que pode impor a condição Amedrontado.', color: 'border-rose-800 bg-rose-950 text-rose-300' },
  'cura': { category: 'Magias e Tradições', description: 'Restaura Pontos de Vida ou remove aflições de criaturas vivas.', color: 'border-emerald-700/80 bg-emerald-950/80 text-emerald-300' },
  'veneno': { category: 'Condições', description: 'Toxinas, peçonhas e miasmas biológicos ou alquímicos.', color: 'border-emerald-800 bg-emerald-950 text-emerald-400' },
  'necromancia': { category: 'Magias e Tradições', description: 'Manipulação das energias da vida, morte e não-vida.', color: 'border-zinc-700 bg-black text-rose-300' },
  'evocacao': { category: 'Magias e Tradições', description: 'Manifestação direta de energia elemental e forças brutas.', color: 'border-rose-700 bg-rose-950/70 text-rose-200' },
  'transmutacao': { category: 'Magias e Tradições', description: 'Alteração da forma física, matéria e propriedades corporais.', color: 'border-cyan-700 bg-cyan-950/70 text-cyan-200' },
  'ilusao': { category: 'Magias e Tradições', description: 'Enganação sensorial visual, sonora ou olfativa.', color: 'border-violet-700 bg-violet-950/70 text-violet-300' },
  'abjuracao': { category: 'Magias e Tradições', description: 'Magias protetivas, barreiras, contrafeitiços e santuários.', color: 'border-blue-700 bg-blue-950/70 text-blue-300' },
  'adivinhacao': { category: 'Magias e Tradições', description: 'Revelação de segredos, presságios e visão remota.', color: 'border-cyan-600 bg-cyan-950 text-cyan-300' },
  'encantamento': { category: 'Magias e Tradições', description: 'Influência mental, comandos imperativos e fascínio.', color: 'border-pink-800 bg-pink-950 text-pink-300' },
  'concentracao': { category: 'Ações e Atividades', description: 'Exige foco contínuo; pode ser interrompido por reações com ataque de oportunidade.', color: 'border-amber-700/80 bg-amber-950/80 text-amber-200' },
  'manipular': { category: 'Ações e Atividades', description: 'Movimento físico com as mãos ou corpo; provoca reações contra manipulação.', color: 'border-orange-700/80 bg-orange-950/80 text-orange-200' },
  'auditivo': { category: 'Extra', description: 'Depende de som ou audição para surtir efeito total.', color: 'border-teal-700 bg-teal-950 text-teal-300' },
  'visual': { category: 'Extra', description: 'Depende da visão da criatura para surtir efeito.', color: 'border-sky-700 bg-sky-950 text-sky-300' },
  'linguistico': { category: 'Extra', description: 'O alvo precisa compreender o idioma falado ou transmitido.', color: 'border-zinc-700 bg-zinc-900 text-zinc-300' },
  'ataque': { category: 'Ações e Atividades', description: 'Conta e sofre a Penalidade por Ataque Múltiplo (PAM).', color: 'border-rose-700 bg-rose-950 text-rose-300' },
  'postura': { category: 'Ações e Atividades', description: 'Assume uma postura marcial ativa até adotar outra ou encerrar combate.', color: 'border-purple-700 bg-purple-950 text-purple-300' },
  'golpe': { category: 'Ações e Atividades', description: 'Ataque básico corpo a corpo ou à distância com arma ou ataque desarmado.', color: 'border-red-800 bg-red-950 text-red-300' },
  'magico': { category: 'Extra', description: 'Possui natureza sobrenatural e pode ser afetado por dissipar magia.', color: 'border-cyan-700 bg-cyan-950 text-cyan-300' },
};

export const TraitBadge: React.FC<TraitBadgeProps> = ({ trait, className = '', onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

  const clean = trait.trim();
  const normalizedKey = clean.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const customTraits = HecosStorage.getCustomTraits();
  const info = customTraits[normalizedKey] || TRAIT_DESCRIPTIONS[normalizedKey] || {
    category: 'Ações e Atividades',
    description: `Traço oficial do Pathfinder 2e aplicado a regras, ações, feitiços, itens ou criaturas.`,
    color: 'border-[#3a2e4c] bg-[#1a1426] text-[#cca862]',
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoverPos({
      x: rect.left,
      y: rect.bottom + 6,
    });
    setIsHovered(true);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick();
    } else {
      window.dispatchEvent(
        new CustomEvent('hecos:open-trait-drawer', {
          detail: { trait: clean }
        })
      );
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsHovered(false)}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold tracking-wide uppercase border transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 ${info.color} ${className}`}
        title={`Ver artigos com o traço ${clean}`}
      >
        <span>{clean}</span>
      </button>

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 3, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            className="fixed z-50 w-72 max-w-[85vw] p-3 rounded-xl bg-[#0d0a17]/95 backdrop-blur-md border border-zinc-700 shadow-2xl text-left pointer-events-none"
            style={{
              top: Math.min(hoverPos.y, window.innerHeight - 150),
              left: Math.min(Math.max(10, hoverPos.x), window.innerWidth - 300),
            }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-1.5 mb-1.5">
              <span className="text-[10px] uppercase font-bold text-cyan-400 font-mono tracking-wider">
                Traço • {info.category}
              </span>
              <span className="text-xs font-bold text-amber-300 font-serif uppercase">
                {clean}
              </span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed font-sans">
              {info.description}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
