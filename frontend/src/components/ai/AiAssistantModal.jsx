import React, { useState, useEffect, useRef } from 'react';
import { aiApi, consentApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, Send, BookOpen, AlertTriangle, HelpCircle, Copy, Check, MessageSquare } from 'lucide-react';
import Modal from '../common/Modal';

export default function AiAssistantModal({ isOpen, onClose, preselectedConsentId = null }) {
  const { user } = useAuth();
  const [consents, setConsents] = useState([]);
  const [selectedConsentId, setSelectedConsentId] = useState(preselectedConsentId || '');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hello! I am your AI Medical-Term Assistant. I can help translate complex medical vocabulary in your consent forms into plain, easy-to-understand language.\n\nSelect a consent form or ask about any medical terms below!',
      suggestedQuestions: [
        'What does general anesthesia mean?',
        'What are postoperative complications?',
        'What does infection risk mean?',
        'What is an elective procedure?',
      ],
      disclaimer: 'This assistant explains medical terms for educational purposes only. It cannot diagnose conditions, recommend treatments, or decide whether you should undergo a procedure. Always consult your attending doctor.',
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (preselectedConsentId) {
      setSelectedConsentId(preselectedConsentId);
    }
  }, [preselectedConsentId]);

  useEffect(() => {
    if (isOpen && user && user.role === 'PATIENT') {
      consentApi.getMyConsents()
        .then((res) => {
          if (res.data && res.data.data) {
            setConsents(res.data.data);
          }
        })
        .catch((err) => console.error('Failed to load consents for AI assistant', err));
    }
  }, [isOpen, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (questionToSend = null) => {
    const q = (questionToSend || inputQuestion).trim();
    if (!q || loading) return;

    const userMessage = { role: 'user', text: q };
    setMessages((prev) => [...prev, userMessage]);
    setInputQuestion('');
    setLoading(true);

    try {
      const payload = {
        question: q,
        consentId: selectedConsentId ? Number(selectedConsentId) : null,
      };

      const res = await aiApi.askInquiry(payload);
      const data = res.data.data;

      const assistantMessage = {
        role: 'assistant',
        text: data.answer,
        layman: data.laymanExplanation,
        matchedTerms: data.matchedGlossaryTerms,
        suggestedQuestions: data.suggestedDoctorQuestions,
        providerUsed: data.providerUsed,
        disclaimer: data.disclaimer,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to generate explanation. Please try again or consult your doctor.';
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `⚠️ **Notice:** ${errorMsg}`,
          disclaimer: 'Always verify medical terminology directly with your treating surgical team.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyQuestion = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI Medical-Term Assistant" maxWidth="max-w-3xl">
      <div className="flex flex-col h-[600px] -mt-2">
        {/* Context Selector Bar */}
        <div className="bg-hospital-50 border border-hospital-150 rounded-xl p-3 mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-hospital-600" />
            <span className="text-xs font-bold text-hospital-900">Active Consent Context:</span>
          </div>
          <select
            value={selectedConsentId}
            onChange={(e) => setSelectedConsentId(e.target.value)}
            className="text-xs font-medium bg-white border border-hospital-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-hospital-500"
          >
            <option value="">General Medical Terminology (No specific form)</option>
            {consents.map((c) => (
              <option key={c.id} value={c.id}>
                {c.consentNumber} - {c.procedureName} ({c.status})
              </option>
            ))}
          </select>
        </div>

        {/* Chat Messages Container */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              {msg.role === 'user' ? (
                <div className="max-w-[85%] bg-hospital-600 text-white rounded-2xl rounded-br-xs px-4 py-2.5 text-sm font-medium shadow-xs">
                  {msg.text}
                </div>
              ) : (
                <div className="max-w-[95%] bg-white border border-slate-200 rounded-2xl rounded-bl-xs p-4 shadow-xs space-y-3">
                  {/* Provider Pill */}
                  {msg.providerUsed && (
                    <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-100 pb-2">
                      <span className="font-semibold text-hospital-700">Source: {msg.providerUsed}</span>
                      <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">Privacy Preserving</span>
                    </div>
                  )}

                  {/* Main Answer Text */}
                  <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-normal">
                    {msg.text}
                  </div>

                  {/* Matched Glossary Terms Cards */}
                  {msg.matchedTerms && msg.matchedTerms.length > 0 && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 mt-2">
                      <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700">
                        <BookOpen className="w-3.5 h-3.5 text-hospital-600" />
                        <span>Matched Clinical Dictionary Entries:</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {msg.matchedTerms.map((term, tIdx) => (
                          <div key={tIdx} className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                            <span className="font-bold text-hospital-700 block">{term.term}</span>
                            <span className="text-[10px] text-slate-400 block mb-1">Category: {term.category}</span>
                            <p className="text-slate-600">{term.laymanExplanation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggested Questions to Ask Doctor */}
                  {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                    <div className="border-t border-slate-100 pt-3 space-y-1.5">
                      <span className="text-xs font-bold text-slate-600 block">Recommended questions for your doctor:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.suggestedQuestions.map((q, qIdx) => (
                          <div
                            key={qIdx}
                            className="flex items-center space-x-1 bg-amber-50/70 border border-amber-200 text-amber-900 px-2.5 py-1 rounded-lg text-xs"
                          >
                            <HelpCircle className="w-3 h-3 text-amber-600 shrink-0" />
                            <span className="line-clamp-1">{q}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyQuestion(q, `${idx}-${qIdx}`)}
                              className="text-amber-700 hover:text-amber-950 p-0.5 ml-1"
                              title="Copy question to clipboard"
                            >
                              {copiedIndex === `${idx}-${qIdx}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Safety Disclaimer */}
                  {msg.disclaimer && (
                    <div className="flex items-start space-x-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-[11px] text-amber-800 leading-tight">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>{msg.disclaimer}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-xl p-3 w-fit text-xs text-slate-500 shadow-xs">
              <Sparkles className="w-4 h-4 text-hospital-600 animate-spin" />
              <span>Analyzing medical terms and generating layman explanation...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Question Input & Actions */}
        <div className="mt-3 pt-3 border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              placeholder="Ask about a medical term (e.g. 'What does laparoscopy mean?')..."
              className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-hospital-500 focus:outline-none"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !inputQuestion.trim()}
              className="px-4 py-2.5 bg-hospital-600 hover:bg-hospital-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-sm transition flex items-center space-x-1"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Ask</span>
            </button>
          </form>
          <p className="text-[10px] text-slate-400 mt-1.5 text-center">
            🔒 Privacy Secured: No patient identifying data or clinical history is stored externally.
          </p>
        </div>
      </div>
    </Modal>
  );
}
