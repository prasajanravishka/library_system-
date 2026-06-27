import { useState } from 'react';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/common/Table';
import { Badge } from '../../components/common/Badge';

// Mock Data
const MOCK_BOOKS = [
  { id: '1', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', isbn: '978-0743273565', available: 3, total: 5 },
  { id: '2', title: '1984', author: 'George Orwell', isbn: '978-0451524935', available: 0, total: 4 },
  { id: '3', title: 'To Kill a Mockingbird', author: 'Harper Lee', isbn: '978-0060935467', available: 2, total: 2 },
  { id: '4', title: 'Pride and Prejudice', author: 'Jane Austen', isbn: '978-1503290563', available: 5, total: 5 },
];

export const BookList = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Book Catalog</h1>
          <p className="text-slate-500 mt-1">Manage library inventory and track availability.</p>
        </div>
        <Button className="shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          Add New Book
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search books by title, author, or ISBN..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline">Filter</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Author</TableHead>
            <TableHead>ISBN</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {MOCK_BOOKS.map((book) => (
            <TableRow key={book.id}>
              <TableCell className="font-medium text-slate-900">{book.title}</TableCell>
              <TableCell>{book.author}</TableCell>
              <TableCell className="text-slate-500">{book.isbn}</TableCell>
              <TableCell>
                {book.available > 0 ? (
                  <Badge variant="success">{book.available} / {book.total} Available</Badge>
                ) : (
                  <Badge variant="danger">Out of Stock</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Edit2 className="w-4 h-4 text-slate-500" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="w-4 h-4 text-slate-500" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
