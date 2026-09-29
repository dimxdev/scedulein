import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';

import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ManageSchedule from './pages/ManageSchedule';

import { supabase } from './lib/supabase';
import { isSupabaseConfigured } from './lib/dataService';

export default function App() {
  const { user, loading, checkUser, setUser } = useAuthStore();
  const initTheme = useThemeStore((state) => state.initTheme);

  useEffect(() => {
    initTheme();
    checkUser();

    if (isSupabaseConfigured()) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || 'user@example.com',
            isGuest: false,
          });
        } else if (!useAuthStore.getState().user?.isGuest) {
          setUser(null);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Memuat... 🐈</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={!user ? <Login /> : <Navigate to="/" />} 
        />
        <Route 
          path="/register" 
          element={!user ? <Register /> : <Navigate to="/" />} 
        />

        {/* Private Routes */}
        <Route element={user ? <Layout /> : <Navigate to="/login" />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/manage" element={<ManageSchedule />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
