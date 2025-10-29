import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { GoogleAuthProvider, signInWithCredential, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import Constants from 'expo-constants';

import { auth } from '../lib/firebase';

const EMAIL_HINT = 'user@example.com';
const PASSWORD_HINT = 'password123';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  const extra = useMemo(() => Constants.expoConfig?.extra as Record<string, any> | undefined, []);
  const googleIds = extra?.googleAuth ?? {};

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: googleIds.expoClientId ?? googleIds.clientId,
    androidClientId: googleIds.androidClientId,
    iosClientId: googleIds.iosClientId,
  });

  useEffect(() => {
    const handleGoogleResponse = async () => {
      if (response?.type !== 'success') {
        return;
      }

      const authResult = response.authentication as { idToken?: string } | null;
      const idToken = authResult?.idToken ?? response.params?.id_token;

      if (!idToken) {
        Alert.alert('Google sign-in failed', 'No ID token was returned.');
        return;
      }

      try {
        const credential = GoogleAuthProvider.credential(idToken);
        await signInWithCredential(auth, credential);
      } catch (error: any) {
        console.error('Google credential sign-in failed', error);
        Alert.alert('Google sign-in failed', error.message ?? 'Unable to sign in with Google.');
      }
    };

    handleGoogleResponse();
  }, [response]);

  const signInEmail = async () => {
    if (isSubmitting) {
      return;
    }

    if (!email.trim() || !password) {
      Alert.alert('Missing information', 'Enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error: any) {
      console.error('Email sign-in failed', error);
      Alert.alert('Sign-in error', error.message ?? 'Unable to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const signUpEmail = async () => {
    if (isCreating) {
      return;
    }

    if (!email.trim() || !password) {
      Alert.alert('Missing information', 'Enter both email and password.');
      return;
    }

    setIsCreating(true);
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      Alert.alert('Account created', 'You can now sign in with your credentials.');
    } catch (error: any) {
      console.error('Account creation failed', error);
      Alert.alert('Sign-up error', error.message ?? 'Unable to create account.');
    } finally {
      setIsCreating(false);
    }
  };

  

  return (
    <LinearGradient
      colors={["#181c2f", "#232a45", "#0f2027", "#2c5364"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={styles.headerWrapper}>
          <Text style={styles.appTitle}>AVI WELLNESS HUB</Text>
          <Text style={styles.subtitle}>Enter the control center to track your journey.</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="Email"
            placeholderTextColor="rgba(255,255,255,0.45)"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            secureTextEntry
            placeholder="Password"
            placeholderTextColor="rgba(255,255,255,0.45)"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.button, (isSubmitting || isCreating) && styles.buttonDisabled]}
            onPress={signInEmail}
            disabled={isSubmitting || isCreating}
          >
            <Text style={styles.buttonText}>{isSubmitting ? 'Signing in…' : 'Sign in with Email'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.secondaryButton, (isSubmitting || isCreating) && styles.buttonDisabled]}
            onPress={signUpEmail}
            disabled={isSubmitting || isCreating}
          >
            <Text style={styles.secondaryButtonText}>{isCreating ? 'Creating…' : 'Create account (Email)'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.googleButton, (!request || isSubmitting || isCreating) && styles.buttonDisabled]}
            onPress={() => promptAsync()}
            disabled={!request || isSubmitting || isCreating}
          >
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          <Text style={styles.helperText}>
            Hint: {EMAIL_HINT} / {PASSWORD_HINT}
          </Text>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  headerWrapper: {
    width: '100%',
    marginBottom: 32,
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00eaff',
    letterSpacing: 4,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 12,
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  formCard: {
    width: '100%',
    padding: 24,
    borderRadius: 16,
    backgroundColor: 'rgba(12, 18, 32, 0.85)',
    borderWidth: 1,
    borderColor: '#00eaff',
    shadowColor: '#00eaff',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00eaff',
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderRadius: 10,
    paddingHorizontal: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    color: '#FFFFFF',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  button: {
    height: 50,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00eaff',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 1,
    color: '#101829',
  },
  secondaryButton: {
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    marginTop: 12,
  },
  secondaryButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  googleButton: {
    height: 50,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginTop: 16,
  },
  googleButtonText: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: '#0f2027',
  },
  helperText: {
    marginTop: 16,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
  },
});
