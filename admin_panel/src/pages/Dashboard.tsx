import { Book, Users, Repeat, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/common/Card';

const stats = [
  { title: "Total Books", value: "2,543", icon: Book, color: "text-blue-500", bg: "bg-blue-100" },
  { title: "Active Users", value: "1,204", icon: Users, color: "text-green-500", bg: "bg-green-100" },
  { title: "Books Borrowed", value: "342", icon: Repeat, color: "text-purple-500", bg: "bg-purple-100" },
  { title: "Overdue Returns", value: "28", icon: AlertCircle, color: "text-red-500", bg: "bg-red-100" },
];

export const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i}>
              <CardContent className="p-6 flex items-center gap-4">
                <div className={`p-4 rounded-xl ${stat.bg} ${stat.color}`}>
                  <Icon className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                  <h3 className="text-3xl font-bold text-slate-900">{stat.value}</h3>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                      U{i}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">John Doe borrowed "The Great Gatsby"</p>
                      <p className="text-sm text-slate-500">2 hours ago</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Borrowed
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Alerts</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
              <div className="p-4 rounded-lg bg-red-50 border border-red-100 text-red-900">
                <h4 className="font-semibold flex items-center gap-2"><AlertCircle className="w-4 h-4"/> High Overdue Rate</h4>
                <p className="text-sm mt-1">28 books are currently overdue. Please send reminders to patrons.</p>
              </div>
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-100 text-blue-900">
                <h4 className="font-semibold flex items-center gap-2"><Book className="w-4 h-4"/> New Books Added</h4>
                <p className="text-sm mt-1">15 new titles were added to the catalog yesterday.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
