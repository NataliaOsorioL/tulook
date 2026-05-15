import { useState, useRef, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getAllUserOutfits, deleteSingleOutfit, deleteAllUserOutfits } from '../services/outfit.service';
import { logger } from '../utils/logger';
import { ensureSignedIn } from '../services/auth.service';

export function useOutfits() {
  const [outfits, setOutfits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);
  const outfitsRef = useRef([]);

  const syncRef = (data) => {
    outfitsRef.current = data;
  };

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const userId = await ensureSignedIn();
      const loaded = await getAllUserOutfits(userId);
      if (mountedRef.current) {
        syncRef(loaded);
        setOutfits(loaded);
      }
    } catch (err) {
      if (mountedRef.current) setError(err.message);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  const deleteOutfit = useCallback(async (outfitId) => {
    const current = outfitsRef.current;
    const updated = current.filter((o) => o.id !== outfitId);
    if (mountedRef.current) {
      syncRef(updated);
      setOutfits(updated);
    }
    try {
      await deleteSingleOutfit(outfitId);
    } catch (err) {
      logger.warn('[useOutfits] Error deleting outfit:', err.message);
      if (mountedRef.current) {
        syncRef(current);
        setOutfits(current);
      }
      throw err;
    }
  }, []);

  const deleteAllOutfits = useCallback(async () => {
    const current = outfitsRef.current;
    if (mountedRef.current) {
      syncRef([]);
      setOutfits([]);
    }
    setIsDeleting(true);
    try {
      const userId = await ensureSignedIn();
      await deleteAllUserOutfits(userId);
    } catch (err) {
      logger.warn('[useOutfits] Error deleting all outfits:', err.message);
      if (mountedRef.current) {
        syncRef(current);
        setOutfits(current);
      }
      throw err;
    } finally {
      if (mountedRef.current) setIsDeleting(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      mountedRef.current = true;
      load();
      return () => { mountedRef.current = false; };
    }, [load]),
  );

  return { outfits, isLoading, isDeleting, error, refresh: load, deleteOutfit, deleteAllOutfits };
}
