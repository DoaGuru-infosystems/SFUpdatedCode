import React, { useEffect, useState } from "react";
import axios from 'axios';
import PaginationControls from "../../components/Pagination";


function AssignProjectDetails() {
  const [taskData, setTaskData] = useState([]);

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


  const myTask = () => {
    let user = localStorage.getItem('user');
    user = JSON.parse(user);
    console.log(user);

    if (!user || !user.id) {
      console.error('User ID not found');
      return;
    }

    axios.get(`https://sf.doaguru.com/api/mytask/${user.id}`)
      .then(res => {
        // console.log(res.data)
        setTaskData(res.data);
      })
      .catch(error => {
        console.error('There was an error!', error);
      });
  }


  useEffect(() => {

    myTask();

  }, []);

  return (
    <div className="TaskView min-h-screen">


      {/* Assign Projects Details Show table  */}
      <div>
        <h1 className="text-2xl font-bold text-center py-3 my-2">Assign Projects Details</h1>
      </div>
      <div className="container  overflow-x-auto shadow-md rounded-lg m-auto border-3 ">
        <div className=" Select-table-row mb-0.5">
          <span className="text-xs">Select Page </span>
          <select name="rowsPerPage" id="rowsPerPage" className="text-xs rounded border-1 " onChange={(e) => handleRowsPerPage(e, setRowsPerPagetask)}
            value={rowsPerPagetask}>
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
          </select>
        </div>
        <table className="w-full text-sm text-left rtl:text-right text-gray-700 dark:text-gray">
          <thead className="text-xs text-white-900 uppercase bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-100 ">
            <tr className="">
              <th scope="col" className="px-3 py-2 ">S.no.</th>
              <th scope="col" className="px-3 py-2">Assign ID</th>
              <th scope="col" className="px-3 py-2">Project/Client Name</th>
              <th scope="col" className="px-3 py-2">Category</th>
              <th scope="col" className="px-3 py-2">Assign Date</th>

            </tr>
          </thead>
          <tbody>
            {getCurrentRows(taskData, currentPagetask, rowsPerPagetask).map((task, index) => (
              <tr key={task.id} className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:text-gray-100 dark:border-gray-700">
                <td className="px-3 py-2">{(currentPagetask - 1) * rowsPerPagetask + index + 1}</td>
                <td className="px-3 py-2">{task.id}</td>
                <td className="px-3 py-2">{task.ProjectOrClientName}</td>
                <td className="px-3 py-2">{task.Category}</td>
                <td className="px-3 py-2">{task.task_date}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {getTotalPages(taskData, rowsPerPagetask) > 1 && (
          <PaginationControls
            currentPage={currentPagetask}
            totalPages={getTotalPages(taskData, rowsPerPagetask)}
            onNextPage={() => handleNextPage(setCurrentPagetask, currentPagetask, getTotalPages(taskData, rowsPerPagetask))}
            onPreviousPage={() => handlePreviousPage(setCurrentPagetask, currentPagetask)}
          />
        )}
      </div>
    </div>


  );
}

export default AssignProjectDetails;
