import { useState, useEffect, useCallback } from "react";
import { itemsService } from "../../services/purchasing/itemsService";
import { ItemMaster } from "../../lib/purchasing/types";

export function useItems() {
  const [items, setItems] = useState<ItemMaster[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Demo seeds removed to allow permanent deletion
      const data = await itemsService.getAll();
      setItems(data);
    } catch (err: any) {
      console.error("Failed to load items:", err);
      setError(err?.message || "Failed to retrieve items");
    } finally {
      setLoading(false);
    }
  }, []);

  const createItem = async (item: Omit<ItemMaster, "id" | "created_at" | "updated_at">) => {
    try {
      const newId = await itemsService.create(item);
      await fetchItems();
      return newId;
    } catch (err: any) {
      throw new Error(err?.message || "Failed to create item");
    }
  };

  const updateItem = async (id: string, item: Partial<ItemMaster>) => {
    try {
      await itemsService.update(id, item);
      await fetchItems();
    } catch (err: any) {
      throw new Error(err?.message || "Failed to update item");
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await itemsService.delete(id);
      await fetchItems();
    } catch (err: any) {
      throw new Error(err?.message || "Failed to delete item");
    }
  };

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return {
    items,
    loading,
    error,
    refreshItems: fetchItems,
    createItem,
    updateItem,
    deleteItem
  };
}
