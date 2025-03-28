# App Navigation Structure

This application uses Expo Router for file-based routing. Here's an overview of the navigation structure:

## Key Files and Their Purposes

- `app/_layout.tsx`: Root layout that wraps the entire application
- `app/(auth)/_layout.tsx`: Layout for authentication screens (login/signup)
- `app/(tabs)/_layout.tsx`: Layout for main app tabs (discover, search, messages, profile)

## Routing Groups

- `(auth)`: Authentication-related screens
- `(tabs)`: Main application tabs
  - `index.tsx`: Discover tab (home screen)
  - `search.tsx`: Search functionality
  - `messages.tsx`: Messaging features
  - `profile.tsx`: User profile

## Special Files

- `+not-found.tsx`: Custom 404 page

## Navigation Flow

1. User starts at authentication if not logged in
2. After login, user is directed to the tabs navigation
3. User can navigate between tabs using the bottom tab bar 