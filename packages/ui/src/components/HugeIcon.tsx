import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';

export interface HugeIconProps {
  icon: any;
  size?: number;
  className?: string;
  color?: string;
}

export const HugeIcon: React.FC<HugeIconProps> = ({
  icon,
  size = 20,
  className,
  color = 'currentColor',
}) => {
  return <HugeiconsIcon icon={icon} size={size} color={color} className={className} />;
};
