import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useProfileCreation } from '../../contexts/ProfileCreationContext';
import { FormInput } from '../ui/FormInput';
import { FormDatePicker } from '../ui/FormDatePicker';
import { FormSelect } from '../ui/FormSelect';
import { FormLocationInput, LocationData } from '../ui/FormLocationInput';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

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
        contentContainerStyle={{ paddingBottom: 40 }}
        nestedScrollEnabled={true}
      >
        <Text style={styles.title}>Your Preferences</Text>

        <View style={styles.budgetContainer}>
          <Controller
            control={control}
            name="budgetMin"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormInput
                label="Min Budget ($/month)"
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
                label="Max Budget ($/month)"
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

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[styles.button, styles.backButton]} onPress={goBack}>
            <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Previous Step</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.nextButton]} onPress={handleSubmit(onSubmit)}>
            <Text style={styles.buttonText}>Next Step</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  locationInputWrapper: {
    zIndex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  budgetContainer: {
  },
  budgetInput: {
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 40,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    backgroundColor: '#555555',
    marginRight: 10,
  },
  nextButton: {
    backgroundColor: '#FFD700',
    marginLeft: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
}); 