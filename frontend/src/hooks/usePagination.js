import { useState, useCallback, useMemo } from 'react';

// Hook for pagination management
const usePagination = (totalItems = 0, defaultPageSize = 10) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.ceil(totalItems / pageSize);
  }, [totalItems, pageSize]);

  // Calculate start and end indices for current page
  const pageIndices = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);
    return { startIndex, endIndex };
  }, [currentPage, pageSize, totalItems]);

  // Check if current page is valid
  const isValidPage = useMemo(() => {
    return currentPage >= 1 && currentPage <= totalPages;
  }, [currentPage, totalPages]);

  // Go to specific page
  const goToPage = useCallback((page) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  }, [totalPages]);

  // Go to next page
  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, totalPages]);

  // Go to previous page
  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  // Go to first page
  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  // Go to last page
  const goToLastPage = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);

  // Change page size
  const changePageSize = useCallback((newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  }, []);

  // Reset pagination
  const resetPagination = useCallback(() => {
    setCurrentPage(1);
    setPageSize(defaultPageSize);
  }, [defaultPageSize]);

  // Get pagination info
  const paginationInfo = useMemo(() => {
    return {
      currentPage,
      pageSize,
      totalItems,
      totalPages,
      startIndex: pageIndices.startIndex,
      endIndex: pageIndices.endIndex,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
      isFirstPage: currentPage === 1,
      isLastPage: currentPage === totalPages
    };
  }, [currentPage, pageSize, totalItems, totalPages, pageIndices]);

  // Get pagination props for Ant Design Table
  const tablePagination = useMemo(() => {
    return {
      current: currentPage,
      pageSize: pageSize,
      total: totalItems,
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} mục`,
      pageSizeOptions: ['10', '20', '50', '100'],
      onChange: (page, size) => {
        setCurrentPage(page);
        if (size !== pageSize) {
          setPageSize(size);
        }
      }
    };
  }, [currentPage, pageSize, totalItems]);

  return {
    // State
    currentPage,
    pageSize,
    
    // Computed values
    totalPages,
    pageIndices,
    isValidPage,
    paginationInfo,
    
    // Actions
    goToPage,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
    changePageSize,
    resetPagination,
    
    // UI helpers
    tablePagination
  };
};

export default usePagination;
