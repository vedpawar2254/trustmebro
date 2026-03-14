'use client';

import { GigType, GigSubtype } from '@/types';

interface GigTypeBadgeProps {
  gigType: GigType;
  gigSubtype: GigSubtype;
}

const TYPE_MAP: Record<GigType, { class: string; label: string }> = {
  SOFTWARE: { class: 'blue', label: 'Software' },
  COPYWRITING: { class: 'warn', label: 'Writing' },
  DATA_ENTRY: { class: 'success', label: 'Data' },
  TRANSLATION: { class: 'purple', label: 'Translation' },
};

const SUBTYPE_FORMATS: Record<string, string> = {
  // Software
  WEB_DEVELOPMENT: 'Web Dev',
  MOBILE_DEVELOPMENT: 'Mobile Dev',
  DESKTOP_APPLICATIONS: 'Desktop',
  APIS_INTEGRATIONS: 'APIs',
  DATABASE_DESIGN: 'Database',
  DEVOPS_INFRASTRUCTURE: 'DevOps',
  // Copywriting
  BLOG_POSTS: 'Articles',
  WEBSITE_COPY: 'Site Copy',
  EMAIL_MARKETING: 'Email',
  SOCIAL_MEDIA: 'Social',
  PRODUCT_DESCRIPTIONS: 'Products',
  SALES_MARKETING: 'Sales',
  // Data Entry
  FORM_DIGITIZATION: 'Forms',
  DATABASE_POPULATION: 'Database',
  DATA_CLEANING: 'Cleaning',
  SPREADSHEET_CREATION: 'Sheets',
  DOCUMENT_TRANSCRIPTION: 'Transcription',
  DATA_EXTRACTION: 'Extraction',
  // Translation
  WEBSITE_LOCALIZATION: 'Localization',
  DOCUMENT_TRANSLATION: 'Doc Trans',
  SUBTITLE_TRANSLATION: 'Subtitles',
  MARKETING_TRANSLATION: 'Marketing',
  SOFTWARE_UI_TRANSLATION: 'UI Trans',
  AUDIO_VIDEO_TRANSLATION: 'AV Trans',
};

export function GigTypeBadge({ gigType, gigSubtype }: GigTypeBadgeProps) {
  const typeInfo = TYPE_MAP[gigType] || { class: 'info', label: gigType };
  const subtypeLabel = SUBTYPE_FORMATS[gigSubtype] || gigSubtype.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');

  return (
    <div className="flex flex-col items-end gap-1.5">
      <span className={`dash-badge ${typeInfo.class}`}>
        {typeInfo.label}
      </span>
      <span className="text-[10px] font-bold uppercase tracking-wider text-[#4a3866] px-1 whitespace-nowrap">
        {subtypeLabel}
      </span>
    </div>
  );
}
