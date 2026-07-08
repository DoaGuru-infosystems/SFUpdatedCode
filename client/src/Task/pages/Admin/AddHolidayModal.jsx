import React, { useEffect, useState } from "react";
import axios from "axios";

import DatePicker from "react-multi-date-picker";
import DateObject from "react-date-object";

const AddHolidayModal = ({ isOpen, onClose, fetchLeaveData }) => {
  const [selectedDates, setSelectedDates] = useState([]);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const formattedDates = selectedDates.map((date) =>
        date.format("DD-MM-YYYY")
      );

      const promises = formattedDates.map((date) =>
        axios.post("http://localhost:3000/api/addHolidayManually", {
          title,
          date,
          status,
        })
      );

      await Promise.all(promises);
      alert("Holidays Added.");
      fetchLeaveData();
      setSelectedDates([]);
      setTitle("");
      setStatus("");
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
          Add Holidays Manually
        </h2>

        {/* Multi-Date Picker */}
        <div className="mb-4">
          <label className="block mb-1 font-medium italic text-[10px] uppercase text-slate-400">Select Holiday Dates</label>
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
            // Allow only past dates
            mapDays={({ date }) => {
              // Disable Sundays (0 = Sunday)
              if (date.weekDay.index === 0) {
                return {
                  disabled: true,
                  style: {
                    color: "#ccc",
                    textDecoration: "line-through",
                    cursor: "not-allowed",
                  },
                };
              }
            }}
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-medium">Title</label>
          <input
            type="text"
            value={title}
            placeholder="Add Holiday Title"
            onChange={(e) => setTitle(e.target.value)}
            className="border w-full px-3 py-2 rounded"
          />
        </div>

        {/* Leave Type */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Holiday Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border w-full px-3 py-2 rounded"
          >
            <option value="">-Select-</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Submit Button */}
        <div className="text-center">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-indigo-600 text-white font-black px-8 py-3 rounded-2xl hover:bg-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-100 transition-all text-xs"
          >
            {loading ? "PROCESSING..." : "REGISTER HOLIDAYS"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddHolidayModal;
