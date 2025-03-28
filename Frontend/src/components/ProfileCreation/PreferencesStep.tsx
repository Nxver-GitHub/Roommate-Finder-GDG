import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useProfileCreation } from '../../contexts/ProfileCreationContext';
import { FormInput } from '../ui/FormInput';
import { FormRangeSlider } from '../ui/FormRangeSlider';
import { FormDatePicker } from '../ui/FormDatePicker';
import { FormSelect } from '../ui/FormSelect';
import { FormRadioGroup } from '../ui/FormRadioGroup';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { addMonths } from 'date-fns';

const schema = yup.object().shape({
  budget: yup.object({
    min: yup.number().required('Minimum budget is required'),
    max: yup
      .number()
      .required('Maximum budget is required')
      .min(
        yup.ref('min'),
        'Maximum budget must be greater than minimum budget'
      ),
  }),
  moveInDate: yup.date().required('Move-in date is required'),
  duration: yup.string().required('Duration is required'),
  location: yup.string().required('Location is required'),
  roomType: yup.string().required('Room type is required'),
});

const durationOptions = [
  { label: '3-6 months', value: '3-6 months' },
  { label: '6-12 months', value: '6-12 months' },
  { label: '1+ year', value: '1+ year' },
  { label: 'Flexible', value: 'flexible' },
];

const roomTypeOptions = [
  { label: 'Private Room', value: 'private' },
  { label: 'Shared Room', value: 'shared' },
  { label: 'Either is fine', value: 'either' },
];

export function PreferencesStep() {
  const { formData, updateFormData, setCurrentStep } = useProfileCreation();

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      budget: {
        min: formData.preferences?.budget?.min || 500,
        max: formData.preferences?.budget?.max || 1500,
      },
      moveInDate: formData.preferences?.moveInDate || new Date(),
      duration: formData.preferences?.duration || '',
      location: formData.preferences?.location || '',
      roomType: formData.preferences?.roomType || 'either',
    },
  });

  const onSubmit = (data: any) => {
    updateFormData({
      preferences: data,
    });
    setCurrentStep(2); // Move to lifestyle step
  };

  const handleBack = () => {
    setCurrentStep(0); // Go back to basic info
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Controller
        control={control}
        name="budget"
        render={({ field: { value } }) => (
          <FormRangeSlider
            label="Monthly Budget"
            minValue={300}
            maxValue={5000}
            step={50}
            initialLow={value.min}
            initialHigh={value.max}
            onValueChange={(low, high) => {
              setValue('budget', { min: low, max: high });
            }}
            error={errors.budget?.min?.message || errors.budget?.max?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="moveInDate"
        render={({ field: { value, onChange } }) => (
          <FormDatePicker
            label="Preferred Move-in Date"
            value={value}
            onChange={onChange}
            error={errors.moveInDate?.message}
            minimumDate={new Date()}
            maximumDate={addMonths(new Date(), 6)}
          />
        )}
      />

      <Controller
        control={control}
        name="duration"
        render={({ field: { value, onChange } }) => (
          <FormSelect
            label="Stay Duration"
            value={value}
            options={durationOptions}
            onSelect={onChange}
            error={errors.duration?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="location"
        render={({ field: { value, onChange } }) => (
          <FormInput
            label="Preferred Location"
            value={value}
            onChangeText={onChange}
            error={errors.location?.message}
            placeholder="Enter neighborhood, city, etc."
          />
        )}
      />

      <Controller
        control={control}
        name="roomType"
        render={({ field: { value, onChange } }) => (
          <FormRadioGroup
            label="Room Type"
            options={roomTypeOptions}
            value={value}
            onSelect={onChange}
            error={errors.roomType?.message}
          />
        )}
      />

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