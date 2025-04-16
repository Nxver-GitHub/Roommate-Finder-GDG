# Roommate Finder App

## Project Overview
This Roommate Finder app helps users connect with potential roommates by providing a platform to create profiles, discover matches, search with filters, and communicate with each other. Built with React Native and Expo, this application offers a comprehensive solution for finding compatible roommates.

## Features
- **Profile Creation**: Create and edit user profiles with preferences
- **Discovery**: Swipe through potential roommate matches
- **Messaging**: Real-time chat with matched users
- **Search/Filter**: Find roommates based on specific criteria
- **Match Management**: View and manage roommate matches

## Prerequisites
- Node.js (v16.x or higher)
- npm (v8.x or higher) or Yarn (v1.22.x or higher)
- Expo CLI (`npm install -g expo-cli`)
- Git

## Installation

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/Roommate-Finder-GDG.git
cd Roommate-Finder-GDG/Frontend
```

### 2. Install dependencies
```bash
npm install
# or if you use yarn
yarn install
```

### 3. Key dependencies
The application relies on several important packages:
- **Expo Router**: For navigation (`@expo/router`)
- **NativeWind**: For Tailwind CSS styling in React Native
- **Ionicons**: For UI icons
- **React Native**: Core framework
- **TypeScript**: For type safety

## Running the Application

Start the development server:
```bash
npm start
# or
npx expo start
```

This will provide you with several options:
- Press `a` to run on Android emulator/device
- Press `i` to run on iOS simulator/device
- Press `w` to run in web browser
- Scan the QR code with the Expo Go app on your mobile device

## Project Structure

- `app/` - Contains the main application screens and navigation
  - `(screens)/` - Main tab screens (Discover, Messages, Search, Results, Profile)
  - `(screens)/conversation/` - Conversation screens for messaging
- `src/` - Source code
  - `components/` - Reusable UI components
  - `services/` - Mock API services for development
  - `utils/` - Utility functions
- `assets/` - Static assets like images

## Development Notes

### Adding a New Screen
1. Create a new `.tsx` file in the appropriate directory under `app/`
2. Import and use the necessary components
3. If it should be a tab, add it to the tab navigation in `app/(screens)/_layout.tsx`

### Styling with NativeWind
This project uses NativeWind (TailwindCSS for React Native):
```jsx
<View className="flex-1 bg-gray-900 p-4">
  <Text className="text-white text-lg">Example</Text>
</View>
```

### Mock Data
During development, the app uses mock data services found in `src/services/`. These will eventually be replaced with Firebase integration.

## Troubleshooting

### Common Issues
1. **Node modules errors**: 
   ```bash
   rm -rf node_modules
   rm package-lock.json
   npm install
   ```

2. **Expo errors**: Clear cache with 
   ```bash
   npx expo start --clear
   ```

3. **Navigation issues**: Ensure all screen routes are properly defined in the layout files

### TypeScript Type Errors
The project uses TypeScript for type safety. If you encounter type errors:
1. Check the interface definitions in related files
2. Ensure proper typing for component props and state
3. Use the appropriate import paths for components and utilities

## Future Plans
- Firebase integration for backend functionality
- User authentication
- Cloud storage for profile images
- Real-time messaging
- Location-based matching

## Contribution Guidelines
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes and commit: `git commit -m "Add new feature"`
4. Push to your fork: `git push origin feature/new-feature`
5. Create a pull request

## License
This project is licensed under the MIT License.

## Acknowledgements
- This app was created as part of a UC Santa Cruz Google Developer Group project
- UI/UX inspiration from popular roommate and dating applications
