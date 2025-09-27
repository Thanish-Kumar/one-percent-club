# Firebase Setup Instructions

Follow these steps to set up Firebase authentication for your project:

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter your project name (e.g., "1-percent-club")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## 2. Enable Authentication

1. In your Firebase project, click on "Authentication" in the left sidebar
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Enable "Email/Password" authentication:
   - Click on "Email/Password"
   - Toggle "Enable" for the first option
   - Click "Save"

## 3. Get Firebase Configuration

1. In your Firebase project, click on the gear icon (⚙️) next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon (`</>`) to add a web app
5. Enter your app nickname (e.g., "1-percent-club-web")
6. Click "Register app"
7. Copy the Firebase configuration object

## 4. Set Up Environment Variables

1. Create a `.env.local` file in your project root
2. Copy the contents from `env.example` to `.env.local`
3. Replace the placeholder values with your actual Firebase config:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## 5. Test the Integration

1. Start your development server: `npm run dev`
2. Navigate to `/signup` and create a test account
3. Navigate to `/login` and sign in with the test account
4. Check the Firebase Console > Authentication > Users to see your test user

## 6. Security Rules (Optional)

For production, consider setting up Firestore security rules if you plan to use Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Troubleshooting

### Common Issues:

1. **"Firebase: Error (auth/configuration-not-found)"**
   - Make sure your environment variables are correctly set
   - Restart your development server after adding environment variables

2. **"Firebase: Error (auth/invalid-api-key)"**
   - Double-check your API key in the `.env.local` file
   - Ensure there are no extra spaces or quotes around the values

3. **"Firebase: Error (auth/domain-not-authorized)"**
   - Add your domain to the authorized domains in Firebase Console
   - Go to Authentication > Settings > Authorized domains

### Development vs Production:

- For development: Add `localhost:3000` to authorized domains
- For production: Add your actual domain to authorized domains

## Next Steps

Once Firebase is set up, you can:

1. Add email verification
2. Implement password reset functionality
3. Add social authentication (Google, Facebook, etc.)
4. Set up user profile management
5. Add role-based access control
6. Implement protected routes
