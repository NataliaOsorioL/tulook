import { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Image, KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { getAuthErrorMessage } from '../src/services/auth.service';

export default function ForgotPasswordScreen({ navigation }) {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const isMounted = useRef(true);

  async function handleReset() {
    Keyboard.dismiss();
    setError('');
    setSuccess('');

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError('Ingresa tu correo electrónico.');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(trimmedEmail);
      if (isMounted.current) {
        setSuccess('Te hemos enviado un correo para restablecer tu contraseña. Revisa tu bandeja de entrada.');
        setEmail('');
      }
    } catch (err) {
      if (isMounted.current) {
        setError(getAuthErrorMessage(err));
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          disabled={isLoading}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
        />

        <Text style={styles.title}>Recuperar Contraseña</Text>

        <Text style={styles.subtitle}>
          Te enviaremos un enlace para restablecer tu contraseña
        </Text>

        <View style={styles.card}>
          <View style={styles.formContainer}>
            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={18} color="#D32F2F" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {success ? (
              <View style={styles.successContainer}>
                <Ionicons name="checkmark-circle" size={18} color="#2E7D32" />
                <Text style={styles.successText}>{success}</Text>
              </View>
            ) : null}

            <View style={styles.inputContainer}>
              <TextInput
                placeholder="Correo Electrónico"
                placeholderTextColor="#B7B7B7"
                style={styles.input}
                value={email}
                onChangeText={(text) => { setEmail(text); setError(''); setSuccess(''); }}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                editable={!isLoading}
              />
              <Ionicons name="mail-outline" size={20} color="#B7B7B7" />
            </View>

            <TouchableOpacity
              style={[styles.resetButton, isLoading && styles.resetButtonDisabled]}
              onPress={handleReset}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.resetText}>Enviar Enlace</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.backContainer}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            disabled={isLoading}
          >
            <Text style={styles.backLink}>Volver a Iniciar Sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    backgroundColor: '#F6F2EA',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#222',
    marginTop: 8,
    marginBottom: 25,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  card: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 3,
  },
  formContainer: {
    padding: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 15,
    marginBottom: 18,
    height: 55,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  resetButton: {
    marginTop: 5,
    height: 58,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#529BD6',
  },
  resetButtonDisabled: {
    opacity: 0.7,
  },
  resetText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 15,
    gap: 8,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 15,
    gap: 8,
  },
  successText: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  backContainer: {
    flexDirection: 'row',
    marginTop: 25,
  },
  backLink: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
});
