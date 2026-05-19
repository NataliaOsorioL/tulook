import { View,Text,StyleSheet,TextInput,TouchableOpacity,Image,KeyboardAvoidingView,Platform,ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : null}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >

        <Text style={styles.title}>TuLook</Text>

        <Text style={styles.subtitle}>
          Organiza. Combina. Inspira.
        </Text>

        {/* closet cardd */}
        <View style={styles.card}>

          <Image
            source={{
              uri: 'https://via.placeholder.com/320x350',
            }}
            style={styles.backgroundImage}
          />

          <View style={styles.formContainer}>

            {/* email  */}
            <View style={styles.inputContainer}>
              <TextInput
                placeholder="Correo Electrónico"
                placeholderTextColor="#B7B7B7"
                style={styles.input}
              />

              <Ionicons
                name="mail-outline"
                size={20}
                color="#B7B7B7"
              />
            </View>

            {/* pass */}
            <View style={styles.inputContainer}>
              <TextInput
                placeholder="Contraseña"
                placeholderTextColor="#B7B7B7"
                secureTextEntry
                style={styles.input}
              />

              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#B7B7B7"
              />
            </View>

            {/* login butt */}
            <TouchableOpacity style={styles.loginButton}>
              <Text style={styles.loginText}>
                Iniciar Sesión
              </Text>
            </TouchableOpacity>

            {/* fg pass */}
            <TouchableOpacity>
              <Text style={styles.forgotText}>
                ¿Olvidaste tu contraseña?
              </Text>
            </TouchableOpacity>

          </View>

        </View>

        {/* registro */}
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

    backgroundColor: '#D9B7B1',
  },

  loginText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
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