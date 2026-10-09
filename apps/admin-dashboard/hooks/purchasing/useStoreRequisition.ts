import { useState, useEffect, useCallback } from "react";
import { srService } from "../../services/purchasing/srService";
import { itemsService } from "../../services/purchasing/itemsService";
import { StoreRequisition } from "../../lib/purchasing/types";

export function useStoreRequisition() {
  const [srs, setSrs] = useState<StoreRequisition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSRs = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await srService.getAll(forceRefresh);
      setSrs(data);
    } catch (err: any) {
      console.error("Failed to load SRs:", err);
      setError(err?.message || "Failed to retrieve Store Requisitions");
    } finally {
      setLoading(false);
    }
  }, []);

  const createSR = async (sr: Omit<StoreRequisition, "id" | "sr_number" | "created_at" | "updated_at">) => {
    try {
      const newId = await srService.create(sr);
      await fetchSRs(true);
      return newId;
    } catch (err: any) {
      throw new Error(err?.message || "Failed to create Store Requisition");
    }
  };

  const updateSR = async (id: string, sr: Partial<StoreRequisition>) => {
    try {
      await srService.update(id, sr);
      await fetchSRs(true);
    } catch (err: any) {
      throw new Error(err?.message || "Failed to update Store Requisition");
    }
  };

  const deleteSR = async (id: string) => {
    try {
      await srService.softDelete(id);
      await fetchSRs(true);
    } catch (err: any) {
      throw new Error(err?.message || "Failed to delete Store Requisition");
    }
  };

  const approveSR = async (id: string, userId: string, userName: string) => {
    try {
      await srService.update(id, {
        status: "approved",
        approved_by: userId,
        approved_by_name: userName
      });
      await fetchSRs(true);
    } catch (err: any) {
      throw new Error(err?.message || "Failed to approve Store Requisition");
    }
  };

  const fulfillSR = async (id: string, items: any[]) => {
    try {
      await srService.update(id, {
        status: "fulfilled",
        items
      });
      await fetchSRs(true);
    } catch (err: any) {
      throw new Error(err?.message || "Failed to fulfill Store Requisition");
    }
  };

  useEffect(() => {
    fetchSRs();
  }, [fetchSRs]);

  return {
    srs,
    loading,
    error,
    refreshSRs: fetchSRs,
    createSR,
    updateSR,
    deleteSR,
    approveSR,
    fulfillSR
  };
}
