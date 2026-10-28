import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { departmentApi } from '../../api';
import { Activity, User, Mail, Lock, Stethoscope, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';

const DEPARTMENT_SPECIALTIES = {
  1: ['Interventional Cardiology & Coronary Stenting', 'Electrophysiology & Arrhythmia', 'Heart Failure & Transplantation', 'Pediatric Cardiology', 'General Cardiology'],
  2: ['Adult Knee and Hip Arthroplasty', 'Spine Surgery & Trauma', 'Sports Medicine & Arthroscopy', 'Hand & Upper Extremity', 'Pediatric Orthopedics'],
  3: ['Laparoscopic & Minimally Invasive Surgery', 'Surgical Oncology', 'Bariatric & Metabolic Surgery', 'Colorectal Surgery', 'General Surgery'],
  4: ['Brain & Cerebrovascular Surgery', 'Spinal Neurosurgery', 'Neuro-Oncology & Skull Base', 'Pediatric Neurosurgery', 'General Neurology'],
  5: ['Cardiothoracic Anesthesia', 'Critical Care Medicine', 'Obstetric Anesthesiology', 'Pediatric Anesthesiology', 'Chronic Pain Management'],
};

const DEFAULT_DEPARTMENTS = [
  { id: 1, name: 'Cardiology' },
  { id: 2, name: 'Orthopedics & Joint Reconstruction' },
  { id: 3, name: 'General & Laparoscopic Surgery' },
  { id: 4, name: 'Neurology & Neurosurgery' },
  { id: 5, name: 'Anesthesiology & Pain Management' },
];

export default function RegisterPage() {
  const [role, setRole] = useState('PATIENT');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Patient fields
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('PREFER_NOT_TO_SAY');
  const [bloodGroup, setBloodGroup] = useState('UNKNOWN');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');

  // Doctor fields
  const [departmentId, setDepartmentId] = useState('1');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [specialization, setSpecialization] = useState('Interventional Cardiology & Coronary Stenting');
  const [isCustomSpecialization, setIsCustomSpecialization] = useState(false);
  const [customSpecialization, setCustomSpecialization] = useState('');
  const [officeLocation, setOfficeLocation] = useState('');

  const [departments, setDepartments] = useState(DEFAULT_DEPARTMENTS);
  const [deptLoading, setDeptLoading] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setDeptLoading(true);
    departmentApi.getAll()
      .then((res) => {
        if (res.data && res.data.data && res.data.data.length > 0) {
          setDepartments(res.data.data);
          setDepartmentId(String(res.data.data[0].id));
          const specs = DEPARTMENT_SPECIALTIES[res.data.data[0].id] || [];
          if (specs.length > 0 && !isCustomSpecialization) {
            setSpecialization(specs[0]);
          }
        }
      })
      .catch((err) => {
        console.warn('Using default departments list as fallback:', err);
      })
      .finally(() => {
        setDeptLoading(false);
      });
  }, []);

  const handleDepartmentChange = (deptIdVal) => {
    setDepartmentId(deptIdVal);
    const specs = DEPARTMENT_SPECIALTIES[deptIdVal] || [];
    if (specs.length > 0 && !isCustomSpecialization) {
      setSpecialization(specs[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        role,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        phoneNumber: phoneNumber?.trim(),
        address: address?.trim(),
      };

      if (role === 'PATIENT') {
        payload.dateOfBirth = dateOfBirth || null;
        payload.gender = gender;
        payload.bloodGroup = bloodGroup;
      } else if (role === 'DOCTOR') {
        if (!licenseNumber || !licenseNumber.trim()) {
          setError('Medical license number is mandatory for Doctor registration');
          setLoading(false);
          return;
        }
        const effectiveSpecialization = isCustomSpecialization
          ? (customSpecialization?.trim() || 'General Practice')
          : (specialization?.trim() || 'General Practice');

        payload.departmentId = departmentId ? Number(departmentId) : (departments[0]?.id || 1);
        payload.licenseNumber = licenseNumber.trim();
        payload.specialization = effectiveSpecialization;
        payload.officeLocation = officeLocation?.trim() || 'Main Hospital Campus';
      }

      const user = await register(payload);
      if (user.role === 'DOCTOR') navigate('/doctor');
      else navigate('/patient');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full space-y-6 bg-white p-8 rounded-2xl border border-slate-200 shadow-xl">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-hospital-700 to-hospital-500 flex items-center justify-center text-white shadow-md shadow-hospital-500/20 mb-3">
            <Activity className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Create Portal Account</h2>
          <p className="text-xs text-slate-500">Sign up as a patient or medical professional</p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Role Toggle */}
        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-xl">
          <button
            type="button"
            onClick={() => setRole('PATIENT')}
            className={`flex items-center justify-center py-2 text-xs font-bold rounded-lg transition ${
              role === 'PATIENT' ? 'bg-white text-hospital-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4 mr-1.5" /> Patient Account
          </button>
          <button
            type="button"
            onClick={() => setRole('DOCTOR')}
            className={`flex items-center justify-center py-2 text-xs font-bold rounded-lg transition ${
              role === 'DOCTOR' ? 'bg-white text-hospital-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Stethoscope className="w-4 h-4 mr-1.5" /> Doctor / Surgeon
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Common Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Legal Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Eleanor Vance"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-hospital-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-hospital-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-hospital-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-hospital-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Patient-specific fields */}
          {role === 'PATIENT' && (
            <div className="space-y-4 pt-2 border-t border-slate-150">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Patient Demographics</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-hospital-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-hospital-500 focus:outline-none"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                    <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Blood Group</label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-hospital-500 focus:outline-none"
                  >
                    <option value="UNKNOWN">Unknown</option>
                    <option value="A_POSITIVE">A+</option>
                    <option value="A_NEGATIVE">A-</option>
                    <option value="B_POSITIVE">B+</option>
                    <option value="B_NEGATIVE">B-</option>
                    <option value="AB_POSITIVE">AB+</option>
                    <option value="AB_NEGATIVE">AB-</option>
                    <option value="O_POSITIVE">O+</option>
                    <option value="O_NEGATIVE">O-</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Residential Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, City, State, ZIP"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-hospital-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Doctor-specific fields */}
          {role === 'DOCTOR' && (
            <div className="space-y-4 pt-2 border-t border-slate-150">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Clinical Credentials</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Medical License Number *</label>
                  <input
                    type="text"
                    required
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="e.g. MED-IL-77821"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-hospital-500 focus:outline-none"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">Hospital Department *</label>
                    {deptLoading && <span className="text-[10px] text-hospital-600 animate-pulse">Syncing...</span>}
                  </div>
                  <select
                    value={departmentId}
                    onChange={(e) => handleDepartmentChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-hospital-500 focus:outline-none bg-white"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">Clinical Specialization *</label>
                    <button
                      type="button"
                      onClick={() => setIsCustomSpecialization(!isCustomSpecialization)}
                      className="text-[10px] text-hospital-600 hover:underline font-semibold"
                    >
                      {isCustomSpecialization ? 'Choose from list' : 'Custom entry'}
                    </button>
                  </div>
                  {isCustomSpecialization ? (
                    <input
                      type="text"
                      required
                      value={customSpecialization}
                      onChange={(e) => setCustomSpecialization(e.target.value)}
                      placeholder="e.g. Pediatric Cardiac Electrophysiology"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-hospital-500 focus:outline-none"
                    />
                  ) : (
                    <select
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-hospital-500 focus:outline-none bg-white"
                    >
                      {(DEPARTMENT_SPECIALTIES[departmentId] || [
                        'General Practice',
                        'Internal Medicine',
                        'Consultant Specialist'
                      ]).map((spec) => (
                        <option key={spec} value={spec}>
                          {spec}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Office / Clinic Location</label>
                  <input
                    type="text"
                    value={officeLocation}
                    onChange={(e) => setOfficeLocation(e.target.value)}
                    placeholder="e.g. Suite 302, East Pavilion"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-hospital-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-hospital-600 hover:bg-hospital-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md shadow-hospital-600/20 transition flex items-center justify-center space-x-2"
          >
            <span>{loading ? 'Creating Account...' : 'Complete Registration'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-150">
          <p className="text-xs text-slate-500">
            Already registered?{' '}
            <Link to="/login" className="text-hospital-600 font-bold hover:underline">
              Sign in to your account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
