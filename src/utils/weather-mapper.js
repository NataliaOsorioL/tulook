const OWM_TO_IONICONS = {
  '01d': 'sunny-outline',
  '01n': 'moon-outline',
  '02d': 'partly-sunny-outline',
  '02n': 'cloudy-night-outline',
  '03d': 'cloudy-outline',
  '03n': 'cloudy-outline',
  '04d': 'cloudy-outline',
  '04n': 'cloudy-outline',
  '09d': 'rainy-outline',
  '09n': 'rainy-outline',
  '10d': 'rainy-outline',
  '10n': 'rainy-outline',
  '11d': 'thunderstorm-outline',
  '11n': 'thunderstorm-outline',
  '13d': 'snow-outline',
  '13n': 'snow-outline',
  '50d': 'eye-outline',
  '50n': 'eye-outline',
};

export function mapOwmIconToIonicon(owmIconCode) {
  return OWM_TO_IONICONS[owmIconCode] || 'cloudy-outline';
}

export function buildWeatherText(description, temperature, unit) {
  const capitalized = description.charAt(0).toUpperCase() + description.slice(1);
  return `${capitalized}, ${Math.round(temperature)}°${unit}`;
}

export function getDefaultWeather() {
  return {
    icon: 'sunny-outline',
    temperature: 20,
    unit: 'C',
    description: 'Soleado',
    text: 'Soleado, 20°C',
  };
}

const TEMPERATURE_RANGES = {
  VERY_HOT: { min: 28, tags: ['summer'], exclude: ['winter'] },
  HOT: { min: 20, max: 28, tags: ['spring', 'summer'], exclude: ['winter'] },
  MILD: { min: 12, max: 20, tags: ['spring', 'fall'], exclude: [] },
  COLD: { min: 5, max: 12, tags: ['fall', 'winter'], exclude: ['summer'] },
  VERY_COLD: { min: -Infinity, max: 5, tags: ['winter'], exclude: ['summer', 'spring'] },
};

export function getSeasonTagsForTemperature(tempCelsius) {
  if (tempCelsius > TEMPERATURE_RANGES.VERY_HOT.min) {
    return TEMPERATURE_RANGES.VERY_HOT.tags;
  }
  if (tempCelsius > TEMPERATURE_RANGES.HOT.min) {
    return TEMPERATURE_RANGES.HOT.tags;
  }
  if (tempCelsius > TEMPERATURE_RANGES.MILD.min) {
    return TEMPERATURE_RANGES.MILD.tags;
  }
  if (tempCelsius > TEMPERATURE_RANGES.COLD.min) {
    return TEMPERATURE_RANGES.COLD.tags;
  }
  return TEMPERATURE_RANGES.VERY_COLD.tags;
}

export function getExcludedSeasonTagsForTemperature(tempCelsius) {
  if (tempCelsius > TEMPERATURE_RANGES.VERY_HOT.min) {
    return TEMPERATURE_RANGES.VERY_HOT.exclude;
  }
  if (tempCelsius > TEMPERATURE_RANGES.HOT.min) {
    return TEMPERATURE_RANGES.HOT.exclude;
  }
  if (tempCelsius > TEMPERATURE_RANGES.MILD.min) {
    return TEMPERATURE_RANGES.MILD.exclude;
  }
  if (tempCelsius > TEMPERATURE_RANGES.COLD.min) {
    return TEMPERATURE_RANGES.COLD.exclude;
  }
  return TEMPERATURE_RANGES.VERY_COLD.exclude;
}
