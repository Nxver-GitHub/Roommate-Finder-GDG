import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useProfileCreation } from '../../contexts/ProfileCreationContext';
import { FormInput } from '../ui/FormInput';
import { FormSelect } from '../ui/FormSelect';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

const schema = yup.object().shape({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  age: yup
    .number()
    .required('Age is required')
    .min(18, 'Must be at least 18 years old')
    .max(100, 'Invalid age'),
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
        age: parseInt(data.age, 10),
      },
    });
    setCurrentStep(1); // Move to next step
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Controller
        control={control}
        name="firstName"
        render={({ field: { onChange, value } }) => (
          <FormInput
            label="First Name"
            value={value}
            onChangeText={onChange}
            error={errors.firstName?.message}
            placeholder="Enter your first name"
          />
        )}
      />

      <Controller
        control={control}
        name="lastName"
        render={({ field: { onChange, value } }) => (
          <FormInput
            label="Last Name"
            value={value}
            onChangeText={onChange}
            error={errors.lastName?.message}
            placeholder="Enter your last name"
          />
        )}
      />

      <Controller
        control={control}
        name="age"
        render={({ field: { onChange, value } }) => (
          <FormInput
            label="Age"
            value={value}
            onChangeText={onChange}
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
        render={({ field: { onChange, value } }) => (
          <FormInput
            label="Occupation"
            value={value}
            onChangeText={onChange}
            error={errors.occupation?.message}
            placeholder="Enter your occupation"
          />
        )}
      />

      <Controller
        control={control}
        name="bio"
        render={({ field: { onChange, value } }) => (
          <FormInput
            label="Bio"
            value={value}
            onChangeText={onChange}
            error={errors.bio?.message}
            placeholder="Tell potential roommates about yourself..."
            multiline
            numberOfLines={4}
          />
        )}
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit(onSubmit)}>
        <Text style={styles.buttonText}>Next Step</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  button: {
    backgroundColor: '#FFD700',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  buttonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 