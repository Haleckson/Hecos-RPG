import React from 'react';
import * as LucideIcons from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface EntityIconProps {
  icon?: string;
  category?: string;
  className?: string;
  fallbackIcon?: LucideIcon;
  size?: number;
}

// Map default categories to thematic Lucide icons
const CATEGORY_DEFAULT_ICONS: Record<string, string> = {
  pc: 'User',
  npc: 'Users',
  location: 'MapPin',
  settlement: 'Landmark',
  dungeon: 'Skull',
  faction: 'Flag',
  lore: 'BookOpen',
  rule: 'Scale',
  spell: 'Wand2',
  item: 'Gem',
  weapon: 'Sword',
  armor: 'Shield',
  flora: 'TreePine',
  fauna: 'Footprints',
  peril: 'Skull',
  hazard: 'AlertTriangle',
  ancestry: 'Dna',
  class: 'Crown',
  feat: 'Award',
  quest: 'Target',
  timeline: 'Clock',
  gm_note: 'Lock',
};

export const EntityIcon: React.FC<EntityIconProps> = ({
  icon,
  category,
  className = 'w-5 h-5',
  fallbackIcon: Fallback,
  size,
}) => {
  // If icon is a web URL or data URL (image avatar/token)
  if (icon && (icon.startsWith('http://') || icon.startsWith('https://') || icon.startsWith('data:'))) {
    return (
      <img
        src={icon}
        alt="Ícone"
        referrerPolicy="no-referrer"
        className={`object-cover rounded-lg ${className}`}
        style={size ? { width: size, height: size } : undefined}
      />
    );
  }

  // Determine Lucide Icon Name
  const iconName = icon || (category ? CATEGORY_DEFAULT_ICONS[category] : 'BookOpen') || 'BookOpen';

  // Find icon in Lucide collection
  const IconComponent = (LucideIcons as unknown as Record<string, LucideIcon>)[iconName] || Fallback || LucideIcons.BookOpen;

  return (
    <IconComponent
      className={className}
      size={size}
    />
  );
};
