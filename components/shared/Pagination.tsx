import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (size: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ currentPage, totalItems, itemsPerPage, onPageChange, onItemsPerPageChange }) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) {
    return null;
  }

  const handlePrev = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between mt-4 px-2 py-2 bg-slate-50 rounded-b-lg border-t text-sm">
      <div className="flex items-center gap-2 mb-2 sm:mb-0">
        <span className="text-slate-600">عرض</span>
        <select
          value={itemsPerPage}
          onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          className="bg-white border border-slate-300 rounded-md p-1"
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
        </select>
        <span className="text-slate-600">صفوف</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-slate-600">
          صفحة {currentPage} من {totalPages}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrev}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded-md bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            السابق
          </button>
          <button
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded-md bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            التالي
          </button>
        </div>
      </div>
    </div>
  );
};
