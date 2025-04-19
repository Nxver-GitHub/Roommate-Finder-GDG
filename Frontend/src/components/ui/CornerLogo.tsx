import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { SPACING } from '../../utils/theme';

type CornerLogoProps = {
  position?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
  size?: number;
  opacity?: number;
  onPress?: () => void;
};

const CornerLogo: React.FC<CornerLogoProps> = ({
  position = 'bottomLeft',
  size = 40,
  opacity = 0.85,
  onPress,
}) => {
  // Determine position styles based on the chosen corner
  const getPositionStyle = () => {
    switch (position) {
      case 'topLeft':
        return { top: SPACING.lg, left: SPACING.lg };
      case 'topRight':
        return { top: SPACING.lg, right: SPACING.lg };
      case 'bottomRight':
        return { bottom: SPACING.lg + 50, right: SPACING.lg };
      case 'bottomLeft':
      default:
        return { bottom: SPACING.lg + 50, left: SPACING.lg };
    }
  };

  const Logo = () => (
    <Image
      source={require('../../../assets/images/logo.png')}
      style={[
        styles.logo,
        { width: size, height: size, opacity }
      ]}
      resizeMode="contain"
    />
  );

  return (
    <View style={[styles.container, getPositionStyle()]}>
      {onPress ? (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
          <Logo />
        </TouchableOpacity>
      ) : (
        <Logo />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 10,
  },
  logo: {
    width: 40,
    height: 40,
  },
});

export default CornerLogo; 