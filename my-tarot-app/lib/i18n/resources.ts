import type { Resource } from 'i18next';

import commonZH from '@/assets/i18n/zh-CN/common.json';
import homeZH from '@/assets/i18n/zh-CN/home.json';
import settingsZH from '@/assets/i18n/zh-CN/settings.json';

import commonEN from '@/assets/i18n/en/common.json';
import homeEN from '@/assets/i18n/en/home.json';
import settingsEN from '@/assets/i18n/en/settings.json';

export const NAMESPACES = ['common', 'home', 'settings'] as const;

export type Namespace = (typeof NAMESPACES)[number];

export const resources: Resource = {
  'zh-CN': {
    common: commonZH,
    home: homeZH,
    settings: settingsZH,
  },
  en: {
    common: commonEN,
    home: homeEN,
    settings: settingsEN,
  },
};

export const AVAILABLE_LOCALES = [
  { code: 'zh-CN', label: '简体中文' },
  { code: 'en', label: 'English' },
] as const;

export type AppLocale = (typeof AVAILABLE_LOCALES)[number]['code'];

export const DEFAULT_LOCALE: AppLocale = 'zh-CN';
