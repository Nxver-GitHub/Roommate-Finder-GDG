    // Frontend/app/(auth)/index.tsx (Ultra-simple test)
    import React, { useState } from 'react';
    import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
    import { Stack, useRouter } from 'expo-router';
    import { Ionicons } from '@expo/vector-icons';
    import { styled } from 'nativewind';

    // Import your Firebase auth functions
    import { signInWithEmail, handleGoogleSignIn } from '../../src/firebase/auth'; // Adjust path if needed

    // Apply NativeWind styling to core components
    const StyledView = styled(View);
    const StyledText = styled(Text);
    const StyledTextInput = styled(TextInput);
    const StyledTouchableOpacity = styled(TouchableOpacity);

    export default function LoginScreen() {
      const router = useRouter();
      const [email, setEmail] = useState('');
      const [password, setPassword] = useState('');
      const [loading, setLoading] = useState(false);
      const [error, setError] = useState<string | null>(null);
      const [googleLoading, setGoogleLoading] = useState(false);

      const handleEmailLogin = async () => {
        if (!email || !password) {
          setError("Please enter both email and password.");
          return;
        }
        setLoading(true);
        setError(null);
        try {
          console.log("Attempting email sign in...");
          await signInWithEmail(email, password);
          console.log("Email sign in successful");
        } catch (err: any) {
          console.error("Email Login Error:", err);
          setError(err.message || "Failed to log in. Please check your credentials.");
        } finally {
          setLoading(false);
        }
      };

      // Handle Google Sign-In Button Press
      const onGoogleButtonPress = async () => {
        setGoogleLoading(true);
        setError(null);
        try {
          await handleGoogleSignIn();
          // This won't execute due to the error in handleGoogleSignIn
        } catch (error) {
          // Only show errors that aren't our intentional disabled message
          if (error.message !== "GOOGLE_AUTH_DISABLED") {
            setError("Google Sign-In failed. Please try again or use email/password.");
          }
        } finally {
          setGoogleLoading(false);
        }
      };

      const navigateToSignup = () => {
        router.push('/(auth)/signup');
      };

      return (
        <SafeAreaView style={styles.container}>
          <Stack.Screen options={{ title: 'Login', headerShown: false }} />
          <StyledView className="flex-1 justify-center items-center p-5 bg-gray-900">
            <StyledText className="text-3xl font-bold mb-8 text-white">
              Welcome Back!
            </StyledText>

            {error && (
              <StyledText className="text-red-500 mb-4 text-center">{error}</StyledText>
            )}

            <StyledTextInput
              className="w-full h-12 bg-gray-800 rounded-lg px-4 mb-4 text-white border border-gray-700"
              placeholder="School Email"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <StyledTextInput
              className="w-full h-12 bg-gray-800 rounded-lg px-4 mb-6 text-white border border-gray-700"
              placeholder="Password"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <StyledTouchableOpacity
              className={`w-full h-12 rounded-lg justify-center items-center mb-4 ${loading ? 'bg-cyan-800' : 'bg-cyan-600'}`}
              onPress={handleEmailLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <StyledText className="text-white text-lg font-semibold">Login</StyledText>
              )}
            </StyledTouchableOpacity>

            {/* OR Separator */}
            <View style={styles.separatorContainer}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>OR</Text>
              <View style={styles.separatorLine} />
            </View>

            {/* Google Sign-In Button */}
            <StyledTouchableOpacity
              style={[styles.googleButton, { backgroundColor: '#FFFFFF' }]}
              onPress={onGoogleButtonPress}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <ActivityIndicator color="#1f2937" />
              ) : (
                <>
                  <Ionicons name="logo-google" size={20} color="#1f2937" style={styles.googleIcon} />
                  <StyledText className="text-gray-800 text-lg font-semibold">Continue with Google</StyledText>
                </>
              )}
            </StyledTouchableOpacity>

            <StyledTouchableOpacity onPress={navigateToSignup} disabled={loading}>
              <StyledText className="text-cyan-500 mt-4">
                Don't have an account? Sign Up
              </StyledText>
            </StyledTouchableOpacity>
          </StyledView>
        </SafeAreaView>
      );
    }

    // --- Add/Update Styles ---
    const styles = StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: '#111827', // gray-900
      },
      content: {
          flex: 1,
          justifyContent: 'center',
          padding: 24,
      },
      title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 8,
      },
       subtitle: {
        fontSize: 16,
        color: '#9ca3af', // gray-400
        textAlign: 'center',
        marginBottom: 40,
      },
      button: {
        backgroundColor: '#0891b2', // cyan-600
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        minHeight: 50, // Ensure consistent button height
        marginBottom: 16,
      },
      buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
      },
      googleButton: {
        width: '100%',
        height: 48,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        marginBottom: 16,
      },
      googleIcon: {
        marginRight: 12,
      },
      separatorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginVertical: 20,
      },
      separatorLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#374151', // gray-700
      },
      separatorText: {
        color: '#9CA3AF', // gray-400
        paddingHorizontal: 10,
        fontSize: 14,
      },
       footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
      },
      footerText: {
        color: '#9ca3af', // gray-400
        fontSize: 14,
      },
      linkText: {
        color: '#38bdf8', // sky-400
        fontWeight: '600',
        fontSize: 14,
      }
    });