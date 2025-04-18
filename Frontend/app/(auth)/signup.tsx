import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { styled } from 'nativewind';

// Import your Firebase auth function for signup
import { signUpWithSchoolEmail } from '../../src/firebase/auth'; // Adjust path if needed

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
    <StyledSafeAreaView className="flex-1 bg-gray-900">
      <StyledView className="flex-1 justify-center items-center p-5">
        <StyledView className="w-full items-center mb-8">
          <StyledText className="text-5xl font-bold text-cyan-500 mb-2">
            SlugSpace
          </StyledText>
          <StyledText className="text-white text-xl mb-2 italic">
            Find your UCSC roommate
          </StyledText>
        </StyledView>
        
        <StyledText className="text-3xl font-bold mb-8 text-white">
          Create Account
        </StyledText>

        {error && (
          <StyledText className="text-red-500 mb-4 text-center">{error}</StyledText>
        )}

        <StyledTextInput
          className="w-full h-12 bg-gray-800 rounded-lg px-4 mb-4 text-white border border-gray-700"
          placeholder="Full Name"
          placeholderTextColor="#9CA3AF"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
        <StyledTextInput
          className="w-full h-12 bg-gray-800 rounded-lg px-4 mb-4 text-white border border-gray-700"
          placeholder="School Email (@ucsc.edu)"
          placeholderTextColor="#9CA3AF"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <StyledTextInput
          className="w-full h-12 bg-gray-800 rounded-lg px-4 mb-4 text-white border border-gray-700"
          placeholder="Password (min. 6 characters)"
          placeholderTextColor="#9CA3AF"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <StyledTextInput
          className="w-full h-12 bg-gray-800 rounded-lg px-4 mb-6 text-white border border-gray-700"
          placeholder="Confirm Password"
          placeholderTextColor="#9CA3AF"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <StyledTouchableOpacity
          className={`w-full h-12 rounded-lg justify-center items-center mb-4 ${loading ? 'bg-cyan-800' : 'bg-cyan-600'}`}
          onPress={handleSignup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <StyledText className="text-white text-lg font-semibold">Sign Up</StyledText>
          )}
        </StyledTouchableOpacity>

        <StyledTouchableOpacity onPress={() => router.back()} disabled={loading}>
          <StyledText className="text-cyan-500 mt-4">
            Already have an account? Login
          </StyledText>
        </StyledTouchableOpacity>
      </StyledView>
    </StyledSafeAreaView>
  );
} 