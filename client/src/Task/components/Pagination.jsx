import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const PaginationControls = ({ currentPage, totalPages, onNextPage, onPreviousPage }) => (
  <div className="flex items-center m-4 justify-content-evenly">
    <button
      onClick={onPreviousPage}
      disabled={currentPage === 1}
      className="text-gray-700 dark:hover:text-white dark:text-gray-700 hover:bg-gray-600 dark:hover:bg-gray-600 hover:text-white dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed bg-gray-200 px-2 rounded"
    >
      <FaChevronLeft size={20} />
    </button>

    <div className="text-gray-700 dark:text-gray-400">
      Page {currentPage} of {totalPages}
    </div>

    <button
      onClick={onNextPage}
      disabled={currentPage === totalPages}
      className="text-gray-700 dark:hover:text-white dark:text-gray-700 hover:bg-gray-600 dark:hover:bg-gray-600 hover:text-white dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed bg-gray-200 px-2 rounded"
    >
      <FaChevronRight size={20} />
    </button>
  </div>
);

export default PaginationControls;
