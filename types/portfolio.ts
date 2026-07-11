export interface ProjectLink {
  id?: string;
  type: string;
  url: string;
}

export interface TechStack {
  id?: string;
  technologyName: string;
}

export interface Checkpoint {
  id?: string;
  title: string;
  percentage: number;
  isCompleted: boolean;
  orderIndex: number;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  status: "RELEASED" | "IN_PROGRESS" | string;
  imageUrl: string;
  showImage: boolean;
  icon: string;
  projectType: "SOLO" | "TEAM" | "INTERNSHIP" | "ACADEMIC" | "FREELANCE" | "CLIENT" | "PERSONAL" | "OPEN_SOURCE" | "COMMISSION";
  startDate: string;
  endDate: string;
  links: ProjectLink[];
  techStack: TechStack[];
  checkpoints: Checkpoint[];
  userId?: string;
  orderIndex?: number;
  visible?: boolean;
}

export interface Skill {
  id?: string;
  name: string;
  level: number; // 1-100
  visible?: boolean;
}

/* ─── Social Links ──────────────────────────────────── */
export type SocialLinkType =
  | 'GITHUB' | 'LINKEDIN' | 'TWITTER' | 'YOUTUBE' | 'INSTAGRAM'
  | 'X' | 'FIGMA' | 'BEHANCE' | 'DRIBBBLE' | 'TIKTOK'
  | 'WEBSITE' | 'CUSTOM';

export interface SocialLink {
  id: string;
  type: SocialLinkType;
  title: string;
  url: string;
  imageUrl?: string;
  visible?: boolean;
}

export type SocialLinksLayout = 'ICONS' | 'CARD' | 'CREATOR';
export type UserInfoLayout = 'LEFT' | 'RIGHT' | 'CENTER';

/* ─── Account Type ──────────────────────────────────── */
export type AccountType = 'DEVELOPER' | 'DESIGNER' | 'CREATOR' | 'STUDENT';

/* ─── Theme Engine ──────────────────────────────────── */
export type ThemePreset = 'MINIMAL' | 'NEON' | 'GLASSMORPHISM' | 'BRUTALIST' | 'SOFT' | 'MONOCHROME';
export type ThemeTexture = 'NONE' | 'DOTS' | 'GRID' | 'NOISE';
export type ThemeFont = 'SANS' | 'SERIF' | 'MONO' | 'DISPLAY';
export type CardStyle = 'FLAT' | 'GLASSMORPHIC' | 'SOFT_SHADOW' | 'BRUTALIST';
export type ButtonStyle = 'PILL' | 'ROUNDED' | 'SHARP' | 'GHOST';

export interface ThemeColors {
  background: string;
  card: string;
  accent: string;
  text: string;
  descriptionColor: string;
}

export interface Theme {
  preset: ThemePreset;
  colors: ThemeColors;
  texture: ThemeTexture;
  fontFamily?: ThemeFont;
  cardStyle?: CardStyle;
  buttonStyle?: ButtonStyle;
}

export const DEFAULT_THEME: Theme = {
  preset: 'MINIMAL',
  colors: { background: '#ffffff', card: '#f8f9fa', accent: '#6366f1', text: '#0f172a', descriptionColor: '#64748b' },
  texture: 'NONE',
  fontFamily: 'SANS',
  cardStyle: 'FLAT',
  buttonStyle: 'ROUNDED',
};

export const THEME_PRESETS: Record<ThemePreset, { colors: ThemeColors; texture: ThemeTexture }> = {
  MINIMAL: {
    colors: { background: '#ffffff', card: '#f8f9fa', accent: '#6366f1', text: '#0f172a', descriptionColor: '#64748b' },
    texture: 'NONE',
  },
  NEON: {
    colors: { background: '#0a0a0a', card: '#141414', accent: '#22d3ee', text: '#f0f0f0', descriptionColor: '#94a3b8' },
    texture: 'GRID',
  },
  GLASSMORPHISM: {
    colors: { background: '#0f172a', card: 'rgba(255,255,255,0.06)', accent: '#a78bfa', text: '#e2e8f0', descriptionColor: '#94a3b8' },
    texture: 'NONE',
  },
  BRUTALIST: {
    colors: { background: '#fffbe6', card: '#ffffff', accent: '#ff5722', text: '#000000', descriptionColor: '#555555' },
    texture: 'NONE',
  },
  SOFT: {
    colors: { background: '#f9f5ff', card: '#ffffff', accent: '#8b5cf6', text: '#1e1b4b', descriptionColor: '#7c6fa0' },
    texture: 'NONE',
  },
  MONOCHROME: {
    colors: { background: '#f8f8f8', card: '#ffffff', accent: '#374151', text: '#111827', descriptionColor: '#6b7280' },
    texture: 'NONE',
  },
};

export interface Profile {
  fullName: string;
  title: string;
  bio: string;
  location: string;
  username: string;
  avatarUrl: string;
  showAvatar: boolean;
  theme: Theme;
  socialLinks: SocialLink[];
  socialLinksLayout: SocialLinksLayout;
  userInfoLayout: UserInfoLayout;
  showLinks?: boolean;
  showProjects?: boolean;
  showSkills?: boolean;
  portfolioVisibility: "ALL" | "RELEASED_ONLY";
  layoutStyle: "CLASSIC" | "MINIMAL" | "CAROUSEL" | "TIMELINE";
  skills: Skill[];
  userId?: string;
  accountType?: AccountType;
}
