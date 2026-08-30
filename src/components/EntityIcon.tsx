import React from 'react';
import * as LucideIcons from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface EntityIconProps {
  icon?: string;
  iconName?: string;
  category?: string;
  className?: string;
  imageClassName?: string;
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
  iconName: propIconName,
  category,
  className = 'w-5 h-5',
  imageClassName,
  fallbackIcon: Fallback,
  size,
}) => {
  const effectiveIcon = icon || propIconName;
  // If icon is a web URL or data URL (image avatar/token)
  if (effectiveIcon && (effectiveIcon.startsWith('http://') || effectiveIcon.startsWith('https://') || effectiveIcon.startsWith('data:'))) {
    return (
      <img
        src={effectiveIcon}
        alt="Ícone"
        referrerPolicy="no-referrer"
        className={`object-cover ${imageClassName || className}`}
        style={size ? { width: size, height: size } : undefined}
      />
    );
  }

  // Determine Lucide Icon Name
  const finalIconName = effectiveIcon || (category ? CATEGORY_DEFAULT_ICONS[category] : 'BookOpen') || 'BookOpen';

  // Find icon in Lucide collection
  const IconComponent = (LucideIcons as unknown as Record<string, LucideIcon>)[finalIconName] || Fallback || LucideIcons.BookOpen;

  return (
    <IconComponent
      className={className}
      size={size}
    />
  );
};
