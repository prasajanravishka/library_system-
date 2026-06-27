export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'librarian' | 'patron';
  status: 'active' | 'suspended' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
  coverImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  bookId: string;
  userId: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'borrowed' | 'returned' | 'overdue';
}

export interface Fine {
  id: string;
  transactionId: string;
  userId: string;
  amount: number;
  status: 'unpaid' | 'paid';
  createdAt: string;
}
