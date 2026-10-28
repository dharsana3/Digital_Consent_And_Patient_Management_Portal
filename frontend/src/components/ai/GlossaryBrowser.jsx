import React, { useState, useEffect } from 'react';
import { aiApi } from '../../api';
import { Search, BookOpen, HelpCircle, CheckCircle } from 'lucide-react';
import Modal from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';

export default function GlossaryBrowser({ isOpen, onClose }) {
  const [terms, setTerms] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCategories();
      fetchTerms('', '');
    }
  }, [isOpen]);

  const loadCategories = async () => {
    try {
      const res = await aiApi.getCategories();
      if (res.data && res.data.data) {
        setCategories(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load glossary categories', err);
    }
  };

  const fetchTerms = async (query, category) => {
    setLoading(true);
    try {
      const res = await aiApi.searchGlossary(query, category);
      if (res.data && res.data.data) {
        setTerms(res.data.data);
      }
    } catch (err) {
      console.error('Failed to search glossary', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    fetchTerms(q, selectedCategory);
  };

  const handleCategorySelect = (category) => {
    const newCategory = category === selectedCategory ? '' : category;
    setSelectedCategory(newCategory);
    fetchTerms(searchQuery, newCategory);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Medical Terminology Glossary" maxWidth="max-w-4xl">
      <div className="space-y-4">
        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search medical terms or keywords (e.g., anesthesia, clot, infection)..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-hospital-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex flex-wrap gap-1.5 pb-2 border-b border-slate-150">
          <button
            type="button"
            onClick={() => handleCategorySelect('')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              selectedCategory === ''
                ? 'bg-hospital-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Specialties
          </button>
          {categories.map((cat, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleCategorySelect(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                selectedCategory === cat
                  ? 'bg-hospital-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Term Cards List */}
        {loading ? (
          <LoadingSpinner text="Searching medical glossary..." />
        ) : terms.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            No medical terms found matching your query.
          </div>
        ) : (
          <div className="max-h-[460px] overflow-y-auto pr-2 space-y-3">
            {terms.map((item) => (
              <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 hover:border-hospital-300 transition">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-hospital-800">{item.term}</h4>
                  <span className="text-xs font-semibold bg-white border border-slate-200 text-slate-600 px-2.5 py-0.5 rounded-full">
                    {item.category}
                  </span>
                </div>

                <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-2.5">
                  <span className="text-xs font-bold text-emerald-900 block mb-0.5">Plain English Translation:</span>
                  <p className="text-xs text-emerald-950 leading-relaxed">{item.laymanExplanation}</p>
                </div>

                <div className="text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">Clinical Definition: </span>
                  {item.definition}
                </div>

                {item.patientTakeaway && (
                  <div className="text-xs text-slate-700 flex items-start space-x-1.5 pt-1">
                    <CheckCircle className="w-3.5 h-3.5 text-hospital-600 shrink-0 mt-0.5" />
                    <span><strong>What this means for you:</strong> {item.patientTakeaway}</span>
                  </div>
                )}

                {item.questionsToAskDoctor && (
                  <div className="text-xs text-amber-900 bg-amber-50/80 border border-amber-200 rounded-lg p-2 flex items-start space-x-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span><strong>Question to ask your doctor:</strong> {item.questionsToAskDoctor}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
