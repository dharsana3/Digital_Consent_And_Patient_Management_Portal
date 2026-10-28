import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { consentApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import {
  FileCheck,
  Sparkles,
  ArrowLeft,
  Clock,
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Send,
  User,
  Stethoscope,
  Calendar,
} from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import SignaturePad from '../../components/common/SignaturePad';
import Modal from '../../components/common/Modal';

export default function ConsentDetailPage({ onOpenAiAssistantWithConsent }) {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [consent, setConsent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [signModalOpen, setSignModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [questionModalOpen, setQuestionModalOpen] = useState(false);

  // Forms
  const [rejectionReason, setRejectionReason] = useState('');
  const [revocationReason, setRevocationReason] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [patientComments, setPatientComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadConsent();
  }, [id]);

  const loadConsent = async () => {
    try {
      setLoading(true);
      const res = await consentApi.getById(id);
      if (res.data?.data) {
        setConsent(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load consent details');
    } finally {
      setLoading(false);
    }
  };

  const handleSignConfirm = async (signatureData) => {
    try {
      setSubmitting(true);
      await consentApi.sign(id, {
        signatureData,
        patientComments: patientComments || undefined,
      });
      setSignModalOpen(false);
      loadConsent();
    } catch (err) {
      alert(err.response?.data?.message || 'Signing failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectConfirm = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await consentApi.reject(id, { reason: rejectionReason });
      setRejectModalOpen(false);
      loadConsent();
    } catch (err) {
      alert(err.response?.data?.message || 'Rejection failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevokeConfirm = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await consentApi.revoke(id, { reason: revocationReason });
      setRevokeModalOpen(false);
      loadConsent();
    } catch (err) {
      alert(err.response?.data?.message || 'Revocation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await consentApi.askQuestion(id, { question: questionText });
      setQuestionModalOpen(false);
      setQuestionText('');
      loadConsent();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit question');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" text="Retrieving digital consent agreement..." />;
  if (error || !consent) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-center">
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-6 rounded-2xl">
          <h3 className="font-bold text-base">Error Loading Consent</h3>
          <p className="text-xs mt-1">{error || 'Consent not found or access denied.'}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isPatient = user?.role === 'PATIENT';
  const isDoctor = user?.role === 'DOCTOR';
  const isPending = consent.status === 'PENDING_REVIEW';
  const isApproved = consent.status === 'APPROVED';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Back & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center space-x-2">
          {/* AI Term Explainer Button */}
          <button
            type="button"
            onClick={() => onOpenAiAssistantWithConsent && onOpenAiAssistantWithConsent(consent.id)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold shadow-xs transition"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Explain Terms with AI</span>
          </button>

          {/* Ask Clarification Button */}
          {isPatient && (isPending || isApproved) && (
            <button
              type="button"
              onClick={() => setQuestionModalOpen(true)}
              className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Ask Doctor Question</span>
            </button>
          )}

          {/* Sign Button */}
          {isPatient && isPending && (
            <button
              type="button"
              onClick={() => setSignModalOpen(true)}
              className="flex items-center space-x-1 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Sign &amp; Approve</span>
            </button>
          )}

          {/* Reject Button */}
          {isPatient && isPending && (
            <button
              type="button"
              onClick={() => setRejectModalOpen(true)}
              className="flex items-center space-x-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold transition"
            >
              <XCircle className="w-4 h-4" />
              <span>Reject</span>
            </button>
          )}

          {/* Revoke Button */}
          {isApproved && (isPatient || isDoctor) && (
            <button
              type="button"
              onClick={() => setRevokeModalOpen(true)}
              className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 rounded-xl text-xs font-bold transition"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Revoke Consent</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Consent Document Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Document Header */}
        <div className="bg-slate-50 border-b border-slate-200 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-hospital-700 bg-hospital-50 border border-hospital-200 px-2 py-0.5 rounded-md">
                {consent.consentNumber}
              </span>
              <span className="text-xs text-slate-400 font-semibold">Version {consent.consentVersion}</span>
              <StatusBadge status={consent.status} />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {consent.procedureName}
            </h1>
            <p className="text-xs text-slate-500 max-w-xl">{consent.procedureDescription}</p>
          </div>

          <div className="flex flex-col sm:items-end text-xs text-slate-500 space-y-1">
            <div className="flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Created: {new Date(consent.createdAt).toLocaleDateString()}</span>
            </div>
            {consent.validUntil && (
              <div className="flex items-center space-x-1.5 text-hospital-700 font-semibold">
                <Clock className="w-3.5 h-3.5" />
                <span>Valid Until: {consent.validUntil}</span>
              </div>
            )}
          </div>
        </div>

        {/* Clinical Parties Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-150 border-b border-slate-200 bg-slate-50/40 text-xs">
          <div className="p-4 sm:p-6 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Patient Party</span>
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-slate-400" />
              <strong className="text-sm font-bold text-slate-900">{consent.patient?.fullName}</strong>
            </div>
            <p className="text-slate-500">Email: {consent.patient?.email}</p>
            <p className="text-slate-500">
              DOB: {consent.patient?.dateOfBirth || 'N/A'} &bull; Blood: {consent.patient?.bloodGroup || 'Unknown'}
            </p>
          </div>
          <div className="p-4 sm:p-6 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Attending Physician Party</span>
            <div className="flex items-center space-x-2">
              <Stethoscope className="w-4 h-4 text-hospital-600" />
              <strong className="text-sm font-bold text-slate-900">Dr. {consent.doctor?.fullName}</strong>
            </div>
            <p className="text-slate-500">Department: {consent.doctor?.departmentName}</p>
            <p className="text-slate-500">
              License: <span className="font-mono">{consent.doctor?.licenseNumber}</span> &bull; {consent.doctor?.specialization}
            </p>
          </div>
        </div>

        {/* Consent Disclosures & Legal Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
              1. Procedure Description &amp; Clinical Disclosures
            </h3>
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-xs text-slate-700 leading-relaxed font-mono whitespace-pre-wrap">
              {consent.consentText}
            </div>
          </div>

          {consent.risksAndAlternatives && (
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
                2. Anticipated Risks, Complications &amp; Alternatives
              </h3>
              <div className="bg-amber-50/50 rounded-2xl p-5 border border-amber-200 text-xs text-amber-950 leading-relaxed whitespace-pre-wrap">
                {consent.risksAndAlternatives}
              </div>
            </div>
          )}

          {consent.doctorNotes && (
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-1">
                3. Attending Physician Notes
              </h3>
              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                {consent.doctorNotes}
              </p>
            </div>
          )}

          {/* Signature / Status Verification Box */}
          <div className="pt-4 border-t border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
              4. Legal Execution &amp; Signature Verification
            </h3>

            {isApproved && consent.signatureData ? (
              <div className="bg-emerald-50/70 border border-emerald-300 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-800 font-bold text-sm">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <span>Digitally Executed by Patient</span>
                  </div>
                  <p className="text-xs text-emerald-950">
                    Signed by: <strong>{consent.patient?.fullName}</strong>
                  </p>
                  <p className="text-xs text-emerald-900 flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Timestamp: {new Date(consent.signatureTimestamp).toLocaleString()}</span>
                  </p>
                  {consent.patientComments && (
                    <p className="text-xs text-emerald-900 italic mt-1">
                      Patient statement: "{consent.patientComments}"
                    </p>
                  )}
                </div>

                <div className="bg-white border border-emerald-200 rounded-xl p-3 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                    Verified Digital Signature
                  </span>
                  <img
                    src={consent.signatureData}
                    alt="Digital Patient Signature"
                    className="max-h-20 w-auto border-b border-slate-300 pb-1"
                  />
                  <span className="text-[9px] text-slate-400 font-mono block mt-1">
                    SHA-256 Verified &bull; Legally Binding
                  </span>
                </div>
              </div>
            ) : consent.status === 'REJECTED' ? (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-xs text-rose-800 space-y-1">
                <div className="flex items-center space-x-2 font-bold text-rose-900 text-sm">
                  <XCircle className="w-5 h-5 text-rose-600" />
                  <span>Consent Request Declined by Patient</span>
                </div>
                <p>{consent.patientComments || 'Patient elected not to execute this consent.'}</p>
              </div>
            ) : consent.status === 'REVOKED' ? (
              <div className="bg-slate-100 border border-slate-300 rounded-2xl p-5 text-xs text-slate-800 space-y-1">
                <div className="flex items-center space-x-2 font-bold text-slate-900 text-sm">
                  <AlertTriangle className="w-5 h-5 text-slate-600" />
                  <span>Consent Revoked</span>
                </div>
                <p>Revocation Reason: <strong>{consent.revocationReason}</strong></p>
                <p className="text-slate-500">Revocation Timestamp: {new Date(consent.revocationTimestamp).toLocaleString()}</p>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-amber-900 text-xs">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Awaiting Patient Digital Review and Signature Execution</span>
                </div>
                {isPatient && (
                  <button
                    type="button"
                    onClick={() => setSignModalOpen(true)}
                    className="px-4 py-2 bg-hospital-600 hover:bg-hospital-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                  >
                    Launch Signature Pad
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Immutable Audit Trail Timeline */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-150 pb-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-hospital-600" />
            <h2 className="text-base font-bold text-slate-900">Legal Audit Trail &amp; Access Log</h2>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">
            Immutable Chain of Custody ({consent.auditTrail?.length || 0} Events)
          </span>
        </div>

        <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {consent.auditTrail?.map((log, idx) => (
            <div key={log.id || idx} className="relative group">
              <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-white bg-hospital-600 shadow-xs"></div>
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{log.action}</span>
                  <span className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                </div>
                <p className="text-slate-600">{log.details}</p>
                <div className="flex items-center space-x-2 text-[10px] text-slate-400 pt-1 border-t border-slate-150">
                  <span>Actor: <strong>{log.performedByName}</strong> ({log.performedByRole})</span>
                  <span>&bull;</span>
                  <span>IP: {log.ipAddress || '127.0.0.1'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sign Consent Modal */}
      <Modal isOpen={signModalOpen} onClose={() => setSignModalOpen(false)} title="Sign Digital Consent Agreement" maxWidth="max-w-xl">
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            By signing below, you verify that you understand the proposed procedure (<strong>{consent.procedureName}</strong>), the sedation and surgical risks, and that you voluntarily authorize the treatment.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Optional Comments or Questions for Physician:</label>
            <input
              type="text"
              value={patientComments}
              onChange={(e) => setPatientComments(e.target.value)}
              placeholder="e.g. Discussed allergy precautions with Dr. Vance."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-hospital-500 focus:outline-none"
            />
          </div>

          <SignaturePad onSave={handleSignConfirm} onCancel={() => setSignModalOpen(false)} />
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal isOpen={rejectModalOpen} onClose={() => setRejectModalOpen(false)} title="Decline Consent Request">
        <form onSubmit={handleRejectConfirm} className="space-y-4">
          <p className="text-xs text-slate-600">
            Please provide your reason for declining this procedure consent. This will be recorded into the official clinical audit log.
          </p>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Rejection Reason *</label>
            <textarea
              required
              minLength={5}
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Decided to postpone surgery or pursue conservative alternative treatment..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-hospital-500 focus:outline-none"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-150">
            <button
              type="button"
              onClick={() => setRejectModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              Confirm Rejection
            </button>
          </div>
        </form>
      </Modal>

      {/* Revoke Modal */}
      <Modal isOpen={revokeModalOpen} onClose={() => setRevokeModalOpen(false)} title="Revoke Approved Consent">
        <form onSubmit={handleRevokeConfirm} className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-xl text-xs flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Legal Notice:</strong> Revoking this consent will immediately cancel surgical authorization. The treating team will be notified.
            </span>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Formal Revocation Reason *</label>
            <textarea
              required
              minLength={5}
              rows={3}
              value={revocationReason}
              onChange={(e) => setRevocationReason(e.target.value)}
              placeholder="e.g. Patient withdrew agreement due to change in clinical condition or second opinion..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-hospital-500 focus:outline-none"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-150">
            <button
              type="button"
              onClick={() => setRevokeModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              Confirm Revocation
            </button>
          </div>
        </form>
      </Modal>

      {/* Ask Question Modal */}
      <Modal isOpen={questionModalOpen} onClose={() => setQuestionModalOpen(false)} title="Submit Question to Attending Physician">
        <form onSubmit={handleAskQuestion} className="space-y-4">
          <p className="text-xs text-slate-600">
            Your question will be appended to the official consent audit log for clinical review by Dr. {consent.doctor?.fullName}.
          </p>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Your Question or Clarification Request *</label>
            <textarea
              required
              minLength={5}
              rows={3}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="e.g. Could you explain the anesthesia protocol or expected recovery time in more detail?"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-hospital-500 focus:outline-none"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-150">
            <button
              type="button"
              onClick={() => setQuestionModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-hospital-600 hover:bg-hospital-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              Record Question
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
