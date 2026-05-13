import { getUserProfile } from './user.service';
import { getRecentGarments } from './garment.service';
import { getOrGenerateDailyOutfit } from './outfit.service';
import { getWeather } from './weather.service';
import { GARMENT_CATEGORIES_LABELS } from '../utils/constants';

function buildOutfitDescription(garments, outfitGarments) {
  if (!garments || garments.length === 0) return null;
  if (outfitGarments && outfitGarments.length > 0) {
    const ordered = outfitGarments
      .sort((a, b) => a.position - b.position)
      .map((og) => {
        const garment = garments.find((g) => g.id === og.garment_id);
        return garment ? garment.name : '?';
      });
    return ordered.join(' + ');
  }
  return garments.map((g) => g.name).join(' + ');
}

function buildOutfitResponse(outfitResult) {
  if (!outfitResult || !outfitResult.outfit) {
    return null;
  }

  const outfit = outfitResult.outfit;
  const rawGarments = outfit.garments || [];

  const garmentsResponse = rawGarments.map((g) => ({
    id: g.id,
    name: g.name,
    image_url: g.image_url || null,
    category: g.category,
    category_label: GARMENT_CATEGORIES_LABELS[g.category] || g.category,
    color_hex: g.color_hex || null,
  }));

  const description = outfit.description || buildOutfitDescription(rawGarments, null);

  return {
    id: outfit.id,
    is_automatic: outfit.is_automatic ?? true,
    garments: garmentsResponse,
    description,
    preview_images: rawGarments.slice(0, 2).map((g) => g.image_url).filter(Boolean),
  };
}

function buildRecentGarmentsResponse(rawGarments) {
  return (rawGarments || []).slice(0, 3).map((g) => ({
    id: g.id,
    name: g.name,
    image_url: g.image_url || null,
    emoji: g.emoji || null,
    color_hex: g.color_hex || null,
    last_used_at: g.last_used_at || null,
  }));
}

export async function getHomeDashboard(userId, location = null, unit = 'C') {
  const user = await getUserProfile(userId);
  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  const effectiveUnit = unit || user.temperature_unit || 'C';
  const lat = location?.lat || user.location_lat;
  const lng = location?.lng || user.location_lng;

  let weatherResult = null;
  if (lat && lng) {
    try {
      weatherResult = await getWeather(lat, lng, effectiveUnit);
    } catch {
      weatherResult = null;
    }
  }

  const outfitResult = await getOrGenerateDailyOutfit(userId, weatherResult);

  const recentGarments = await getRecentGarments(userId, 3);

  return {
    user: {
      name: user.name,
      avatar_url: user.avatar_url || null,
    },
    weather: weatherResult,
    outfit_of_the_day: buildOutfitResponse(outfitResult),
    recent_garments: buildRecentGarmentsResponse(recentGarments),
  };
}
