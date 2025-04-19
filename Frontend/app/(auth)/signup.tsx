import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { styled } from 'nativewind';

// Import your Firebase auth function for signup
import { signUpWithSchoolEmail } from '../../src/firebase/auth'; // Adjust path if needed
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../src/utils/theme';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTextInput = styled(TextInput);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledSafeAreaView = styled(SafeAreaView);

export default function SignupScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    // Basic email format check (consider more robust validation)
    if (!/\S+@\S+\.\S+/.test(email)) {
        setError("Please enter a valid email address.");
        return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log("Attempting email sign up...");
      // Call the actual Firebase signup function
      await signUpWithSchoolEmail(email, password, name);
      console.log("Sign up successful! Verification email sent (if enabled).");
      Alert.alert(
        "Account Created",
        "Please check your email to verify your account. You will now be taken to profile setup.",
        [{ text: "OK" }] // Allow _layout.tsx to handle navigation
      );
      // NOTE: User won't be logged in immediately.
      // The RootLayout listener will keep them on the (auth) screen until they verify (if needed) and log in.
      // Alternatively, after signup, you could navigate them to a "Check your email" screen.

    } catch (err: any) {
      console.error("Signup Error:", err);
      setError(err.message || "Failed to sign up. Please try again.");
      // Specific error handling can be added here based on err.code
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.brand}>SlugSpace</Text>
          <Text style={styles.tagline}>Finding roommates for UCSC students</Text>
        </View>
        
        <Text style={styles.title}>Create Account</Text>

        {error && (
          <Text style={styles.error}>{error}</Text>
        )}

        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor={COLORS.text.secondary}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
        <TextInput
          style={styles.input}
          placeholder="School Email (@ucsc.edu)"
          placeholderTextColor={COLORS.text.secondary}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password (min. 6 characters)"
          placeholderTextColor={COLORS.text.secondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor={COLORS.text.secondary}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.disabledButton]}
          onPress={handleSignup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.text.primary} />
          ) : (
            <Text style={styles.buttonText}>Sign Up</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => router.back()} 
          disabled={loading}
          style={styles.loginLink}
        >
          <Text style={styles.loginLinkText}>
            Already have an account? Login
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.default,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  headerContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  brand: {
    fontSize: 48,
    fontFamily: 'Poppins-Bold',
    color: COLORS.secondary,
    marginBottom: SPACING.xs,
  },
  tagline: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.text.primary,
    fontFamily: 'Inter-Medium',
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize['3xl'],
    fontFamily: 'Poppins-Bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.xl,
  },
  error: {
    color: COLORS.danger,
    marginBottom: SPACING.md,
    textAlign: 'center',
    width: '100%',
    fontFamily: 'Inter',
  },
  input: {
    width: '100%',
    height: 48,
    backgroundColor: COLORS.background.input,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    color: COLORS.text.primary,
    borderWidth: 1,
    borderColor: COLORS.border.default,
    fontFamily: 'Inter',
  },
  button: {
    width: '100%',
    height: 48,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  disabledButton: {
    backgroundColor: COLORS.primary + '80', // 50% opacity
  },
  buttonText: {
    color: COLORS.text.primary,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontFamily: 'Poppins-SemiBold',
  },
  loginLink: {
    marginTop: SPACING.md,
  },
  loginLinkText: {
    color: COLORS.secondary,
    fontFamily: 'Inter-Medium',
  }
}); 