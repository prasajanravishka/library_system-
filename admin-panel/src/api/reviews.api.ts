import client from './client';

export interface AdminReview {
  review_id: number;
  rating: number;
  review_text: string | null;
  created_at: string;
  student_name: string;
  student_id: string;
  book_title: string;
  author: string;
  book_id: number;
}

export const reviewsApi = {
  getAll: async (): Promise<AdminReview[]> => {
    const { data } = await client.get<{ status: string; reviews: AdminReview[] }>('/admin/reviews');
    return data.reviews;
  },

  delete: async (reviewId: number): Promise<void> => {
    await client.delete(`/admin/reviews/${reviewId}`);
  }
};
