import React, { useEffect, useState } from "react";
import axios from "axios";

import DatePicker from "react-multi-date-picker";
import DateObject from "react-date-object";

const BackEmpAttendModal = ({
  isOpen,
  onClose,
  userId,
  getAllBackDateReq,
  selected,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    userId: userId,
    loginTime: "",
    logoutTime: "",
    attendDate: "",
  });

  console.log(selected);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  useEffect(() => {
    setFormData({
      ...formData,
      userId: userId,
      loginTime: "",
      logoutTime: "",
      attendDate: selected?.request_date,
    });
  }, [selected]);

  console.log(formData);

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const res = await axios.put(
        "https://sf.doaguru.com/api/markBackDateAttendance",
        formData
      );
      alert("Attendance Marked Successfully");
      getAllBackDateReq();
      onClose();
      setLoading(false);
    } catch (err) {
      console.error("Unexpected error:", err);
      alert(`Unexpected Error: ${err?.message}`);
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-red-600"
        >
          X
        </button>
        <h2 className="text-2xl font-bold mb-4 text-center">
          Mark Back Date Attendance
        </h2>

        <div className="mb-4">
          <label className="block mb-1 font-medium">Attendance Date</label>
          <input
            type="text"
            name="attendDate"
            value={formData.attendDate}
            onChange={handleChange}
            readOnly
          />
        </div>

        {/* Multi-Date Picker */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Login Time</label>
          <input
            type="time"
            name="loginTime"
            value={formData.loginTime}
            onChange={handleChange}
            step={1}
            required
          />
        </div>

        {/* Leave Reason */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Logout Time</label>
          <input
            type="time"
            name="logoutTime"
            value={formData.logoutTime}
            onChange={handleChange}
            step={1}
            required
          />
        </div>

        {/* Submit Button */}
        <div className="text-center">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BackEmpAttendModal;
