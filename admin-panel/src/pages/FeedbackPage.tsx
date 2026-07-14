/* ══════════════════════════════════════════════════════════════════════════
   Feedback Page — List and manage user book reviews
   ══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useState, useMemo } from 'react';
import { Search, Star, Trash2, MessageSquare, BookOpen, User as UserIcon, Calendar, ArrowUpRight, ShieldAlert } from 'lucide-react';
import { reviewsApi, type AdminReview } from '../api/reviews.api';
import { getErrorMessage, formatDate } from '../lib/utils';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function FeedbackPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number | 'ALL'>('ALL');
  const navigate = useNavigate();

  const fetchReviews = async () => {
    try {
      const data = await reviewsApi.getAll();
      setReviews(data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDeleteReview = async (reviewId: number) => {
    if (!window.confirm('Are you sure you want to delete this book review/feedback?')) return;
    try {
      await reviewsApi.delete(reviewId);
      setReviews((prev) => prev.filter((r) => r.review_id !== reviewId));
      toast.success('Review deleted successfully');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      const matchesSearch = 
        !searchQuery ||
        r.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.student_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.book_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.review_text && r.review_text.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesRating = ratingFilter === 'ALL' || r.rating === ratingFilter;

      return matchesSearch && matchesRating;
    });
  }, [reviews, searchQuery, ratingFilter]);

  // Statistics calculations
  const stats = useMemo(() => {
    if (reviews.length === 0) return { average: 0, total: 0, positive: 0, critical: 0 };
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const average = sum / reviews.length;
    const positive = reviews.filter((r) => r.rating >= 4).length;
    const critical = reviews.filter((r) => r.rating <= 2).length;
    return {
      average,
      total: reviews.length,
      positive,
      critical,
    };
  }, [reviews]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <MessageSquare className="text-indigo-600 w-8 h-8" />
            Book Feedback & Reviews
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            Monitor and moderate user ratings and textual feedback for books.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
            <Star className="w-6 h-6 fill-indigo-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Rating</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{stats.average.toFixed(1)} / 5.0</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-slate-50 rounded-xl text-slate-600">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Reviews</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <Star className="w-6 h-6 fill-emerald-500 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Positive (4-5★)</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">
              {stats.positive} <span className="text-xs text-slate-400 font-medium">({stats.total ? Math.round((stats.positive / stats.total) * 100) : 0}%)</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Critical (1-2★)</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">
              {stats.critical} <span className="text-xs text-slate-400 font-medium">({stats.total ? Math.round((stats.critical / stats.total) * 100) : 0}%)</span>
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student, book, or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 custom-scrollbar">
          {(['ALL', 5, 4, 3, 2, 1] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setRatingFilter(opt)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                ratingFilter === opt
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-100'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {opt === 'ALL' ? 'All Ratings' : `${opt} Stars`}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews Display */}
      {filteredReviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700">No feedback found</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or rating filters to find reviews.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredReviews.map((review) => (
            <div
              key={review.review_id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all duration-200 relative group"
            >
              {/* Top Row: Student & Delete */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500">
                    <UserIcon size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 leading-tight">{review.student_name}</h3>
                    <p className="text-xs text-slate-400 font-medium">{review.student_id}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteReview(review.review_id)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  title="Delete review"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Rating & Text */}
              <div className="mb-4 flex-1">
                <div className="flex items-center gap-1 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={
                        i < review.rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-200 fill-slate-200'
                      }
                    />
                  ))}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed font-normal whitespace-pre-line">
                  {review.review_text || <span className="text-slate-400 italic">No comments left</span>}
                </p>
              </div>

              {/* Footer Row: Book & Date */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div 
                  onClick={() => navigate(`/books/${review.book_id}`)}
                  className="flex items-center gap-1.5 font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer transition-colors max-w-[70%]"
                >
                  <BookOpen size={13} className="shrink-0" />
                  <span className="truncate" title={review.book_title}>
                    {review.book_title}
                  </span>
                  <ArrowUpRight size={12} className="shrink-0" />
                </div>

                <div className="flex items-center gap-1 font-medium font-mono text-slate-400">
                  <Calendar size={13} />
                  <span>{formatDate(review.created_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
