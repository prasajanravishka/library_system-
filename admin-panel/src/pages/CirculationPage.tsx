import { useState, useEffect } from 'react';
import { BookUp, BookDown, Search, Library, Book } from 'lucide-react';
import { toast } from 'sonner';
import { getErrorMessage } from '../lib/utils';
import { borrowsApi } from '../api/borrows.api';
import { booksApi } from '../api/books.api';
import type { Book as BookType } from '../types/book.types';

export default function CirculationPage() {
  const [books, setBooks] = useState<BookType[]>([]);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const data = await booksApi.getAll();
        setBooks(data);
      } catch (err) {
        console.error('Failed to fetch books', err);
      }
    };
    fetchBooks();
  }, []);

  // Checkout state
  const [checkoutStudentId, setCheckoutStudentId] = useState('');
  const [checkoutBookName, setCheckoutBookName] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutStudentId || !checkoutBookName) {
      toast.error('Please enter both Student ID and Book Name');
      return;
    }

    const selectedBook = books.find(b => b.title === checkoutBookName);
    if (!selectedBook) {
      toast.error('Book not found in the catalog.');
      return;
    }
    
    setIsCheckingOut(true);
    try {
      await borrowsApi.checkout(checkoutStudentId, selectedBook.book_id);
      toast.success('Book checked out successfully!');
      setCheckoutStudentId('');
      setCheckoutBookName('');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsCheckingOut(false);
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all";
  const labelClass = "block text-sm font-semibold text-slate-700 mb-2";

  return (
    <div className="flex flex-col h-full bg-slate-50 relative z-0">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex-none px-8 py-6 bg-white border-b border-slate-200">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 shrink-0 border border-indigo-100">
            <Library size={20} className="text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Circulation Desk</h1>
        </div>
        <p className="text-slate-500 text-sm ml-13">
          Manage book check-outs and check-ins.
        </p>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto p-8 flex justify-center items-start">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          
          <div className="px-8 py-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <BookUp size={20} className="text-indigo-600" />
              Check-Out (Issue Book)
            </h2>
          </div>

          <datalist id="booksList">
            {books.map(book => (
              <option key={book.book_id} value={book.title} />
            ))}
          </datalist>

          <div className="p-8">
            {/* ── Check-out Form ────────────────────────────────────────── */}
            <form onSubmit={handleCheckout} className="space-y-6">
                <div>
                  <label className={labelClass}>Student ID</label>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      value={checkoutStudentId}
                      onChange={(e) => setCheckoutStudentId(e.target.value)}
                      placeholder="e.g. STU12345"
                      className={`${inputClass} pl-11`}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Book Name</label>
                  <div className="relative">
                    <Book className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      list="booksList"
                      value={checkoutBookName}
                      onChange={(e) => setCheckoutBookName(e.target.value)}
                      placeholder="Search for a book..."
                      className={`${inputClass} pl-11`}
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isCheckingOut}
                    className="w-full px-4 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 active:scale-[0.98] transition-all disabled:opacity-70 disabled:scale-100 flex justify-center"
                  >
                    {isCheckingOut ? 'Processing...' : 'Issue Book'}
                  </button>
                </div>
              </form>
          </div>
          
        </div>
      </div>
    </div>
  );
}
