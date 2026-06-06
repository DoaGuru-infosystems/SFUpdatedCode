import React, { useEffect, useState } from "react";
import axios from "axios";
import DatePicker from "react-multi-date-picker";
import DateObject from "react-date-object";

const API_BASE_URL = "https://sf.doaguru.com/api";

const EditAttendRequestModal = ({
  isOpen,
  onClose,
  userId,
  getAllBackDateReq,
}) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [loginTime, setLoginTime] = useState("");
  const [logoutTime, setLogoutTime] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [holidays, setHolidays] = useState([]);

  const yesterday = new DateObject().subtract(1, "day");

  const getHolidaysOfCurrentYear = async () => {
    try {
      const { data } = await axios.get(
        `${API_BASE_URL}/getAllHolidaysCurrentYear`
      );
      setHolidays(data || []);
    } catch (error) {
      console.error("Error fetching holidays:", error.message);
    }
  };

  useEffect(() => {
    getHolidaysOfCurrentYear();
  }, []);

  const handleSubmit = async () => {
    if (!selectedDate || !loginTime || !logoutTime || !reason) {
      alert("Please fill in all fields: date, login time, logout time, and reason.");
      return;
    }

    setLoading(true);

    try {
      const formattedDate = selectedDate.format("DD-MM-YYYY");

      const response = await axios.post(`${API_BASE_URL}/applyForBackDateAttendance`, {
        employee_id: userId,
        request_date: formattedDate,
        abr_reason: reason,
        request_type: "edit",
        requested_login_time: loginTime,
        requested_logout_time: logoutTime
      });

      alert(response.data?.message || "Time edit request submitted successfully.");
      
      getAllBackDateReq();
      setSelectedDate(null);
      setLoginTime("");
      setLogoutTime("");
      setReason("");
      onClose();
    } catch (err) {
      console.error("Error submitting time edit request:", err);
      const errorMsg = err.response?.data?.message || err.message || "Failed to submit.";
      alert(`Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-red-600 font-bold"
        >
          X
        </button>
        <h2 className="text-2xl font-bold mb-4 text-center text-slate-800">
          Request Time Edit
        </h2>

        {/* Date Selection */}
        <div className="mb-4">
          <label className="block mb-1 font-semibold text-sm text-slate-700">Select Date</label>
          <DatePicker
            value={selectedDate}
            onChange={setSelectedDate}
            format="DD-MM-YYYY"
            placeholder="Select a date to edit"
            className="custom-calendar w-full"
            inputClass="border w-full px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
            closeOnScroll={true}
            closeOnSelect={true}
            maxDate={yesterday} // Allow only past dates
            mapDays={({ date }) => {
              const dateStr = date.format("YYYY-MM-DD");
              const isSunday = date.weekDay.index === 0;

              const holiday = holidays.find(
                (h) => h.holiday_status === "active" && h.holiday_date === dateStr
              );

              const isHoliday = Boolean(holiday);

              if (isSunday || isHoliday) {
                return {
                  disabled: true,
                  style: {
                    backgroundColor: isHoliday ? "#fde68a" : "",
                    color: "#999",
                    cursor: "not-allowed",
                    borderRadius: "5px",
                  },
                  title: isHoliday ? holiday.holiday_title : "Sunday",
                };
              }
            }}
          />
        </div>

        {/* Times Row */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-1 font-semibold text-sm text-slate-700">Requested Login Time</label>
            <input
              type="time"
              value={loginTime}
              onChange={(e) => setLoginTime(e.target.value)}
              className="border w-full px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold text-sm text-slate-700">Requested Logout Time</label>
            <input
              type="time"
              value={logoutTime}
              onChange={(e) => setLogoutTime(e.target.value)}
              className="border w-full px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>
        </div>

        {/* Reason */}
        <div className="mb-4">
          <label className="block mb-1 font-semibold text-sm text-slate-700">Reason / Explanation</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows="3"
            className="border w-full px-3 py-2 rounded resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
            placeholder="Please explain why you need to edit your check-in/out times..."
            required
          ></textarea>
        </div>

        {/* Submit Button */}
        <div className="text-center">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-amber-600 text-white px-6 py-2 rounded hover:bg-amber-700 disabled:opacity-50 font-bold transition-all shadow-sm"
          >
            {loading ? "Submitting..." : "Submit Edit Request"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditAttendRequestModal;
