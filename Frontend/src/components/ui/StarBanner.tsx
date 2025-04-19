import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { COLORS, TYPOGRAPHY } from '../../utils/theme';

type StarBannerProps = {
  title: string;
  subtitle?: string;
  size?: 'small' | 'medium' | 'large';
};

export default function StarBanner({ title, subtitle, size = 'medium' }: StarBannerProps) {
  const starSize = size === 'small' ? 20 : size === 'medium' ? 30 : 40;
  
  return (
    <View style={styles.container}>
      <View style={styles.starLeft}>
        <StarIcon size={starSize} />
      </View>
      
      <View style={styles.textContainer}>
        <Text style={[
          styles.title, 
          size === 'small' ? styles.smallTitle : size === 'large' ? styles.largeTitle : {}
        ]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.subtitle}>{subtitle}</Text>
        )}
      </View>
      
      <View style={styles.starRight}>
        <StarIcon size={starSize} />
      </View>
    </View>
  );
}

function StarIcon({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={COLORS.secondary}>
      <Path d="M12 2L14.4 8.8H21.6L15.6 13.2L18 20L12 15.6L6 20L8.4 13.2L2.4 8.8H9.6L12 2Z" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginVertical: 8,
  },
  starLeft: {
    marginRight: 16,
  },
  starRight: {
    marginLeft: 16,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  smallTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
  },
  largeTitle: {
    fontSize: TYPOGRAPHY.fontSize['3xl'],
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginTop: 4,
  },
}); 