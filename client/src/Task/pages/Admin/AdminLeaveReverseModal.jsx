import React, { useEffect, useState } from "react";
import axios from "axios";

import DatePicker from "react-multi-date-picker";
import DateObject from "react-date-object";

const leaveTypes = ["Sick Leave", "Casual Leave", "Paid Leave", "Other"];

const AdminLeaveReverseModal = ({ isOpen, onClose, fetchLeaveData }) => {
  const [selectedDates, setSelectedDates] = useState([]);
  const [leaveType, setLeaveType] = useState("");
  const [duration, setDuration] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [allUser, setAllUsers] = useState([]);
  const [userId, setUserId] = useState();
  const [holidays, setHolidays] = useState([]);

  const getHolidaysOfCurrentYear = async () => {
    try {
      const { data } = await axios.get(
        `https://sf.doaguru.com/api/getAllHolidaysCurrentYear`
      );
      setHolidays(data);
    } catch (error) {
      console.error("Error fetching attendance:", error.message);
    }
  };

  console.log(holidays);

  const getAllUserData = async () => {
    try {
      const { data } = await axios.get("https://sf.doaguru.com/api/users");
      setAllUsers(data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getAllUserData();
    getHolidaysOfCurrentYear();
  }, []);

  const yesterday = new DateObject().subtract(1, "day");

  const handleSubmit = async () => {
    if (!leaveType || !leaveReason || selectedDates.length === 0) {
      alert("Please fill all fields and select at least one date.");
      return;
    }

    setLoading(true);

    try {
      const formattedDates = selectedDates.map((date) =>
        date.format("DD-MM-YYYY")
      );

      const promises = formattedDates.map((date) =>
        axios.post("https://sf.doaguru.com/api/adminReverseLeave", {
          user_id: userId,
          leave_date: date,
          leave_type: leaveType,
          leave_duration: duration,
          leave_reason: leaveReason,
        })
      );

      await Promise.all(promises);
      alert("Leave request(s) submitted.");
      fetchLeaveData();
      setSelectedDates([]);
      setLeaveType("");
      setDuration("");
      setLeaveReason("");
      onClose();
    } catch (err) {
      console.error(err);
      alert(`Error: ${err.response.data.message}`);
      console.log(err.response.data.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center"
      // onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative animate-fade-in"
        // onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-red-600"
        >
          X
        </button>
        <h2 className="text-2xl font-bold mb-4 text-center">
          Employee Leave Reversal
        </h2>

        {/* Multi-Date Picker */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Select Leave Dates</label>
          <DatePicker
            multiple
            value={selectedDates}
            onChange={setSelectedDates}
            format="DD-MM-YYYY"
            placeholder="Select multiple dates"
            className="custom-calendar w-full"
            inputClass="border w-full px-3 py-2 rounded focus:outline-none"
            closeOnScroll={true}
            closeOnSelect={true}
            maxDate={yesterday} // Allow only past dates
            mapDays={({ date }) => {
              const dateStr = date.format("YYYY-MM-DD");

              const isSunday = date.weekDay.index === 0;

              const holiday = holidays.find(
                (h) =>
                  h.holiday_status === "active" && h.holiday_date === dateStr
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

        <div className="mb-4">
          <label className="block mb-1 font-medium">Select Employee</label>
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="border w-full px-3 py-2 rounded"
          >
            <option value="">-Select Employee-</option>
            {allUser?.map((type, idx) => (
              <option key={idx} value={type?.id}>
                {type?.id} - {type?.full_name}
              </option>
            ))}
          </select>
        </div>

        {/* Leave Type */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Leave Type</label>
          <select
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value)}
            className="border w-full px-3 py-2 rounded"
          >
            <option value="">Select Leave Type</option>
            {leaveTypes.map((type, idx) => (
              <option key={idx} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium">Leave Duration</label>
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="border w-full px-3 py-2 rounded"
          >
            <option value="">Select Leave Duration</option>
            <option value="fullday">Full-day</option>
            <option value="halfday">Half-day</option>
          </select>
        </div>

        {/* Leave Reason */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Reason</label>
          <textarea
            value={leaveReason}
            onChange={(e) => setLeaveReason(e.target.value)}
            rows="3"
            className="border w-full px-3 py-2 rounded resize-none"
            placeholder="Enter reason for leave"
          ></textarea>
        </div>

        {/* Submit Button */}
        <div className="text-center">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Leave"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLeaveReverseModal;
