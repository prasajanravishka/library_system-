import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { BookList } from './features/books/BookList';
import { UserList } from './features/users/UserList';
import { CirculationList } from './features/circulation/CirculationList';
import { FinesList } from './features/fines/FinesList';

// Placeholder Login
const Login = () => (
  <div className="flex h-screen items-center justify-center bg-slate-50">
    <div className="p-8 bg-white shadow-xl rounded-2xl border border-slate-100 max-w-sm w-full">
      <div className="flex items-center justify-center mb-8">
        <span className="text-3xl font-bold tracking-tight"><span className="text-blue-500">Smart</span>Library</span>
      </div>
      <h1 className="text-2xl font-semibold mb-6 text-center text-slate-900">Admin Login</h1>
      <div className="space-y-4">
        <input type="email" placeholder="Email" className="w-full h-10 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none" />
        <input type="password" placeholder="Password" className="w-full h-10 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none" />
        <button className="w-full h-10 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">Sign In</button>
      </div>
    </div>
  </div>
);

const NotFound = () => (
  <div className="flex flex-col items-center justify-center h-full space-y-4">
    <h1 className="text-4xl font-bold text-slate-900">404</h1>
    <p className="text-slate-500">The page you are looking for does not exist.</p>
  </div>
);

// Protected Route Wrapper
const ProtectedRoute = () => {
  const isAuthenticated = true; // Replace with actual auth check later
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <MainLayout />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes inside MainLayout */}
        <Route path="/" element={<ProtectedRoute />}>
          <Route index element={<Dashboard />} />
          <Route path="books" element={<BookList />} />
          <Route path="users" element={<UserList />} />
          <Route path="circulation" element={<CirculationList />} />
          <Route path="fines" element={<FinesList />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
