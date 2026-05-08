import { View,Text,StyleSheet,Image,TouchableOpacity,ScrollView } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';

const clothes = [
  {
    id: 1,
    image: 'https://via.placeholder.com/80',
  },
  {
    id: 2,
    image: 'https://via.placeholder.com/80',
  },
  {
    id: 3,
    image: 'https://via.placeholder.com/80',
  },
  {
    id: 4,
    image: 'https://via.placeholder.com/80',
  },
  {
    id: 5,
    image: 'https://via.placeholder.com/80',
  },
  {
    id: 6,
    image: 'https://via.placeholder.com/80',
  },
];

export default function CreateOutfitScreen() {
  return (
    <View style={styles.container}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <Ionicons name="shirt-outline" size={28} color="#000" />
        <Text style={styles.headerTitle}>CREAR OUTFIT</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* PREVIEW */}
        <View style={styles.previewContainer}>
          <View style={styles.previewCard}>
            
            <Image
              source={{
                uri: 'https://via.placeholder.com/220x350',
              }}
              style={styles.mainClothe}
            />

            <Image
              source={{
                uri: 'https://via.placeholder.com/80',
              }}
              style={styles.shoes}
            />

          </View>
        </View>

        {/* CATEGORIES */}
        <View style={styles.categories}>
          <TouchableOpacity style={styles.activeCategory}>
            <Text style={styles.activeText}>Parte Superior</Text>
          </TouchableOpacity>

          <TouchableOpacity>
            <Text style={styles.categoryText}>Parte Inferior</Text>
          </TouchableOpacity>

          <TouchableOpacity>
            <Text style={styles.categoryText}>Calzado</Text>
          </TouchableOpacity>

          <TouchableOpacity>
            <Text style={styles.categoryText}>Accesorios</Text>
          </TouchableOpacity>
        </View>

        {/* CLOTHES LIST */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.clothesRow}
        >
          {clothes.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.clotheCard,
                index === 0 && styles.selectedCard,
              ]}
            >
              <Image
                source={{ uri: item.image }}
                style={styles.clotheImage}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity style={styles.saveButton}>
          <Text style={styles.saveText}>GUARDAR OUTFIT</Text>

          <Feather name="shopping-bag" size={26} color="#fff" />
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
    paddingHorizontal: 20,
    marginBottom: 25,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },

  previewContainer: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#C9B8AA',
    marginHorizontal: 20,
    borderRadius: 25,
    padding: 18,
  },

  previewCard: {
    backgroundColor: '#fff',
    borderRadius: 25,
    height: 420,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },

  mainClothe: {
    width: 220,
    height: 320,
    resizeMode: 'contain',
  },

  shoes: {
    width: 80,
    height: 80,
    position: 'absolute',
    left: 15,
    bottom: 20,
    borderRadius: 12,
  },

  categories: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 25,
    paddingHorizontal: 10,
  },

  activeCategory: {
    backgroundColor: '#fff',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
    elevation: 2,
  },

  activeText: {
    fontWeight: '600',
  },

  categoryText: {
    fontWeight: '500',
  },

  clothesRow: {
    paddingHorizontal: 15,
    paddingTop: 20,
    gap: 12,
  },

  clotheCard: {
    width: 70,
    height: 90,
    borderRadius: 15,
    backgroundColor: '#DDE7F2',
    justifyContent: 'center',
    alignItems: 'center',
  },

  selectedCard: {
    borderWidth: 2,
    borderColor: '#000',
  },

  clotheImage: {
    width: 55,
    height: 70,
    borderRadius: 10,
  },

  saveButton: {
    marginHorizontal: 25,
    marginTop: 30,
    marginBottom: 30,
    borderRadius: 35,
    height: 70,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,

    backgroundColor: '#C9DCE8',
  },

  saveText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },

  navbar: {
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

  navText: {
    fontSize: 11,
    marginTop: 4,
    color: '#8E8E93',
  },

  activeNav: {
    fontSize: 11,
    marginTop: 4,
    color: '#000',
    fontWeight: '600',
  },
});