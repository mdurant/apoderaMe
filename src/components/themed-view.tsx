import { View, type ViewProps } from 'react-native';

import { useAppTheme } from '@/components/theme-provider';
import { ThemeColor } from '@/constants/theme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: ThemeColor;
};

export function ThemedView({ style, lightColor, darkColor, type, ...otherProps }: ThemedViewProps) {
  const { colors, mode } = useAppTheme();
  const customColor = mode === 'dark' ? darkColor : lightColor;
  const backgroundColor = customColor ?? colors[type ?? 'background'];

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
