import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { userApi, departmentApi, consentApi, appointmentApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  Stethoscope,
  FileText,
  Building2,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Calendar,
  Eye,
  Filter,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const [stats, setStats] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [consents, setConsents] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [consentFilter, setConsentFilter] = useState('');
  const [appointmentFilter, setAppointmentFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Department modal state
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [deptForm, setDeptForm] = useState({ name: '', description: '', headDoctorName: '' });
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, [roleFilter]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, deptsRes, usersRes, consentsRes, apptsRes] = await Promise.all([
        userApi.getAdminStats().catch((e) => ({ data: { data: null } })),
        departmentApi.getAll().catch((e) => ({ data: { data: [] } })),
        userApi.getAll(roleFilter || undefined).catch((e) => ({ data: { data: [] } })),
        consentApi.getAllConsents().catch((e) => ({ data: { data: [] } })),
        appointmentApi.getAllAppointments().catch((e) => ({ data: { data: [] } })),
      ]);

      if (statsRes.data?.data) setStats(statsRes.data.data);
      if (deptsRes.data?.data) setDepartments(deptsRes.data.data);
      if (usersRes.data?.data) setUsers(usersRes.data.data);
      if (consentsRes.data?.data) setConsents(consentsRes.data.data);
      if (apptsRes.data?.data) setAppointments(apptsRes.data.data);
    } catch (err) {
      console.error('Failed to load admin data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDeptModal = (dept = null) => {
    setActionError('');
    if (dept) {
      setEditingDept(dept);
      setDeptForm({ name: dept.name, description: dept.description || '', headDoctorName: dept.headDoctorName || '' });
    } else {
      setEditingDept(null);
      setDeptForm({ name: '', description: '', headDoctorName: '' });
    }
    setDeptModalOpen(true);
  };

  const handleSaveDepartment = async (e) => {
    e.preventDefault();
    setActionError('');
    try {
      if (editingDept) {
        await departmentApi.update(editingDept.id, deptForm);
      } else {
        await departmentApi.create(deptForm);
      }
      setDeptModalOpen(false);
      loadDashboardData();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to save department');
    }
  };

  const handleDeleteDepartment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;
    try {
      await departmentApi.delete(id);
      loadDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete department');
    }
  };

  const handleToggleUserStatus = async (targetUser) => {
    const newStatus = targetUser.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    if (!window.confirm(`Are you sure you want to change status of ${targetUser.fullName} to ${newStatus}?`)) return;

    try {
      await userApi.updateStatus(targetUser.id, newStatus);
      loadDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleCancelHospitalAppt = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment as administrator?')) return;
    try {
      await appointmentApi.updateStatus(id, { status: 'CANCELLED', doctorNotes: 'Cancelled by hospital administration' });
      loadDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel appointment');
    }
  };

  if (loading && !stats) {
    return <LoadingSpinner size="lg" text="Loading hospital administrative overview..." />;
  }

  const filteredConsents = consentFilter
    ? consents.filter((c) => c.status === consentFilter)
    : consents;

  const filteredAppointments = appointmentFilter
    ? appointments.filter((a) => a.status === appointmentFilter)
    : appointments;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Hospital Administration</h1>
          <p className="text-xs text-slate-500">System governance, clinical departments, appointments, consents, and user access oversight</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-purple-50 text-purple-700 rounded-xl text-xs font-bold border border-purple-200">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>Administrator Session</span>
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Total Users</span>
            <span className="text-2xl font-extrabold text-slate-900 mt-1 block">{stats.totalUsers}</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-blue-500 block uppercase">Doctors</span>
            <span className="text-2xl font-extrabold text-blue-700 mt-1 block">{stats.totalDoctors}</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-emerald-500 block uppercase">Patients</span>
            <span className="text-2xl font-extrabold text-emerald-700 mt-1 block">{stats.totalPatients}</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-purple-500 block uppercase">Departments</span>
            <span className="text-2xl font-extrabold text-purple-700 mt-1 block">{stats.totalDepartments}</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-amber-500 block uppercase">Consents Pending</span>
            <span className="text-2xl font-extrabold text-amber-700 mt-1 block">{stats.pendingConsents}</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-hospital-600 block uppercase">Appointments</span>
            <span className="text-2xl font-extrabold text-hospital-700 mt-1 block">{stats.totalAppointments || appointments.length}</span>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'overview' })}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'overview'
              ? 'bg-hospital-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Overview
        </button>
        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'users' })}
          className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'users'
              ? 'bg-hospital-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Management ({users.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'departments' })}
          className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'departments'
              ? 'bg-hospital-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Departments ({departments.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'consents' })}
          className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'consents'
              ? 'bg-hospital-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Consents ({consents.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'appointments' })}
          className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === 'appointments'
              ? 'bg-hospital-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Appointments ({appointments.length})</span>
        </button>
      </div>

      {/* SECTION: Departments (Overview or Departments tab) */}
      {(activeTab === 'overview' || activeTab === 'departments') && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-150 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-hospital-600" />
              <h2 className="text-base font-bold text-slate-900">Hospital Specialty Departments</h2>
            </div>
            <button
              type="button"
              onClick={() => handleOpenDeptModal()}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-hospital-600 hover:bg-hospital-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Department</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-150">
                <tr>
                  <th className="px-6 py-3">Department Name</th>
                  <th className="px-6 py-3">Head Physician</th>
                  <th className="px-6 py-3">Clinical Description</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {departments.map((dept) => (
                  <tr key={dept.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-3.5 font-bold text-slate-900">{dept.name}</td>
                    <td className="px-6 py-3.5 text-slate-600">{dept.headDoctorName || 'Not designated'}</td>
                    <td className="px-6 py-3.5 text-slate-500 max-w-md truncate">{dept.description || '—'}</td>
                    <td className="px-6 py-3.5 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleOpenDeptModal(dept)}
                        className="p-1.5 text-slate-400 hover:text-hospital-600 hover:bg-hospital-50 rounded-lg transition"
                        title="Edit Department"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDepartment(dept.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete Department"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION: User Management (Overview or Users tab) */}
      {(activeTab === 'overview' || activeTab === 'users') && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-hospital-600" />
              <h2 className="text-base font-bold text-slate-900">Registered Accounts Directory</h2>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-hospital-500 focus:outline-none bg-white"
              >
                <option value="">All Roles</option>
                <option value="ADMIN">Administrators</option>
                <option value="DOCTOR">Physicians</option>
                <option value="PATIENT">Patients</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-150">
                <tr>
                  <th className="px-6 py-3">Full Legal Name</th>
                  <th className="px-6 py-3">Email Address</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Account Status</th>
                  <th className="px-6 py-3 text-right">Status Toggle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-3.5 font-bold text-slate-900">{u.fullName}</td>
                    <td className="px-6 py-3.5 text-slate-600">{u.email}</td>
                    <td className="px-6 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        u.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-800 border-purple-200'
                          : u.role === 'DOCTOR'
                          ? 'bg-blue-100 text-blue-800 border-blue-200'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      {u.id !== user.id && (
                        <button
                          type="button"
                          onClick={() => handleToggleUserStatus(u)}
                          className={`px-3 py-1 rounded-lg text-[11px] font-bold transition ${
                            u.status === 'ACTIVE'
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                        >
                          {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION: Consents Management (Consents tab) */}
      {activeTab === 'consents' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-hospital-600" />
              <h2 className="text-base font-bold text-slate-900">Hospital Procedure Consents</h2>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={consentFilter}
                onChange={(e) => setConsentFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-hospital-500 focus:outline-none bg-white"
              >
                <option value="">All Statuses</option>
                <option value="PENDING_REVIEW">Pending Review</option>
                <option value="APPROVED">Approved &amp; Signed</option>
                <option value="REJECTED">Rejected</option>
                <option value="REVOKED">Revoked</option>
              </select>
            </div>
          </div>

          {filteredConsents.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No procedure consent records match the selected filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-150">
                  <tr>
                    <th className="px-6 py-3.5">Consent Number</th>
                    <th className="px-6 py-3.5">Procedure</th>
                    <th className="px-6 py-3.5">Attending Doctor</th>
                    <th className="px-6 py-3.5">Patient</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Request Date</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {filteredConsents.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-6 py-4 font-mono font-bold text-hospital-700">{c.consentNumber}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">{c.procedureName}</td>
                      <td className="px-6 py-4 text-slate-700">Dr. {c.doctor?.fullName}</td>
                      <td className="px-6 py-4 text-slate-700">{c.patient?.fullName}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-6 py-4 text-slate-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/consents/${c.id}`}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 bg-hospital-50 hover:bg-hospital-100 text-hospital-700 rounded-lg text-xs font-bold transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Detail</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SECTION: Appointments Management (Appointments tab) */}
      {activeTab === 'appointments' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-hospital-600" />
              <h2 className="text-base font-bold text-slate-900">Hospital Appointment Consultations</h2>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={appointmentFilter}
                onChange={(e) => setAppointmentFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-hospital-500 focus:outline-none bg-white"
              >
                <option value="">All Statuses</option>
                <option value="REQUESTED">Requested</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          {filteredAppointments.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No hospital appointments match the selected filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-150">
                  <tr>
                    <th className="px-6 py-3.5">Patient</th>
                    <th className="px-6 py-3.5">Doctor &amp; Department</th>
                    <th className="px-6 py-3.5">Date &amp; Time</th>
                    <th className="px-6 py-3.5">Reason</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Physician Notes</th>
                    <th className="px-6 py-3.5 text-right">Admin Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {filteredAppointments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-900 block">{a.patientName}</span>
                        <span className="text-[10px] text-slate-400 block">{a.patientEmail}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-800 block">{a.doctorName}</span>
                        <span className="text-[10px] text-hospital-600 block">{a.departmentName} &bull; {a.doctorSpecialization}</span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        <div>{a.appointmentDate}</div>
                        <div className="text-[10px] text-slate-400 flex items-center space-x-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{a.appointmentTime}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 max-w-xs truncate" title={a.reason}>
                        {a.reason}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={a.status} />
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-[11px] italic">
                        {a.doctorNotes || '—'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {(a.status === 'REQUESTED' || a.status === 'CONFIRMED') && (
                          <button
                            type="button"
                            onClick={() => handleCancelHospitalAppt(a.id)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold transition"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Cancel</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Department Modal */}
      <Modal
        isOpen={deptModalOpen}
        onClose={() => setDeptModalOpen(false)}
        title={editingDept ? 'Edit Clinical Department' : 'Create New Department'}
      >
        <form onSubmit={handleSaveDepartment} className="space-y-4">
          {actionError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs font-semibold">
              {actionError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Department Name *</label>
            <input
              type="text"
              required
              value={deptForm.name}
              onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
              placeholder="e.g. Oncology &amp; Hematology"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-hospital-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Department Head / Chief Physician</label>
            <input
              type="text"
              value={deptForm.headDoctorName}
              onChange={(e) => setDeptForm({ ...deptForm, headDoctorName: e.target.value })}
              placeholder="e.g. Dr. Robert Chen, MD"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-hospital-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Scope &amp; Description</label>
            <textarea
              rows={3}
              value={deptForm.description}
              onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
              placeholder="Overview of medical services, specialty clinics, and treatments..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-hospital-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-150">
            <button
              type="button"
              onClick={() => setDeptModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-hospital-600 hover:bg-hospital-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
            >
              {editingDept ? 'Update Department' : 'Save Department'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
