import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { MapPin, User } from 'lucide-react-native'; // Example icons

// Re-use or import your UserProfileData interface
interface UserProfileData {
    id?: string;
    basicInfo?: { firstName?: string; lastName?: string; age?: number; };
    preferences?: { location?: string; budget?: { min?: number; max?: number }; };
    photoURL?: string | null;
    [key: string]: any;
}

interface ProfileCardProps {
    profile: UserProfileData;
    onPress: (profileId: string) => void; // Callback when card is pressed
}

// Define a placeholder image URI
const PLACEHOLDER_IMAGE_URI = 'https://via.placeholder.com/150/374151/e5e7eb?text=No+Pic';

export function ProfileCard({ profile, onPress }: ProfileCardProps) {
    const displayName = `${profile.basicInfo?.firstName || ''} ${profile.basicInfo?.lastName || ''}`.trim() || 'User';
    const profileImageUrl = profile.photoURL || PLACEHOLDER_IMAGE_URI;
    const age = profile.basicInfo?.age;
    const location = profile.preferences?.location || 'Location not set';
    const budgetMin = profile.preferences?.budget?.min;
    const budgetMax = profile.preferences?.budget?.max;

    const handlePress = () => {
        if (profile.id) {
            onPress(profile.id);
        } else {
            console.warn("ProfileCard pressed but profile ID is missing");
        }
    };

    return (
        <TouchableOpacity style={styles.card} onPress={handlePress}>
            <Image source={{ uri: profileImageUrl }} style={styles.profileImage} />
            <View style={styles.infoContainer}>
                <Text style={styles.name}>{displayName}{age ? `, ${age}` : ''}</Text>

                <View style={styles.detailRow}>
                    <MapPin size={14} color="#9ca3af" />
                    <Text style={styles.locationText} numberOfLines={1} ellipsizeMode="tail">{location}</Text>
                </View>

                {budgetMin !== undefined && budgetMax !== undefined && (
                     <Text style={styles.budget}>${budgetMin} - ${budgetMax} /mo</Text>
                )}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#1f2937', // gray-800
        borderRadius: 12,
        marginBottom: 16,
        overflow: 'hidden', // Clip image corners
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
    },
    profileImage: {
        width: 70,
        height: 70,
        borderRadius: 35, // Circular
        backgroundColor: '#374151', // Placeholder bg
        marginRight: 12,
    },
    infoContainer: {
        flex: 1, // Take remaining space
        justifyContent: 'center',
    },
    name: {
        fontSize: 17,
        fontWeight: '600',
        color: '#e5e7eb', // gray-200
        marginBottom: 4,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    locationText: {
        fontSize: 14,
        color: '#9ca3af', // gray-400
        marginLeft: 5,
        flexShrink: 1, // Allow text to shrink/wrap if needed
    },
    budget: {
        fontSize: 14,
        color: '#a7f3d0', // teal-200 (example color for budget)
        fontWeight: '500',
        marginTop: 2,
    },
}); 