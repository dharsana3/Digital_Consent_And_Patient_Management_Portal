import React from 'react';

const statusConfig = {
  PENDING_REVIEW: { label: 'Pending Review', bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' },
  APPROVED: { label: 'Approved & Signed', bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
  REJECTED: { label: 'Rejected', bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-300' },
  REVOKED: { label: 'Revoked', bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300' },
  ACTIVE: { label: 'Active', bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  SUSPENDED: { label: 'Suspended', bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
  ARCHIVED: { label: 'Archived', bg: 'bg-zinc-100', text: 'text-zinc-700', border: 'border-zinc-300' },
  REQUESTED: { label: 'Requested', bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' },
  CONFIRMED: { label: 'Confirmed', bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
  COMPLETED: { label: 'Completed', bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300' },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || { label: status, bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}>
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-70"></span>
      {config.label}
    </span>
  );
}
