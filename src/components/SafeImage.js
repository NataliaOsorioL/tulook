import React, { useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SafeImage({ uri, style, iconName = 'shirt-outline', iconSize = 28, iconColor = '#ccc', bgColor = '#f0f0f0', ...props }) {
  const [hasError, setHasError] = useState(false);

  if (!uri || hasError) {
    return (
      <View style={[styles.placeholder, style, { backgroundColor: bgColor }]}>
        <Ionicons name={iconName} size={iconSize} color={iconColor} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={style}
      onError={() => setHasError(true)}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
