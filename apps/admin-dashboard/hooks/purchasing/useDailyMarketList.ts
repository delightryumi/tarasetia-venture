import { useState, useEffect, useCallback } from "react";
import { dmlService } from "../../services/purchasing/dmlService";
import { itemsService } from "../../services/purchasing/itemsService";
import { DailyMarketList } from "../../lib/purchasing/types";

export function useDailyMarketList() {
  const [dmls, setDmls] = useState<DailyMarketList[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDMLs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await itemsService.getAll();
      await dmlService.seedDemoDMLs(items);
      const data = await dmlService.getAll();
      setDmls(data);
    } catch (err: any) {
      console.error("Failed to load DMLs:", err);
      setError(err?.message || "Failed to retrieve Daily Market Lists");
    } finally {
      setLoading(false);
    }
  }, []);

  const createDML = async (dml: Omit<DailyMarketList, "id" | "dml_number" | "created_at">) => {
    try {
      const newId = await dmlService.create(dml);
      await fetchDMLs();
      return newId;
    } catch (err: any) {
      throw new Error(err?.message || "Failed to create Daily Market List");
    }
  };

  const updateDML = async (id: string, dml: Partial<DailyMarketList>) => {
    try {
      await dmlService.update(id, dml);
      await fetchDMLs();
    } catch (err: any) {
      throw new Error(err?.message || "Failed to update Daily Market List");
    }
  };

  const deleteDML = async (id: string) => {
    try {
      await dmlService.softDelete(id);
      await fetchDMLs();
    } catch (err: any) {
      throw new Error(err?.message || "Failed to delete Daily Market List");
    }
  };

  useEffect(() => {
    fetchDMLs();
  }, [fetchDMLs]);

  return {
    dmls,
    loading,
    error,
    refreshDMLs: fetchDMLs,
    createDML,
    updateDML,
    deleteDML
  };
}
