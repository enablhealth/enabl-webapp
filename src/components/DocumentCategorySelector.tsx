import React, { useState } from 'react';

export interface DocumentCategory {
  value: 'medical' | 'insurance' | 'lab' | 'prescription' | 'other';
  label: string;
  description: string;
  icon: string;
}

export const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  {
    value: 'medical',
    label: 'Medical Records',
    description: 'Doctor visits, hospital records, medical history',
    icon: '🏥'
  },
  {
    value: 'lab',
    label: 'Lab Results', 
    description: 'Blood tests, urine tests, pathology reports',
    icon: '🧪'
  },
  {
    value: 'prescription',
    label: 'Prescriptions',
    description: 'Medication lists, pharmacy records, dosage info',
    icon: '💊'
  },
  {
    value: 'insurance',
    label: 'Insurance Documents',
    description: 'Insurance cards, coverage details, claims',
    icon: '📋'
  },
  {
    value: 'other',
    label: 'Other Health Documents',
    description: 'Health trackers, fitness data, other records',
    icon: '📄'
  }
];

interface DocumentCategorySelectorProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  className?: string;
}

export function DocumentCategorySelector({ 
  selectedCategory, 
  onCategoryChange, 
  className = '' 
}: DocumentCategorySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedCategoryData = DOCUMENT_CATEGORIES.find(cat => cat.value === selectedCategory);

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Document Category
      </label>
      
      {/* Category Selector Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <span className="text-lg">{selectedCategoryData?.icon || '📄'}</span>
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {selectedCategoryData?.label || 'Select Category'}
            </div>
            {selectedCategoryData && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {selectedCategoryData.description}
              </div>
            )}
          </div>
        </div>
        <svg 
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {DOCUMENT_CATEGORIES.map((category) => (
            <button
              key={category.value}
              type="button"
              onClick={() => {
                onCategoryChange(category.value);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                selectedCategory === category.value
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'text-gray-900 dark:text-white'
              }`}
            >
              <div className="flex items-start space-x-3">
                <span className="text-lg mt-0.5">{category.icon}</span>
                <div>
                  <div className="text-sm font-medium">{category.label}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {category.description}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
