import React from 'react';
import { Badge } from '@/components/ui/badge';

interface GigTypeBadgeProps {
  gigType: string;
  gigSubtype: string;
}

export function GigTypeBadge({ gigType, gigSubtype }: GigTypeBadgeProps) {
  return (
    <div className="flex gap-2">
      <Badge variant="muted">{gigType.replace(/_/g, ' ')}</Badge>
      <Badge variant="default">{gigSubtype.replace(/_/g, ' ')}</Badge>
    </div>
  );
}
