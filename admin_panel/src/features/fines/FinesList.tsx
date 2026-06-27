import { Search, CheckCircle } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/common/Table';
import { Badge } from '../../components/common/Badge';

const MOCK_FINES = [
  { id: 'F001', user: 'Bob Johnson', amount: 15.00, reason: 'Overdue: 1984 (3 days)', status: 'unpaid' },
  { id: 'F002', user: 'Charlie Brown', amount: 5.50, reason: 'Overdue: Pride and Prejudice (1 day)', status: 'paid' },
];

export const FinesList = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Fine Management</h1>
          <p className="text-slate-500 mt-1">Track and collect overdue fines from patrons.</p>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search fines by patron name..." className="pl-10" />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fine ID</TableHead>
            <TableHead>Patron</TableHead>
            <TableHead>Amount ($)</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {MOCK_FINES.map((fine) => (
            <TableRow key={fine.id}>
              <TableCell className="font-mono text-slate-500">{fine.id}</TableCell>
              <TableCell className="font-medium text-slate-900">{fine.user}</TableCell>
              <TableCell className="font-bold text-slate-900">${fine.amount.toFixed(2)}</TableCell>
              <TableCell>{fine.reason}</TableCell>
              <TableCell>
                <Badge variant={fine.status === 'paid' ? 'success' : 'danger'} className="capitalize">
                  {fine.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {fine.status === 'unpaid' ? (
                  <Button size="sm">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark Paid
                  </Button>
                ) : (
                  <span className="text-sm text-slate-400 mr-2">Resolved</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
