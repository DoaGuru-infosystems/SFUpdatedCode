import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

const AdminUpdateAttendanceModal = ({
  isOpen,
  onClose,
  fetchAttendance,
  initialData,
}) => {
  const { uid } = useParams();

  const [formData, setFormData] = useState({
    user_id: uid,
    login_time: "",
    logout_time: "",
    attend_date: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // console.log(formData);

  useEffect(() => {
    setFormData({
      ...formData,
      user_id: uid,
      login_time: initialData?.login_time,
      logout_time: "",
      attend_date: initialData?.attend_date,
    });
  }, [initialData]);

  const handleSubmit = async () => {
    const { user_id, login_time, logout_time, attend_date } = formData;

    if (!user_id || !login_time || !logout_time || !attend_date) {
      alert("All fields are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.put(
        `https://sf.doaguru.com/api/adminUpdateAttendanceLogoutTime/${initialData?.attend_id}`,
        {
          user_id,
          logout_time,
          attend_date,
        }
      );
      fetchAttendance();
      alert(res.data.message);

      onClose();
    } catch (error) {
      alert(error.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg relative">
        <h2 className="text-xl font-bold mb-4 text-center">
          Update Attendance Details
        </h2>

        <div className="mb-4">
          <label className="block mb-1 font-medium">User ID</label>
          <input
            type="text"
            name="user_id"
            className="w-full border px-3 py-2 rounded"
            value={formData.user_id}
            onChange={handleChange}
            readOnly
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-medium">
            Attendance Date (DD-MM-YYYY)
          </label>
          <input
            type="text"
            name="attend_date"
            placeholder="01-07-2025"
            readOnly
            className="w-full border px-3 py-2 rounded"
            value={formData.attend_date}
            onChange={handleChange}
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-medium">
            Login Time (HH:mm:ss)
          </label>
          <input
            type="text"
            name="login_time"
            placeholder="09:00:00"
            step="1"
            readOnly
            className="w-full border px-3 py-2 rounded"
            value={formData.login_time}
            onChange={handleChange}
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-medium">
            Logout Time (HH:mm:ss)
          </label>
          <input
            type="time"
            name="logout_time"
            placeholder="17:30:00"
            step="1"
            className="w-full border px-3 py-2 rounded"
            value={formData.logout_time}
            onChange={handleChange}
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Saving..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminUpdateAttendanceModal;
