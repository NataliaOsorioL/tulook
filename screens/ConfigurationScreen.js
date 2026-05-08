import { View,Text,StyleSheet,TouchableOpacity,Image,Switch,ScrollView } from 'react-native';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);

  return (
    <View style={styles.container}>
      
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* head */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color="#000" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Configuración</Text>

          <View style={{ width: 35 }} />
        </View>

        {/* perfil */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Perfil</Text>

          <View style={styles.profileRow}>
            
            <View style={styles.profileInfo}>
              <Image
                source={{
                  uri: 'https://via.placeholder.com/100',
                }}
                style={styles.avatar}
              />

              <View>
                <Text style={styles.name}>Nati</Text>
                <Text style={styles.email}>
                  nati@email.com
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.editButton}>
              <Text style={styles.editText}>
                Editar perfil
              </Text>
            </TouchableOpacity>

          </View>
        </View>

        {/* preferencias */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Preferencias
          </Text>

          {/* temperature */}
          <View style={styles.preferenceRow}>
            
            <View style={styles.preferenceLeft}>
              <Text style={styles.icon}>🌡️</Text>

              <Text style={styles.preferenceText}>
                Unidad de temperatura
              </Text>
            </View>

            <View style={styles.tempButtons}>
              <TouchableOpacity style={styles.activeTemp}>
                <Text style={styles.activeTempText}>
                  °C
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.tempButton}>
                <Text>°F</Text>
              </TouchableOpacity>
            </View>

          </View>

          {/* tema */}
          <View style={styles.preferenceRow}>
            
            <View style={styles.preferenceLeft}>
              <Text style={styles.icon}>🧸</Text>

              <Text style={styles.preferenceText}>
                Tema
              </Text>
            </View>

            <View style={styles.themeContainer}>
              
              <TouchableOpacity style={styles.activeTheme}>
                <Text style={styles.activeThemeText}>
                  Claro
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.themeButton}>
                <Text>Oscuro</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.themeButton}>
                <Text>Automático</Text>
              </TouchableOpacity>

            </View>

          </View>
        </View>

        {/* notifs */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Notificaciones
          </Text>

          <View style={styles.preferenceRow}>
            
            <View style={styles.preferenceLeft}>
              <Ionicons
                name="notifications-outline"
                size={20}
                color="#777"
              />

              <Text style={styles.preferenceText}>
                Notificaciones generales
              </Text>
            </View>

            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{
                false: '#D9D9D9',
                true: '#B9D9B0',
              }}
            />

          </View>
        </View>

        {/* privacidad */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Privacidad
          </Text>

          <TouchableOpacity style={styles.preferenceRow}>
            
            <View style={styles.preferenceLeft}>
              <Feather
                name="lock"
                size={20}
                color="#777"
              />

              <Text style={styles.preferenceText}>
                Cambiar contraseña
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={20}
              color="#999"
            />

          </TouchableOpacity>
        </View>

        {/* logout */}
        <TouchableOpacity style={styles.logoutButton}>
          <MaterialIcons
            name="logout"
            size={18}
            color="#fff"
          />

          <Text style={styles.logoutText}>
            Cerrar sesión
          </Text>
        </TouchableOpacity>

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
    marginBottom: 20,
  },

  backButton: {
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },

  card: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 18,
    borderRadius: 18,
    padding: 15,
    elevation: 2,
  },

  sectionTitle: {
    fontWeight: '700',
    marginBottom: 15,
    fontSize: 16,
  },

  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  avatar: {
    width: 55,
    height: 55,
    borderRadius: 30,
  },

  name: {
    fontSize: 18,
    fontWeight: '600',
  },

  email: {
    color: '#999',
    marginTop: 2,
  },

  editButton: {
    backgroundColor: '#F3F3F3',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },

  editText: {
    fontSize: 13,
  },

  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },

  preferenceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  icon: {
    fontSize: 16,
  },

  preferenceText: {
    fontSize: 14,
  },

  tempButtons: {
    flexDirection: 'row',
    backgroundColor: '#F4F4F4',
    borderRadius: 10,
    overflow: 'hidden',
  },

  activeTemp: {
    backgroundColor: '#E6DED3',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  activeTempText: {
    fontWeight: '600',
  },

  tempButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  themeContainer: {
    flexDirection: 'row',
    backgroundColor: '#F4F4F4',
    borderRadius: 10,
    overflow: 'hidden',
  },

  activeTheme: {
    backgroundColor: '#E6DED3',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  activeThemeText: {
    fontWeight: '600',
  },

  themeButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  logoutButton: {
    backgroundColor: '#7A0000',
    marginHorizontal: 20,
    marginTop: 25,
    marginBottom: 120,
    borderRadius: 12,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },

  logoutText: {
    color: '#fff',
    fontWeight: '600',
  },

  navbar: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 85,
    backgroundColor: '#fff',
    borderTopWidth: 0.5,
    borderColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },

  navItem: {
    alignItems: 'center',
  },

  activeNav: {
    alignItems: 'center',
    backgroundColor: '#ECECEC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },

  navText: {
    fontSize: 11,
    marginTop: 3,
    color: '#999',
  },

  activeNavText: {
    fontSize: 11,
    marginTop: 3,
    fontWeight: '600',
  },
});