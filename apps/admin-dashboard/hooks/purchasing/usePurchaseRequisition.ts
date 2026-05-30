import { useState, useEffect, useCallback } from "react";
import { prService } from "../../services/purchasing/prService";
import { itemsService } from "../../services/purchasing/itemsService";
import { suppliersService } from "../../services/purchasing/suppliersService";
import { PurchaseRequisition } from "../../lib/purchasing/types";

export function usePurchaseRequisition() {
  const [prs, setPrs] = useState<PurchaseRequisition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPRs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await itemsService.getAll();
      const suppliers = await suppliersService.getAll();
      await prService.seedDemoPRs(items, suppliers);
      const data = await prService.getAll();
      setPrs(data);
    } catch (err: any) {
      console.error("Failed to load PRs:", err);
      setError(err?.message || "Failed to retrieve Purchase Requisitions");
    } finally {
      setLoading(false);
    }
  }, []);

  const createPR = async (pr: Omit<PurchaseRequisition, "id" | "pr_number" | "created_at" | "updated_at">) => {
    try {
      const newId = await prService.create(pr);
      await fetchPRs();
      return newId;
    } catch (err: any) {
      throw new Error(err?.message || "Failed to create Purchase Requisition");
    }
  };

  const updatePR = async (id: string, pr: Partial<PurchaseRequisition>) => {
    try {
      await prService.update(id, pr);
      await fetchPRs();
    } catch (err: any) {
      throw new Error(err?.message || "Failed to update Purchase Requisition");
    }
  };

  const deletePR = async (id: string) => {
    try {
      await prService.softDelete(id);
      await fetchPRs();
    } catch (err: any) {
      throw new Error(err?.message || "Failed to delete Purchase Requisition");
    }
  };

  const approvePR = async (id: string, userId: string, userName: string) => {
    try {
      await prService.update(id, {
        status: "approved",
        approved_by: userId,
        approved_by_name: userName
      });
      await fetchPRs();
    } catch (err: any) {
      throw new Error(err?.message || "Failed to approve Purchase Requisition");
    }
  };

  useEffect(() => {
    fetchPRs();
  }, [fetchPRs]);

  return {
    prs,
    loading,
    error,
    refreshPRs: fetchPRs,
    createPR,
    updatePR,
    deletePR,
    approvePR
  };
}
