import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ItemVisibility, HecosUser } from '../types';
import { HecosStorage } from '../services/storage';
import { Eye, EyeOff, Users, Check, ChevronDown, ShieldAlert, Globe, UserCheck } from 'lucide-react';

interface VisibilityBadgeMenuProps {
  visibility?: ItemVisibility;
  allowedUserIds?: string[];
  isSecret?: boolean;
  onChange: (newVisibility: ItemVisibility, newAllowedUserIds: string[]) => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
  compact?: boolean;
  className?: string;
  disabled?: boolean;
}

export const VisibilityBadgeMenu: React.FC<VisibilityBadgeMenuProps> = ({
  visibility,
  allowedUserIds = [],
  isSecret,
  onChange,
  title,
  size = 'md',
  compact = false,
  className = '',
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [users, setUsers] = useState<HecosUser[]>(HecosStorage.getUsers());
  const [currentUser, setCurrentUser] = useState<HecosUser | null>(HecosStorage.getCurrentUser());
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubUsers = HecosStorage.subscribeUsersList(setUsers);
    const unsubUser = HecosStorage.subscribeUser(setCurrentUser);
    return () => {
      unsubUsers();
      unsubUser();
    };
  }, []);

  const updatePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const dropdownWidth = 320;
    const isRightClipped = rect.left + dropdownWidth > window.innerWidth - 16;

    let left = isRightClipped ? rect.right - dropdownWidth : rect.left;
    if (left < 16) left = 16;

    let top = rect.bottom + 8;
    // If it falls off bottom of screen, show above button
    if (top + 340 > window.innerHeight && rect.top > 340) {
      top = rect.top - 8 - 340;
    }

    setCoords({ top, left });
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      const handleScroll = () => updatePosition();
      const handleResize = () => updatePosition();
      window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
      window.addEventListener('resize', handleResize, { passive: true });
      return () => {
        window.removeEventListener('scroll', handleScroll, { capture: true });
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isOpen]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        buttonRef.current && !buttonRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const isGM = currentUser?.role === 'gm';

  // Compute effective visibility
  let effectiveVisibility: ItemVisibility = visibility || (isSecret === false ? 'all' : 'gm');
  if (!visibility && isSecret === undefined) {
    effectiveVisibility = 'gm';
  }

  const currentAllowed = allowedUserIds || [];
  const playerUsers = users.filter(u => u.role === 'player');

  const handleSelectVisibility = (newVis: ItemVisibility) => {
    if (newVis === 'custom') {
      // If switching to custom, keep current selection or default to all players
      const initialAllowed = currentAllowed.length > 0 ? currentAllowed : playerUsers.map(u => u.id);
      onChange('custom', initialAllowed);
    } else {
      onChange(newVis, []);
    }
  };

  const handleTogglePlayer = (playerId: string) => {
    const exists = currentAllowed.includes(playerId);
    let updated: string[];
    if (exists) {
      updated = currentAllowed.filter(id => id !== playerId);
    } else {
      updated = [...currentAllowed, playerId];
    }
    onChange('custom', updated);
  };

  const handleSelectAllPlayers = () => {
    onChange('custom', playerUsers.map(u => u.id));
  };

  const handleClearPlayers = () => {
    onChange('custom', []);
  };

  // Render button appearance depending on state (Icon-only, compact & sleek)
  const iconSizeClass = size === 'sm' ? 'w-2.5 h-2.5' : size === 'lg' ? 'w-3.5 h-3.5' : 'w-3 h-3';

  const renderBadgeContent = () => {
    if (effectiveVisibility === 'gm') {
      return (
        <div className="relative flex items-center justify-center">
          <EyeOff className={`${iconSizeClass} text-rose-400 stroke-[2]`} />
          <span className="absolute w-[1.2px] h-3 bg-rose-500 rotate-45 pointer-events-none opacity-90 shadow-[0_0_3px_rgba(244,63,94,0.9)]" />
        </div>
      );
    }

    if (effectiveVisibility === 'all') {
      return (
        <div className="flex items-center justify-center">
          <Eye className={`${iconSizeClass} text-white stroke-[2] drop-shadow-[0_0_3px_rgba(255,255,255,0.4)]`} />
        </div>
      );
    }

    // Custom / Seletivo
    const count = currentAllowed.length;
    return (
      <div className="relative flex items-center justify-center">
        <Eye className={`${iconSizeClass} text-cyan-400 stroke-[2] drop-shadow-[0_0_4px_rgba(6,182,212,0.6)]`} />
        <span
          className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-cyan-400 ring-1 ring-[#120d1c] shadow-[0_0_4px_rgba(6,182,212,0.9)]"
          data-tooltip={`${count} jogador(es) selecionado(s)`}
        />
      </div>
    );
  };

  const getButtonStyle = () => {
    if (effectiveVisibility === 'gm') {
      return 'bg-rose-950/70 hover:bg-rose-900/90 border-rose-600/60 text-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.18)] hover:shadow-[0_0_12px_rgba(244,63,94,0.35)]';
    }
    if (effectiveVisibility === 'all') {
      return 'bg-zinc-800/85 hover:bg-zinc-700/90 border-zinc-500/60 text-white shadow-[0_0_8px_rgba(255,255,255,0.1)] hover:shadow-[0_0_12px_rgba(255,255,255,0.2)]';
    }
    return 'bg-cyan-950/75 hover:bg-cyan-900/90 border-cyan-500/60 text-cyan-200 shadow-[0_0_8px_rgba(6,182,212,0.2)] hover:shadow-[0_0_12px_rgba(6,182,212,0.4)]';
  };

  const getTooltip = () => {
    if (effectiveVisibility === 'gm') {
      return 'Visibilidade: Apenas GM (Privado)';
    }
    if (effectiveVisibility === 'all') {
      return 'Visibilidade: Todos os usuários (Público)';
    }
    const names = playerUsers
      .filter(u => currentAllowed.includes(u.id))
      .map(u => u.name || u.username)
      .join(', ');
    return `Visibilidade: GM + Jogadores (${names || 'Nenhum jogador marcado'})`;
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Trigger Button (Icon Only - Compact Size) */}
      <button
        ref={buttonRef}
        type="button"
        id="visibility-toggle-btn"
        disabled={disabled || !isGM}
        onClick={(e) => {
          e.stopPropagation();
          if (isGM) {
            updatePosition();
            setIsOpen(!isOpen);
          }
        }}
        data-tooltip={isGM ? getTooltip() : 'Nível de Permissão de Visualização'}
        className={`flex items-center justify-center rounded-lg border backdrop-blur-md transition-all ${
          size === 'sm' ? 'p-1' : size === 'lg' ? 'p-2' : 'p-1.5'
        } ${getButtonStyle()} ${!isGM ? 'cursor-default opacity-85' : 'cursor-pointer hover:scale-105 active:scale-95'}`}
      >
        {renderBadgeContent()}
      </button>

      {/* Dropdown Menu (Accessible to GM, Portaled to document.body) */}
      {isOpen && isGM && createPortal(
        <div
          ref={dropdownRef}
          id="visibility-submenu-dropdown"
          className="fixed w-72 sm:w-80 bg-[#120d1c] border border-zinc-700/80 rounded-xl shadow-2xl p-2 text-zinc-200 text-xs backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 z-[99999990]"
          style={{
            top: `${coords.top}px`,
            left: `${coords.left}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-2 border-b border-zinc-800/80 mb-1 flex items-center justify-between">
            <span className="font-semibold text-zinc-300 text-[11px] uppercase tracking-wider">
              Permissão de Visualização
            </span>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30 font-medium">
              GM Control
            </span>
          </div>

          <div className="space-y-1 py-1">
            {/* Option 1: Apenas GM */}
            <button
              type="button"
              id="visibility-opt-gm"
              onClick={() => {
                handleSelectVisibility('gm');
                setIsOpen(false);
              }}
              className={`w-full text-left flex items-start gap-2.5 p-2 rounded-lg transition-all ${
                effectiveVisibility === 'gm'
                  ? 'bg-rose-950/60 border border-rose-500/50 text-rose-200'
                  : 'hover:bg-zinc-800/60 border border-transparent text-zinc-300'
              }`}
            >
              <div className="mt-0.5 p-1 rounded bg-rose-950/80 text-rose-400 border border-rose-800/60">
                <EyeOff className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-xs text-rose-300 flex items-center justify-between">
                  <span>Apenas GM</span>
                  {effectiveVisibility === 'gm' && <Check className="w-3.5 h-3.5 text-rose-400" />}
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5 leading-tight">
                  Visível exclusivamente para o GM com login. Jogadores e visitantes não veem.
                </p>
              </div>
            </button>

            {/* Option 2: Todos */}
            <button
              type="button"
              id="visibility-opt-all"
              onClick={() => {
                handleSelectVisibility('all');
                setIsOpen(false);
              }}
              className={`w-full text-left flex items-start gap-2.5 p-2 rounded-lg transition-all ${
                effectiveVisibility === 'all'
                  ? 'bg-zinc-800/80 border border-zinc-400/50 text-white'
                  : 'hover:bg-zinc-800/60 border border-transparent text-zinc-300'
              }`}
            >
              <div className="mt-0.5 p-1 rounded bg-zinc-800 text-zinc-100 border border-zinc-600">
                <Globe className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-xs text-zinc-100 flex items-center justify-between">
                  <span>Todos (Público)</span>
                  {effectiveVisibility === 'all' && <Check className="w-3.5 h-3.5 text-zinc-200" />}
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5 leading-tight">
                  Visível para todos os visitantes e jogadores, com ou sem login.
                </p>
              </div>
            </button>

            {/* Option 3: Compartilhamento Seletivo */}
            <button
              type="button"
              id="visibility-opt-custom"
              onClick={() => {
                handleSelectVisibility('custom');
              }}
              className={`w-full text-left flex items-start gap-2.5 p-2 rounded-lg transition-all ${
                effectiveVisibility === 'custom'
                  ? 'bg-cyan-950/60 border border-cyan-500/50 text-cyan-200'
                  : 'hover:bg-zinc-800/60 border border-transparent text-zinc-300'
              }`}
            >
              <div className="mt-0.5 p-1 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
                <Users className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-xs text-cyan-300 flex items-center justify-between">
                  <span>Jogadores Específicos</span>
                  {effectiveVisibility === 'custom' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5 leading-tight">
                  Visível para o GM e apenas para os jogadores selecionados.
                </p>
              </div>
            </button>
          </div>

          {/* Player Selection Sub-list when 'custom' is active */}
          {effectiveVisibility === 'custom' && (
            <div className="mt-2 pt-2 border-t border-zinc-800/80">
              <div className="flex items-center justify-between px-2 mb-1.5">
                <span className="text-[11px] font-semibold text-cyan-300 flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-cyan-400" />
                  Jogadores com Acesso:
                </span>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <button
                    type="button"
                    onClick={handleSelectAllPlayers}
                    className="text-cyan-400 hover:text-cyan-300 underline"
                  >
                    Todos
                  </button>
                  <span className="text-zinc-600">|</span>
                  <button
                    type="button"
                    onClick={handleClearPlayers}
                    className="text-zinc-400 hover:text-zinc-300 underline"
                  >
                    Limpar
                  </button>
                </div>
              </div>

              {playerUsers.length === 0 ? (
                <div className="p-3 bg-zinc-900/80 rounded-lg border border-zinc-800 text-center text-zinc-400 text-xs">
                  <p className="mb-1 text-zinc-300 font-medium">Nenhum jogador cadastrado ainda.</p>
                  <p className="text-[10px] text-zinc-500">
                    O GM pode criar jogadores e definir senhas no menu de usuários.
                  </p>
                </div>
              ) : (
                <div className="max-h-40 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                  {playerUsers.map((player) => {
                    const isChecked = currentAllowed.includes(player.id);
                    return (
                      <label
                        key={player.id}
                        className={`flex items-center justify-between p-1.5 rounded-lg border cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-100'
                            : 'bg-zinc-900/40 border-zinc-800/60 text-zinc-400 hover:bg-zinc-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-cyan-900/80 text-cyan-300 border border-cyan-700/50 flex items-center justify-center font-bold text-[10px]">
                            {player.name ? player.name[0].toUpperCase() : 'J'}
                          </div>
                          <div>
                            <div className="font-medium text-xs text-zinc-200">{player.name}</div>
                            <div className="text-[10px] text-zinc-500">@{player.username}</div>
                          </div>
                        </div>

                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleTogglePlayer(player.id)}
                          className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-cyan-500 focus:ring-cyan-500/20"
                        />
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};
