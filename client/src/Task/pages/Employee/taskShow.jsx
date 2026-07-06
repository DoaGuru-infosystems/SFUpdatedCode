import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from 'axios';
import toast from "react-hot-toast";
import PaginationControls from "../../components/Pagination";


function TaskView() {
  const [taskData, setTaskData] = useState([]);
  console.log(taskData);

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


  const handleDeleteTask = (id) => {
    const isConfirm = window.confirm('Are you sure remove this task ');
    if (isConfirm) {
      axios.post('https://sf.doaguru.com/api/delete-task', { id })
        .then(response => {
          toast.success('Task deleted successfully', { position: 'top-right' });

          console.log('task dlete');
          myTask();
        })
        .catch(error => console.error('There was an error!', error));
    }
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
        const sortedData = res.data.sort((a, b) => b.id - a.id);

        // console.log(res.data)
        setTaskData(sortedData);
        // console.log(setTaskData, 'line 70');
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

      {/* Add Task Modal Add  */}
      <>
      </>

      {/* Table task show day wise only */}
      <div>
        <h1 className="text-2xl font-bold text-center py-3 my-2">Task Effort Report</h1>
      </div>
      <div className="  overflow-x-auto shadow-md rounded-lg container m-auto border-3  ">
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
          <thead className="text-xs text-white-900 uppercase bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-100">
            <tr>
              <th scope="col" className="px-3 py-2">S.no.</th>
              <th scope="col" className="px-3 py-2">Project/Client Name</th>
              <th scope="col" className="px-3 py-2">Category</th>
              <th scope="col" className="px-3 py-2">Sub-Category</th>
              <th scope="col" className="px-3 py-2">Task Description</th>
              <th scope="col" className="px-3 py-2">Consuming time in min</th>
              <th scope="col" className="px-3 py-2">Task Date</th>
              <th scope="col" className="px-3 py-2 center">Action</th>
            </tr>
          </thead>
          <tbody>
            {getCurrentRows(taskData, currentPagetask, rowsPerPagetask).map((task, index) => (
              <tr key={task.id} className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:text-gray-100 dark:border-gray-700">
                <td className="px-3 py-2">{(currentPagetask - 1) * rowsPerPagetask + index + 1}</td>
                <td className="px-3 py-2">{task.ProjectOrClientName}</td>
                <td className="px-3 py-2">{task.Category}</td>
                <td className="px-3 py-2">{task.SubCategory}</td>
                <td className="px-3 py-2">{task.TaskDescription}</td>
                <td className="px-3 py-2">{task.ConsumingTimeInMin}</td>

                <td className="px-3 py-2">{task.task_date}</td>
                <td className="px-3 py-2 flex-wrap">
                  {/* <Link to="#" onClick={() => { handleEditTask(task) }} dis className="font-medium text-blue-600 dark:text-blue-500 hover:underline px-1">Edit</Link> */}
                  <Link to="#" onClick={() => handleDeleteTask(task.id)} className="font-medium text-red-600 dark:text-red-500 hover:underline px-1">Remove</Link>
                </td>
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

export default TaskView;
