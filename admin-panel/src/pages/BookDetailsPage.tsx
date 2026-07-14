import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, User, Hash, Calendar, Globe, MapPin, Tag, Layers, Bookmark, Trash2, Edit, Plus, Star, History, MessageSquare, Box } from 'lucide-react';
import { booksApi } from '../api/books.api';
import type { Book, BookCopy, BorrowHistory, Review } from '../types/book.types';
import Badge from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { getErrorMessage, formatDate } from '../lib/utils';
import { toast } from 'sonner';

export default function BookDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    
    const fetchBook = async () => {
      try {
        const data = await booksApi.getById(Number(id));
        setBook(data);
      } catch (err) {
        toast.error(getErrorMessage(err));
        navigate('/books');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBook();
  }, [id, navigate]);

  const handleActionClick = (actionName: string) => {
    toast.info(`${actionName} feature coming soon!`);
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-10 w-32 rounded-xl mb-8" />
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row">
          <Skeleton className="w-full md:w-[320px] h-[450px]" />
          <div className="p-8 md:p-10 flex-1 space-y-6">
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

  // Calculate average rating
  let avgRating = 0;
  if (book.reviews && book.reviews.length > 0) {
    avgRating = book.reviews.reduce((acc, r) => acc + r.rating, 0) / book.reviews.length;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
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
          
          <div className="mt-8 w-full flex flex-col gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 text-center">Status</p>
              <div className="flex justify-center">
                <Badge status={book.availability_status} />
              </div>
            </div>
            
            {avgRating > 0 && (
              <div className="flex flex-col items-center justify-center bg-white border border-slate-100 rounded-xl p-3 shadow-sm">
                <div className="flex items-center gap-1 text-amber-500 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} className={i < Math.round(avgRating) ? 'fill-current' : 'text-slate-200'} />
                  ))}
                </div>
                <span className="text-xs font-semibold text-slate-600">{avgRating.toFixed(1)} / 5.0 ({book.reviews?.length} reviews)</span>
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="p-8 md:p-10 flex-1 relative z-10 flex flex-col">
          <div className="flex justify-between items-start gap-4 mb-2">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 leading-tight mb-2">
                {book.title}
              </h1>
              {book.category_name && (
                <span className="inline-flex px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full border border-indigo-100 items-center gap-1.5">
                  <Tag size={12} />
                  {book.category_name}
                </span>
              )}
            </div>
            
            {/* Admin Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={() => handleActionClick('Add Copy')}
                className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors tooltip"
                title="Add Copy"
              >
                <Plus size={18} />
              </button>
              <button 
                onClick={() => handleActionClick('Edit Details')}
                className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors tooltip"
                title="Edit Book"
              >
                <Edit size={18} />
              </button>
              <button 
                onClick={() => handleActionClick('Delete Book')}
                className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors tooltip"
                title="Delete Book"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
          
          <p className="text-lg text-slate-600 flex items-center gap-2 mb-8 font-medium">
            <User size={18} className="text-slate-400" />
            {book.author || 'Unknown Author'}
          </p>

          <div className="prose prose-slate prose-sm max-w-none mb-10 text-slate-600 leading-relaxed flex-1">
            {book.synopsis ? (
              <p>{book.synopsis}</p>
            ) : (
              <p className="italic text-slate-400">No synopsis available for this book.</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-12 mt-auto">
            <DetailItem icon={Hash} label="ISBN" value={book.isbn || 'N/A'} />
            <DetailItem icon={Globe} label="Language" value={book.language} />
            <DetailItem icon={Bookmark} label="Publisher" value={book.publisher || 'N/A'} />
            <DetailItem icon={Calendar} label="Publication Year" value={book.publication_year?.toString() || 'N/A'} />
            <DetailItem icon={Layers} label="Inventory Summary" value={`${book.available_copies} available / ${book.total_copies} total`} />
            <DetailItem 
              icon={MapPin} 
              label="Location" 
              value={book.location_name || 'N/A'} 
              subValue={book.shelf_location ? `Shelf: ${book.shelf_location}` : undefined}
            />
          </div>
        </div>
      </div>

      {/* ── Detailed Sections ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Copies Inventory */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Box size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Physical Copies</h2>
          </div>
          
          {book.copies && book.copies.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                    <th className="pb-3 px-2">Barcode</th>
                    <th className="pb-3 px-2">ISBN</th>
                    <th className="pb-3 px-2">Condition</th>
                    <th className="pb-3 px-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {book.copies.map(copy => (
                    <tr key={copy.copy_id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-2 font-mono text-slate-700 font-medium">{copy.barcode}</td>
                      <td className="py-3 px-2 font-mono text-slate-500">{copy.isbn || book.isbn || 'N/A'}</td>
                      <td className="py-3 px-2 text-slate-600">{copy.condition || 'Unknown'}</td>
                      <td className="py-3 px-2 text-right">
                        <Badge status={copy.status || 'available'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic text-center py-8">No copies registered.</p>
          )}
        </div>

        {/* User Reviews */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <MessageSquare size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">User Reviews</h2>
          </div>
          
          {book.reviews && book.reviews.length > 0 ? (
            <div className="space-y-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {book.reviews.map(review => (
                <div key={review.review_id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{review.user_name}</p>
                      <p className="text-xs text-slate-500">{formatDate(review.created_at)}</p>
                    </div>
                    <div className="flex gap-0.5 text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={12} className={i < review.rating ? 'fill-current' : 'text-slate-200'} />
                      ))}
                    </div>
                  </div>
                  {review.review_text && (
                    <p className="text-sm text-slate-600 italic mt-2">"{review.review_text}"</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic text-center py-8">No reviews yet.</p>
          )}
        </div>
      </div>

      {/* Borrowing History */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <History size={20} />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Borrowing History</h2>
        </div>
        
        {book.history && book.history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-semibold bg-slate-50">
                  <th className="py-3 px-4 rounded-tl-lg">User</th>
                  <th className="py-3 px-4">Copy Barcode</th>
                  <th className="py-3 px-4">Borrowed On</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Returned On</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right rounded-tr-lg">Fines</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {book.history.map(record => (
                  <tr key={record.borrow_id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-700">{record.user_name}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{record.barcode || 'N/A'}</td>
                    <td className="py-3 px-4 text-slate-600">{formatDate(record.borrow_date)}</td>
                    <td className="py-3 px-4 text-slate-600">{formatDate(record.due_date)}</td>
                    <td className="py-3 px-4 text-slate-600">{record.return_date ? formatDate(record.return_date) : '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge status={record.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      {parseFloat(record.fine_amount as string) > 0 ? (
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${record.fine_paid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          LKR {parseFloat(record.fine_amount as string).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500 italic text-center py-8">This book has never been borrowed.</p>
        )}
      </div>

    </div>
  );
}

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
