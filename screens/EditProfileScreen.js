import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../src/context/AuthContext';
import { getUserProfile, updateUserProfile } from '../src/services/user.service';
import { uploadImageToGitHub, deleteImageFromGitHub, getPublicImageUrl } from '../src/services/github.service';
import { logger } from '../src/utils/logger';

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { userId, user } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [avatarUri, setAvatarUri] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const oldAvatarPath = useRef(null);
  const oldAvatarSha = useRef(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const profile = await getUserProfile(userId);
      if (profile) {
        setName(profile.name || '');
        setEmail(profile.email || user?.email || '');
        setPhone(profile.phone || '');
        setAddress(profile.address || '');
        if (profile.avatar_url) {
          setAvatarUri(profile.avatar_url);
        }
        oldAvatarPath.current = profile.avatar_path || null;
        oldAvatarSha.current = profile.avatar_sha || null;
      } else {
        setEmail(user?.email || '');
      }
    } catch (err) {
      logger.error('[EditProfile] Error al cargar perfil:', err);
      Alert.alert('Error', 'No se pudo cargar la información del perfil.');
    } finally {
      setIsLoading(false);
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = 'El nombre es obligatorio';
    } else if (name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!email.trim()) {
      newErrors.email = 'El correo es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Ingresa un correo válido';
    }

    if (phone.trim() && !/^[+]?[\d\s()-]{7,20}$/.test(phone.trim())) {
      newErrors.phone = 'Ingresa un teléfono válido (7-20 dígitos)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para seleccionar una foto.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const asset = result.assets[0];
        setAvatarUri(asset.uri);
        setAvatarFile(asset.uri);
      }
    } catch (err) {
      logger.error('[EditProfile] Error al seleccionar imagen:', err);
      Alert.alert('Error', 'No se pudo seleccionar la imagen.');
    }
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);

    try {
      let avatarUrl = avatarUri;

      if (avatarFile) {
        const uploadResult = await uploadImageToGitHub(userId, avatarFile);
        avatarUrl = getPublicImageUrl(uploadResult.path);

        if (oldAvatarPath.current && oldAvatarSha.current) {
          deleteImageFromGitHub(oldAvatarPath.current, oldAvatarSha.current).catch((err) =>
            logger.warn('[EditProfile] No se pudo eliminar avatar anterior:', err.message)
          );
        }

        await updateUserProfile(userId, {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          address: address.trim() || null,
          avatar_url: avatarUrl,
          avatar_path: uploadResult.path,
          avatar_sha: uploadResult.sha,
        });
      } else {
        await updateUserProfile(userId, {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          address: address.trim() || null,
          avatar_url: avatarUri,
        });
      }

      Alert.alert('Éxito', 'Perfil actualizado correctamente.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      logger.error('[EditProfile] Error al guardar:', err);
      Alert.alert('Error', err.message || 'No se pudieron guardar los cambios.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#529BD6" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={22} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Editar Perfil</Text>
            <View style={{ width: 35 }} />
          </View>

          <View style={styles.profileContainer}>
            <Image
              source={{ uri: avatarUri || 'https://via.placeholder.com/150' }}
              style={styles.profileImage}
            />
            <TouchableOpacity style={styles.cameraButton} onPress={pickImage}>
              <Ionicons name="camera" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.label}>Nombre</Text>
            <View style={[styles.inputContainer, errors.name && styles.inputError]}>
              <Ionicons name="person-outline" size={20} color="#999" />
              <TextInput
                placeholder="Tu nombre"
                placeholderTextColor="#B7B7B7"
                style={styles.input}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

            <Text style={styles.label}>Correo Electrónico</Text>
            <View style={[styles.inputContainer, errors.email && styles.inputError]}>
              <Ionicons name="mail-outline" size={20} color="#999" />
              <TextInput
                placeholder="correo@email.com"
                placeholderTextColor="#B7B7B7"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

            <Text style={styles.label}>Teléfono</Text>
            <View style={[styles.inputContainer, errors.phone && styles.inputError]}>
              <Ionicons name="call-outline" size={20} color="#999" />
              <TextInput
                placeholder="+57 300 123 4567"
                placeholderTextColor="#B7B7B7"
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

            <Text style={styles.label}>Dirección</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="location-outline" size={20} color="#999" />
              <TextInput
                placeholder="Calle 123, Ciudad"
                placeholderTextColor="#B7B7B7"
                style={styles.input}
                value={address}
                onChangeText={setAddress}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveText}>Guardar Cambios</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F6F2EA',
  },
  container: {
    flex: 1,
    backgroundColor: '#F6F2EA',
    paddingTop: 55,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 25,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
  },
  profileContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileImage: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 4,
    borderColor: '#fff',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 5,
    right: 120,
    width: 38,
    height: 38,
    borderRadius: 20,
    backgroundColor: '#529BD6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formCard: {
    backgroundColor: '#fff',
    marginHorizontal: 18,
    borderRadius: 25,
    padding: 20,
    elevation: 3,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    borderRadius: 16,
    paddingHorizontal: 15,
    height: 55,
    marginBottom: 18,
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#E74C3C',
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#000',
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 12,
    marginTop: -12,
    marginBottom: 12,
    marginLeft: 5,
  },
  saveButton: {
    height: 58,
    borderRadius: 30,
    backgroundColor: '#529BD6',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
});
