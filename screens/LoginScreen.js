import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Image, KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { login, getAuthErrorMessage } from '../src/services/auth.service';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin() {
    Keyboard.dismiss();
    setError('');

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError('Ingresa tu correo electrónico.');
      return;
    }

    if (!password) {
      setError('Ingresa tu contraseña.');
      return;
    }

    setIsLoading(true);
    try {
      await login(trimmedEmail, password);
    } catch (err) {
      console.log('[LoginScreen] Error capturado:', err.code, err.message);
      setError(getAuthErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : null}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        <Text style={styles.title}>TuLook</Text>

        <Text style={styles.subtitle}>
          Organiza. Combina. Inspira.
        </Text>

        <View style={styles.card}>

          <Image
            source={{
              uri: 'https://via.placeholder.com/320x350',
            }}
            style={styles.backgroundImage}
          />

          <View style={styles.formContainer}>

            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={18} color="#D32F2F" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputContainer}>
              <TextInput
                placeholder="Correo Electrónico"
                placeholderTextColor="#B7B7B7"
                style={styles.input}
                value={email}
                onChangeText={(text) => { setEmail(text); setError(''); }}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                editable={!isLoading}
              />

              <Ionicons
                name="mail-outline"
                size={20}
                color="#B7B7B7"
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                placeholder="Contraseña"
                placeholderTextColor="#B7B7B7"
                secureTextEntry={!showPassword}
                style={styles.input}
                value={password}
                onChangeText={(text) => { setPassword(text); setError(''); }}
                autoCapitalize="none"
                autoComplete="password"
                editable={!isLoading}
              />

              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#B7B7B7"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.loginText}>Iniciar Sesión</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity>
              <Text style={styles.forgotText}>
                ¿Olvidaste tu contraseña?
              </Text>
            </TouchableOpacity>

          </View>

        </View>

        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>
            ¿No tienes cuenta?
          </Text>

          <TouchableOpacity>
            <Text style={styles.registerLink}>
              {' '}Regístrate aquí
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F6F2EA',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },

  logo: {
    width: 70,
    height: 70,
    marginBottom: 10,
  },

  title: {
    fontSize: 42,
    fontWeight: '700',
    color: '#000',
  },

  subtitle: {
    fontSize: 20,
    color: '#222',
    marginTop: 5,
    marginBottom: 30,
  },

  card: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
  },

  backgroundImage: {
    width: '100%',
    height: 420,
    position: 'absolute',
    opacity: 0.45,
  },

  formContainer: {
    padding: 20,
    paddingTop: 60,
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

  loginButton: {
    marginTop: 5,
    height: 58,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',

    backgroundColor: '#529bd6',
  },

  loginText: {
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

  loginButtonDisabled: {
    opacity: 0.7,
  },

  forgotText: {
    textAlign: 'center',
    marginTop: 18,
    fontWeight: '600',
    color: '#222',
  },

  registerContainer: {
    flexDirection: 'row',
    marginTop: 25,
  },

  registerText: {
    fontSize: 16,
  },

  registerLink: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
});