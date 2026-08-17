import React, { useState } from 'react';
import { Dices, Sparkles, X, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DiceRollerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RollLog {
  id: string;
  expression: string;
  dice: number[];
  modifier: number;
  total: number;
  isCritSuccess?: boolean;
  isCritFailure?: boolean;
  time: string;
}

export const DiceRollerModal: React.FC<DiceRollerModalProps> = ({ isOpen, onClose }) => {
  const [modifier, setModifier] = useState(0);
  const [dc, setDc] = useState<number | ''>(15);
  const [logs, setLogs] = useState<RollLog[]>([]);

  const rollDice = (sides: number, count = 1) => {
    const diceResults: number[] = [];
    let sum = 0;
    for (let i = 0; i < count; i++) {
      const roll = Math.floor(Math.random() * sides) + 1;
      diceResults.push(roll);
      sum += roll;
    }

    const total = sum + modifier;
    const isD20 = sides === 20 && count === 1;
    const isCritSuccess = isD20 && diceResults[0] === 20;
    const isCritFailure = isD20 && diceResults[0] === 1;

    const newLog: RollLog = {
      id: 'roll-' + Date.now(),
      expression: `${count}d${sides}${modifier !== 0 ? (modifier > 0 ? `+${modifier}` : modifier) : ''}`,
      dice: diceResults,
      modifier,
      total,
      isCritSuccess,
      isCritFailure,
      time: new Date().toLocaleTimeString('pt-BR')
    };

    setLogs((prev) => [newLog, ...prev.slice(0, 15)]);
  };

  const getDegreeOfSuccess = (total: number, d20Roll?: number) => {
    if (dc === '') return null;
    let base = 'Falha';
    if (total >= dc + 10) base = 'Sucesso Crítico';
    else if (total >= dc) base = 'Sucesso';
    else if (total <= dc - 10) base = 'Falha Crítica';
    else base = 'Falha';

    // Nat 20 steps up, Nat 1 steps down (PF2e rule)
    if (d20Roll === 20) {
      if (base === 'Falha') base = 'Sucesso';
      else if (base === 'Sucesso') base = 'Sucesso Crítico';
    } else if (d20Roll === 1) {
      if (base === 'Sucesso') base = 'Falha';
      else if (base === 'Falha') base = 'Falha Crítica';
    }

    return base;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md bg-[#0e0c15] border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          >
            <div className="flex items-center justify-between px-5 py-4 bg-[#141020] border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-700/60 text-cyan-400">
                  <Dices className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-zinc-100">
                    Rolador de Dados (Pathfinder 2e)
                  </h3>
                  <p className="text-xs text-zinc-400">Sucessos críticos e graus de sucesso automáticos</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Modifier & DC Bar */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 rounded-xl bg-black/60 border border-zinc-800">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">
                    Bônus / Modificador
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setModifier((p) => p - 1)}
                      className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 font-bold"
                    >
                      -
                    </button>
                    <span className="flex-1 text-center font-bold text-cyan-400 text-sm">
                      {modifier >= 0 ? `+${modifier}` : modifier}
                    </span>
                    <button
                      onClick={() => setModifier((p) => p + 1)}
                      className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-black/60 border border-zinc-800">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">
                    CD do Teste (Opcional)
                  </label>
                  <input
                    type="number"
                    value={dc}
                    onChange={(e) => setDc(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Ex: 18"
                    className="w-full text-center py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-100 font-bold text-sm"
                  />
                </div>
              </div>

              {/* Dice Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'd20 (Teste)', sides: 20, count: 1, color: 'bg-cyan-950 text-cyan-300 border-cyan-700' },
                  { label: 'd4', sides: 4, count: 1, color: 'bg-purple-950 text-purple-300 border-purple-700' },
                  { label: 'd6', sides: 6, count: 1, color: 'bg-purple-950 text-purple-300 border-purple-700' },
                  { label: 'd8', sides: 8, count: 1, color: 'bg-purple-950 text-purple-300 border-purple-700' },
                  { label: 'd10', sides: 10, count: 1, color: 'bg-rose-950 text-rose-300 border-rose-700' },
                  { label: 'd12', sides: 12, count: 1, color: 'bg-rose-950 text-rose-300 border-rose-700' },
                  { label: 'd100', sides: 100, count: 1, color: 'bg-amber-950 text-amber-300 border-amber-700' },
                  { label: '2d6', sides: 6, count: 2, color: 'bg-zinc-900 text-zinc-200 border-zinc-700' },
                ].map((d) => (
                  <button
                    key={d.label}
                    onClick={() => rollDice(d.sides, d.count)}
                    className={`py-2 px-1 rounded-xl font-bold text-xs border hover:scale-105 transition-all shadow-md ${d.color}`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              {/* Roll History */}
              <div className="pt-3 border-t border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-zinc-400 uppercase">Histórico de Rolagens</span>
                  {logs.length > 0 && (
                    <button
                      onClick={() => setLogs([])}
                      className="text-[10px] text-zinc-500 hover:text-zinc-300"
                    >
                      Limpar
                    </button>
                  )}
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5">
                  {logs.length === 0 ? (
                    <p className="text-xs text-zinc-500 text-center py-4">Clique nos dados acima para rolar.</p>
                  ) : (
                    logs.map((log) => {
                      const degree = log.dice.length === 1 && log.expression.startsWith('1d20')
                        ? getDegreeOfSuccess(log.total, log.dice[0])
                        : null;

                      return (
                        <div
                          key={log.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-black/60 border border-zinc-800/80 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-zinc-400">{log.expression}</span>
                            <span className="text-[11px] text-zinc-500">[{log.dice.join(', ')}]</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {degree && (
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                  degree.includes('Crítico') && degree.includes('Sucesso')
                                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-600'
                                    : degree === 'Sucesso'
                                    ? 'bg-emerald-950 text-emerald-300'
                                    : degree.includes('Crítica')
                                    ? 'bg-rose-950 text-rose-300 border border-rose-600'
                                    : 'bg-zinc-800 text-zinc-400'
                                }`}
                              >
                                {degree}
                              </span>
                            )}
                            <span className="text-sm font-extrabold text-cyan-400">
                              {log.total}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
