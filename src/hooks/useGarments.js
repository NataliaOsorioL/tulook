import { useState, useRef, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getGarmentsByUser, deleteGarment as deleteGarmentService, deleteAllGarments as deleteAllGarmentsService } from '../services/garment.service';
import { deleteAllUserOutfits } from '../services/outfit.service';
import { ensureSignedIn } from '../services/auth.service';
import { groupByCategory } from '../utils/outfit-generator-v2';
import { logger } from '../utils/logger';

export function useGarments() {
  const [garmentsByCategory, setGarmentsByCategory] = useState({});
  const [allGarments, setAllGarments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);
  const allGarmentsRef = useRef([]);

  const syncRef = (garments) => {
    allGarmentsRef.current = garments;
  };

  const load = useCallback(async () => {
    logger.debug('[useGarments] Reloading garments from Firestore...');
    try {
      setIsLoading(true);
      setError(null);
      const userId = await ensureSignedIn();
      const garments = await getGarmentsByUser(userId);
      const grouped = groupByCategory(garments);
      logger.debug(`[useGarments] Loaded ${garments.length} garments`);
      if (mountedRef.current) {
        syncRef(garments);
        setAllGarments(garments);
        setGarmentsByCategory(grouped);
      }
    } catch (err) {
      if (mountedRef.current) setError(err.message);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  const deleteGarment = useCallback(async (garmentId) => {
    const current = allGarmentsRef.current;
    const updated = current.filter((g) => g.id !== garmentId);
    if (mountedRef.current) {
      syncRef(updated);
      setAllGarments(updated);
      setGarmentsByCategory(groupByCategory(updated));
    }
    await deleteGarmentService(garmentId);
  }, []);

  const deleteAllGarments = useCallback(async () => {
    const userId = await ensureSignedIn();

    if (mountedRef.current) {
      syncRef([]);
      setAllGarments([]);
      setGarmentsByCategory({});
    }

    const results = await Promise.allSettled([
      deleteAllGarmentsService(userId),
      deleteAllUserOutfits(userId),
    ]);

    const errors = results
      .filter((r) => r.status === 'rejected')
      .map((r) => r.reason?.message || 'Error desconocido');

    if (errors.length > 0) {
      logger.warn('[useGarments] deleteAll partial errors:', errors);
      const reconciled = await getGarmentsByUser(userId);
      if (mountedRef.current) {
        syncRef(reconciled);
        setAllGarments(reconciled);
        setGarmentsByCategory(groupByCategory(reconciled));
      }
      throw new Error(errors.join('; '));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      mountedRef.current = true;
      load();
      return () => { mountedRef.current = false; };
    }, [load]),
  );

  return { garmentsByCategory, allGarments, isLoading, error, refresh: load, deleteGarment, deleteAllGarments };
}
