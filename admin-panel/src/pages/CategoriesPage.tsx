/* ══════════════════════════════════════════════════════════════════════════
   Categories Page — Card grid with CRUD operations and expandable book lists
   ══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useState } from 'react';
import { Tags, BookOpen, ChevronDown, ChevronUp, Plus, Edit2, Trash2 } from 'lucide-react';
import { categoriesApi } from '../api/categories.api';
import type { Category } from '../types/category.types';
import type { Book } from '../types/book.types';
import Badge from '../components/ui/Badge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Modal from '../components/ui/Modal';
import CategoryForm, { type CategoryFormData } from '../components/forms/CategoryForm';
import { getErrorMessage } from '../lib/utils';
import { toast } from 'sonner';
// A quick mapping to allow dynamic rendering of Lucide icons based on string
import * as LucideIcons from 'lucide-react';

/**
 * CategoriesPage Component
 * 
 * Manages the library's book categories. Displays categories as cards with
 * expandable lists of associated books. Supports full CRUD operations for categories.
 */
export default function CategoriesPage() {
  // State for storing the list of categories and managing the loading indicator
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for managing the expanded view of books within a category
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [categoryBooks, setCategoryBooks] = useState<Book[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(false);

  // Modal state variables for creating/editing categories
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch all categories on initial component mount
  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await categoriesApi.getAll();
        setCategories(data);
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  // Toggles the expanded state of a category to show/hide its books
  const handleExpand = async (categoryId: number) => {
    if (expandedId === categoryId) {
      setExpandedId(null);
      setCategoryBooks([]);
      return;
    }

    setExpandedId(categoryId);
    setLoadingBooks(true);
    try {
      const { books } = await categoriesApi.getCategoryBooks(categoryId);
      setCategoryBooks(books);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setCategoryBooks([]);
    } finally {
      setLoadingBooks(false);
    }
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleEditCategory = (e: React.MouseEvent, category: Category) => {
    e.stopPropagation(); // Prevent expanding the card
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleDeleteCategory = async (e: React.MouseEvent, categoryId: number) => {
    e.stopPropagation(); // Prevent expanding the card
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await categoriesApi.delete(categoryId);
      setCategories((prev) => prev.filter((c) => c.id !== categoryId));
      if (expandedId === categoryId) {
        setExpandedId(null);
        setCategoryBooks([]);
      }
      toast.success('Category deleted successfully');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  // Handles form submission for both creating a new category and updating an existing one
  const handleFormSubmit = async (data: CategoryFormData) => {
    setIsSubmitting(true);
    try {
      if (editingCategory) {
        const updated = await categoriesApi.update(editingCategory.id, data);
        setCategories((prev) => prev.map((c) => (c.id === editingCategory.id ? updated : c)));
        toast.success('Category updated successfully');
      } else {
        const created = await categoriesApi.create(data);
        setCategories((prev) => [...prev, created]);
        toast.success('Category created successfully');
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderIcon = (iconName?: string | null) => {
    if (!iconName) return <Tags size={20} className="text-indigo-600" />;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const IconComponent = (LucideIcons as any)[iconName];
    if (IconComponent) {
      return <IconComponent size={20} className="text-indigo-600" />;
    }
    return <Tags size={20} className="text-indigo-600" />;
  };

  if (loading) return <LoadingSpinner fullPage label="Loading categories…" />;

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Categories</h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse and manage book categories · {categories.length} categories
          </p>
        </div>
        <button
          onClick={handleAddCategory}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 active:scale-[0.98]"
        >
          <Plus size={18} />
          Add Category
        </button>
      </div>

      {/* ── Category Cards ────────────────────────────────────────────── */}
      <div className="space-y-4">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300 group"
          >
            {/* Card Header */}
            <div
              onClick={() => handleExpand(cat.id)}
              className="w-full flex items-center justify-between px-6 py-5 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100">
                  {renderIcon(cat.icon)}
                </div>
                <div className="text-left">
                  <h3 className="text-base font-semibold text-slate-900">{cat.name}</h3>
                  {cat.description && (
                    <p className="text-xs text-slate-500 mt-0.5">{cat.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleEditCategory(e, cat)}
                    className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200"
                    title="Edit category"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={(e) => handleDeleteCategory(e, cat.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                    title="Delete category"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-900">{cat.book_count || 0}</p>
                  <p className="text-xs text-slate-500">books</p>
                </div>
                {expandedId === cat.id ? (
                  <ChevronUp size={18} className="text-slate-500" />
                ) : (
                  <ChevronDown size={18} className="text-slate-500" />
                )}
              </div>
            </div>

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

      {/* ── Category Form Modal ───────────────────────────────────────── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Add New Category'}
        size="sm"
      >
        <CategoryForm
          category={editingCategory}
          onSubmit={handleFormSubmit}
          isSubmitting={isSubmitting}
        />
      </Modal>
    </div>
  );
}
