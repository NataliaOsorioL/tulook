import {
  collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { FIRESTORE_COLLECTIONS, WEATHER_CACHE_TTL_MINUTES } from '../utils/constants';
import { mapOwmIconToIonicon, buildWeatherText, getDefaultWeather } from '../utils/weather-mapper';

const OWM_BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';
const FETCH_TIMEOUT_MS = 10000;
const DEFAULT_API_KEY = 'bfa8d7a75a5b60f9c6e96f73da1a6b74';

let _owmApiKey = DEFAULT_API_KEY;

export function setWeatherApiKey(apiKey) {
  _owmApiKey = apiKey || DEFAULT_API_KEY;
}

function buildLocationKey(lat, lng) {
  return `${lat.toFixed(4)}_${lng.toFixed(4)}`;
}

function validateCoordinates(lat, lng) {
  if (lat == null || lng == null) {
    throw new Error('INVALID_COORDS');
  }
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    throw new Error('INVALID_COORDS');
  }
  if (lat < -90 || lat > 90) {
    throw new Error('INVALID_COORDS: lat out of range');
  }
  if (lng < -180 || lng > 180) {
    throw new Error('INVALID_COORDS: lng out of range');
  }
}

export async function getCachedWeather(lat, lng) {
  const locationKey = buildLocationKey(lat, lng);
  const q = query(
    collection(db, FIRESTORE_COLLECTIONS.WEATHER_CACHE),
    where('location_key', '==', locationKey),
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const record = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  const now = new Date();
  const expiresAt = record.expires_at?.toDate?.() || new Date(record.expires_at);

  if (expiresAt > now) {
    return record;
  }

  return { ...record, stale: true };
}

async function fetchWithTimeout(url, ms = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);

  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

class WeatherApiError extends Error {
  constructor(message, { code, status, retryable }) {
    super(message);
    this.name = 'WeatherApiError';
    this.code = code;
    this.status = status;
    this.retryable = retryable;
  }
}

async function fetchWeatherFromOWM(lat, lng) {
  if (!_owmApiKey) {
    throw new WeatherApiError('OWM API key not configured', {
      code: 'MISSING_API_KEY',
      status: 0,
      retryable: false,
    });
  }

  const url =
    `${OWM_BASE_URL}?lat=${lat}&lon=${lng}&appid=${_owmApiKey}&lang=es&units=metric`;

  let response;
  try {
    response = await fetchWithTimeout(url);
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new WeatherApiError('OWM API timeout', {
        code: 'TIMEOUT',
        status: 0,
        retryable: true,
      });
    }
    throw new WeatherApiError('OWM API network error', {
      code: 'NETWORK_ERROR',
      status: 0,
      retryable: true,
    });
  }

  if (response.status === 401) {
    throw new WeatherApiError('OWM API key inválida', {
      code: 'INVALID_API_KEY',
      status: 401,
      retryable: false,
    });
  }

  if (response.status === 404) {
    throw new WeatherApiError('Ubicación no encontrada en OWM', {
      code: 'LOCATION_NOT_FOUND',
      status: 404,
      retryable: false,
    });
  }

  if (response.status === 429) {
    throw new WeatherApiError('Límite de peticiones OWM excedido', {
      code: 'RATE_LIMIT',
      status: 429,
      retryable: true,
    });
  }

  if (!response.ok) {
    throw new WeatherApiError(`OWM API error HTTP ${response.status}`, {
      code: 'HTTP_ERROR',
      status: response.status,
      retryable: response.status >= 500,
    });
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new WeatherApiError('OWM API response inválido', {
      code: 'INVALID_RESPONSE',
      status: response.status,
      retryable: true,
    });
  }

  if (!data.weather || !data.weather[0]) {
    throw new WeatherApiError('OWM API response sin datos de clima', {
      code: 'MISSING_WEATHER_DATA',
      status: response.status,
      retryable: false,
    });
  }

  return data;
}

function parseOwmResponse(data) {
  const iconCode = data.weather[0].icon;
  return {
    condition: data.weather[0].main,
    description: data.weather[0].description,
    temp_celsius: data.main.temp,
    icon_code: iconCode,
    mapped_ionicon: mapOwmIconToIonicon(iconCode),
  };
}

async function saveWeatherCache(locationKey, weatherData) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + WEATHER_CACHE_TTL_MINUTES * 60 * 1000);

  const q = query(
    collection(db, FIRESTORE_COLLECTIONS.WEATHER_CACHE),
    where('location_key', '==', locationKey),
  );
  const snapshot = await getDocs(q);

  const record = {
    location_key: locationKey,
    ...weatherData,
    fetched_at: serverTimestamp(),
    expires_at: expiresAt.toISOString(),
  };

  if (snapshot.empty) {
    const ref = await addDoc(collection(db, FIRESTORE_COLLECTIONS.WEATHER_CACHE), record);
    return { id: ref.id, ...record };
  }

  const existingId = snapshot.docs[0].id;
  await updateDoc(doc(db, FIRESTORE_COLLECTIONS.WEATHER_CACHE, existingId), record);
  return { id: existingId, ...record };
}

export async function getWeather(lat, lng, unit = 'C') {
  validateCoordinates(lat, lng);

  let cached = null;
  try {
    cached = await getCachedWeather(lat, lng);
  } catch {
    cached = null;
  }

  if (cached && !cached.stale) {
    return {
      icon: cached.mapped_ionicon,
      temperature: cached.temp_celsius,
      unit,
      description: cached.description,
      text: buildWeatherText(cached.description, cached.temp_celsius, unit),
      cached: true,
    };
  }

  try {
    const owmData = await fetchWeatherFromOWM(lat, lng);
    const parsed = parseOwmResponse(owmData);
    const locationKey = buildLocationKey(lat, lng);
    await saveWeatherCache(locationKey, parsed);

    return {
      icon: parsed.mapped_ionicon,
      temperature: parsed.temp_celsius,
      unit,
      description: parsed.description,
      text: buildWeatherText(parsed.description, parsed.temp_celsius, unit),
      cached: false,
    };
  } catch (err) {
    if (err instanceof WeatherApiError && !err.retryable) {
      if (cached) {
        return {
          icon: cached.mapped_ionicon,
          temperature: cached.temp_celsius,
          unit,
          description: cached.description,
          text: buildWeatherText(cached.description, cached.temp_celsius, unit),
          stale: true,
        };
      }
      const fallback = getDefaultWeather();
      return { ...fallback, unit, stale: true };
    }

    if (cached) {
      return {
        icon: cached.mapped_ionicon,
        temperature: cached.temp_celsius,
        unit,
        description: cached.description,
        text: buildWeatherText(cached.description, cached.temp_celsius, unit),
        stale: true,
        error: err.message,
      };
    }

    const fallback = getDefaultWeather();
    return { ...fallback, unit, stale: true, error: err.message };
  }
}
