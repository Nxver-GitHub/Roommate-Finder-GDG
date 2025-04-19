// Frontend/app/(auth)/index.tsx – Enhanced with premium design elements

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Easing,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { styled } from 'nativewind';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import { signInWithEmail, handleGoogleSignIn } from '../../src/firebase/auth';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../src/utils/theme';

/* ─── Styled Components ───── */
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTextInput = styled(TextInput);
const StyledTouchableOpacity = styled(TouchableOpacity);

/* ─── Animated Star Component ───── */
const AnimatedStar = ({ size, style, delay = 0 }) => {
  const animation = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(animation, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(animation, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        })
      ])
    ).start();
  }, []);
  
  const opacity = animation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.4, 1, 0.4]
  });
  
  const scale = animation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.8, 1.2, 0.8]
  });
  
  return (
    <Animated.View style={[
      style, 
      { opacity, transform: [{ scale }] }
    ]}>
      <Ionicons 
        name="sparkles" 
        size={size} 
        color={COLORS.secondary}
      />
    </Animated.View>
  );
};

/* ─── SlugSpace Logo Header Component ───── */
const SlugSpaceLogo = () => {
  const logoAnimation = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Initial entrance animation for the logo
    Animated.timing(logoAnimation, {
      toValue: 1,
      duration: 1000,
      easing: Easing.out(Easing.back(1.5)),
      useNativeDriver: true,
    }).start();
  }, []);
  
  const logoOpacity = logoAnimation;
  const logoTranslateY = logoAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [30, 0]
  });
  
  return (
    <Animated.View 
      style={[
        styles.logoHeader,
        {
          opacity: logoOpacity,
          transform: [{ translateY: logoTranslateY }]
        }
      ]}
    >
      <Text style={styles.brand}>slugspace</Text>
    </Animated.View>
  );
};

/* ─── Animated Slug Mascot Component ───── */
const AnimatedSlugMascot = () => {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Slug bounce animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        })
      ])
    ).start();
    
    // Subtle rotation animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        })
      ])
    ).start();
  }, []);
  
  const translateY = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10]
  });
  
  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-2deg', '2deg']
  });
  
  return (
    <View style={styles.slugContainer}>
      <AnimatedStar size={20} style={styles.starTopLeft} delay={500} />
      <AnimatedStar size={24} style={styles.starTopRight} />
      <AnimatedStar size={16} style={styles.starBottomLeft} delay={1000} />
      <AnimatedStar size={18} style={styles.starBottomRight} delay={750} />
      
      <Animated.Image
        source={require('../../assets/images/logo.png')}
        style={[
          styles.slugImage,
          { 
            transform: [
              { translateY },
              { rotate }
            ] 
          }
        ]}
        resizeMode="contain"
      />
    </View>
  );
};

