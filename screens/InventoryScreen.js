import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  Platform, View, Text, TextInput, StyleSheet, FlatList, Image, TouchableOpacity,
  ActivityIndicator, Modal, Alert, ScrollView, KeyboardAvoidingView, useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import {
  createGarment, uploadGarmentImage, createGarmentFromEmoji,
} from '../src/services/garment.service';
import { useGarments } from '../src/hooks/useGarments';
import { useOutfits } from '../src/hooks/useOutfits';
import { logger } from '../src/utils/logger';
import { useAuth } from '../src/context/AuthContext';
import { GARMENT_CATEGORIES, GARMENT_CATEGORIES_LABELS, GARMENT_TYPES } from '../src/utils/constants';
import { useTheme } from '../src/context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const EMOJI_BY_CATEGORY = {
  [GARMENT_CATEGORIES.TOP]: ['👕', '👚', '🧥', '👔'],
  [GARMENT_CATEGORIES.BOTTOM]: ['👖', '🩳'],
  [GARMENT_CATEGORIES.DRESS]: ['👗', '👘'],
  [GARMENT_CATEGORIES.SHOES]: ['👟', '👠', '🥾'],
  [GARMENT_CATEGORIES.ACCESSORY]: ['👜', '🧢', '🕶️', '⌚'],
};

const DEFAULT_SUBTYPE_BY_EMOJI = {
  '👕': 'Camisa',
  '👚': 'Blusa',
  '🧥': 'Chamarra',
  '👔': 'Camisa',
  '👖': 'Jean',
  '🩳': 'Short',
  '👗': 'Vestido corto',
  '👘': 'Mono',
  '👟': 'Tenis',
  '👠': 'Tacones',
  '🥾': 'Botas',
  '👜': 'Bolso',
  '🧢': 'Gorra',
  '🕶️': 'Lentes',
  '⌚': 'Reloj',
};

const getCategoryForEmoji = (emoji) => {
  for (const [category, emojis] of Object.entries(EMOJI_BY_CATEGORY)) {
    if (emojis.includes(emoji)) {
      return category;
    }
  }
  return GARMENT_CATEGORIES.TOP;
};

const COLOR_OPTIONS = [
  { hex: '#FF6B6B', name: 'Rojo' },
  { hex: '#FFA94D', name: 'Naranja' },
  { hex: '#FFD43B', name: 'Amarillo' },
  { hex: '#69DB7C', name: 'Verde' },
  { hex: '#4DABF7', name: 'Azul' },
  { hex: '#9775FA', name: 'Púrpura' },
  { hex: '#F783AC', name: 'Rosa' },
  { hex: '#C0C0C0', name: 'Plata' },
  { hex: '#F8F9FA', name: 'Blanco' },
  { hex: '#495057', name: 'Gris Oscuro' },
  { hex: '#212529', name: 'Negro' },
  { hex: '#E9ECEF', name: 'Gris Claro' },
  { hex: '#D4A373', name: 'Beige' },
  { hex: '#A98467', name: 'Marrón' },
  { hex: '#5C940D', name: 'Oliva' },
  { hex: '#A61E24', name: 'Borgoña' },
];

function buildInfo(garment) {
  const parts = [];
  if (garment.subtype) parts.push(garment.subtype);
  if (garment.quantity != null) parts.push(`×${garment.quantity}`);
  return parts.join(' | ') || '—';
}

