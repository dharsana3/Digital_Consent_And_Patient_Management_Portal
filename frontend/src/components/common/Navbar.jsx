import React from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Activity,
  LogOut,
  User,
  Sparkles,
  BookOpen,
  FileCheck,
  Calendar,
  Upload,
  Users,
  Building2,
  LayoutDashboard,
} from 'lucide-react';

export default function Navbar({ onOpenAiAssistant, onOpenGlossary }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-200">ADMIN</span>;
      case 'DOCTOR':
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200">DOCTOR</span>;
      case 'PATIENT':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">PATIENT</span>;
      default:
        return null;
    }
  };

  const isNavActive = (path, tab) => {
    if (location.pathname !== path) return false;
    if (!tab) return !activeTab || activeTab === 'overview';
    return activeTab === tab;
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Portal Brand */}
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex items-center space-x-2.5 group shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-hospital-700 to-hospital-500 flex items-center justify-center text-white shadow-md shadow-hospital-500/20 group-hover:scale-105 transition-transform">
                <Activity className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-base font-extrabold text-slate-900 tracking-tight block leading-tight">
                  MediConsent<span className="text-hospital-600">Portal</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Hospital Multi-Specialty
                </span>
              </div>
            </Link>

            {/* Role-Based Desktop Navigation Links */}
            {user && (
              <nav className="hidden lg:flex items-center space-x-1 pl-2">
                {user.role === 'PATIENT' && (
                  <>
                    <Link
                      to="/patient?tab=overview"
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                        isNavActive('/patient', 'overview')
                          ? 'bg-hospital-50 text-hospital-700 font-extrabold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      <span>Dashboard</span>
                    </Link>
                    <Link
                      to="/patient?tab=consents"
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                        isNavActive('/patient', 'consents')
                          ? 'bg-hospital-50 text-hospital-700 font-extrabold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>Consents</span>
                    </Link>
                    <Link
                      to="/patient?tab=appointments"
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                        isNavActive('/patient', 'appointments')
                          ? 'bg-hospital-50 text-hospital-700 font-extrabold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Appointments</span>
                    </Link>
                    <Link
                      to="/patient?tab=documents"
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                        isNavActive('/patient', 'documents')
                          ? 'bg-hospital-50 text-hospital-700 font-extrabold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Documents</span>
                    </Link>
                  </>
                )}

                {user.role === 'DOCTOR' && (
                  <>
                    <Link
                      to="/doctor?tab=consents"
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                        isNavActive('/doctor', 'consents')
                          ? 'bg-hospital-50 text-hospital-700 font-extrabold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>Consents</span>
                    </Link>
                    <Link
                      to="/doctor?tab=appointments"
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                        isNavActive('/doctor', 'appointments')
                          ? 'bg-hospital-50 text-hospital-700 font-extrabold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Appointments</span>
                    </Link>
                    <Link
                      to="/doctor?tab=patients"
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                        isNavActive('/doctor', 'patients')
                          ? 'bg-hospital-50 text-hospital-700 font-extrabold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Patients &amp; Records</span>
                    </Link>
                  </>
                )}

                {user.role === 'ADMIN' && (
                  <>
                    <Link
                      to="/admin?tab=overview"
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                        isNavActive('/admin', 'overview')
                          ? 'bg-hospital-50 text-hospital-700 font-extrabold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      <span>Overview</span>
                    </Link>
                    <Link
                      to="/admin?tab=users"
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                        isNavActive('/admin', 'users')
                          ? 'bg-hospital-50 text-hospital-700 font-extrabold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Users</span>
                    </Link>
                    <Link
                      to="/admin?tab=departments"
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                        isNavActive('/admin', 'departments')
                          ? 'bg-hospital-50 text-hospital-700 font-extrabold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Departments</span>
                    </Link>
                    <Link
                      to="/admin?tab=consents"
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                        isNavActive('/admin', 'consents')
                          ? 'bg-hospital-50 text-hospital-700 font-extrabold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>Consents</span>
                    </Link>
                    <Link
                      to="/admin?tab=appointments"
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                        isNavActive('/admin', 'appointments')
                          ? 'bg-hospital-50 text-hospital-700 font-extrabold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Appointments</span>
                    </Link>
                  </>
                )}
              </nav>
            )}
          </div>

          {/* Quick Actions & Profile */}
          {user && (
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* AI Term Assistant Button */}
              <button
                type="button"
                onClick={onOpenAiAssistant}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-hospital-50 to-indigo-50 hover:from-hospital-100 hover:to-indigo-100 border border-hospital-200 text-hospital-700 rounded-lg text-xs font-bold shadow-xs transition hover:scale-102"
              >
                <Sparkles className="w-4 h-4 text-hospital-600 animate-pulse" />
                <span className="hidden sm:inline">AI Medical Assistant</span>
                <span className="sm:hidden">AI</span>
              </button>

              {/* Glossary Browser Button */}
              <button
                type="button"
                onClick={onOpenGlossary}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                title="Browse Medical Glossary"
              >
                <BookOpen className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden md:inline">Glossary</span>
              </button>

              <div className="h-6 w-px bg-slate-200"></div>

              {/* User Identity Pill */}
              <div className="flex items-center space-x-2 pl-1">
                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
                  <User className="w-4 h-4" />
                </div>
                <div className="hidden sm:block text-left">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-slate-800 leading-none">{user.fullName}</span>
                    {getRoleBadge(user.role)}
                  </div>
                  <span className="text-[10px] text-slate-400 block truncate max-w-[130px]">{user.email}</span>
                </div>
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                title="Logout"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
