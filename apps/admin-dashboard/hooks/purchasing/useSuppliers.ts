import { useState, useEffect, useCallback } from "react";
import { suppliersService } from "../../services/purchasing/suppliersService";
import { Supplier } from "../../lib/purchasing/types";

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await suppliersService.seedDemoSuppliers();
      const data = await suppliersService.getAll();
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
      await fetchSuppliers();
      return newId;
    } catch (err: any) {
      throw new Error(err?.message || "Failed to create supplier");
    }
  };

  const updateSupplier = async (id: string, supplier: Partial<Supplier>) => {
    try {
      await suppliersService.update(id, supplier);
      await fetchSuppliers();
    } catch (err: any) {
      throw new Error(err?.message || "Failed to update supplier");
    }
  };

  const deleteSupplier = async (id: string) => {
    try {
      await suppliersService.softDelete(id);
      await fetchSuppliers();
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
