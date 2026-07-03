/* ══════════════════════════════════════════════════════════════════════════
   Books Page — Full CRUD with data table, add/edit modals, search
   ══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Pencil, Eye, BookOpen } from 'lucide-react';
import { booksApi } from '../api/books.api';
import { dashboardApi } from '../api/dashboard.api';
import { locationsApi } from '../api/locations.api';
import type { Book, AddBookPayload, UpdateBookPayload } from '../types/book.types';
import type { Category } from '../types/category.types';
import type { Location } from '../types/location.types';
import type { BookFormData } from '../components/forms/BookForm';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Skeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import BookForm from '../components/forms/BookForm';
import { formatDate, getErrorMessage } from '../lib/utils';
import { toast } from 'sonner';

export default function BooksPage() {
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBooks = async () => {
    try {
      const [booksData, catsData, locsData] = await Promise.all([
        booksApi.getAll(),
        dashboardApi.getCategories(),
        locationsApi.getAll().catch((err) => {
          console.warn('Failed to fetch locations (endpoint might not exist yet):', err);
          return [];
        }),
      ]);
      setBooks(booksData);
      setCategories(catsData);
      setLocations(locsData);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  // Filtered books
  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      const matchesSearch =
        !searchQuery ||
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.isbn?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || b.availability_status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [books, searchQuery, statusFilter]);

  // Add book handler
  const handleAddBook = async (formData: BookFormData) => {
    setIsSubmitting(true);
    try {
      const payload: AddBookPayload = {
        title: formData.title,
        author: formData.author || '',
        isbn: formData.isbn || undefined,
        publisher: formData.publisher || '',
        publication_year: formData.publication_year ? Number(formData.publication_year) : undefined,
        language: formData.language || 'English',
        total_copies: formData.total_copies,
        available_copies: formData.available_copies,
        cover_image_url: formData.cover_image_url || '',
        location_id: formData.location_id ? Number(formData.location_id) : undefined,
        category_ids: formData.category_ids || [],
      };
      await booksApi.create(payload);
      toast.success('Book added successfully!');
      setShowAddModal(false);
      fetchBooks();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit book handler
  const handleEditBook = async (formData: BookFormData) => {
    if (!selectedBook) return;
    setIsSubmitting(true);
    try {
      const payload: UpdateBookPayload = {};
      if (formData.title) payload.title = formData.title;
      if (formData.author) payload.author = formData.author;
      if (formData.isbn) payload.isbn = formData.isbn;
      if (formData.publisher) payload.publisher = formData.publisher;
      if (formData.publication_year) payload.publication_year = Number(formData.publication_year);
      if (formData.language) payload.language = formData.language;
      if (formData.total_copies) payload.total_copies = formData.total_copies;
      if (formData.available_copies !== undefined)
        payload.available_copies = formData.available_copies;
      if (formData.location_id) payload.location_id = Number(formData.location_id);

      await booksApi.update(selectedBook.book_id, payload);
      toast.success('Book updated successfully!');
      setShowEditModal(false);
      setSelectedBook(null);
      fetchBooks();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectClass =
    'px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors cursor-pointer';

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Books</h1>
            <p className="text-sm text-slate-500 mt-1">Manage your library catalog</p>
          </div>
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
        <div className="flex gap-4 mb-6">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-10 w-40 rounded-xl" />
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Page Header ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Books</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your library catalog · {books.length} total
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 active:scale-[0.97] transition-all duration-200"
        >
          <Plus size={18} />
          Add Book
        </button>
      </div>

      {/* ── Filters ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="relative flex-1 w-full sm:min-w-[260px] sm:max-w-md">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, author, or ISBN…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={selectClass}
        >
          <option value="all">All Statuses</option>
          <option value="available">Available</option>
          <option value="borrowed">Borrowed</option>
          <option value="lost">Lost</option>
        </select>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar">
          {filteredBooks.length === 0 ? (
            <EmptyState 
              icon={BookOpen} 
              title="No books found" 
              description="Adjust your search or filters to find what you're looking for, or add a new book to the catalog." 
            />
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur-md shadow-sm">
                <tr className="border-b border-slate-200">
                  {['Title', 'Author', 'ISBN', 'Publisher', 'Year', 'Copies', 'Location', 'Status', 'Actions'].map(
                    (col) => (
                      <th
                        key={col}
                        className="text-left py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider"
                      >
                        {col}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredBooks.map((book) => (
                  <tr
                    key={book.book_id}
                    className="hover:bg-slate-50 border-b border-slate-100 transition-colors group"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-9 h-12 rounded-lg bg-indigo-50 shrink-0 border border-indigo-100">
                          <BookOpen size={16} className="text-indigo-600" />
                        </div>
                        <span className="font-medium text-slate-900 truncate max-w-[200px]">
                          {book.title}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{book.author || '—'}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-xs">
                      {book.isbn || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 truncate max-w-[150px]">
                      {book.publisher || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{book.publication_year || '—'}</td>
                    <td className="py-3 px-4 text-slate-600">
                      <span className="text-slate-900 font-medium">{book.available_copies}</span>
                      <span className="text-slate-500"> / {book.total_copies}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 truncate max-w-[120px]">
                      {book.location_id
                        ? locations.find((l) => l.location_id === book.location_id)?.name || 'Unknown'
                        : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <Badge status={book.availability_status} />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            navigate(`/books/${book.book_id}`);
                          }}
                          className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 active:scale-[0.97] transition-all"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedBook(book);
                            setShowEditModal(true);
                          }}
                          className="p-1.5 rounded-lg bg-white border border-slate-200 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 active:scale-[0.97] transition-all"
                          title="Edit Book"
                        >
                          <Pencil size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Footer / Count ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
          <p className="text-xs text-slate-500">
            Showing {filteredBooks.length} of {books.length} books
          </p>
        </div>
      </div>

      {/* ── Add Book Modal ────────────────────────────────────────────── */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Book"
        size="lg"
      >
        <BookForm
          categories={categories}
          locations={locations}
          onSubmit={handleAddBook}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* ── Edit Book Modal ───────────────────────────────────────────── */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedBook(null);
        }}
        title="Edit Book"
        size="lg"
      >
        <BookForm
          book={selectedBook}
          categories={categories}
          locations={locations}
          onSubmit={handleEditBook}
          isSubmitting={isSubmitting}
        />
      </Modal>
    </div>
  );
}
