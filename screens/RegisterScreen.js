import { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Image, KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { getAuthErrorMessage } from '../src/services/auth.service';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const isMounted = useRef(true);

  async function handleRegister() {
    Keyboard.dismiss();
    setError('');

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setError('Ingresa tu nombre.');
      return;
    }

    if (!trimmedEmail) {
      setError('Ingresa tu correo electrónico.');
      return;
    }

    if (!password) {
      setError('Ingresa una contraseña.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setIsLoading(true);
    try {
      await register(trimmedEmail, password);
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

        <Text style={styles.title}>Crear Cuenta</Text>

        <Text style={styles.subtitle}>
          Únete a TuLook y organiza tu armario
        </Text>

        <View style={styles.card}>
          <View style={styles.formContainer}>
            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={18} color="#D32F2F" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputContainer}>
              <TextInput
                placeholder="Nombre"
                placeholderTextColor="#B7B7B7"
                style={styles.input}
                value={name}
                onChangeText={(text) => { setName(text); setError(''); }}
                autoCapitalize="words"
                autoComplete="name"
                editable={!isLoading}
              />
              <Ionicons name="person-outline" size={20} color="#B7B7B7" />
            </View>

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
              <Ionicons name="mail-outline" size={20} color="#B7B7B7" />
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
                autoComplete="new-password"
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

            <View style={styles.inputContainer}>
              <TextInput
                placeholder="Confirmar Contraseña"
                placeholderTextColor="#B7B7B7"
                secureTextEntry={!showPassword}
                style={styles.input}
                value={confirmPassword}
                onChangeText={(text) => { setConfirmPassword(text); setError(''); }}
                autoCapitalize="none"
                autoComplete="new-password"
                editable={!isLoading}
              />
              <Ionicons name="lock-closed-outline" size={20} color="#B7B7B7" />
            </View>

            <TouchableOpacity
              style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.registerText}>Crear Cuenta</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>¿Ya tienes cuenta?</Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            disabled={isLoading}
          >
            <Text style={styles.loginLink}> Inicia sesión</Text>
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
    paddingHorizontal: 20,
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
  registerButton: {
    marginTop: 5,
    height: 58,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#529BD6',
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  registerText: {
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
  loginContainer: {
    flexDirection: 'row',
    marginTop: 25,
  },
  loginText: {
    fontSize: 16,
  },
  loginLink: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
});
