import { useState, useEffect } from 'react';
import { BookUp, BookDown, Search, Library, Book } from 'lucide-react';
import { toast } from 'sonner';
import { getErrorMessage } from '../lib/utils';
import { borrowsApi } from '../api/borrows.api';
import { booksApi } from '../api/books.api';
import type { Book as BookType } from '../types/book.types';

/**
 * CirculationPage Component
 * 
 * Provides an interface for the circulation desk to manage book check-outs.
 * Handles the logic for issuing books to students with validation for ISBN/Title.
 */
export default function CirculationPage() {
  // State for storing the catalog of books to facilitate search/autocomplete during checkout
  const [books, setBooks] = useState<BookType[]>([]);

  // Fetch the full catalog of books when the component mounts
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

  // State variables for managing the checkout form inputs and submission status
  const [checkoutStudentId, setCheckoutStudentId] = useState('');
  const [checkoutBookName, setCheckoutBookName] = useState('');
  const [checkoutScan, setCheckoutScan] = useState('');
  const [selectedBarcode, setSelectedBarcode] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // State for the customizable due date
  const [dueDateStr, setDueDateStr] = useState('');

  // Date calculations: determine today's date
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  
  // Initialize standard due date (14 days) on mount
  useEffect(() => {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 14);
    setDueDateStr(defaultDate.toISOString().split('T')[0]); // Standard HTML date format
  }, []);

  /**
   * Calculates the difference in days between today and the selected due date.
   */
  const calculateDaysGap = () => {
    if (!dueDateStr) return 0;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const [year, month, day] = dueDateStr.split('-').map(Number);
    const end = new Date(year, month - 1, day);
    end.setHours(0, 0, 0, 0);
    const diffTime = end.getTime() - start.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  const daysGap = calculateDaysGap();

  // Effect to auto-fill Book Name and auto-select barcode when a code is scanned
  useEffect(() => {
    if (checkoutScan) {
      let found = false;
      for (const book of books) {
        if (book.isbn === checkoutScan) {
          setCheckoutBookName(book.title);
          found = true;
          break;
        }
        if (book.copies) {
          const matchedCopy = book.copies.find(c => c.isbn === checkoutScan || c.barcode === checkoutScan);
          if (matchedCopy) {
            setCheckoutBookName(book.title);
            setSelectedBarcode(matchedCopy.barcode);
            found = true;
            break;
          }
        }
      }
      if (!found) {
        setSelectedBarcode(null);
      }
    }
  }, [checkoutScan, books]);

  // Reset selected barcode when the search criteria changes manually
  useEffect(() => {
    if (!checkoutScan) {
      setSelectedBarcode(null);
    }
  }, [checkoutBookName, checkoutScan]);

  // Handles the checkout form submission, validates inputs, and triggers the checkout API
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutStudentId) {
      toast.error('Please enter a Student ID');
      return;
    }
    
    if (!checkoutBookName && !checkoutScan) {
      toast.error('Please enter a Book Title or Scan Code');
      return;
    }

    let selectedBook;
    if (checkoutScan) {
      selectedBook = books.find(b => b.isbn === checkoutScan || b.copies?.some(c => c.isbn === checkoutScan || c.barcode === checkoutScan));
      if (!selectedBook) {
        toast.error('Invalid Scan Code. Book not found.');
        return;
      }
    } else if (checkoutBookName) {
      const matchingBooks = books.filter(b => b.title === checkoutBookName);
      if (matchingBooks.length === 0) {
        toast.error('Book not found in the catalog.');
        return;
      } else if (matchingBooks.length > 1) {
        toast.error('Multiple editions found! Please select the specific ISBN.');
        return;
      } else {
        selectedBook = matchingBooks[0];
      }
    }

    if (!selectedBook) {
      toast.error('Unable to determine book selection.');
      return;
    }
    
    if (selectedBook.copies && selectedBook.copies.length > 0 && !selectedBarcode) {
      toast.error('Please select a specific physical barcode to issue.');
      return;
    }
    
    setIsCheckingOut(true);
    try {
      await borrowsApi.checkout(checkoutStudentId, selectedBook.book_id, dueDateStr, selectedBarcode || undefined);
      toast.success('Book checked out successfully!');
      setCheckoutStudentId('');
      setCheckoutBookName('');
      setCheckoutScan('');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsCheckingOut(false);
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all";
  const labelClass = "block text-sm font-semibold text-slate-700 mb-2";

  const filteredBooksForScan = checkoutBookName 
    ? books.filter(b => b.title === checkoutBookName && (b.isbn || (b.copies && b.copies.length > 0)))
    : books.filter(b => b.isbn || (b.copies && b.copies.length > 0));

  const scanLabel = (checkoutBookName && filteredBooksForScan.length > 1)
    ? 'Scan Barcode / ISBN (Required for this title)'
    : 'Scan Barcode / ISBN (Optional)';

  // Determine the actively selected book to display its info
  const selectedBookByTitle = checkoutBookName ? books.filter(b => b.title === checkoutBookName) : [];
  const selectedBookByScan = checkoutScan 
    ? books.find(b => b.isbn === checkoutScan || b.copies?.some(c => c.isbn === checkoutScan || c.barcode === checkoutScan)) 
    : null;
  const activeBook = selectedBookByScan || (selectedBookByTitle.length === 1 ? selectedBookByTitle[0] : null);

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
            {/* We can unique the titles so the dropdown doesn't show duplicates */}
            {Array.from(new Set(books.map(b => b.title))).map(title => (
              <option key={title} value={title} />
            ))}
          </datalist>

          <datalist id="scanList">
            {filteredBooksForScan.flatMap(book => {
              const options = [];
              if (book.isbn) options.push(<option key={`isbn-${book.book_id}`} value={book.isbn} />);
              if (book.copies) {
                book.copies.forEach(copy => {
                  options.push(<option key={`bc-${copy.barcode}`} value={copy.barcode} />);
                  if (copy.isbn) options.push(<option key={`cisbn-${copy.barcode}`} value={copy.isbn} />);
                });
              }
              return options;
            })}
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
                  <label className={labelClass}>Book Title</label>
                  <div className="relative">
                    <Book className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      list="booksList"
                      value={checkoutBookName}
                      onChange={(e) => {
                        setCheckoutBookName(e.target.value);
                      }}
                      placeholder="Search for a book by title..."
                      className={`${inputClass} pl-11`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`${labelClass} ${scanLabel.includes('Required') ? 'text-rose-600' : ''}`}>
                    {scanLabel}
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      list="scanList"
                      value={checkoutScan}
                      onChange={(e) => {
                        setCheckoutScan(e.target.value);
                      }}
                      placeholder="Scan or enter Barcode/ISBN..."
                      className={`${inputClass} pl-11`}
                    />
                  </div>
                  
                  {/* Selected Book Info Snippet */}
                  {activeBook && (
                    <div className="mt-4 p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 flex flex-col gap-3 transition-all animate-in fade-in zoom-in duration-200">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-semibold text-indigo-900 mb-0.5">Selected Book</p>
                          <p className="text-sm font-medium text-slate-800 line-clamp-1">{activeBook.title}</p>
                        </div>
                        <div className="text-right shrink-0 ml-4 bg-white px-3 py-2 rounded-lg border border-indigo-50 shadow-sm">
                          <p className="text-sm font-bold text-indigo-700 leading-none">{activeBook.isbn || 'N/A'}</p>
                          <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mt-1">ISBN Number</p>
                        </div>
                      </div>
                      
                      {/* Physical Copies / Barcodes Display */}
                      {activeBook.copies && activeBook.copies.length > 0 && (
                        <div className="pt-3 border-t border-indigo-100/60">
                          <p className="text-xs font-semibold text-indigo-900 mb-2">Available Physical Copies:</p>
                          <div className="flex flex-wrap gap-2">
                            {activeBook.copies.map((copy, idx) => (
                              <button
                                type="button"
                                key={idx}
                                onClick={() => {
                                  setSelectedBarcode(copy.barcode);
                                  setCheckoutScan(copy.barcode);
                                }}
                                className={`inline-flex flex-col items-start px-2 py-1.5 border rounded shadow-sm transition-all ${selectedBarcode === copy.barcode ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50'}`}
                              >
                                <span className="text-[11px] font-mono leading-none">{copy.barcode}</span>
                                {copy.isbn && <span className="text-[9px] opacity-80 mt-1 leading-none">ISBN: {copy.isbn}</span>}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <label className={labelClass}>Borrow Date</label>
                    <input
                      type="text"
                      readOnly
                      value={today}
                      className="w-full px-4 py-3 rounded-xl bg-slate-100/50 border border-slate-200 text-slate-500 text-sm font-medium focus:outline-none cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Loan Period (Days)</label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={daysGap > 0 ? daysGap : ''}
                      onChange={(e) => {
                        const days = parseInt(e.target.value) || 14;
                        const defaultDate = new Date();
                        defaultDate.setDate(defaultDate.getDate() + days);
                        setDueDateStr(defaultDate.toISOString().split('T')[0]);
                      }}
                      placeholder="e.g. 14"
                      className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all hover:bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Due Date</label>
                    <input
                      type="date"
                      readOnly
                      value={dueDateStr}
                      className="w-full px-4 py-3 rounded-xl bg-slate-100/50 border border-slate-200 text-indigo-700 text-sm font-bold focus:outline-none cursor-not-allowed"
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
