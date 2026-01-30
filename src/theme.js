/**
 * VoltEdge theme – blue accents and shared styles
 */
import { Platform } from 'react-native';

export const ACCENT_BLUE = '#0066cc';
export const ACCENT_BLUE_HOVER = '#0052a3';
export const ACCENT_BLUE_LIGHT = '#e3f2fd';
export const ACCENT_BLUE_BORDER = '#0066cc';

/** Smooth transition for pressable/hover (web only) */
export const transitionStyle =
  Platform.OS === 'web'
    ? {
        transitionProperty: 'opacity, background-color',
        transitionDuration: '0.2s',
        transitionTimingFunction: 'ease',
      }
    : {};

/** Base style for primary buttons (blue) – use with Pressable style function for hover */
export const primaryButtonStyle = {
  backgroundColor: ACCENT_BLUE,
  ...transitionStyle,
};

/** Text alignment for modal/panel content */
export const textAlignLeft = { textAlign: 'left' };
