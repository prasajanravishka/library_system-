import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, User, Hash, Calendar, Globe, MapPin, Tag, Layers, Bookmark } from 'lucide-react';
import { booksApi } from '../api/books.api';
import type { Book } from '../types/book.types';
import Badge from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { getErrorMessage, formatDate } from '../lib/utils';
import { toast } from 'sonner';

/**
 * BookDetailsPage Component
 * 
 * Displays detailed information about a specific book, including cover image,
 * metadata (ISBN, publisher, year, etc.), inventory status, and current borrowing status.
 * Fetches data based on the route parameter `id`.
 */
export default function BookDetailsPage() {
  // Retrieve the book ID from the URL parameters
  const { id } = useParams<{ id: string }>();
  // Hook for programmatic navigation
  const navigate = useNavigate();
  
  // Local state for storing the fetched book details
  const [book, setBook] = useState<Book | null>(null);
  // Loading state to show skeletons while fetching data
  const [loading, setLoading] = useState(true);

  // Fetch book details when the component mounts or when the ID changes
  useEffect(() => {
    if (!id) return;
    
    const fetchBook = async () => {
      try {
        const data = await booksApi.getById(Number(id));
        setBook(data);
      } catch (err) {
        toast.error(getErrorMessage(err));
        navigate('/books'); // redirect back if book doesn't exist
      } finally {
        setLoading(false);
      }
    };
    
    fetchBook();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-10 w-32 rounded-xl mb-8" />
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row">
          <Skeleton className="w-full md:w-[300px] h-[450px]" />
          <div className="p-8 flex-1 space-y-6">
            <Skeleton className="h-10 w-3/4 rounded-xl" />
            <Skeleton className="h-6 w-1/2 rounded-lg" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <div className="grid grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!book) return null;

  return (
    // Main layout container for the book details page
    <div className="max-w-5xl mx-auto space-y-8">
      {/* ── Back Navigation ── */}
      <button
        onClick={() => navigate('/books')}
        className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Books
      </button>

      {/* ── Main Detail Card ── */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row relative">
        
        {/* Decorative background blur */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Cover Image Section */}
        <div className="w-full md:w-[320px] shrink-0 bg-slate-50 flex flex-col items-center justify-center p-8 border-b md:border-b-0 md:border-r border-slate-200 relative">
          {book.cover_image_url ? (
            <img 
              src={book.cover_image_url} 
              alt={book.title}
              className="w-full max-w-[240px] rounded-lg shadow-md object-cover aspect-[2/3]"
            />
          ) : (
            <div className="w-full max-w-[240px] aspect-[2/3] rounded-lg shadow-sm bg-white border border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-3">
              <BookOpen size={48} className="text-slate-300" />
              <span className="text-sm font-medium">No Cover</span>
            </div>
          )}
          
          <div className="mt-8 w-full">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 text-center">Status</p>
            <div className="flex justify-center">
              <Badge status={book.availability_status} />
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="p-8 md:p-10 flex-1 relative z-10">
          <div className="flex justify-between items-start gap-4 mb-2">
            <h1 className="text-3xl font-bold text-slate-900 leading-tight">
              {book.title}
            </h1>
            {book.category_name && (
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full shrink-0 border border-indigo-100 flex items-center gap-1.5">
                <Tag size={12} />
                {book.category_name}
              </span>
            )}
          </div>
          
          <p className="text-lg text-slate-600 flex items-center gap-2 mb-8 font-medium">
            <User size={18} className="text-slate-400" />
            {book.author || 'Unknown Author'}
          </p>

          <div className="prose prose-slate prose-sm max-w-none mb-10 text-slate-600 leading-relaxed">
            {book.synopsis ? (
              <p>{book.synopsis}</p>
            ) : (
              <p className="italic text-slate-400">No synopsis available for this book.</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-12">
            <DetailItem icon={Hash} label="ISBN" value={book.isbn || 'N/A'} />
            <DetailItem icon={Globe} label="Language" value={book.language} />
            <DetailItem icon={Bookmark} label="Publisher" value={book.publisher || 'N/A'} />
            <DetailItem icon={Calendar} label="Publication Year" value={book.publication_year?.toString() || 'N/A'} />
            <DetailItem icon={Layers} label="Inventory" value={`${book.available_copies} available / ${book.total_copies} total`} />
            <DetailItem 
              icon={MapPin} 
              label="Location" 
              value={book.location_name || 'N/A'} 
              subValue={book.shelf_location ? `Shelf: ${book.shelf_location}` : undefined}
            />
          </div>

          {book.availability_status === 'borrowed' && book.borrowed_by && (
            <div className="mt-8 p-4 bg-orange-50 rounded-xl border border-orange-100 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                <User size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold text-orange-900">Currently Borrowed</p>
                <p className="text-sm text-orange-700">Checked out by <span className="font-bold">{book.borrowed_by}</span>.</p>
              </div>
            </div>
          )}
          
          <div className="mt-8 pt-6 border-t border-slate-100 text-xs text-slate-400">
            Added to catalog on {formatDate(book.added_at)}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * DetailItem Component
 * 
 * A reusable UI component for displaying a specific piece of book metadata
 * with an accompanying icon, label, and optional sub-value.
 */
function DetailItem({ icon: Icon, label, value, subValue }: { icon: any, label: string, value: string, subValue?: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0 mt-0.5">
        <Icon size={16} />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-sm font-medium text-slate-900">{value}</p>
        {subValue && <p className="text-xs text-slate-500 mt-0.5">{subValue}</p>}
      </div>
    </div>
  );
}
