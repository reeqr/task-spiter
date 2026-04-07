import { theme } from 'antd';
import type { ThemeConfig } from 'antd';

export interface AppTheme {
  id: string;
  name: string;
  emoji: string;
  colorPrimary: string;
  antdTheme: ThemeConfig;
  cssVars: Record<string, string>;
  bodyBg: string;
}

export const animeTheme: AppTheme = {
  id: 'anime',
  name: '二次元粉色',
  emoji: '🌸',
  colorPrimary: '#FF85A2',
  antdTheme: {
    token: {
      colorPrimary: '#FF85A2',
      colorSuccess: '#98D8C8',
      colorWarning: '#FFE48A',
      colorError: '#FF85A2',
      colorInfo: '#87CEEB',
      borderRadius: 12,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial',
    },
    algorithm: theme.defaultAlgorithm,
    components: {
      Button: { borderRadius: 12, controlHeight: 40 },
      Input: { borderRadius: 12, controlHeight: 40 },
      Card: { borderRadiusLG: 16 },
      Modal: { borderRadiusLG: 16 },
    },
  },
  cssVars: {
    '--anime-pink': '#FF85A2',
    '--anime-pink-light': '#FFB6C8',
    '--anime-pink-dark': '#FF9FBB',
    '--anime-purple': '#B19CD9',
    '--anime-purple-light': '#D4C1F5',
    '--anime-blue': '#87CEEB',
    '--anime-yellow': '#FFE48A',
    '--anime-mint': '#98D8C8',
    '--anime-peach': '#FFDAB9',
    '--gradient-primary': 'linear-gradient(135deg, #FF85A2 0%, #FFB6C8 100%)',
    '--gradient-magical': 'linear-gradient(135deg, #FF85A2 0%, #B19CD9 50%, #87CEEB 100%)',
    '--shadow-soft': '0 4px 20px rgba(255, 133, 162, 0.15)',
    '--shadow-medium': '0 6px 24px rgba(177, 156, 217, 0.2)',
    '--text-primary': '#2D2D2D',
    '--text-secondary': '#4A4A4A',
    '--text-muted': '#9B9B9B',
    '--card-border': 'rgba(255, 133, 162, 0.2)',
    '--scrollbar-track': '#FFF5F8',
  },
  bodyBg: 'linear-gradient(135deg, #FFF5F8 0%, #F5F0FF 50%, #F0F8FF 100%)',
};

export const natureTheme: AppTheme = {
  id: 'nature',
  name: '清新自然',
  emoji: '🌿',
  colorPrimary: '#52C41A',
  antdTheme: {
    token: {
      colorPrimary: '#52C41A',
      colorSuccess: '#52C41A',
      colorWarning: '#FAAD14',
      colorError: '#FF7875',
      colorInfo: '#69B1FF',
      borderRadius: 12,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial',
    },
    algorithm: theme.defaultAlgorithm,
    components: {
      Button: { borderRadius: 12, controlHeight: 40 },
      Input: { borderRadius: 12, controlHeight: 40 },
      Card: { borderRadiusLG: 16 },
      Modal: { borderRadiusLG: 16 },
    },
  },
  cssVars: {
    '--anime-pink': '#52C41A',
    '--anime-pink-light': '#95DE64',
    '--anime-pink-dark': '#389E0D',
    '--anime-purple': '#73D13D',
    '--anime-purple-light': '#B7EB8F',
    '--anime-blue': '#69B1FF',
    '--anime-yellow': '#FFD666',
    '--anime-mint': '#5CDBD3',
    '--anime-peach': '#FFD591',
    '--gradient-primary': 'linear-gradient(135deg, #52C41A 0%, #95DE64 100%)',
    '--gradient-magical': 'linear-gradient(135deg, #52C41A 0%, #73D13D 50%, #5CDBD3 100%)',
    '--shadow-soft': '0 4px 20px rgba(82, 196, 26, 0.12)',
    '--shadow-medium': '0 6px 24px rgba(82, 196, 26, 0.18)',
    '--text-primary': '#1D3712',
    '--text-secondary': '#2D5016',
    '--text-muted': '#8BAD76',
    '--card-border': 'rgba(82, 196, 26, 0.2)',
    '--scrollbar-track': '#F6FFED',
  },
  bodyBg: 'linear-gradient(135deg, #F6FFED 0%, #FCFFE6 50%, #F0FFF0 100%)',
};

export const ALL_THEMES: AppTheme[] = [animeTheme, natureTheme];

export const DEFAULT_THEME_ID = 'anime';
