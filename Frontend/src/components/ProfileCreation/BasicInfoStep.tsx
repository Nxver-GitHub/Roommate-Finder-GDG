import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useProfileCreation } from '../../contexts/ProfileCreationContext';
import { FormInput } from '../ui/FormInput';
import { FormSelect } from '../ui/FormSelect';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { User, ArrowRight, UserCircle } from 'lucide-react-native';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, TYPOGRAPHY } from '../../utils/theme';

const schema = yup.object().shape({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  age: yup
    .number()
    .required('Age is required')
    .min(18, 'Must be at least 18 years old')
    .max(100, 'Invalid age')
    .typeError('Age must be a number'),
  gender: yup.string().required('Gender is required'),
  occupation: yup.string().required('Occupation is required'),
  bio: yup
    .string()
    .required('Bio is required')
    .min(50, 'Bio must be at least 50 characters')
    .max(500, 'Bio must not exceed 500 characters'),
});

const genderOptions = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Non-binary', value: 'non-binary' },
  { label: 'Prefer not to say', value: 'prefer-not-to-say' },
];

export function BasicInfoStep() {
  const { formData, updateFormData, setCurrentStep } = useProfileCreation();
  
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      firstName: formData.basicInfo?.firstName || '',
      lastName: formData.basicInfo?.lastName || '',
      age: formData.basicInfo?.age?.toString() || '',
      gender: formData.basicInfo?.gender || '',
      occupation: formData.basicInfo?.occupation || '',
      bio: formData.basicInfo?.bio || '',
    },
  });

  const onSubmit = (data: any) => {
    updateFormData({
      basicInfo: {
        ...data,
        age: parseInt(data.age, 10) || 0,
      },
    });
    setCurrentStep(1);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
      >
        <Animated.View 
          entering={FadeInDown.duration(600).delay(100)}
          style={styles.headerContainer}
        >
          <LinearGradient
            colors={[COLORS.primary, 'rgba(67, 113, 203, 0.8)']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.headerGradient}
          >
            <UserCircle size={40} color={COLORS.secondary} />
            <Text style={styles.headerText}>Tell us about yourself</Text>
          </LinearGradient>
        </Animated.View>

        <Animated.View 
          entering={FadeInDown.duration(600).delay(200)}
          style={styles.formContainer}
        >
          <View style={styles.formGlowBorder}>
            <LinearGradient
              colors={['rgba(240, 210, 100, 0.7)', 'rgba(67, 113, 203, 0.7)']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.gradientBorder}
            >
              <View style={styles.formContent}>
                <Controller
                  control={control}
                  name="firstName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <FormInput
                      label="First Name"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.firstName?.message}
                      placeholder="Enter your first name"
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="lastName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <FormInput
                      label="Last Name"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.lastName?.message}
                      placeholder="Enter your last name"
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="age"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <FormInput
                      label="Age"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.age?.message}
                      placeholder="Enter your age"
                      keyboardType="numeric"
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="gender"
                  render={({ field: { onChange, value } }) => (
                    <FormSelect
                      label="Gender"
                      value={value}
                      options={genderOptions}
                      onSelect={onChange}
                      error={errors.gender?.message}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="occupation"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <FormInput
                      label="Occupation"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.occupation?.message}
                      placeholder="Enter your occupation"
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="bio"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <FormInput
                      label="Bio"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.bio?.message}
                      placeholder="Tell potential roommates about yourself..."
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                      inputStyle={styles.bioInput}
                    />
                  )}
                />
              </View>
            </LinearGradient>
          </View>
        </Animated.View>

        <Animated.View 
          entering={FadeInUp.duration(600).delay(300)}
          style={styles.buttonContainer}
        >
          <TouchableOpacity
            style={styles.buttonWrapper}
            onPress={handleSubmit(onSubmit)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[COLORS.secondary, '#E5B93C']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Next Step</Text>
              <ArrowRight size={20} color="#000000" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const { width } = Dimensions.get('window');
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    marginBottom: SPACING.lg,
  },
  headerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.md,
  },
  headerText: {
    color: COLORS.text.primary,
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginLeft: SPACING.sm,
  },
  formContainer: {
    marginBottom: SPACING.lg,
  },
  formGlowBorder: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  gradientBorder: {
    padding: 2, // Border thickness
  },
  formContent: {
    backgroundColor: COLORS.background.elevated,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  bioInput: {
    minHeight: 120,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    marginBottom: SPACING.xl,
    alignItems: 'center',
  },
  buttonWrapper: {
    width: '80%',
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  buttonText: {
    color: '#000000',
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginRight: SPACING.sm,
  },
}); 