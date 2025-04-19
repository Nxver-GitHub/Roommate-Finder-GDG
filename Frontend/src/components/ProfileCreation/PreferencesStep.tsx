import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useProfileCreation } from '../../contexts/ProfileCreationContext';
import { FormInput } from '../ui/FormInput';
import { FormDatePicker } from '../ui/FormDatePicker';
import { FormSelect } from '../ui/FormSelect';
import { FormLocationInput, LocationData } from '../ui/FormLocationInput';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Home, ArrowRight, ArrowLeft, CalendarClock, DollarSign, Building, MapPin } from 'lucide-react-native';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, TYPOGRAPHY } from '../../utils/theme';

const schema = yup.object().shape({
  budgetMin: yup
    .number()
    .required('Minimum budget is required')
    .min(0, 'Budget cannot be negative')
    .typeError('Must be a number'),
  budgetMax: yup
    .number()
    .required('Maximum budget is required')
    .min(yup.ref('budgetMin'), 'Max budget must be greater than or equal to min budget')
    .typeError('Must be a number'),
  moveInDate: yup.date().required('Move-in date is required').typeError('Invalid date'),
  duration: yup.string().required('Lease duration is required'),
  location: yup.string().required('Preferred location is required'),
  roomType: yup.string().required('Room type preference is required'),
});

const durationOptions = [
  { label: '3 months', value: '3m' },
  { label: '6 months', value: '6m' },
  { label: '1 year', value: '1y' },
  { label: 'Flexible', value: 'flexible' },
];

const roomTypeOptions = [
  { label: 'Private Room', value: 'private' },
  { label: 'Shared Room', value: 'shared' },
  { label: 'Either', value: 'either' },
];

