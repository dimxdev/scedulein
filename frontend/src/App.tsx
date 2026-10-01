import { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';

import Layout from './components/Layout';
import Toaster from './components/Toaster';
import PageLoader from './components/PageLoader';
import { DashboardPage, LoginPage, ManagePage, RegisterPage, SettingsPage, StatsPage } from './routes';

export default function App() {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const init = useAuthStore((s) => s.init);
  const initTheme = useThemeStore((s) => s.initTheme);

  useEffect(() => {
    initTheme();
    init();
  }, [init, initTheme]);

  if (loading) return <PageLoader fullScreen />;

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader fullScreen />}>
        <Routes>
          <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" replace />} />
          <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/" replace />} />

          <Route element={user ? <Layout /> : <Navigate to="/login" replace />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/manage" element={<ManagePage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <Toaster />
    </BrowserRouter>
  );
}
