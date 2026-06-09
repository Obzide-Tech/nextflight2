import { Image, View, Text, ViewStyle } from 'react-native';
import {
  LOGO_WORDMARK_CENTERED_CREAM,
  LOGO_WORDMARK_LEFT_CREAM,
  LOGO_MONOGRAM_CREAM,
  LOGO_OVAL_CREAM,
  LOGO_SEAL_CREAM,
  LOGO_BADGE_CREAM,
  LOGO_PLANE_CREAM,
  LOGO_WORDMARK_CENTERED_BURGUNDY,
  LOGO_WORDMARK_LEFT_BURGUNDY,
  LOGO_MONOGRAM_BURGUNDY,
  LOGO_OVAL_BURGUNDY,
  LOGO_SEAL_BURGUNDY,
  LOGO_BADGE_BURGUNDY,
  LOGO_PLANE_BURGUNDY,
  LOGO_WORDMARK_CENTERED_GOLD,
  LOGO_WORDMARK_LEFT_GOLD,
  LOGO_MONOGRAM_GOLD,
  LOGO_OVAL_GOLD,
  LOGO_SEAL_GOLD,
  LOGO_BADGE_GOLD,
  LOGO_PLANE_GOLD,
  LOGO_WORDMARK_LEFT_GOLD_GRAD,
  LOGO_MONOGRAM_GOLD_GRAD,
  LOGO_OVAL_GOLD_GRAD,
  LOGO_SEAL_GOLD_GRAD,
  LOGO_BADGE_GOLD_GRAD,
  LOGO_PLANE_GOLD_GRAD,
} from '@/constants/logos';

export type BrandVariant = 'wordmark' | 'monogram' | 'oval' | 'seal' | 'badge' | 'plane' | 'lockup';
export type BrandTheme = 'light' | 'dark' | 'gold' | 'gold-grad';

type Props = {
  variant?: BrandVariant;
  theme?: BrandTheme;
  size?: number;
  style?: ViewStyle;
};

const RATIOS: Record<BrandVariant, number> = {
  wordmark: 2.78,
  lockup: 3.48,
  monogram: 0.64,
  oval: 0.71,
  seal: 1,
  badge: 1.92,
  plane: 1.22,
};

function pickAsset(variant: BrandVariant, theme: BrandTheme) {
  if (theme === 'light') {
    switch (variant) {
      case 'wordmark': return LOGO_WORDMARK_CENTERED_CREAM;
      case 'lockup':   return LOGO_WORDMARK_LEFT_CREAM;
      case 'monogram': return LOGO_MONOGRAM_CREAM;
      case 'oval':     return LOGO_OVAL_CREAM;
      case 'seal':     return LOGO_SEAL_CREAM;
      case 'badge':    return LOGO_BADGE_CREAM;
      case 'plane':    return LOGO_PLANE_CREAM;
    }
  }
  if (theme === 'dark') {
    switch (variant) {
      case 'wordmark': return LOGO_WORDMARK_CENTERED_BURGUNDY;
      case 'lockup':   return LOGO_WORDMARK_LEFT_BURGUNDY;
      case 'monogram': return LOGO_MONOGRAM_BURGUNDY;
      case 'oval':     return LOGO_OVAL_BURGUNDY;
      case 'seal':     return LOGO_SEAL_BURGUNDY;
      case 'badge':    return LOGO_BADGE_BURGUNDY;
      case 'plane':    return LOGO_PLANE_BURGUNDY;
    }
  }
  if (theme === 'gold-grad') {
    switch (variant) {
      case 'wordmark': return LOGO_WORDMARK_LEFT_GOLD_GRAD;
      case 'lockup':   return LOGO_WORDMARK_LEFT_GOLD_GRAD;
      case 'monogram': return LOGO_MONOGRAM_GOLD_GRAD;
      case 'oval':     return LOGO_OVAL_GOLD_GRAD;
      case 'seal':     return LOGO_SEAL_GOLD_GRAD;
      case 'badge':    return LOGO_BADGE_GOLD_GRAD;
      case 'plane':    return LOGO_PLANE_GOLD_GRAD;
    }
  }
  switch (variant) {
    case 'wordmark': return LOGO_WORDMARK_CENTERED_GOLD;
    case 'lockup':   return LOGO_WORDMARK_LEFT_GOLD;
    case 'monogram': return LOGO_MONOGRAM_GOLD;
    case 'oval':     return LOGO_OVAL_GOLD;
    case 'seal':     return LOGO_SEAL_GOLD;
    case 'badge':    return LOGO_BADGE_GOLD;
    case 'plane':    return LOGO_PLANE_GOLD;
    default:         return LOGO_WORDMARK_CENTERED_GOLD;
  }
}

export function BrandMark({ variant = 'wordmark', theme = 'light', size = 48, style }: Props) {
  const source = pickAsset(variant, theme);
  const ratio = RATIOS[variant] ?? 1;

  return (
    <View style={style}>
      <Image source={source} style={{ width: size * ratio, height: size }} resizeMode="contain" />
    </View>
  );
}

export default BrandMark;
