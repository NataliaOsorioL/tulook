import { View,Text,StyleSheet,TextInput,TouchableOpacity,Image,ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function EditProfileScreen() {
  return (
    <View style={styles.container}>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >

        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton}>
            <Ionicons
              name="arrow-back"
              size={22}
              color="#000"
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            Editar Perfil
          </Text>

          <View style={{ width: 35 }} />
        </View>

        {/* imagen del perfil */}
        <View style={styles.profileContainer}>

          <Image
            source={{
              uri: 'https://via.placeholder.com/150',
            }}
            style={styles.profileImage}
          />

          <TouchableOpacity style={styles.cameraButton}>
            <Ionicons
              name="camera"
              size={18}
              color="#fff"
            />
          </TouchableOpacity>

        </View>

        <View style={styles.formCard}>

          <Text style={styles.label}>Nombre</Text>

          <View style={styles.inputContainer}>
            <Ionicons
              name="person-outline"
              size={20}
              color="#999"
            />

            <TextInput
              placeholder="Tu nombre"
              placeholderTextColor="#B7B7B7"
              style={styles.input}
            />
          </View>

          <Text style={styles.label}>
            Correo Electrónico
          </Text>

          <View style={styles.inputContainer}>
            <Ionicons
              name="mail-outline"
              size={20}
              color="#999"
            />

            <TextInput
              placeholder="correo@email.com"
              placeholderTextColor="#B7B7B7"
              style={styles.input}
              keyboardType="email-address"
            />
          </View>

          <Text style={styles.label}>
            Nueva Contraseña
          </Text>

          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color="#999"
            />

            <TextInput
              placeholder="********"
              placeholderTextColor="#B7B7B7"
              style={styles.input}
              secureTextEntry
            />
          </View>

          <Text style={styles.label}>Biografía</Text>

          <View style={styles.bioContainer}>
            <TextInput
              placeholder="Cuéntanos sobre tu estilo..."
              placeholderTextColor="#B7B7B7"
              multiline
              style={styles.bioInput}
            />
          </View>

          <TouchableOpacity style={styles.saveButton}>
            <Text style={styles.saveText}>
              Guardar Cambios
            </Text>
          </TouchableOpacity>

        </View>

      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
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

  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#000',
  },

  bioContainer: {
    backgroundColor: '#F7F7F7',
    borderRadius: 16,
    padding: 15,
    height: 120,
    marginBottom: 30,
  },

  bioInput: {
    fontSize: 15,
    color: '#000',
    textAlignVertical: 'top',
  },

  saveButton: {
    height: 58,
    borderRadius: 30,
    backgroundColor: '#529BD6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  saveText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
});