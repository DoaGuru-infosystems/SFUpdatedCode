import React from "react";
import AdminAttendCalendar from "../../components/AdminAttendCalender";

const AdminAttendReport = () => {
  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <h2 className="text-2xl font-bold text-center py-6">
          Employees Attendance Records
        </h2>
        <AdminAttendCalendar />
      </div>
    </>
  );
};

export default AdminAttendReport;
