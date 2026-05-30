// apps/Point-of-sales-Nextjs-main/components/lexupos/SubCategoryTable.tsx
'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { fetchSubCategories, SubCategory } from '@/data/subcategory';

export default function SubCategoryTable() {
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchSubCategories();
        setSubCategories(data);
      } catch (e) {
        console.error('Failed to fetch sub‑categories', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="rounded-xl bg-white dark:bg-zinc-900 shadow-lg p-6 mt-8 overflow-hidden">
      <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-4">
        Sub‑Category
      </h2>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin w-6 h-6 text-neutral-500" />
        </div>
      ) : (
        <div className="max-h-72 overflow-y-auto thin-scrollbar">
          <table className="w-full table-auto border-separate border-spacing-0">
            <thead className="sticky top-0 bg-white dark:bg-zinc-900">
              <tr className="text-xs text-neutral-500">
                <th className="text-left px-3 py-2">ID</th>
                <th className="text-left px-3 py-2">Nama</th>
                <th className="text-left px-3 py-2">Kategori Induk</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {subCategories.map((sc) => (
                <tr
                  key={sc.id}
                  className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors"
                >
                  <td className="px-3 py-2 break-all">{sc.id}</td>
                  <td className="px-3 py-2">{sc.name}</td>
                  <td className="px-3 py-2">{sc.parentCategory}</td>
                </tr>
              ))}
              {subCategories.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center py-4 text-neutral-400">
                    Tidak ada sub‑category.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
