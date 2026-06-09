/**
 * Wordmark — convenience wrapper around BrandMark.
 * Keeps the original prop API so no call sites need changing.
 */

import { View, ViewStyle } from 'react-native';
import { BrandMark, BrandTheme } from '@/components/BrandMark';

type Props = {
  size?: number;
  color?: string;
  align?: 'left' | 'center' | 'right';
  tagline?: string;
  style?: ViewStyle;
  /**
   * dark       = cream assets on dark/burgundy backgrounds (default)
   * light      = burgundy assets on light/cream backgrounds
   * icon       = monogram only
   * seal-dark  = seal cream on dark bg
   * seal-light = seal burgundy on light bg
   * text       = wordmark (same as dark)
   */
  variant?: 'dark' | 'light' | 'icon' | 'seal-dark' | 'seal-light' | 'text';
};

export function Wordmark({ size = 36, align = 'center', style, variant = 'dark' }: Props) {
  const alignItems =
    align === 'center' ? ('center' as const)
    : align === 'right' ? ('flex-end' as const)
    : ('flex-start' as const);

  // Map Wordmark variant → BrandMark theme
  const theme: BrandTheme =
    variant === 'light' ? 'dark'      // light bg → dark (burgundy) assets
    : 'light';                         // dark bg → light (cream) assets

  if (variant === 'icon') {
    return (
      <View style={[{ alignItems }, style]}>
        <BrandMark variant="monogram" theme="light" size={size} />
      </View>
    );
  }

  if (variant === 'seal-dark') {
    return (
      <View style={[{ alignItems }, style]}>
        <BrandMark variant="seal" theme="light" size={size} />
      </View>
    );
  }

  if (variant === 'seal-light') {
    return (
      <View style={[{ alignItems }, style]}>
        <BrandMark variant="seal" theme="dark" size={size} />
      </View>
    );
  }

  return (
    <View style={[{ alignItems }, style]}>
      <BrandMark variant="wordmark" theme={theme} size={size} />
    </View>
  );
}

export default Wordmark;
