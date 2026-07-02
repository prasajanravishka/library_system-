/* ══════════════════════════════════════════════════════════════════════════
   Categories Page — Card grid with book counts and expandable book lists
   ══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useState } from 'react';
import { Tags, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { dashboardApi } from '../api/dashboard.api';
import type { Category } from '../types/category.types';
import type { Book } from '../types/book.types';
import Badge from '../components/ui/Badge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { getErrorMessage } from '../lib/utils';
import { toast } from 'sonner';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [categoryBooks, setCategoryBooks] = useState<Book[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await dashboardApi.getCategories();
        setCategories(data);
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleExpand = async (categoryId: number) => {
    if (expandedId === categoryId) {
      setExpandedId(null);
      setCategoryBooks([]);
      return;
    }

    setExpandedId(categoryId);
    setLoadingBooks(true);
    try {
      const { books } = await dashboardApi.getCategoryBooks(categoryId);
      setCategoryBooks(books);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setCategoryBooks([]);
    } finally {
      setLoadingBooks(false);
    }
  };

  if (loading) return <LoadingSpinner fullPage label="Loading categories…" />;

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Categories</h1>
        <p className="text-sm text-slate-500 mt-1">
          Browse book categories · {categories.length} categories
        </p>
      </div>

      {/* ── Category Cards ────────────────────────────────────────────── */}
      <div className="space-y-4">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300"
          >
            {/* Card Header */}
            <button
              onClick={() => handleExpand(cat.id)}
              className="w-full flex items-center justify-between px-6 py-5 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100">
                  <Tags size={20} className="text-indigo-600" />
                </div>
                <div className="text-left">
                  <h3 className="text-base font-semibold text-slate-900">{cat.name}</h3>
                  {cat.description && (
                    <p className="text-xs text-slate-500 mt-0.5">{cat.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-900">{cat.book_count}</p>
                  <p className="text-xs text-slate-500">books</p>
                </div>
                {expandedId === cat.id ? (
                  <ChevronUp size={18} className="text-slate-500" />
                ) : (
                  <ChevronDown size={18} className="text-slate-500" />
                )}
              </div>
            </button>

            {/* Expanded Book List */}
            {expandedId === cat.id && (
              <div className="border-t border-slate-200 px-6 py-4">
                {loadingBooks ? (
                  <LoadingSpinner label="Loading books…" />
                ) : categoryBooks.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200">
                          {['Title', 'Author', 'ISBN', 'Status'].map((col) => (
                            <th
                              key={col}
                              className="text-left py-2.5 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider"
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {categoryBooks.map((book) => (
                          <tr
                            key={book.book_id}
                            className="hover:bg-slate-50 border-b border-slate-100 transition-colors"
                          >
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2">
                                <BookOpen size={14} className="text-indigo-600 shrink-0" />
                                <span className="font-medium text-slate-900">{book.title}</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">
                              {book.author || '—'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 font-mono text-xs">
                              {book.isbn || '—'}
                            </td>
                            <td className="py-2.5 px-3">
                              <Badge status={book.availability_status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 py-4 text-center">
                    No books in this category yet.
                  </p>
                )}
              </div>
            )}
          </div>
        ))}

        {categories.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <Tags size={32} className="text-slate-400 mx-auto mb-3" />
            <p className="text-slate-500">No categories defined yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
