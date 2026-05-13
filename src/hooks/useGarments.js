import { useState, useRef, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getGarmentsByUser, deleteGarment as deleteGarmentService, deleteAllGarments as deleteAllGarmentsService } from '../services/garment.service';
import { deleteAllUserOutfits } from '../services/outfit.service';
import { ensureSignedIn } from '../services/auth.service';
import { groupByCategory } from '../utils/outfit-generator-v2';

export function useGarments() {
  const [garmentsByCategory, setGarmentsByCategory] = useState({});
  const [allGarments, setAllGarments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    console.log('[useGarments] Reloading garments from Firestore...');
    try {
      setIsLoading(true);
      setError(null);
      const userId = await ensureSignedIn();
      const garments = await getGarmentsByUser(userId);

      const grouped = groupByCategory(garments);
      console.log(`[useGarments] Loaded ${garments.length} garments`);
      if (mountedRef.current) {
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
    try {
      // Optimistic: remove from local state immediately
      const updated = allGarments.filter((g) => g.id !== garmentId);
      if (mountedRef.current) {
        setAllGarments(updated);
        setGarmentsByCategory(groupByCategory(updated));
      }
      // Firestore delete
      await deleteGarmentService(garmentId);
    } catch (err) {
      console.warn('[useGarments] deleteGarment error:', err.message);
      // Reconcile: re-fetch from server
      load();
    }
  }, [allGarments, load]);

  const deleteAllGarments = useCallback(async () => {
    try {
      const userId = await ensureSignedIn();

      // Optimistic: clear local state immediately
      if (mountedRef.current) {
        setAllGarments([]);
        setGarmentsByCategory({});
      }

      // Firestore: delete all garments + all outfit data
      await Promise.all([
        deleteAllGarmentsService(userId),
        deleteAllUserOutfits(userId),
      ]);
    } catch (err) {
      console.warn('[useGarments] deleteAllGarments error:', err.message);
      // Reconcile: re-fetch from server
      load();
    }
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      mountedRef.current = true;
      load();
      return () => { mountedRef.current = false; };
    }, [load]),
  );

  return { garmentsByCategory, allGarments, isLoading, error, refresh: load, deleteGarment, deleteAllGarments };
}