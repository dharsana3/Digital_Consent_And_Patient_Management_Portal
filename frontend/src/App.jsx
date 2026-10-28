import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import LoadingSpinner from './components/common/LoadingSpinner';
import AiAssistantModal from './components/ai/AiAssistantModal';
import GlossaryBrowser from './components/ai/GlossaryBrowser';

// Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import PatientDashboard from './pages/patient/PatientDashboard';
import ConsentDetailPage from './pages/consent/ConsentDetailPage';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner size="lg" text="Verifying clinical session..." />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their own dashboard
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (user.role === 'DOCTOR') return <Navigate to="/doctor" replace />;
    return <Navigate to="/patient" replace />;
  }

  return children;
};

export default function App() {
  const { user, loading } = useAuth();
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [glossaryModalOpen, setGlossaryModalOpen] = useState(false);
  const [selectedConsentForAi, setSelectedConsentForAi] = useState(null);

  const handleOpenAiAssistant = (consentId = null) => {
    setSelectedConsentForAi(consentId);
    setAiModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" text="Starting MediConsent Portal..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar
        onOpenAiAssistant={() => handleOpenAiAssistant(null)}
        onOpenGlossary={() => setGlossaryModalOpen(true)}
      />

      <main className="flex-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" replace />} />
          <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/" replace />} />

          {/* Role Protected Dashboards */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor"
            element={
              <ProtectedRoute allowedRoles={['DOCTOR']}>
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient"
            element={
              <ProtectedRoute allowedRoles={['PATIENT']}>
                <PatientDashboard onOpenAiAssistantWithConsent={handleOpenAiAssistant} />
              </ProtectedRoute>
            }
          />

          {/* Consent Details - Shared with internal ownership checks */}
          <Route
            path="/consents/:id"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR', 'PATIENT']}>
                <ConsentDetailPage onOpenAiAssistantWithConsent={handleOpenAiAssistant} />
              </ProtectedRoute>
            }
          />

          {/* Default Root Redirect */}
          <Route
            path="/"
            element={
              !user ? (
                <Navigate to="/login" replace />
              ) : user.role === 'ADMIN' ? (
                <Navigate to="/admin" replace />
              ) : user.role === 'DOCTOR' ? (
                <Navigate to="/doctor" replace />
              ) : (
                <Navigate to="/patient" replace />
              )
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>MediConsent Portal &bull; Multi-Specialty Hospital System</span>
          <span className="flex items-center space-x-1">
            <span>Security: SHA-256 Verified &bull; JWT Auth &bull; Private Storage</span>
          </span>
        </div>
      </footer>

      {/* Global AI Assistant & Glossary Modals */}
      <AiAssistantModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        preselectedConsentId={selectedConsentForAi}
      />
      <GlossaryBrowser
        isOpen={glossaryModalOpen}
        onClose={() => setGlossaryModalOpen(false)}
      />
    </div>
  );
}