/* ─── Main Login Screen Component ───── */
export default function LoginScreen() {
  const router = useRouter();
  const { height } = Dimensions.get('window');
  
  // Animation refs
  const formAnimation = useRef(new Animated.Value(0)).current;
  
  // State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  
  // Entrance animation
  useEffect(() => {
    Animated.timing(formAnimation, {
      toValue: 1,
      duration: 800,
      delay: 400,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, []);
  
  const formOpacity = formAnimation;
  const formTranslateY = formAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [40, 0]
  });

  // --- Handlers ---
  const handleEmailLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signInWithEmail(email, password);
      // Navigation handled by RootLayout listener
    } catch (err: any) {
      setError(err.message || 'Failed to log in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const onGoogleButtonPress = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      await handleGoogleSignIn();
      // Navigation handled by RootLayout listener
    } catch (err: any) {
      if (err.message !== 'GOOGLE_AUTH_DISABLED') {
        setError('Google Sign‑In failed. Please try again or use email/password.');
        console.error("Google Sign-In Error:", err);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const navigateToSignup = () => {
    if (!loading && !googleLoading) {
      router.push('/(auth)/signup');
    }
  };
  
  const handleForgotPassword = () => {
    // Add password reset functionality here
    alert('Password reset functionality will be implemented soon.');
  };

  // --- Render ---
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background.default} />
      <Stack.Screen options={{ title: 'Login', headerShown: false }} />
      
      <LinearGradient
        colors={['#121212', '#151A26']}
        style={styles.container}
      >
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scrollContentContainer,
              { minHeight: height * 0.9 }
            ]}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header Section */}
            <View style={styles.headerSection}>
              <SlugSpaceLogo />
              <AnimatedSlugMascot />
              
              <View style={styles.taglineContainer}>
                <Text style={styles.tagline}>
                  Finding roommates for UCSC students
                </Text>
                <View style={styles.valuePropositionContainer}>
                  <BlurView 
                    intensity={40} 
                    tint="dark" 
                    style={styles.valuePropositionBlur}
                  >
                    <Ionicons name="home" size={14} color={COLORS.text.accent} style={{ marginRight: 6 }} />
                    <Text style={styles.valueProposition}>
                      Match with your perfect roommate in minutes
                    </Text>
                  </BlurView>
                </View>
              </View>
            </View>
            
            {/* Form Section */}
            <Animated.View 
              style={[
                styles.formContainer,
                {
                  opacity: formOpacity,
                  transform: [{ translateY: formTranslateY }]
                }
              ]}
            >
              {error && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
                  <Text style={styles.error}>{error}</Text>
                </View>
              )}

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email</Text>
                <View style={[
                  styles.textInputWrapper,
                  emailFocused && styles.inputFocused
                ]}>
                  <Ionicons 
                    name="mail" 
                    size={18} 
                    color={emailFocused ? COLORS.secondary : COLORS.text.secondary} 
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="username@ucsc.edu"
                    placeholderTextColor={COLORS.text.secondary}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    textContentType="emailAddress"
                    autoComplete="email"
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                  />
                </View>
                <Text style={styles.helperText}>
                  Use your UCSC email to sign in
                </Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={[
                  styles.textInputWrapper,
                  passwordFocused && styles.inputFocused
                ]}>
                  <Ionicons 
                    name="lock-closed" 
                    size={18} 
                    color={passwordFocused ? COLORS.secondary : COLORS.text.secondary} 
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor={COLORS.text.secondary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    textContentType="password"
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                  />
                  <TouchableOpacity 
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off" : "eye"}
                      size={20}
                      color={COLORS.text.secondary}
                    />
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity 
                  style={styles.forgotPassword}
                  onPress={handleForgotPassword}
                >
                  <Text style={styles.forgotPasswordText}>
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[
                  styles.loginButton,
                  (loading || googleLoading) && styles.disabledButton,
                ]}
                onPress={handleEmailLogin}
                disabled={loading || googleLoading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={loading || googleLoading ? 
                    ['#4371CB80', '#3667C280'] : 
                    ['#4371CB', '#3667C2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.text.primary} />
                  ) : (
                    <Text style={styles.loginButtonText}>
                      Login
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.separatorContainer}>
                <View style={styles.separatorLine} />
                <Text style={styles.separatorText}>OR</Text>
                <View style={styles.separatorLine} />
              </View>

              <TouchableOpacity
                style={[
                  styles.googleButton, 
                  (googleLoading || loading) && styles.disabledGoogleButton,
                ]}
                onPress={onGoogleButtonPress}
                disabled={loading || googleLoading}
                activeOpacity={0.8}
              >
                {googleLoading ? (
                  <ActivityIndicator color="#1f2937" />
                ) : (
                  <>
                    <Ionicons name="logo-google" size={20} color="#1f2937" style={styles.googleIcon} />
                    <Text style={styles.googleButtonText}>
                      Continue with Google
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.signupContainer}>
                <Text style={styles.signupText}>
                  Don't have an account?
                </Text>
                <TouchableOpacity
                  onPress={navigateToSignup}
                  disabled={loading || googleLoading}
                  style={styles.signupButton}
                >
                  <Text style={styles.signupButtonText}>
                    Sign Up
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

/* ─── Styles ───── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
  },
  headerSection: {
    alignItems: 'center',
    width: '100%',
    marginTop: SPACING.xl,
  },
  logoHeader: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  brand: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFCC33',
    textShadowColor: 'rgba(255, 204, 51, 0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  slugContainer: {
    position: 'relative',
    width: 170,
    height: 170,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  slugImage: {
    width: 140,
    height: 140,
  },
  starTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  starTopRight: {
    position: 'absolute',
    top: 10,
    right: 0,
  },
  starBottomLeft: {
    position: 'absolute',
    bottom: 20,
    left: 10,
  },
  starBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 10,
  },
  taglineContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  tagline: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.text.primary,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  valuePropositionContainer: {
    alignItems: 'center',
  },
  valuePropositionBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  valueProposition: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.accent,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    marginTop: SPACING.xl,
    ...SHADOWS.lg,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 68, 68, 0.15)',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.md,
  },
  error: {
    flex: 1,
    color: COLORS.danger,
    marginLeft: SPACING.xs,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  inputContainer: {
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    color: COLORS.text.primary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '500',
    marginBottom: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  textInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(51, 51, 51, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(51, 51, 51, 0.9)',
    borderRadius: BORDER_RADIUS.md,
    height: 50,
    ...SHADOWS.sm,
  },
  inputFocused: {
    borderColor: COLORS.secondary,
    borderWidth: 2,
    backgroundColor: 'rgba(51, 51, 51, 0.8)',
  },
  inputIcon: {
    paddingHorizontal: SPACING.sm,
  },
  input: {
    flex: 1,
    color: COLORS.text.primary,
    paddingVertical: SPACING.sm,
  },
  eyeIcon: {
    paddingHorizontal: SPACING.sm,
  },
  helperText: {
    color: COLORS.text.secondary,
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginTop: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: SPACING.xs,
  },
  forgotPasswordText: {
    color: COLORS.secondary,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '500',
  },
  loginButton: {
    width: '100%',
    height: 50,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    color: COLORS.text.primary,
    fontWeight: 'bold',
    fontSize: TYPOGRAPHY.fontSize.lg,
  },
  disabledButton: {
    opacity: 0.7,
  },
  disabledGoogleButton: {
    opacity: 0.7,
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: SPACING.lg,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(156, 163, 175, 0.2)',
  },
  separatorText: {
    marginHorizontal: SPACING.sm,
    color: COLORS.text.secondary,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  googleButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    ...SHADOWS.sm,
  },
  googleIcon: {
    marginRight: SPACING.sm,
  },
  googleButtonText: {
    color: '#1f2937',
    fontWeight: '600',
    fontSize: TYPOGRAPHY.fontSize.md,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  signupText: {
    color: COLORS.text.secondary,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  signupButton: {
    marginLeft: SPACING.xs,
  },
  signupButtonText: {
    color: COLORS.secondary,
    fontWeight: 'bold',
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
});