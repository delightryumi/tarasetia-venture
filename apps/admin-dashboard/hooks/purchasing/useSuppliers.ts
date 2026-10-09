import { useState, useEffect, useCallback } from "react";
import { suppliersService } from "../../services/purchasing/suppliersService";
import { Supplier } from "../../lib/purchasing/types";

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSuppliers = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await suppliersService.getAll(forceRefresh);
      setSuppliers(data);
    } catch (err: any) {
      console.error("Failed to load suppliers:", err);
      setError(err?.message || "Failed to retrieve suppliers");
    } finally {
      setLoading(false);
    }
  }, []);

  const createSupplier = async (supplier: Omit<Supplier, "id" | "created_at" | "updated_at">) => {
    try {
      const newId = await suppliersService.create(supplier);
      await fetchSuppliers(true);
      return newId;
    } catch (err: any) {
      throw new Error(err?.message || "Failed to create supplier");
    }
  };

  const updateSupplier = async (id: string, supplier: Partial<Supplier>) => {
    try {
      await suppliersService.update(id, supplier);
      await fetchSuppliers(true);
    } catch (err: any) {
      throw new Error(err?.message || "Failed to update supplier");
    }
  };

  const deleteSupplier = async (id: string) => {
    try {
      await suppliersService.softDelete(id);
      await fetchSuppliers(true);
    } catch (err: any) {
      throw new Error(err?.message || "Failed to delete supplier");
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  return {
    suppliers,
    loading,
    error,
    refreshSuppliers: fetchSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier
  };
}
