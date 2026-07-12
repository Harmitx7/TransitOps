import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import './index.css';

// Lazy-load all pages for code splitting
const LoginPage          = lazy(() => import('./features/auth/LoginPage'));
const DashboardPage      = lazy(() => import('./features/dashboard/DashboardPage'));
const VehicleListPage    = lazy(() => import('./features/vehicles/VehicleListPage'));
const VehicleDetailPage  = lazy(() => import('./features/vehicles/VehicleDetailPage'));
const DriverListPage     = lazy(() => import('./features/drivers/DriverListPage'));
const DriverDetailPage   = lazy(() => import('./features/drivers/DriverDetailPage'));
const TripListPage       = lazy(() => import('./features/trips/TripListPage'));
const TripDetailPage     = lazy(() => import('./features/trips/TripDetailPage'));
const TripFormPage       = lazy(() => import('./features/trips/TripFormPage'));
const MaintenancePage    = lazy(() => import('./features/maintenance/MaintenancePage'));
const FuelPage           = lazy(() => import('./features/fuel/FuelPage'));
const ReportsPage        = lazy(() => import('./features/reports/ReportsPage'));
const LiveMapPage        = lazy(() => import('./features/fleet-map/LiveMapPage'));
const InspectionListPage = lazy(() => import('./features/inspections/InspectionListPage'));
const InspectionFormPage = lazy(() => import('./features/inspections/InspectionFormPage'));
const CvDashboardPage    = lazy(() => import('./features/cv/CvDashboardPage'));
const DrowsinessPage     = lazy(() => import('./features/cv/DrowsinessPage'));
const LprPage            = lazy(() => import('./features/cv/LprPage'));
const AiDispatchPage     = lazy(() => import('./features/ai/AiDispatchPage'));
const NotificationsPage  = lazy(() => import('./features/notifications/NotificationsPage'));
const SettingsPage       = lazy(() => import('./features/settings/SettingsPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

function PageLoader() {
  return (
    <div style={{ display: 'grid', placeItems: 'center', height: '60vh' }}>
      <div className="spin" style={{ width: 36, height: 36, border: '3px solid var(--neu-dark)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%' }} aria-label="Loading page" />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="vehicles" element={<VehicleListPage />} />
              <Route path="vehicles/:id" element={<VehicleDetailPage />} />
              <Route path="drivers" element={<DriverListPage />} />
              <Route path="drivers/:id" element={<DriverDetailPage />} />
              <Route path="trips" element={<TripListPage />} />
              <Route path="trips/new" element={<TripFormPage />} />
              <Route path="trips/:id" element={<TripDetailPage />} />
              <Route path="maintenance" element={<MaintenancePage />} />
              <Route path="fuel" element={<FuelPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="map" element={<LiveMapPage />} />
              <Route path="inspections" element={<InspectionListPage />} />
              <Route path="inspections/new" element={<InspectionFormPage />} />
              <Route path="inspections/new/:vehicleId" element={<InspectionFormPage />} />

              <Route path="cv" element={<CvDashboardPage />} />
              <Route path="cv/drowsiness" element={<DrowsinessPage />} />
              <Route path="cv/lpr" element={<LprPage />} />
              <Route path="ai" element={<AiDispatchPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* 404 fallback */}
            <Route path="*" element={
              <div style={{ display: 'grid', placeItems: 'center', height: '100vh', gap: 16 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '4rem', fontWeight: 700, color: 'var(--text-muted)' }}>404</div>
                  <div style={{ color: 'var(--text-secondary)' }}>Page not found</div>
                  <a href="/" style={{ marginTop: 16, display: 'inline-block' }} className="btn-pill">Go Home</a>
                </div>
              </div>
            } />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
