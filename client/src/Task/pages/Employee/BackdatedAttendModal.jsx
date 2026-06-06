import React, { useEffect, useState } from "react";
import axios from "axios";

import DatePicker from "react-multi-date-picker";
import DateObject from "react-date-object";

const API_BASE_URL = "https://sf.doaguru.com/api";

const BackdatedAttendModal = ({
  isOpen,
  onClose,
  userId,
  getAllBackDateReq,
}) => {
  const [selectedDates, setSelectedDates] = useState([]);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [holidays, setHolidays] = useState([]);

  const yesterday = new DateObject().subtract(1, "day");

  const getHolidaysOfCurrentYear = async () => {
    try {
      const { data } = await axios.get(
        `${API_BASE_URL}/getAllHolidaysCurrentYear`
      );
      setHolidays(data);
    } catch (error) {
      console.error("Error fetching attendance:", error.message);
    }
  };

  useEffect(() => {
    getHolidaysOfCurrentYear();
  }, []);

  console.log(holidays);

  const handleSubmit = async () => {
    if (!reason || selectedDates.length === 0) {
      alert("Please fill all fields and select at least one date.");
      return;
    }

    setLoading(true);

    try {
      const formattedDates = selectedDates.map((date) =>
        date.format("DD-MM-YYYY")
      );

      const results = await Promise.allSettled(
        formattedDates.map((date) =>
          axios.post(`${API_BASE_URL}/applyForBackDateAttendance`, {
            employee_id: userId,
            request_date: date,
            abr_reason: reason,
          })
        )
      );

      const failed = [];
      const successful = [];

      results.forEach((r, idx) => {
        const dateStr = formattedDates[idx];
        if (r.status === "fulfilled") {
          successful.push({
            date: dateStr,
            message: r.value?.data?.message || "Submitted successfully."
          });
        } else {
          const errorMsg = r.reason?.response?.data?.message || r.reason?.message || "Failed to submit.";
          failed.push({
            date: dateStr,
            message: errorMsg
          });
        }
      });

      // Prepare feedback message
      let feedback = "";
      if (successful.length > 0) {
        feedback += `Successfully submitted:\n` + successful.map(s => `• ${s.date}: ${s.message}`).join("\n");
      }
      if (failed.length > 0) {
        if (feedback) feedback += "\n\n";
        feedback += `Failed to submit:\n` + failed.map(f => `• ${f.date}: ${f.message}`).join("\n");
      }

      alert(feedback);

      if (successful.length > 0) {
        getAllBackDateReq();
      }

      // If all succeeded, clear and close
      if (failed.length === 0) {
        setSelectedDates([]);
        setReason("");
        onClose();
      } else {
        // Keep only failed dates in the calendar picker for convenience
        const failedDateObjects = selectedDates.filter((date) => 
          failed.some((f) => f.date === date.format("DD-MM-YYYY"))
        );
        setSelectedDates(failedDateObjects);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      alert(`Unexpected Error: ${err?.message}`);
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
          Backdated Attendance Request
        </h2>

        {/* Multi-Date Picker */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Select Dates</label>
          {/* <DatePicker
            multiple
            value={selectedDates}
            onChange={setSelectedDates}
            format="DD-MM-YYYY"
            placeholder="Select multiple dates"
            className="custom-calendar w-full"
            inputClass="border w-full px-3 py-2 rounded focus:outline-none"
            closeOnScroll={true}
            closeOnSelect={true}
            minDate={new DateObject()}
            mapDays={({ date }) => {
              const dateStr = date.format("YYYY-MM-DD");

              // Check if it's Sunday
              const isSunday = date.weekDay.index === 0;

              // Check if it's an active holiday
              const holiday = holidays.find(
                (h) =>
                  h.holiday_status === "active" && h.holiday_date === dateStr
              );

              if (isSunday || holiday) {
                return {
                  disabled: true, // Disable both Sunday and holiday
                  style: {
                    backgroundColor: holiday ? "#fde68a" : "", // Light yellow for holiday
                    color: "#999",
                    cursor: "not-allowed",
                    borderRadius: "5px",
                  },
                  title: holiday ? holiday.holiday_title : "Sunday", // Tooltip
                };
              }
            }}
          /> */}
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

        {/* Leave Reason */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Reason</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
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

export default BackdatedAttendModal;