export function PreferencesStep() {
  const { formData, updateFormData, setCurrentStep } = useProfileCreation();

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      budgetMin: formData.preferences?.budget?.min?.toString() || '500',
      budgetMax: formData.preferences?.budget?.max?.toString() || '1500',
      moveInDate: formData.preferences?.moveInDate || new Date(),
      duration: formData.preferences?.duration || '',
      location: formData.preferences?.location || '',
      roomType: formData.preferences?.roomType || 'either',
    },
  });

  const budgetMinValue = watch('budgetMin');

  const onSubmit = (data: any) => {
    console.log('Preferences Step Data:', data);
    const preferencesToSave = {
      ...data,
      budget: {
        min: parseInt(data.budgetMin, 10),
        max: parseInt(data.budgetMax, 10),
      },
      moveInDate: data.moveInDate instanceof Date ? data.moveInDate : new Date(data.moveInDate),
    };
    delete preferencesToSave.budgetMin;
    delete preferencesToSave.budgetMax;

    updateFormData({
      preferences: preferencesToSave,
    });
    setCurrentStep(2);
  };

  const goBack = () => {
    setCurrentStep(0);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
    >
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: SPACING.xl }}
        nestedScrollEnabled={true}
      >
        <Animated.View 
          entering={FadeInDown.duration(600).delay(100)}
          style={styles.headerContainer}
        >
          <LinearGradient
            colors={[COLORS.success, 'rgba(27, 94, 65, 0.8)']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.headerGradient}
          >
            <Home size={40} color={COLORS.secondary} />
            <Text style={styles.headerText}>Your Housing Preferences</Text>
          </LinearGradient>
        </Animated.View>

        <Animated.View 
          entering={FadeInDown.duration(600).delay(200)}
          style={styles.formContainer}
        >
          <View style={styles.formGlowBorder}>
            <LinearGradient
              colors={['rgba(27, 94, 65, 0.7)', 'rgba(240, 210, 100, 0.7)']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.gradientBorder}
            >
              <View style={styles.formContent}>
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionTitleContainer}>
                    <DollarSign size={20} color={COLORS.text.accent} />
                    <Text style={styles.sectionTitle}>Budget Range</Text>
                  </View>
                  
                  <View style={styles.budgetContainer}>
                    <Controller
                      control={control}
                      name="budgetMin"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <FormInput
                          label="Min Budget"
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          error={errors.budgetMin?.message}
                          placeholder="e.g., 800"
                          keyboardType="numeric"
                          containerStyle={styles.budgetInput}
                        />
                      )}
                    />
                    <Controller
                      control={control}
                      name="budgetMax"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <FormInput
                          label="Max Budget"
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          error={errors.budgetMax?.message?.replace('budgetMin', budgetMinValue)}
                          placeholder="e.g., 1200"
                          keyboardType="numeric"
                          containerStyle={styles.budgetInput}
                        />
                      )}
                    />
                  </View>
                </View>
                
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionTitleContainer}>
                    <CalendarClock size={20} color={COLORS.text.accent} />
                    <Text style={styles.sectionTitle}>Timing</Text>
                  </View>
                  
                  <Controller
                    control={control}
                    name="moveInDate"
                    render={({ field: { onChange, value } }) => (
                      <FormDatePicker
                        label="Desired Move-in Date"
                        value={value}
                        onChange={onChange}
                        error={errors.moveInDate?.message}
                        minimumDate={new Date()}
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name="duration"
                    render={({ field: { onChange, value } }) => (
                      <FormSelect
                        label="Lease Duration"
                        value={value}
                        options={durationOptions}
                        onSelect={onChange}
                        error={errors.duration?.message}
                      />
                    )}
                  />
                </View>
                
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionTitleContainer}>
                    <MapPin size={20} color={COLORS.text.accent} />
                    <Text style={styles.sectionTitle}>Location</Text>
                  </View>
                  
                  <View style={styles.locationInputWrapper}>
                    <Controller
                      control={control}
                      name="location"
                      render={({ field: { onChange, value } }) => {
                        const handleLocationSelect = (locationData: LocationData) => {
                          onChange(locationData.description);
                        };
                        return (
                          <FormLocationInput
                            label="Preferred Location(s)"
                            onLocationSelect={handleLocationSelect}
                            initialValue={typeof value === 'string' ? value : ''}
                            error={errors.location?.message}
                            placeholder="e.g., Near campus, Downtown"
                          />
                        );
                      }}
                    />
                  </View>
                </View>
                
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionTitleContainer}>
                    <Building size={20} color={COLORS.text.accent} />
                    <Text style={styles.sectionTitle}>Room Type</Text>
                  </View>
                  
                  <Controller
                    control={control}
                    name="roomType"
                    render={({ field: { onChange, value } }) => (
                      <FormSelect
                        label="Room Type Preference"
                        value={value}
                        options={roomTypeOptions}
                        onSelect={onChange}
                        error={errors.roomType?.message}
                      />
                    )}
                  />
                </View>
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
            onPress={goBack}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['rgba(67, 113, 203, 0.8)', 'rgba(27, 41, 80, 0.8)']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.backButton}
            >
              <ArrowLeft size={20} color={COLORS.text.primary} />
              <Text style={styles.backButtonText}>Previous</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.buttonWrapper}
            onPress={handleSubmit(onSubmit)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[COLORS.secondary, '#E5B93C']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.nextButton}
            >
              <Text style={styles.nextButtonText}>Next</Text>
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
  sectionContainer: {
    marginBottom: SPACING.md,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  sectionTitle: {
    color: COLORS.text.primary,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginLeft: SPACING.sm,
  },
  budgetContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: -SPACING.xs,
  },
  budgetInput: {
    flex: 1,
    marginHorizontal: SPACING.xs,
  },
  locationInputWrapper: {
    zIndex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  buttonWrapper: {
    flex: 1,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    ...SHADOWS.md,
    marginHorizontal: SPACING.xs,
  },
  backButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  nextButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  backButtonText: {
    color: COLORS.text.primary,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginLeft: SPACING.xs,
  },
  nextButtonText: {
    color: '#000000',
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginRight: SPACING.xs,
  },
}); 