import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, Switch } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useProfileCreation } from '../../contexts/ProfileCreationContext';
import { FormRating } from '../ui/FormRating';
import { FormRadioGroup } from '../ui/FormRadioGroup';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

const schema = yup.object().shape({
  cleanliness: yup
    .number()
    .required('Cleanliness rating is required')
    .min(1, 'Please select a cleanliness rating'),
  noise: yup
    .number()
    .required('Noise tolerance rating is required')
    .min(1, 'Please select a noise tolerance rating'),
  guestComfort: yup
    .number()
    .required('Guest comfort rating is required')
    .min(1, 'Please select a guest comfort rating'),
  schedule: yup.string().required('Schedule preference is required'),
  smoking: yup.boolean().required('Smoking preference is required'),
  pets: yup.boolean().required('Pet preference is required'),
});

const scheduleOptions = [
  { label: 'Early Bird', value: 'early_bird' },
  { label: 'Night Owl', value: 'night_owl' },
  { label: 'Flexible', value: 'flexible' },
];

export function LifestyleStep() {
  const { formData, updateFormData, setCurrentStep } = useProfileCreation();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      cleanliness: formData.lifestyle?.cleanliness || 3,
      noise: formData.lifestyle?.noise || 3,
      guestComfort: formData.lifestyle?.guestComfort || 3,
      schedule: formData.lifestyle?.schedule || 'flexible',
      smoking: formData.lifestyle?.smoking !== undefined ? formData.lifestyle.smoking : false,
      pets: formData.lifestyle?.pets !== undefined ? formData.lifestyle.pets : false,
    },
  });

  const onSubmit = (data: any) => {
    updateFormData({
      lifestyle: data,
    });
    setCurrentStep(3); // Move to photos step
  };

  const handleBack = () => {
    setCurrentStep(1); // Go back to preferences
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Controller
        control={control}
        name="cleanliness"
        render={({ field: { value, onChange } }) => (
          <FormRating
            label="Cleanliness Preference"
            value={value}
            onChange={onChange}
            lowLabel="Relaxed"
            highLabel="Very clean"
            error={errors.cleanliness?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="noise"
        render={({ field: { value, onChange } }) => (
          <FormRating
            label="Noise Tolerance"
            value={value}
            onChange={onChange}
            lowLabel="Silent"
            highLabel="Lively"
            error={errors.noise?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="guestComfort"
        render={({ field: { value, onChange } }) => (
          <FormRating
            label="Guest Comfort"
            value={value}
            onChange={onChange}
            lowLabel="Rarely"
            highLabel="Often"
            error={errors.guestComfort?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="schedule"
        render={({ field: { value, onChange } }) => (
          <FormRadioGroup
            label="Schedule Preference"
            options={scheduleOptions}
            value={value}
            onSelect={onChange}
            error={errors.schedule?.message}
          />
        )}
      />

      <View style={styles.switchContainer}>
        <Text style={styles.switchLabel}>Are you comfortable with smoking?</Text>
        <Controller
          control={control}
          name="smoking"
          render={({ field: { value, onChange } }) => (
            <Switch
              value={value}
              onValueChange={onChange}
              trackColor={{ false: '#333', true: '#4CAF50' }}
              thumbColor={value ? '#fff' : '#f4f3f4'}
            />
          )}
        />
        {errors.smoking && <Text style={styles.errorText}>{errors.smoking.message}</Text>}
      </View>

      <View style={styles.switchContainer}>
        <Text style={styles.switchLabel}>Are you comfortable with pets?</Text>
        <Controller
          control={control}
          name="pets"
          render={({ field: { value, onChange } }) => (
            <Switch
              value={value}
              onValueChange={onChange}
              trackColor={{ false: '#333', true: '#4CAF50' }}
              thumbColor={value ? '#fff' : '#f4f3f4'}
            />
          )}
        />
        {errors.pets && <Text style={styles.errorText}>{errors.pets.message}</Text>}
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.button, styles.backButton]}
          onPress={handleBack}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.nextButton]}
          onPress={handleSubmit(onSubmit)}
        >
          <Text style={styles.nextButtonText}>Next Step</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  switchLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    flex: 1,
  },
  errorText: {
    color: '#FF4444',
    fontSize: 14,
    marginTop: 4,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 40,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  backButton: {
    backgroundColor: '#333',
  },
  nextButton: {
    backgroundColor: '#FFD700',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  nextButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 