const InventarioScreen = () => {
  const { colors } = useTheme();
  const { userId } = useAuth();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isSmallScreen = windowHeight < 700;
  const isLandscape = windowWidth > windowHeight;
  const previewHeight = isSmallScreen ? (isLandscape ? 100 : 160) : (isLandscape ? 140 : 220);

  const themedStyles = useMemo(() => getStyles(colors, windowHeight, insets), [colors, windowHeight, insets]);

  const { allGarments, isLoading, refresh, deleteGarment, deleteAllGarments } = useGarments();
  const {
    outfits: savedOutfits,
    isLoading: outfitsLoading,
    isDeleting: isDeletingOutfits,
    refresh: refreshOutfits,
    deleteOutfit: deleteSavedOutfit,
    deleteAllOutfits: deleteAllSavedOutfits,
  } = useOutfits();

  const [activeTab, setActiveTab] = useState('PRENDAS');
  const [showModal, setShowModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGarmentForm, setShowGarmentForm] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState(GARMENT_CATEGORIES.TOP);
  const [formCategory, setFormCategory] = useState(GARMENT_CATEGORIES.TOP);
  const [formSubtype, setFormSubtype] = useState('');
  const [formColor, setFormColor] = useState('#CCC');
  const [formCustomColor, setFormCustomColor] = useState('');
  const [formName, setFormName] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingLabel, setProcessingLabel] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [showOutfitDetail, setShowOutfitDetail] = useState(false);
  const [selectedOutfit, setSelectedOutfit] = useState(null);
  const [pendingGarment, setPendingGarment] = useState(null);
  const mountedRef = useRef(true);

  React.useEffect(() => {
    const isBtnDisabled = !formSubtype || !pendingGarment;
    console.log('[DEBUG] Botón "Siguiente" habilitado:', !isBtnDisabled, '(Subtipo:', formSubtype, ', Prenda pendiente:', !!pendingGarment, ')');
  }, [formSubtype, pendingGarment]);

  React.useEffect(() => {
    console.log('[DEBUG] Categoría del formulario cambiada a:', formCategory);
  }, [formCategory]);

  const getColor = (hex) => {
    if (!hex || hex === 'multi') return colors.inventoryColorDotFallback;
    return hex;
  };

  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => {
    console.log('[DEBUG] Cerrando modal del formulario.');
    setShowModal(false);
    setShowEmojiPicker(false);
    setShowGarmentForm(false);
    setFormStep(1);
    setPendingGarment(null);
  };

  const handleTakePhoto = async (isRetake = false) => {
    try {
      console.log('[DEBUG] Iniciando captura de foto con la cámara. isRetake:', isRetake);
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        if (Platform.OS === 'web') {
          window.alert('Se necesita acceso a la cámara para tomar fotos.');
        } else {
          Alert.alert('Permiso requerido', 'Se necesita acceso a la cámara para tomar fotos.');
        }
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.7,
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (result.canceled || !result.assets?.[0]) {
        console.log('[DEBUG] Captura de foto cancelada.');
        return;
      }

      console.log('[DEBUG] Foto capturada correctamente. URI:', result.assets[0].uri);
      const newPhoto = { type: 'photo', uri: result.assets[0].uri };
      setPendingGarment(newPhoto);
      setImageLoadError(false);
      if (!isRetake) {
        openGarmentForm(GARMENT_CATEGORIES.TOP, '');
      }
    } catch (err) {
      logger.warn('[Inventory] Error al tomar foto:', err.message);
      if (Platform.OS === 'web') {
        window.alert('No se pudo tomar la foto. Intenta de nuevo.');
      } else {
        Alert.alert('Error', 'No se pudo tomar la foto. Intenta de nuevo.');
      }
    }
  };

  const handlePickImageFromGallery = async (isRetake = false) => {
    try {
      console.log('[DEBUG] Seleccionando imagen de la galería. isRetake:', isRetake);
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        if (Platform.OS === 'web') {
          window.alert('Se necesita acceso a la galería para seleccionar fotos.');
        } else {
          Alert.alert('Permiso requerido', 'Se necesita acceso a la galería para seleccionar fotos.');
        }
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions?.Images || 'images',
        quality: 0.7,
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (result.canceled || !result.assets?.[0]) {
        console.log('[DEBUG] Selección de imagen cancelada.');
        return;
      }

      console.log('[DEBUG] Imagen de galería seleccionada correctamente. URI:', result.assets[0].uri);
      const newPhoto = { type: 'photo', uri: result.assets[0].uri };
      setPendingGarment(newPhoto);
      setImageLoadError(false);
      if (!isRetake) {
        openGarmentForm(GARMENT_CATEGORIES.TOP, '');
      }
    } catch (err) {
      logger.warn('[Inventory] Error al seleccionar imagen de la galería:', err.message);
      if (Platform.OS === 'web') {
        window.alert('No se pudo seleccionar la imagen. Intenta de nuevo.');
      } else {
        Alert.alert('Error', 'No se pudo seleccionar la imagen. Intenta de nuevo.');
      }
    }
  };

  const handleChangePhoto = () => {
    console.log('[DEBUG] Iniciando cambio de foto (Cámara / Galería).');
    if (Platform.OS === 'web') {
      const option = window.confirm('¿Quieres elegir desde la galería? (Aceptar para Galería, Cancelar para Cámara)');
      if (option) {
        handlePickImageFromGallery(true);
      } else {
        handleTakePhoto(true);
      }
    } else {
      Alert.alert(
        'Cambiar foto',
        'Selecciona una opción:',
        [
          { text: 'Cámara', onPress: () => handleTakePhoto(true) },
          { text: 'Galería', onPress: () => handlePickImageFromGallery(true) },
          { text: 'Cancelar', style: 'cancel' },
        ]
      );
    }
  };

  const openGarmentForm = (initialCategory = GARMENT_CATEGORIES.TOP, initialSubtype = '') => {
    console.log('[DEBUG] Abriendo formulario de prenda. Categoría:', initialCategory, 'Subtipo:', initialSubtype);
    setFormCategory(initialCategory);
    setFormSubtype(initialSubtype);
    setFormColor('#CCC');
    setFormCustomColor('');
    setFormName('');
    setFormNotes('');
    setFormStep(1);
    setImageLoadError(false);
    setProcessingLabel('');
    setShowModal(false);
    setShowGarmentForm(true);
  };

  const saveGarment = async () => {
    if (!formSubtype) {
      if (Platform.OS === 'web') {
        window.alert('Selecciona un tipo de prenda');
      } else {
        Alert.alert('Campo requerido', 'Selecciona un tipo de prenda');
      }
      return;
    }
    if (!formCustomColor.trim() && formColor === '#CCC') {
      if (Platform.OS === 'web') {
        window.alert('Selecciona un color');
      } else {
        Alert.alert('Campo requerido', 'Selecciona un color para la prenda');
      }
      return;
    }

    const color = formCustomColor.trim() || formColor;
    const name = formName.trim() || formSubtype;
    const notes = formNotes.trim() || null;

    setShowGarmentForm(false);
    setIsProcessing(true);

    try {
      const pg = pendingGarment;
      if (!pg) return;

      console.log('[DEBUG] Guardando prenda. Categoría:', formCategory, 'Subtipo:', formSubtype, 'Tipo de origen:', pg.type);

      if (pg.type === 'photo') {
        setProcessingLabel('Subiendo imagen...');
        const uploaded = await uploadGarmentImage(userId, pg.uri);
        setProcessingLabel('Guardando prenda...');
        await createGarment(userId, {
          name,
          category: formCategory,
          subtype: formSubtype,
          color_hex: color,
          notes,
          image_url: uploaded.image_url,
          github_path: uploaded.github_path,
          github_sha: uploaded.github_sha,
          quantity: 1,
        });
      } else if (pg.type === 'emoji') {
        setProcessingLabel('Guardando prenda...');
        await createGarmentFromEmoji(userId, pg.emoji, formCategory, color, formSubtype, notes);
      }

      setPendingGarment(null);
      refresh();
    } catch (err) {
      logger.warn('[Inventory] Error al crear prenda:', err.message);
      Alert.alert('Error', 'No se pudo guardar la prenda. Intenta de nuevo.');
    } finally {
      if (mountedRef.current) {
        setIsProcessing(false);
        setProcessingLabel('');
      }
    }
  };

  const handleOpenEmojiPicker = () => {
    setSelectedEmojiCategory(GARMENT_CATEGORIES.TOP);
    setShowEmojiPicker(true);
  };

  const handleSelectEmoji = (emoji) => {
    const category = getCategoryForEmoji(emoji);
    const subtype = DEFAULT_SUBTYPE_BY_EMOJI[emoji] || '';
    console.log('[DEBUG] Emoji seleccionado:', emoji, 'Categoría asignada:', category, 'Subtipo asignado:', subtype);
    setPendingGarment({ type: 'emoji', emoji, category });
    openGarmentForm(category, subtype);
  };

  const handleDeleteGarment = useCallback(async (garment) => {
    if (isDeleting) return;
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('¿Estás segura de eliminar esta prenda? Esta acción no se puede deshacer.');
      if (!confirmed) return;
      setIsDeleting(true);
      try {
        await deleteGarment(garment.id);
        refresh();
        window.alert('Prenda eliminada');
      } catch (err) {
        logger.warn('[Inventory] Error al eliminar:', err.message);
        window.alert('Error al eliminar: ' + err.message);
      } finally {
        setIsDeleting(false);
      }
    } else {
      Alert.alert(
        'Eliminar prenda',
        '¿Estás segura de que deseas eliminar esta prenda de tu closet?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar', style: 'destructive', onPress: async () => {
              setIsDeleting(true);
              try {
                await deleteGarment(garment.id);
                Alert.alert('', 'La prenda fue eliminada correctamente');
              } catch (err) {
                logger.warn('[Inventory] Error al eliminar:', err.message);
                Alert.alert('Error', 'No se pudo eliminar la prenda: ' + err.message);
              } finally {
                setIsDeleting(false);
              }
            },
          },
        ],
      );
    }
  }, [isDeleting, deleteGarment, refresh]);

  const handleDeleteAll = useCallback(async () => {
    if (activeTab === 'PRENDAS') {
      if (isDeleting || allGarments.length === 0) return;
      if (Platform.OS === 'web') {
        const confirmed = window.confirm('¿Estás segura de eliminar TODAS las prendas? Esta acción no se puede deshacer.');
        if (!confirmed) return;
        setIsDeleting(true);
        try {
          await deleteAllGarments();
          refresh();
          window.alert('Todas las prendas fueron eliminadas.');
        } catch (err) {
          logger.warn('[Inventory] Error al eliminar todo:', err.message);
          window.alert('Error al eliminar: ' + err.message);
        } finally {
          setIsDeleting(false);
        }
      } else {
        Alert.alert(
          'Eliminar prendas',
          '¿Deseas eliminar todas las prendas del inventario?',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Eliminar todo', style: 'destructive', onPress: () => {
                Alert.alert(
                  '¿Estás segura?',
                  'Esta acción NO se puede deshacer.',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Eliminar todo', style: 'destructive', onPress: async () => {
                        setIsDeleting(true);
                        try {
                          await deleteAllGarments();
                          Alert.alert('', 'Todas las prendas fueron eliminadas.');
                        } catch (err) {
                          logger.warn('[Inventory] Error al eliminar todo:', err.message);
                          Alert.alert('Error', 'No se pudieron eliminar las prendas: ' + err.message);
                        } finally {
                          setIsDeleting(false);
                        }
                      },
                    },
                  ],
                );
              },
            },
          ],
        );
      }
    } else {
      if (isDeletingOutfits || savedOutfits.length === 0) return;
      if (Platform.OS === 'web') {
        const confirmed = window.confirm('¿Estás segura de eliminar TODOS los outfits? Esta acción no se puede deshacer.');
        if (!confirmed) return;
        setIsDeleting(true);
        try {
          await deleteAllSavedOutfits();
          refreshOutfits();
          window.alert('Todos los outfits fueron eliminados.');
        } catch (err) {
          logger.warn('[Inventory] Error al eliminar outfits:', err.message);
          window.alert('Error al eliminar: ' + err.message);
        } finally {
          setIsDeleting(false);
        }
      } else {
        Alert.alert(
          'Eliminar outfits',
          '¿Deseas eliminar todos los outfits guardados?',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Eliminar todo', style: 'destructive', onPress: () => {
                Alert.alert(
                  '¿Estás segura?',
                  'Esta acción NO se puede deshacer.',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Eliminar todo', style: 'destructive', onPress: async () => {
                        setIsDeleting(true);
                        try {
                          await deleteAllSavedOutfits();
                          refreshOutfits();
                          Alert.alert('', 'Todos los outfits fueron eliminados.');
                        } catch (err) {
                          logger.warn('[Inventory] Error al eliminar outfits:', err.message);
                          Alert.alert('Error', 'No se pudieron eliminar los outfits: ' + err.message);
                        } finally {
                          setIsDeleting(false);
                        }
                      },
                    },
                  ],
                );
              },
            },
          ],
        );
      }
    }
  }, [isDeleting, isDeletingOutfits, activeTab, allGarments, savedOutfits, deleteAllGarments, deleteAllSavedOutfits, refresh, refreshOutfits]);

  const handleDeleteOutfit = useCallback(async (outfit) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`¿Deseas eliminar el outfit "${outfit.name || 'sin nombre'}"?`);
      if (!confirmed) return;
      try {
        await deleteSavedOutfit(outfit.id);
      } catch (err) {
        logger.warn('[Inventory] Error al eliminar outfit:', err.message);
        window.alert('No se pudo eliminar el outfit. Verifica tu conexión e intenta de nuevo.');
      }
    } else {
      Alert.alert(
        'Eliminar outfit',
        `¿Deseas eliminar "${outfit.name || 'sin nombre'}"?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar', style: 'destructive', onPress: async () => {
              try {
                await deleteSavedOutfit(outfit.id);
              } catch (err) {
                logger.warn('[Inventory] Error al eliminar outfit:', err.message);
                Alert.alert('Error', 'No se pudo eliminar el outfit. Verifica tu conexión e intenta de nuevo.');
              }
            },
          },
        ],
      );
    }
  }, [deleteSavedOutfit]);

  const handleOpenOutfitDetail = useCallback((outfit) => {
    setSelectedOutfit(outfit);
    setShowOutfitDetail(true);
  }, []);

  const handleCloseOutfitDetail = useCallback(() => {
    setShowOutfitDetail(false);
    setSelectedOutfit(null);
  }, []);

  const renderItem = ({ item }) => {
    return (
      <View style={themedStyles.card}>
        <TouchableOpacity
          style={themedStyles.deleteButton}
          onPress={() => {
            handleDeleteGarment(item);
          }}
          disabled={isDeleting}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={14} color={isDeleting ? '#CCC' : '#C0392B'} />
        </TouchableOpacity>

      <View style={[themedStyles.colorDot, { backgroundColor: getColor(item.color_hex) }]} />

      <View style={themedStyles.imagePlaceholder}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={themedStyles.garmentImage} />
        ) : (
          <Text style={{ fontSize: 36 }}>{item.emoji || '👕'}</Text>
        )}
      </View>

      <Text style={themedStyles.itemName} numberOfLines={1}>{item.name}</Text>
      <Text style={themedStyles.itemInfo}>{buildInfo(item)}</Text>
    </View>
  );
  };

  const renderOutfitItem = ({ item }) => {
    const garmentCount = item.garments?.length || item.garment_ids?.length || 0;
    const previewGarment = item.garments?.[0];
    const createdDate = item.created_at?.toDate
      ? item.created_at.toDate()
      : item.created_at
        ? new Date(item.created_at)
        : null;
    const dateStr = createdDate
      ? `${createdDate.getDate()}/${createdDate.getMonth() + 1}/${createdDate.getFullYear()}`
      : '';

    return (
      <TouchableOpacity
        style={themedStyles.outfitCard}
        activeOpacity={0.85}
        onPress={() => handleOpenOutfitDetail(item)}
      >
        <TouchableOpacity
          style={themedStyles.outfitDeleteBtn}
          onPress={() => handleDeleteOutfit(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={14} color="#C0392B" />
        </TouchableOpacity>
        <View style={themedStyles.outfitCardPreview}>
          {previewGarment ? (
            <>
              {previewGarment.image_url ? (
                <Image source={{ uri: previewGarment.image_url }} style={themedStyles.outfitCardImage} />
              ) : (
                <Text style={{ fontSize: 32 }}>{previewGarment.emoji || '👕'}</Text>
              )}
            </>
          ) : (
            <Ionicons name="bag-outline" size={28} color="#DDD" />
          )}
        </View>
        <View style={themedStyles.outfitCardInfo}>
          <Text style={themedStyles.outfitCardName} numberOfLines={1}>
            {item.name || 'Outfit'}
          </Text>
          <View style={themedStyles.outfitCardMeta}>
            <Text style={themedStyles.outfitCardCount}>{garmentCount} prendas</Text>
            {dateStr ? (
              <Text style={themedStyles.outfitCardDate}>{dateStr}</Text>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // --------- Loading state (initial load only) ----------
  if (isLoading && allGarments.length === 0) {
    return (
      <View style={themedStyles.container}>
        <View style={themedStyles.header}>
          <Ionicons name="shirt-outline" size={28} color="#555" />
          <Text style={themedStyles.headerTitle}>INVENTARIO</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={themedStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#999" />
        </View>
      </View>
    );
  }

  return (
    <View style={themedStyles.container}>
      <View style={themedStyles.header}>
        <Ionicons name="shirt-outline" size={28} color="#555" />
        <Text style={themedStyles.headerTitle}>INVENTARIO</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(activeTab === 'PRENDAS' ? allGarments.length > 0 : savedOutfits.length > 0) && (
            <TouchableOpacity
              onPress={handleDeleteAll}
              disabled={isDeleting}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="trash-bin-outline"
                size={22}
                color={isDeleting ? '#CCC' : '#C0392B'}
              />
            </TouchableOpacity>
          )}
          <View style={{ width: 28 }} />
        </View>
      </View>

      <View style={themedStyles.tabContainer}>
        <TouchableOpacity
          style={[themedStyles.tab, activeTab === 'PRENDAS' && themedStyles.activeTab]}
          onPress={() => setActiveTab('PRENDAS')}
        >
          <Text style={[themedStyles.tabText, activeTab === 'PRENDAS' && themedStyles.activeTabText]}>PRENDAS</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[themedStyles.tab, activeTab === 'OUTFITS' && themedStyles.activeTab]}
          onPress={() => setActiveTab('OUTFITS')}
        >
          <Text style={[themedStyles.tabText, activeTab === 'OUTFITS' && themedStyles.activeTabText]}>OUTFITS</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'PRENDAS' ? (
        allGarments.length === 0 ? (
          <View style={themedStyles.emptyContainer}>
            <Ionicons name="shirt-outline" size={60} color="#DDD" />
            <Text style={themedStyles.emptyText}>Aún no tienes prendas</Text>
            <Text style={themedStyles.emptySubtext}>Agrega tu primera prenda</Text>
          </View>
        ) : (
          <FlatList
            data={allGarments}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            numColumns={3}
            extraData={isDeleting}
            contentContainerStyle={themedStyles.listContent}
            columnWrapperStyle={themedStyles.columnWrapper}
          />
        )
      ) : (
        <>
          {outfitsLoading ? (
            <View style={themedStyles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.textTertiary} />
            </View>
          ) : savedOutfits.length === 0 ? (
            <View style={themedStyles.emptyContainer}>
              <Ionicons name="bag-outline" size={60} color="#DDD" />
              <Text style={themedStyles.emptyText}>Aún no tienes outfits</Text>
              <Text style={themedStyles.emptySubtext}>Crea tu primer outfit desde la pantalla de outfits</Text>
            </View>
          ) : (
            <FlatList
              data={savedOutfits}
              renderItem={renderOutfitItem}
              keyExtractor={(item) => item.id}
              numColumns={2}
              contentContainerStyle={themedStyles.outfitListContent}
              columnWrapperStyle={themedStyles.outfitColumnWrapper}
            />
          )}
        </>
      )}

      {isDeleting && (
        <View style={themedStyles.deletingOverlay}>
          <ActivityIndicator size="small" color="#FFF" />
          <Text style={themedStyles.deletingText}>Eliminando...</Text>
        </View>
      )}

      <TouchableOpacity
        style={[themedStyles.fab, isDeleting && { opacity: 0.4 }]}
        onPress={handleOpenModal}
        activeOpacity={0.85}
        disabled={isDeleting}
      >
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <TouchableOpacity
          style={themedStyles.modalOverlay}
          activeOpacity={1}
          onPress={handleCloseModal}
        >
          <View style={themedStyles.modalContent}>
            {!showEmojiPicker ? (
              <>
                <TouchableOpacity
                  style={themedStyles.modalOption}
                  onPress={() => handleTakePhoto(false)}
                  disabled={isProcessing}
                >
                  <Ionicons name="camera-outline" size={24} color={colors.text} />
                  <Text style={themedStyles.modalOptionText}>Tomar foto</Text>
                </TouchableOpacity>

                <View style={themedStyles.modalDivider} />

                <TouchableOpacity
                  style={themedStyles.modalOption}
                  onPress={() => handlePickImageFromGallery(false)}
                  disabled={isProcessing}
                >
                  <Ionicons name="image-outline" size={24} color={colors.text} />
                  <Text style={themedStyles.modalOptionText}>Subir foto (Galería)</Text>
                </TouchableOpacity>

                <View style={themedStyles.modalDivider} />

                <TouchableOpacity
                  style={themedStyles.modalOption}
                  onPress={handleOpenEmojiPicker}
                  disabled={isProcessing}
                >
                  <Text style={{ fontSize: 24 }}>👕</Text>
                  <Text style={themedStyles.modalOptionText}>Elegir emoji</Text>
                </TouchableOpacity>

                {isProcessing && (
                  <View style={{ alignItems: 'center', marginTop: 12 }}>
                    <ActivityIndicator size="small" color={colors.textTertiary} />
                    {processingLabel ? (
                      <Text style={{ fontSize: 12, color: colors.textTertiary, marginTop: 6 }}>
                        {processingLabel}
                      </Text>
                    ) : null}
                  </View>
                )}
              </>
            ) : (
              <>
                <Text style={themedStyles.modalTitle}>Elige un emoji</Text>

                <View style={themedStyles.categoryRow}>
                  {Object.entries(GARMENT_CATEGORIES_LABELS).map(([key, label]) => (
                    <TouchableOpacity
                      key={key}
                      style={[
                        themedStyles.categoryChip,
                        selectedEmojiCategory === key && themedStyles.categoryChipActive,
                      ]}
                      onPress={() => setSelectedEmojiCategory(key)}
                    >
                      <Text
                        style={[
                          themedStyles.categoryChipText,
                          selectedEmojiCategory === key && themedStyles.categoryChipTextActive,
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={themedStyles.emojiGrid}>
                  {EMOJI_BY_CATEGORY[selectedEmojiCategory].map((emoji) => (
                    <TouchableOpacity
                      key={emoji}
                      style={themedStyles.emojiItem}
                      onPress={() => handleSelectEmoji(emoji)}
                    >
                      <Text style={{ fontSize: 32 }}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showGarmentForm}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGarmentForm(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={themedStyles.formOverlay}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <TouchableOpacity
            style={themedStyles.formOverlayBackdrop}
            activeOpacity={1}
            onPress={handleCloseModal}
          />
          <View style={themedStyles.formContent}>
            {/* Header */}
            <View style={themedStyles.formHeader}>
              <Text style={themedStyles.formTitle}>Nueva prenda</Text>
              <TouchableOpacity
                style={themedStyles.formCloseBtn}
                onPress={handleCloseModal}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color="#999" />
              </TouchableOpacity>
            </View>

            {/* Image preview */}
            {pendingGarment?.type === 'photo' ? (
              <View style={themedStyles.formImagePreviewCard}>
                {imageLoadError ? (
                  <View style={[themedStyles.formImagePlaceholder, { maxHeight: previewHeight }]}>
                    <Ionicons name="image-outline" size={36} color="#CCC" />
                    <Text style={themedStyles.formImagePlaceholderText}>Error al cargar imagen</Text>
                  </View>
                ) : (
                  <Image
                    source={{ uri: pendingGarment.uri }}
                    style={[themedStyles.formImagePreview, { maxHeight: previewHeight }]}
                    resizeMode="contain"
                    onError={() => setImageLoadError(true)}
                  />
                )}
              </View>
            ) : pendingGarment?.type === 'emoji' ? (
              <View style={themedStyles.formEmojiPreviewCard}>
                <Text style={themedStyles.formEmojiPreview}>{pendingGarment.emoji}</Text>
              </View>
            ) : null}

            {/* Step indicator */}
            <View style={themedStyles.formSteps}>
              <View style={[themedStyles.formStepDot, formStep >= 1 && themedStyles.formStepDotActive]} />
              <View style={themedStyles.formStepLine} />
              <View style={[themedStyles.formStepDot, formStep >= 2 && themedStyles.formStepDotActive]} />
              <View style={themedStyles.formStepLine} />
              <View style={[themedStyles.formStepDot, formStep >= 3 && themedStyles.formStepDotActive]} />
            </View>

            {/* Scrollable form body */}
            <ScrollView
              style={themedStyles.formBody}
              contentContainerStyle={themedStyles.formBodyContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              {formStep === 1 && (
                <View>
                  <Text style={themedStyles.formSectionTitle}>Categoría y tipo</Text>

                  <Text style={themedStyles.formLabel}>Categoría</Text>
                  <View style={themedStyles.formChipRow}>
                    {Object.entries(GARMENT_CATEGORIES_LABELS).map(([key, label]) => (
                      <TouchableOpacity
                        key={key}
                        style={[
                          themedStyles.formChip,
                          formCategory === key && themedStyles.formChipActive,
                        ]}
                        onPress={() => {
                          setFormCategory(key);
                          setFormSubtype('');
                        }}
                      >
                        <Text style={[
                          themedStyles.formChipText,
                          formCategory === key && themedStyles.formChipTextActive,
                        ]}>{label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={themedStyles.formLabel}>Tipo de prenda</Text>
                  <View style={themedStyles.formChipRow}>
                    {GARMENT_TYPES[formCategory].map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          themedStyles.formChip,
                          formSubtype === type && themedStyles.formChipActive,
                        ]}
                        onPress={() => setFormSubtype(type)}
                      >
                        <Text style={[
                          themedStyles.formChipText,
                          formSubtype === type && themedStyles.formChipTextActive,
                        ]}>{type}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {formStep === 2 && (
                <View>
                  <Text style={themedStyles.formSectionTitle}>Elige un color</Text>

                  <View style={themedStyles.formColorGrid}>
                    {COLOR_OPTIONS.map((c) => (
                      <TouchableOpacity
                        key={c.hex}
                        style={[
                          themedStyles.formColorSwatch,
                          { backgroundColor: c.hex },
                          formColor === c.hex && themedStyles.formColorSwatchSelected,
                          c.hex === '#F8F9FA' && { borderWidth: 1, borderColor: '#DDD' },
                        ]}
                        onPress={() => setFormColor(c.hex)}
                      >
                        {formColor === c.hex && (
                          <Ionicons name="checkmark" size={18} color="#FFF" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={themedStyles.formColorInputRow}>
                    <Text style={themedStyles.formColorLabel}>Personalizado:</Text>
                    <TextInput
                      style={themedStyles.formColorInput}
                      placeholder="#HEX"
                      placeholderTextColor="#999"
                      value={formCustomColor}
                      onChangeText={setFormCustomColor}
                      maxLength={7}
                      autoCapitalize="characters"
                    />
                    {formCustomColor.length === 7 && (
                      <View style={[themedStyles.formColorPreview, { backgroundColor: formCustomColor }]} />
                    )}
                  </View>
                </View>
              )}

              {formStep === 3 && (
                <View>
                  <Text style={themedStyles.formSectionTitle}>Nombre y notas</Text>

                  <Text style={themedStyles.formLabel}>Nombre (opcional)</Text>
                  <TextInput
                    style={themedStyles.formTextInput}
                    placeholder="Ej: Blusa blanca elegante"
                    placeholderTextColor="#999"
                    value={formName}
                    onChangeText={setFormName}
                    maxLength={60}
                  />

                  <Text style={themedStyles.formLabel}>Notas (opcional)</Text>
                  <TextInput
                    style={[themedStyles.formTextInput, themedStyles.formTextArea]}
                    placeholder="Ej: Perfecta para la oficina"
                    placeholderTextColor="#999"
                    value={formNotes}
                    onChangeText={setFormNotes}
                    multiline
                    numberOfLines={3}
                    maxLength={200}
                  />

                  <View style={themedStyles.formSummary}>
                    <Text style={themedStyles.formSummaryText}>
                      {GARMENT_CATEGORIES_LABELS[formCategory]} — {formSubtype}
                    </Text>
                    <View style={[themedStyles.formSummaryDot, { backgroundColor: formCustomColor.trim() || formColor }]} />
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Sticky footer */}
            {formStep < 3 ? (
              <View style={themedStyles.formFooter}>
                <TouchableOpacity
                  style={themedStyles.formChangePhotoBtn}
                  onPress={pendingGarment?.type === 'photo' ? handleChangePhoto : undefined}
                >
                  {pendingGarment?.type === 'photo' && (
                    <>
                      <Ionicons name="camera-outline" size={16} color="#E67E22" />
                      <Text style={themedStyles.formChangePhotoText}>Cambiar foto</Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    themedStyles.formNextBtn,
                    (!formSubtype || !pendingGarment) && themedStyles.formNextBtnDisabled
                  ]}
                  disabled={!formSubtype || !pendingGarment}
                  onPress={() => {
                    console.log('[DEBUG] Avanzando al paso:', formStep + 1);
                    setFormStep(formStep + 1);
                  }}
                >
                  <Text style={themedStyles.formNextBtnText}>Siguiente</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={themedStyles.formFooter}>
                <TouchableOpacity style={themedStyles.formBackBtn} onPress={() => setFormStep(2)}>
                  <Text style={themedStyles.formBackBtnText}>Atrás</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={themedStyles.formSaveBtn}
                  onPress={saveGarment}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <View style={themedStyles.formSaveBtnProcessing}>
                      <ActivityIndicator size="small" color="#FFF" />
                      <Text style={themedStyles.formSaveBtnProcessingText}>{processingLabel}</Text>
                    </View>
                  ) : (
                    <Text style={themedStyles.formSaveBtnText}>Guardar prenda</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Outfit detail modal */}
      <Modal
        visible={showOutfitDetail}
        transparent
        animationType="slide"
        onRequestClose={handleCloseOutfitDetail}
      >
        <View style={themedStyles.formOverlay}>
          <TouchableOpacity
            style={themedStyles.formOverlayBackdrop}
            activeOpacity={1}
            onPress={handleCloseOutfitDetail}
          />
          <View style={themedStyles.outfitDetailContent}>
            {/* Header */}
            <View style={themedStyles.outfitDetailHeader}>
              <Text style={themedStyles.outfitDetailTitle} numberOfLines={1}>
                {selectedOutfit?.name || 'Detalles del outfit'}
              </Text>
              <TouchableOpacity
                style={themedStyles.formCloseBtn}
                onPress={handleCloseOutfitDetail}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color="#999" />
              </TouchableOpacity>
            </View>

            {/* Outfit meta */}
            {selectedOutfit && (
              <View style={themedStyles.outfitDetailMeta}>
                <Text style={themedStyles.outfitDetailMetaText}>
                  {selectedOutfit.garments?.length || selectedOutfit.garment_ids?.length || 0} prendas
                </Text>
                {(() => {
                  const d = selectedOutfit.created_at?.toDate
                    ? selectedOutfit.created_at.toDate()
                    : selectedOutfit.created_at
                      ? new Date(selectedOutfit.created_at)
                      : null;
                  return d ? (
                    <Text style={themedStyles.outfitDetailMetaText}>
                      {d.getDate()}/{d.getMonth() + 1}/{d.getFullYear()}
                    </Text>
                  ) : null;
                })()}
                <TouchableOpacity
                  style={themedStyles.outfitDetailDeleteBtn}
                  onPress={() => {
                    handleCloseOutfitDetail();
                    handleDeleteOutfit(selectedOutfit);
                  }}
                >
                  <Ionicons name="trash-outline" size={16} color="#C0392B" />
                  <Text style={themedStyles.outfitDetailDeleteText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Garments list */}
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={themedStyles.outfitDetailList}
              showsVerticalScrollIndicator={false}
            >
              {selectedOutfit?.garments?.length > 0 ? (
                selectedOutfit.garments.map((garment, index) => (
                  <View key={garment.id || index} style={themedStyles.outfitDetailGarmentCard}>
                    <View style={themedStyles.outfitDetailGarmentImageWrap}>
                      {garment.image_url ? (
                        <Image
                          source={{ uri: garment.image_url }}
                          style={themedStyles.outfitDetailGarmentImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text style={{ fontSize: 48 }}>{garment.emoji || '👕'}</Text>
                      )}
                    </View>
                    <View style={themedStyles.outfitDetailGarmentInfo}>
                      <Text style={themedStyles.outfitDetailGarmentName}>
                        {garment.name || garment.subtype || 'Prenda'}
                      </Text>
                      {garment.subtype && (
                        <Text style={themedStyles.outfitDetailGarmentSub}>{garment.subtype}</Text>
                      )}
                      <View style={themedStyles.outfitDetailGarmentTags}>
                        <View style={themedStyles.outfitDetailTag}>
                          <Text style={themedStyles.outfitDetailTagText}>
                            {garment.category ? GARMENT_CATEGORIES_LABELS[garment.category] || garment.category : ''}
                          </Text>
                        </View>
                        {garment.color_hex && garment.color_hex !== 'multi' && (
                          <View style={[themedStyles.outfitDetailColorDot, { backgroundColor: garment.color_hex }]} />
                        )}
                      </View>
                      {garment.notes && (
                        <Text style={themedStyles.outfitDetailNotes} numberOfLines={2}>
                          {garment.notes}
                        </Text>
                      )}
                    </View>
                  </View>
                ))
              ) : (
                <View style={themedStyles.emptyContainer}>
                  <Ionicons name="bag-outline" size={48} color="#DDD" />
                  <Text style={themedStyles.emptyText}>No hay prendas en este outfit</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

function getStyles(colors, winHeight, insets = { top: 0, bottom: 0 }) {
  const safeHeight = winHeight || 700;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: insets.top,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 10,
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 1,
      color: colors.text,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingBottom: 80 + insets.bottom,
    },
    emptyText: {
      fontSize: 16,
      color: colors.inventoryEmptyText,
      marginTop: 16,
      fontWeight: '600',
    },
    emptySubtext: {
      fontSize: 13,
      color: colors.inventoryEmptySubtext,
      marginTop: 4,
    },
    tabContainer: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: colors.inventoryTabBorder,
      marginBottom: 10,
    },
    tab: {
      flex: 1,
      paddingVertical: 15,
      alignItems: 'center',
    },
    activeTab: {
      borderBottomWidth: 2,
      borderBottomColor: colors.inventoryTabActiveBorder,
    },
    tabText: {
      fontSize: 14,
      color: colors.inventoryTabText,
      fontWeight: '600',
    },
    activeTabText: {
      color: colors.inventoryTabActiveText,
    },
    listContent: {
      paddingHorizontal: 10,
      paddingBottom: 20 + insets.bottom + 80,
    },
    columnWrapper: {
      gap: 10,
    },
    outfitListContent: {
      paddingHorizontal: 10,
      paddingBottom: 20 + insets.bottom + 80,
    },
    outfitColumnWrapper: {
      gap: 10,
    },
    outfitCard: {
      backgroundColor: colors.card,
      flex: 1,
      borderRadius: 16,
      marginBottom: 12,
      overflow: 'hidden',
      ...Platform.select({
        web: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
        default: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
        },
      }),
    },
    outfitCardPreview: {
      width: '100%',
      aspectRatio: 1.2,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.inventoryCard,
    },
    outfitCardImage: {
      width: '100%',
      height: '100%',
    },
    outfitCardInfo: {
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    outfitCardName: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    outfitCardMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    outfitCardCount: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    outfitCardDate: {
      fontSize: 10,
      color: colors.textTertiary,
    },
    outfitDeleteBtn: {
      position: 'absolute',
      top: 6,
      left: 6,
      zIndex: 10,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: 'rgba(255,255,255,0.85)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    card: {
      backgroundColor: colors.inventoryCard,
      width: '30%',
      aspectRatio: 0.85,
      borderRadius: 20,
      padding: 10,
      marginBottom: 15,
      alignItems: 'center',
      justifyContent: 'center',
      ...Platform.select({
        web: { boxShadow: '0 2px 5px rgba(0,0,0,0.05)' },
        default: {
          shadowColor: colors.inventoryCardShadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 5,
        },
      }),
    },
    deleteButton: {
      position: 'absolute',
      top: 6,
      left: 6,
      zIndex: 10,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: 'rgba(255,255,255,0.85)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    colorDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      position: 'absolute',
      top: 10,
      right: 10,
      borderWidth: 0.5,
      borderColor: colors.inventoryColorDotBorder,
    },
    imagePlaceholder: {
      width: '100%',
      height: '60%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    garmentImage: {
      width: '100%',
      height: '100%',
      borderRadius: 10,
    },
    itemName: {
      fontSize: 11,
      fontWeight: 'bold',
      marginTop: 5,
      textAlign: 'center',
      color: colors.text,
    },
    itemInfo: {
      fontSize: 9,
      color: colors.inventoryInfoText,
      marginTop: 2,
    },
    fab: {
      position: 'absolute',
      bottom: 24 + insets.bottom,
      right: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#E67E22',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      ...Platform.select({
        web: { boxShadow: '0 3px 6px rgba(0,0,0,0.3)' },
        default: {
          elevation: 6,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
        },
      }),
    },
    deletingOverlay: {
      position: 'absolute',
      bottom: 100 + insets.bottom,
      alignSelf: 'center',
      backgroundColor: 'rgba(0,0,0,0.7)',
      borderRadius: 20,
      paddingVertical: 10,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    deletingText: {
      color: '#FFF',
      fontSize: 13,
      fontWeight: '600',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingVertical: 24,
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    modalOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 8,
    },
    modalOptionText: {
      fontSize: 16,
      marginLeft: 12,
      color: colors.text,
    },
    modalDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginHorizontal: 8,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: 16,
      color: colors.text,
    },
    categoryRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 16,
    },
    categoryChip: {
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: 16,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    categoryChipActive: {
      backgroundColor: '#E67E22',
      borderColor: '#E67E22',
    },
    categoryChipText: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    categoryChipTextActive: {
      color: '#FFF',
      fontWeight: '700',
    },
    emojiGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 8,
    },
    emojiItem: {
      padding: 10,
      margin: 4,
      borderRadius: 12,
      backgroundColor: colors.card,
    },

    // Garment form styles
    formOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    formOverlayBackdrop: {
      flex: 1,
    },
    formContent: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 16,
      paddingHorizontal: 20,
      paddingBottom: Math.max(insets.bottom + 16, 24),
      maxHeight: safeHeight * 0.92,
    },
    formHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
      paddingRight: 4,
    },
    formCloseBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    formTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    formSteps: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
      gap: 4,
    },
    formStepDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.border,
    },
    formStepDotActive: {
      backgroundColor: '#E67E22',
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    formStepLine: {
      width: 32,
      height: 2,
      backgroundColor: colors.border,
    },
    formBody: {
      flex: 1,
    },
    formBodyContent: {
      paddingBottom: 8,
    },
    formSectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: 16,
      color: colors.text,
    },
    formLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 8,
      marginTop: 4,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    formChipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 16,
    },
    formChip: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 16,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    formChipActive: {
      backgroundColor: '#E67E22',
      borderColor: '#E67E22',
    },
    formChipText: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    formChipTextActive: {
      color: '#FFF',
      fontWeight: '600',
    },
    formColorGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 12,
      marginBottom: 20,
    },
    formColorSwatch: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    formColorSwatchSelected: {
      borderWidth: 3,
      borderColor: colors.text,
    },
    formColorInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
      gap: 8,
    },
    formColorLabel: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    formColorInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 12,
      fontSize: 14,
      color: colors.text,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    formColorPreview: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
    },
    formTextInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
      fontSize: 15,
      color: colors.text,
      marginBottom: 16,
    },
    formTextArea: {
      minHeight: 72,
      textAlignVertical: 'top',
    },
    formSummary: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      marginBottom: 16,
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: colors.background,
      borderRadius: 12,
    },
    formSummaryText: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500',
    },
    formSummaryDot: {
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    formFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      marginTop: 4,
    },
    formChangePhotoBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 4,
    },
    formChangePhotoText: {
      fontSize: 13,
      fontWeight: '500',
      color: '#E67E22',
    },
    formNextBtn: {
      flex: 1,
      backgroundColor: '#E67E22',
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
    },
    formNextBtnDisabled: {
      opacity: 0.4,
    },
    formNextBtnText: {
      color: '#FFF',
      fontSize: 15,
      fontWeight: '600',
    },
    formBackBtn: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    formBackBtnText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    formSaveBtn: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: '#E67E22',
      alignItems: 'center',
    },
    formSaveBtnText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#FFF',
    },
    formSaveBtnProcessing: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    formSaveBtnProcessingText: {
      fontSize: 14,
      color: '#FFF',
      fontWeight: '500',
    },
    formImagePreviewCard: {
      backgroundColor: colors.background,
      borderRadius: 16,
      marginBottom: 12,
      ...Platform.select({
        web: { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
        default: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        },
      }),
    },
    formImagePreview: {
      width: '100%',
      aspectRatio: 1,
    },
    formImagePlaceholder: {
      width: '100%',
      aspectRatio: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    formImagePlaceholderText: {
      fontSize: 13,
      color: '#AAA',
      marginTop: 8,
    },
    formEmojiPreviewCard: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      backgroundColor: colors.background,
      borderRadius: 16,
      marginBottom: 12,
      ...Platform.select({
        web: { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
        default: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        },
      }),
    },
    formEmojiPreview: {
      fontSize: 60,
    },

    // Outfit detail modal styles
    outfitDetailContent: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 16,
      paddingHorizontal: 20,
      paddingBottom: Math.max(insets.bottom + 16, 24),
      maxHeight: safeHeight * 0.92,
    },
    outfitDetailHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    outfitDetailTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      flex: 1,
      marginRight: 12,
    },
    outfitDetailMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    outfitDetailMetaText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    outfitDetailDeleteBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginLeft: 'auto',
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 8,
      backgroundColor: '#FDE8E8',
    },
    outfitDetailDeleteText: {
      fontSize: 12,
      color: '#C0392B',
      fontWeight: '500',
    },
    outfitDetailList: {
      paddingBottom: 20,
      gap: 12,
    },
    outfitDetailGarmentCard: {
      flexDirection: 'row',
      backgroundColor: colors.background,
      borderRadius: 16,
      overflow: 'hidden',
      ...Platform.select({
        web: { boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
        default: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
        },
      }),
    },
    outfitDetailGarmentImageWrap: {
      width: 100,
      height: 100,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.inventoryCard,
    },
    outfitDetailGarmentImage: {
      width: '100%',
      height: '100%',
    },
    outfitDetailGarmentInfo: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 12,
      justifyContent: 'center',
    },
    outfitDetailGarmentName: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    outfitDetailGarmentSub: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 6,
    },
    outfitDetailGarmentTags: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },
    outfitDetailTag: {
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: 8,
      backgroundColor: colors.card,
    },
    outfitDetailTagText: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    outfitDetailColorDot: {
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    outfitDetailNotes: {
      fontSize: 12,
      color: colors.textTertiary,
      marginTop: 4,
      lineHeight: 16,
    },
  });
}

export default InventarioScreen;