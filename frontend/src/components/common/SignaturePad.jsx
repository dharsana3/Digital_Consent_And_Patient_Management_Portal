import React, { useRef, useState, useEffect } from 'react';
import { RotateCcw, CheckCircle, Edit3, Type } from 'lucide-react';

export default function SignaturePad({ onSave, onCancel }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [mode, setMode] = useState('draw'); // 'draw' | 'type'
  const [typedName, setTypedName] = useState('');
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a';
  }, [mode]);

  const startDrawing = (e) => {
    if (mode !== 'draw') return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setIsEmpty(false);
  };

  const draw = (e) => {
    if (!isDrawing || mode !== 'draw') return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    setTypedName('');
  };

  const handleTypeChange = (e) => {
    const val = e.target.value;
    setTypedName(val);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (val.trim()) {
      setIsEmpty(false);
      ctx.font = 'italic 34px "Brush Script MT", "Caveat", "Segoe Script", cursive';
      ctx.fillStyle = '#0f172a';
      ctx.fillText(val.trim(), 40, 100);
    } else {
      setIsEmpty(true);
    }
  };

  const handleConfirm = () => {
    if (isEmpty) return;
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Legal Digital Signature</h3>
          <p className="text-xs text-slate-500">Draw or type your signature to authorize the procedure consent</p>
        </div>
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => { setMode('draw'); clearCanvas(); }}
            className={`flex items-center px-3 py-1.5 text-xs font-semibold rounded-md transition ${mode === 'draw' ? 'bg-white text-hospital-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <Edit3 className="w-3.5 h-3.5 mr-1" /> Draw
          </button>
          <button
            type="button"
            onClick={() => { setMode('type'); clearCanvas(); }}
            className={`flex items-center px-3 py-1.5 text-xs font-semibold rounded-md transition ${mode === 'type' ? 'bg-white text-hospital-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <Type className="w-3.5 h-3.5 mr-1" /> Type
          </button>
        </div>
      </div>

      {mode === 'type' && (
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-700 mb-1">Type your legal full name:</label>
          <input
            type="text"
            value={typedName}
            onChange={handleTypeChange}
            placeholder="e.g. Jane Doe"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-hospital-500 focus:outline-none"
          />
        </div>
      )}

      <div className="relative border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={540}
          height={160}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-40 signature-canvas bg-white"
        />
        <div className="absolute bottom-2 right-2 text-[10px] text-slate-400 select-none">
          Signing Canvas &bull; Multi-touch &amp; Mouse
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
        <span>Draw inside the box above</span>
        <button
          type="button"
          onClick={clearCanvas}
          className="flex items-center text-slate-600 hover:text-rose-600 font-medium transition"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1" /> Clear Signature
        </button>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-200">
        <label className="flex items-start space-x-2 text-xs text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 rounded border-slate-300 text-hospital-600 focus:ring-hospital-500"
          />
          <span>
            I acknowledge that I have read the complete consent document, had all my questions addressed, and agree that this digital signature has the same legal effect as a handwritten signature.
          </span>
        </label>
      </div>

      <div className="mt-6 flex items-center justify-end space-x-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          disabled={isEmpty || !agreed}
          onClick={handleConfirm}
          className="flex items-center px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold shadow-sm transition"
        >
          <CheckCircle className="w-4 h-4 mr-1.5" /> Confirm &amp; Sign Consent
        </button>
      </div>
    </div>
  );
}
