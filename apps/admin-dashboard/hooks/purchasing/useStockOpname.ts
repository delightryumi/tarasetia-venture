import { useState, useEffect, useCallback } from "react";
import { opnameService } from "../../services/purchasing/opnameService";
import { itemsService } from "../../services/purchasing/itemsService";
import { StockOpname } from "../../lib/purchasing/types";

export function useStockOpname() {
  const [opnames, setOpnames] = useState<StockOpname[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOpnames = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await opnameService.getAll();
      setOpnames(data);
    } catch (err: any) {
      console.error("Failed to load opnames:", err);
      setError(err?.message || "Failed to retrieve stock opnames");
    } finally {
      setLoading(false);
    }
  }, []);

  const createOpname = async (opname: Omit<StockOpname, "id" | "created_at" | "approved_at">) => {
    try {
      const newId = await opnameService.create(opname);
      await fetchOpnames();
      return newId;
    } catch (err: any) {
      throw new Error(err?.message || "Failed to create stock opname");
    }
  };

  const updateOpname = async (id: string, opname: Partial<StockOpname>) => {
    try {
      await opnameService.update(id, opname);
      await fetchOpnames();
    } catch (err: any) {
      throw new Error(err?.message || "Failed to update stock opname");
    }
  };

  const approveOpname = async (id: string, userId: string, userName: string) => {
    try {
      await opnameService.approve(id, userId, userName);
      await fetchOpnames();
    } catch (err: any) {
      throw new Error(err?.message || "Failed to approve stock opname");
    }
  };

  const deleteOpname = async (id: string) => {
    try {
      await opnameService.softDelete(id);
      await fetchOpnames();
    } catch (err: any) {
      throw new Error(err?.message || "Failed to delete stock opname");
    }
  };

  useEffect(() => {
    fetchOpnames();
  }, [fetchOpnames]);

  return {
    opnames,
    loading,
    error,
    refreshOpnames: fetchOpnames,
    createOpname,
    updateOpname,
    approveOpname,
    deleteOpname
  };
}
