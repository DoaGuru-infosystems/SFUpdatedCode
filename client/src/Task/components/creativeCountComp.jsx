import React, { useState } from "react";
import axios from "axios";

const CreativeCountComp = ({ userId }) => {
  const [counts, setCounts] = useState({
    creative: "",
    video: "",
    flyer: "",
    other: "",
  });

  const handleChange = (e) => {
    setCounts({ ...counts, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Add validation if needed
    try {
      await axios.post(window.API_BASE + "/api/add-creative-count", {
        user_id: userId,
        ...counts,
      });
      alert("Counts submitted successfully!");
      setCounts({ creative: "", video: "", flyer: "", other: "" });
    } catch (err) {
      alert("Error submitting counts");
    }
  };

  return (
    <form className="d-flex align-items-center gap-2 mt-3 m-2" onSubmit={handleSubmit}>
      <label htmlFor="creative">Enter Your Today Creative</label>
      <input
        type="number"
        name="creative"
        className="form-control"
        placeholder="Posts"
        value={counts.creative}
        onChange={handleChange}
        min={0}
        style={{ width: "100px" }}
        required
      />
      <input
        type="number"
        name="video"
        className="form-control"
        placeholder="Video"
        value={counts.video}
        onChange={handleChange}
        min={0}
        style={{ width: "100px" }}
        required
      />
      <input
        type="number"
        name="flyer"
        className="form-control"
        placeholder="Flyer"
        value={counts.flyer}
        onChange={handleChange}
        min={0}
        style={{ width: "100px" }}
        required
      />
      <input
        type="number"
        name="other"
        className="form-control"
        placeholder="Other"
        value={counts.other}
        onChange={handleChange}
        min={0}
        style={{ width: "100px" }}
        required
      />
      <button type="submit" className="btn btn-dark">
        Submit
      </button>
    </form>
  );
};

export default CreativeCountComp;