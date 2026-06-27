import { Search, Plus } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/common/Table';
import { Badge } from '../../components/common/Badge';

const MOCK_TRANSACTIONS = [
  { id: 'TXN-001', bookTitle: 'The Great Gatsby', user: 'Alice Smith', borrowDate: '2023-10-01', dueDate: '2023-10-15', status: 'borrowed' },
  { id: 'TXN-002', bookTitle: '1984', user: 'Bob Johnson', borrowDate: '2023-09-20', dueDate: '2023-10-04', status: 'overdue' },
  { id: 'TXN-003', bookTitle: 'Pride and Prejudice', user: 'Charlie Brown', borrowDate: '2023-09-10', dueDate: '2023-09-24', status: 'returned' },
];

export const CirculationList = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Circulation</h1>
          <p className="text-slate-500 mt-1">Manage book borrowing, returns, and renewals.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">Process Return</Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Issue Book
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search transactions..." className="pl-10" />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Transaction ID</TableHead>
            <TableHead>Book Title</TableHead>
            <TableHead>Patron</TableHead>
            <TableHead>Borrow Date</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {MOCK_TRANSACTIONS.map((txn) => (
            <TableRow key={txn.id}>
              <TableCell className="font-mono text-slate-500">{txn.id}</TableCell>
              <TableCell className="font-medium text-slate-900">{txn.bookTitle}</TableCell>
              <TableCell>{txn.user}</TableCell>
              <TableCell>{txn.borrowDate}</TableCell>
              <TableCell>{txn.dueDate}</TableCell>
              <TableCell>
                <Badge 
                  variant={txn.status === 'returned' ? 'success' : txn.status === 'overdue' ? 'danger' : 'warning'} 
                  className="capitalize"
                >
                  {txn.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
