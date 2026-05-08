import { View,Text,StyleSheet,TouchableOpacity,ScrollView,Image } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';

export default function StatisticsScreen() {
  return (
    <View style={styles.container}>
      
      {/* headdd */}
      <View style={styles.header}>
        <Ionicons name="shirt-outline" size={26} color="#000" />

        <Text style={styles.headerTitle}>ESTADÍSTICAS</Text>

        <Feather name="more-horizontal" size={26} color="#000" />
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* cards */}
        <View style={styles.topCards}>

          {/* barras de estadísticas */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>USO DE PRENDAS</Text>

            <View style={styles.chartContainer}>

              <View style={styles.barGroup}>
                <View style={[styles.bar, { height: 110 }]} />
                <Text style={styles.day}>L</Text>
              </View>

              <View style={styles.barGroup}>
                <View style={[styles.bar, { height: 80 }]} />
                <Text style={styles.day}>M</Text>
              </View>

              <View style={styles.barGroup}>
                <View style={[styles.bar, { height: 90 }]} />
                <Text style={styles.day}>M</Text>
              </View>

              <View style={styles.barGroup}>
                <View style={[styles.bar, { height: 120 }]} />
                <Text style={styles.day}>J</Text>
              </View>

              <View style={styles.barGroup}>
                <View style={[styles.bar, { height: 150 }]} />
                <Text style={styles.day}>V</Text>
              </View>

              <View style={styles.barGroup}>
                <View style={[styles.barPink, { height: 100 }]} />
                <Text style={styles.day}>S</Text>
              </View>

              <View style={styles.barGroup}>
                <View style={[styles.barPink, { height: 40 }]} />
                <Text style={styles.day}>D</Text>
              </View>

            </View>
          </View>

          {/* donut de estadística */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              DISTRIBUCIÓN DE COLORES
            </Text>

            <View style={styles.circleContainer}>
              
              <View style={styles.circle}>
                <View style={styles.innerCircle}>
                  <Text style={styles.totalText}>TOTAL</Text>
                  <Text style={styles.totalText}>PRENDAS</Text>

                  <Text style={styles.numberText}>120</Text>
                </View>
              </View>

            </View>

            <View style={styles.labels}>
              <Text style={styles.label}>28% Azul</Text>
              <Text style={styles.label}>19% Rosa</Text>
              <Text style={styles.label}>17% Beige</Text>
              <Text style={styles.label}>10% Mint</Text>
            </View>
          </View>

        </View>

        {/* prendas olvidadas */}
        <View style={styles.bottomCard}>
          <Text style={styles.cardTitle}>
            PRENDAS OLVIDADAS
          </Text>

          <Text style={styles.subtitle}>
            No usados en &gt; 6 meses
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.clothesRow}
          >
            
            <View style={styles.clotheCard}>
              <Image
                source={{
                  uri: 'https://via.placeholder.com/80',
                }}
                style={styles.clotheImage}
              />
            </View>

            <View style={styles.clotheCard}>
              <Image
                source={{
                  uri: 'https://via.placeholder.com/80',
                }}
                style={styles.clotheImage}
              />
            </View>

            <View style={styles.clotheCard}>
              <Image
                source={{
                  uri: 'https://via.placeholder.com/80',
                }}
                style={styles.clotheImage}
              />
            </View>

            <View style={styles.clotheCard}>
              <Image
                source={{
                  uri: 'https://via.placeholder.com/80',
                }}
                style={styles.clotheImage}
              />
            </View>

            <View style={styles.clotheCard}>
              <Image
                source={{
                  uri: 'https://via.placeholder.com/80',
                }}
                style={styles.clotheImage}
              />
            </View>

          </ScrollView>
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
    paddingHorizontal: 20,
    marginBottom: 25,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
  },

  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },

  activeTab: {
    borderBottomWidth: 2,
    borderColor: '#B89C87',
    paddingBottom: 10,
    width: '50%',
    alignItems: 'center',
  },

  activeTabText: {
    fontWeight: '700',
    fontSize: 16,
  },

  tabText: {
    color: '#999',
    fontSize: 16,
    paddingTop: 2,
  },

  topCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },

  card: {
    backgroundColor: '#fff',
    width: '48%',
    borderRadius: 25,
    padding: 15,
    elevation: 2,
  },

  cardTitle: {
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 5,
  },

  subtitle: {
    textAlign: 'center',
    color: '#555',
    marginBottom: 15,
  },

  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 180,
    marginTop: 10,
  },

  barGroup: {
    alignItems: 'center',
  },

  bar: {
    width: 18,
    backgroundColor: '#5A8CCB',
    borderRadius: 10,
  },

  barPink: {
    width: 18,
    backgroundColor: '#E8A8A8',
    borderRadius: 10,
  },

  day: {
    marginTop: 8,
    fontSize: 12,
  },

  circleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },

  circle: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#C7D9EF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  innerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },

  totalText: {
    fontSize: 12,
    fontWeight: '600',
  },

  numberText: {
    fontSize: 28,
    fontWeight: '700',
  },

  labels: {
    marginTop: 15,
    gap: 4,
  },

  label: {
    fontSize: 12,
    color: '#555',
  },

  bottomCard: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 25,
    padding: 18,
    elevation: 2,
    marginBottom: 100,
  },

  clothesRow: {
    marginTop: 10,
    gap: 12,
  },

  clotheCard: {
    backgroundColor: '#F7F3ED',
    borderRadius: 18,
    padding: 10,
  },

  clotheImage: {
    width: 70,
    height: 90,
    borderRadius: 12,
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

  activeNavItem: {
    alignItems: 'center',
    backgroundColor: '#DDE6F6',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },

  navText: {
    fontSize: 11,
    color: '#999',
    marginTop: 3,
  },

  activeNavText: {
    fontSize: 11,
    marginTop: 3,
    fontWeight: '600',
  },
});