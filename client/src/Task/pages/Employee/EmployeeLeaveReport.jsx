import axios from "axios";
import React, { useEffect, useState } from "react";
import { FaDownload } from "react-icons/fa";
import * as XLSX from "xlsx";
import { FcLeave } from "react-icons/fc";
import ApplyLeaveModal from "./ApplyLeaveModal";

const EmployeeLeaveReport = () => {
  let user = localStorage.getItem("user");
  user = JSON.parse(user);
  console.log(user);
  const [attendData, setAttendData] = useState([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [showModal, setShowModal] = useState(false);

  const handleMonthChange = (offset) => {
    const newDate = new Date(year, month - 1 + offset);
    setMonth(newDate.getMonth() + 1);
    setYear(newDate.getFullYear());
  };

  console.log(month, year);

  const getUserAttendanceById = async () => {
    try {
      const { data } = await axios.get(
        `http://localhost:8080/api/getMonthlyEmployeeLeavesByUserId/${user?.id}/${month}/${year}`
      );
      setAttendData(data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getUserAttendanceById();
  }, [month, year]);

  console.log(attendData);

  const downloadExcel = () => {
    const rows = attendData.map((row) => ({
      "User ID": row.id,
      "User Name": row.full_name,
      "Leave Date": row.leave_date,
      "Leave Duration": row.leave_duration,
      "Leave Type": row.leave_type,
      "Leave Reason": row.leave_reason,
      "Leave Status": row.leave_status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leave");

    const filename = `${attendData[0]?.full_name || "Employee"}_Leave.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <h1 className="text-2xl font-bold text-center py-6">
          Employee Leave Records
        </h1>
        <div className="mx-4 mb-2">
          <button
            className="bg-sky-300 text-black p-2 px-2 rounded font-bold hover:bg-sky-500 flex items-center gap-2"
            onClick={() => setShowModal(true)}
          >
            <FcLeave /> Apply Leave
          </button>
        </div>
        <div className="flex justify-center space-x-3 items-center mb-1 mx-2">
          <button
            onClick={() => handleMonthChange(-1)}
            className="px-3 py-1 bg-gray-200 rounded"
          >
            Prev
          </button>
          <div className="font-bold text-lg">
            {new Date(year, month - 1).toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}
          </div>
          <button
            onClick={() => handleMonthChange(1)}
            className="px-3 py-1 bg-gray-200 rounded"
          >
            Next
          </button>
        </div>
        <div className="overflow-x-auto p-2">
          <table className="w-full table-auto border-collapse border border-gray-300 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-4 py-2 whitespace-nowrap">User ID</th>
                <th className="border px-4 py-2 whitespace-nowrap">
                  User Name
                </th>
                <th className="border px-4 py-2 whitespace-nowrap">
                  Leave Date
                </th>
                <th className="border px-4 py-2 whitespace-nowrap">
                  Leave Duration
                </th>
                <th className="border px-4 py-2 whitespace-nowrap">
                  Leave Type
                </th>
                <th className="border px-4 py-2 whitespace-nowrap">
                  Leave Reason
                </th>
                <th className="border px-4 py-2 whitespace-nowrap">
                  Leave Status
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(attendData) && attendData.length > 0 ? (
                attendData.some((row) => row.login_time !== null) ? (
                  attendData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="border px-4 py-2">{row.id}</td>
                      <td className="border px-4 py-2">{row.full_name}</td>
                      <td className="border px-4 py-2">{row.leave_date}</td>
                      <td className="border px-4 py-2">{row.leave_duration}</td>
                      <td className="border px-4 py-2">{row.leave_type}</td>
                      <td className="border px-4 py-2">{row.leave_reason}</td>
                      <td className="border px-4 py-2">{row.leave_status}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="13" className="text-center py-4 text-red-500">
                      No attendance data found for this month.
                    </td>
                  </tr>
                )
              ) : (
                <tr>
                  <td colSpan="13" className="text-center py-4 text-red-500">
                    No attendance records available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <button
          onClick={downloadExcel}
          className="mb-4 ml-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 mt-4 flex items-center gap-2"
        >
          <FaDownload />
          Download Leave Report
        </button>
      </div>
      <ApplyLeaveModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        userId={user?.id}
        getUserAttendanceById={getUserAttendanceById}
      />
    </>
  );
};

export default EmployeeLeaveReport;
