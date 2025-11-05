import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';

type SignUpMethod = 'phone' | 'email';

export default function SignUpScreen({ navigation }: any) {
  const [method, setMethod] = useState<SignUpMethod>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'signup' | 'verify'>('signup');
  const [loading, setLoading] = useState(false);
  const { signUpWithPhone, signUpWithEmail, verifyPhoneOTP, verifyEmailOTP, resendOTP, resendEmailOTP } = useAuth();

  // Validation functions
  const validatePhone = (phoneNumber: string): boolean => {
    // Remove formatting characters
    const cleaned = phoneNumber.replace(/\s|-|\(|\)/g, '');
    // Check if it's a valid phone number (at least 10 digits, optionally with country code)
    return /^(\+?1?)?[2-9]\d{2}[2-9]\d{2}\d{4}$/.test(cleaned) || /^\+\d{10,15}$/.test(cleaned);
  };

  const validateEmail = (emailAddress: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailAddress);
  };

  const handleSignUp = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }

    if (method === 'phone') {
      if (!phone.trim()) {
        Alert.alert('Error', 'Please enter your phone number');
        return;
      }
      if (!validatePhone(phone)) {
        Alert.alert('Error', 'Please enter a valid phone number');
        return;
      }
    } else {
      if (!email.trim()) {
        Alert.alert('Error', 'Please enter your email address');
        return;
      }
      if (!validateEmail(email)) {
        Alert.alert('Error', 'Please enter a valid email address');
        return;
      }
    }

    setLoading(true);
    try {
      if (method === 'phone') {
        console.log('[SignUp] Attempting phone signup with:', phone);
        await signUpWithPhone(phone, fullName);
        setStep('verify');
        Alert.alert('Code Sent', 'Please check your phone for the verification code');
      } else {
        await signUpWithEmail(email, fullName);
        setStep('verify');
        Alert.alert('Code Sent', 'Please check your email for the verification code');
      }
    } catch (error: any) {
      console.error('[SignUp] Signup error:', error);
      const errorMessage = error?.message || 'Failed to send verification code';
      Alert.alert(
        'Sign Up Failed', 
        errorMessage,
        [
          {
            text: 'OK',
            style: 'default',
          },
          method === 'phone' ? {
            text: 'Try Email Instead',
            style: 'default',
            onPress: () => setMethod('email'),
          } : undefined,
        ].filter(Boolean) as any
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!otp.trim() || otp.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit verification code');
      return;
    }

    setLoading(true);
    try {
      if (method === 'phone') {
        await verifyPhoneOTP(phone, otp);
        // Auto-login happens in AuthContext after verification
        Alert.alert('Success', 'Account created successfully!');
      } else {
        await verifyEmailOTP(email, otp);
        // Auto-login happens in AuthContext after verification
        Alert.alert('Success', 'Account created successfully!');
      }
    } catch (error: any) {
      Alert.alert('Verification Failed', error.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    try {
      if (method === 'phone') {
        await resendOTP(phone);
        Alert.alert('Code Sent', 'A new verification code has been sent to your phone');
      } else {
        await resendEmailOTP(email);
        Alert.alert('Code Sent', 'A new verification code has been sent to your email');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('signup');
    setOtp('');
  };

  if (step === 'verify') {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.content}>
            <Text style={styles.title}>Verify {method === 'phone' ? 'Phone' : 'Email'}</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code sent to{'\n'}
              {method === 'phone' ? phone : email}
            </Text>
            {method === 'email' && (
              <Text style={styles.helpText}>
                If you received a magic link instead of a code, please check your email for a 6-digit code.
                You can also click "Resend code" below to request a new code.
              </Text>
            )}

            <View style={styles.form}>
              <TextInput
                style={styles.otpInput}
                placeholder="Enter 6-digit code"
                value={otp}
                onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, '').slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
                editable={!loading}
                autoFocus
              />

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleVerify}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.buttonText}>Verify</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.linkButton}
                onPress={handleResendCode}
                disabled={loading}
              >
                <Text style={styles.linkText}>Resend code</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.linkButton}
                onPress={handleBack}
                disabled={loading}
              >
                <Text style={styles.linkText}>Change {method === 'phone' ? 'phone number' : 'email'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join your neighborhood</Text>

          {/* Method selector */}
          <View style={styles.methodSelector}>
            <TouchableOpacity
              style={[styles.methodButton, method === 'phone' && styles.methodButtonActive]}
              onPress={() => setMethod('phone')}
            >
              <Text style={[styles.methodButtonText, method === 'phone' && styles.methodButtonTextActive]}>
                Phone
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.methodButton, method === 'email' && styles.methodButtonActive]}
              onPress={() => setMethod('email')}
            >
              <Text style={[styles.methodButtonText, method === 'email' && styles.methodButtonTextActive]}>
                Email
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={fullName}
              onChangeText={setFullName}
              editable={!loading}
              autoCapitalize="words"
            />

            {method === 'phone' ? (
              <TextInput
                style={styles.input}
                placeholder="Phone Number (e.g., +1234567890)"
                value={phone}
                onChangeText={(text) => {
                  // Allow digits, +, spaces, dashes, parentheses
                  const cleaned = text.replace(/[^\d+\s\-()]/g, '');
                  setPhone(cleaned);
                }}
                keyboardType="phone-pad"
                editable={!loading}
                autoCapitalize="none"
              />
            ) : (
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />
            )}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSignUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>Send Verification Code</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.linkText}>Already have an account? Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 40,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 32,
    textAlign: 'center',
  },
  methodSelector: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  methodButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  methodButtonActive: {
    backgroundColor: '#10b981',
  },
  methodButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  methodButtonTextActive: {
    color: '#ffffff',
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
  },
  otpInput: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#10b981',
    borderRadius: 12,
    padding: 20,
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    letterSpacing: 8,
  },
  button: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    padding: 12,
    alignItems: 'center',
  },
  linkText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '500',
  },
  helpText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 16,
    lineHeight: 16,
  },
});
