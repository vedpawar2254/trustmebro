import { GigType, GigSubtype } from '@/types';

interface GigTypeBadgeProps {
  gigType: GigType;
  gigSubtype: GigSubtype;
}

const getGigTypeColor = (type: GigType) => {
  switch (type) {
    case 'SOFTWARE':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'COPYWRITING':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'DATA_ENTRY':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'TRANSLATION':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const formatSubtype = (subtype: string) => {
  return subtype
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
};

export function GigTypeBadge({ gigType, gigSubtype }: GigTypeBadgeProps) {
  return (
    <div className="flex flex-col gap-1 items-end">
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getGigTypeColor(gigType)}`}>
        {gigType}
      </span>
      <span className="text-xs text-gray-500">
        {formatSubtype(gigSubtype)}
      </span>
    </div>
  );
}
