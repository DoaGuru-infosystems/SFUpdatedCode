import { useState, useEffect } from 'react';
import axios from 'axios';
import PaginationControls from '../../components/Pagination';
import { PiMicrosoftExcelLogoFill } from "react-icons/pi";

const EmployeeTaskReport = () => {
  const [tasks, setTasks] = useState([]);
  const [userId, setUserId] = useState(null);


  // Pagination state
  const [currentPagetask, setCurrentPagetask] = useState(1);
  // Row per page state
  const [rowsPerPagetask, setRowsPerPagetask] = useState(5);

  //Pagination function 
  const getTotalPages = (data, rowsPerPage) => Math.ceil(data.length / rowsPerPage);

  const getCurrentRows = (data, currentPage, rowsPerPage) => {
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    return data.slice(indexOfFirstRow, indexOfLastRow);
  };

  const handleNextPage = (setter, currentPage, totalPages) => {
    if (currentPage < totalPages) {
      setter(currentPage + 1);
    }
  };

  const handlePreviousPage = (setter, currentPage) => {
    if (currentPage > 1) {
      setter(currentPage - 1);
    }
  };
  // handle row per page in table 
  const handleRowsPerPage = (event, setter) => {
    setter(parseInt(event.target.value));
  };


  useEffect(() => {
    // Fetch the logged-in user information from localStorage
    const user = JSON.parse(localStorage.getItem('user'));

    if (user && user.id) {
      setUserId(user.id);

      // Fetch tasks for the logged-in user
      axios.get(`https://sf.doaguru.com/api/getUserTasks/${user.id}`)
        .then(response => {
          const sortedData = response.data.sort((a, b) => new Date(b.task_date) - new Date(a.task_date));
          setTasks(sortedData);
          console.log(sortedData, 'line 53');
        })
        .catch(error => {
          console.error("There was an error fetching the tasks!", error);
        });
    }
  }, []);

  const handleDownload = () => {
    window.location.href = `https://sf.doaguru.com/api/downloadUserTasks/${userId}`;
  };

  return (
    <div className='container mx-auto px-4'>
      <h1 className='text-center font-bold text-2xl'>My Task Report</h1>
      <div className='flex justify-center flex-col'>
        {/* <h2 className='text-center font-bold text-2xl'>Tasks</h2> */}
        <div className=" Select-table-row mb-0.5">
          <span className="text-xs">Select Page </span>
          <select name="rowsPerPage" id="rowsPerPage" className="text-xs rounded border-1 " onChange={(e) => handleRowsPerPage(e, setRowsPerPagetask)}
            value={rowsPerPagetask}>
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
          </select>
        </div>
        <div className='relative mx-4 overflow-x-auto shadow-md sm:rounded-lg border-3'>
          {tasks.length > 0 ? (
            <table className="w-full text-sm text-left rtl:text-right ">
              <thead className="text-xs text-white-900 uppercase bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-100">
                <tr>
                  <th scope="col" className="px-3 py-2 center ">Project or Client Name</th>
                  <th scope="col" className="px-3 py-2 center ">Category</th>
                  <th scope="col" className="px-3 py-2 center ">SubCategory</th>
                  <th scope="col" className="px-3 py-2 center ">Task Description</th>
                  <th scope="col" className="px-3 py-2 center ">Consuming Time in(Min)</th>
                  <th scope="col" className="px-3 py-2 center ">Task Date</th>
                </tr>
              </thead>
              <tbody>
                {getCurrentRows(tasks, currentPagetask, rowsPerPagetask).map(task => (
                  <tr key={task.id} className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 text-gray-600 dark:text-white border-b dark:border-gray-700 center">
                    <td className="px-3 py-2">{task.ProjectOrClientName}</td>
                    <td className="px-3 py-2">{task.Category}</td>
                    <td className="px-3 py-2">{task.SubCategory}</td>
                    <td className="px-3 py-2">{task.TaskDescription}</td>
                    <td className="px-3 py-2">{task.ConsumingTimeInMin}</td>
                    <td className="px-3 py-2">{task.task_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className='text-red-600 font-bold m-1 p-2'>No tasks found.</p>
          )}
        </div>
        {getTotalPages(tasks, rowsPerPagetask) > 1 && (
          <PaginationControls
            currentPage={currentPagetask}
            totalPages={getTotalPages(tasks, rowsPerPagetask)}
            onNextPage={() => handleNextPage(setCurrentPagetask, currentPagetask, getTotalPages(tasks, rowsPerPagetask))}
            onPreviousPage={() => handlePreviousPage(setCurrentPagetask, currentPagetask)}
          />
        )}
      </div>
      <div className='flex justify-end mt-5'>
        <button className='flex items-center gap-1 border-2 rounded-md border-green-500 p-1 hover:bg-green-700 text-gray-600 font-bold hover:text-white' onClick={handleDownload} disabled={!userId}>
          <PiMicrosoftExcelLogoFill />
          Import as Excel
        </button>
      </div>
    </div>
  );
};

export default EmployeeTaskReport;
