import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUser, FaClock, FaCalendarAlt, FaPlus, FaSignOutAlt, FaSignInAlt,
  FaEdit, FaTrash, FaCheckCircle, FaExclamationCircle, FaChartLine,
  FaDownload, FaCamera, FaMapMarkerAlt, FaHistory
} from "react-icons/fa";
import moment from "moment";

let defaultTaskData = {
  ProjectOrClientName: "",
  Category: "",
  SubCategory: "",
  TaskDescription: "",
  ConsumingTimeInMin: "",
  PostCreativeStatus: "",
  VideoStatus: "",
  OtherGraphicsName: "",
  OtherGraphicsStatus: "",
};

function UserHome() {
  const [showModal, setShowModal] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [formData, setFormData] = useState({
    ProjectOrClientName: "",
    Category: "",
    subCategory: "",
    TaskDescription: "",
    ConsumingTimeInMin: "",
    PostCreativeStatus: "",
    VideoStatus: "",
    OtherGraphicsName: "",
    OtherGraphicsStatus: "",
    task_date: new Date().toISOString().split("T")[0],
  });

  const [date, setDate] = useState(new Date());
  const [allProject, setAllProject] = useState([]);
  const [allCategory, setAllCategory] = useState([]);
  const [userProject, setUserProject] = useState([]);
  const [taskData, setTaskData] = useState([]);
  const [projects, setProjects] = useState([]);
  const [categorys, setCategory] = useState([]);
  const [subCategorys, setSubCategory] = useState([]);
  const [selectedProjects, setSelectedProjects] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkInData, setCheckInData] = useState([]);
  const [checkInSelfieBlob, setCheckInSelfieBlob] = useState(null);
  const [checkOutSelfieBlob, setCheckOutSelfieBlob] = useState(null);
  const [leaveCheck, setLeaveCheck] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  let user = JSON.parse(localStorage.getItem("user"));

  // ═══ Live Timer Logic ═══
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getLeaveDetails = async () => {
    try {
      const { data } = await axios.get(`${window.API_BASE}/api/getEmployeeTodaysLeavesByUserId/${user?.id}`);
      setLeaveCheck(data);
    } catch (error) { console.error(error); }
  };

  useEffect(() => { getLeaveDetails(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = { ...formData };
    if (submitData.subCategory === "POST Create ") submitData.PostCreativeCount = submitData.PostCreativeStatus === "Complete" ? 1 : 0;
    if (submitData.subCategory === "Video Edittor") submitData.VideoCount = submitData.VideoStatus === "Complete" ? 1 : 0;
    if (submitData.subCategory === "Other Graphic Design") submitData.OtherGraphicsCount = submitData.OtherGraphicsStatus === "Complete" ? 1 : 0;
    const selectedSubCat = subCategorys.find((sub) => sub.name === submitData.subCategory);
    submitData.shootCount = selectedSubCat && selectedSubCat.id == 32 ? 1 : 0;

    axios.post(window.API_BASE + "/api/add-data", { user_id: user.id, user_full_name: user.full_name, ...submitData, task_date: submitData.task_date })
      .then(() => {
        const selectedDate = submitData.task_date;
        setFormData({ ...defaultTaskData, task_date: selectedDate });
        setShowModal(false);
        toast.success("आपका टास्क सफलतापूर्वक जोड़ दिया गया है।");
        fetchTasks(new Date(selectedDate));
      })
      .catch((error) => toast.error(error.response.data.sqlMessage));
  };

  const fetchTasks = (selectedDate) => {
    const formattedDate = selectedDate.toISOString().split("T")[0];
    axios.get(window.API_BASE + "/api/fetch-data", { params: { date: formattedDate } })
      .then((response) => {
        let currentUser = response.data.filter((iteam) => iteam.user_id === user.id);
        setTaskData(currentUser);
      })
      .catch((error) => console.error(error));
  };

  const handleEditTask = (task) => {
    setIsUpdate(true);
    const taskData = { ...task, task_date: task.task_date || task.date || new Date().toISOString().split("T")[0] };
    setFormData(taskData);
    particularProject(task.ProjectOrClientName);
    setSelectedProjects(task.ProjectOrClientName);
    setSelectedCategory(task.Category);
    if (task.ProjectOrClientName) {
      axios.get(`${window.API_BASE}/api/category-list?projects_id=${encodeURIComponent(task.ProjectOrClientName)}`)
        .then((response) => {
          setAllCategory(response.data);
          setCategory(response.data);
          if (task.Category) {
            const selectedCategoryObj = response.data.find((cat) => cat.name === task.Category);
            if (selectedCategoryObj) {
              axios.get(`${window.API_BASE}/api/sub-category-list?category_id=${selectedCategoryObj.id}`).then((subResponse) => setSubCategory(subResponse.data));
            }
          }
        });
    }
    setShowModal(true);
  };

  const updateTask = (e) => {
    e.preventDefault();
    const updateData = { ...formData };
    if (updateData.subCategory === "POST Create ") updateData.PostCreativeCount = updateData.PostCreativeStatus === "Complete" ? 1 : 0;
    if (updateData.subCategory === "Video Edittor") updateData.VideoCount = updateData.VideoStatus === "Complete" ? 1 : 0;
    if (updateData.subCategory === "Other Graphic Design") updateData.OtherGraphicsCount = updateData.OtherGraphicsStatus === "Complete" ? 1 : 0;
    const selectedSubCatUpdate = subCategorys.find((sub) => sub.name === updateData.subCategory);
    updateData.shootCount = selectedSubCatUpdate && selectedSubCatUpdate.id == 32 ? 1 : 0;
    if (!updateData.task_date) updateData.task_date = new Date().toISOString().split("T")[0];

    axios.post(window.API_BASE + "/api/update-task", updateData)
      .then(() => {
        const taskDate = new Date(updateData.task_date);
        setDate(taskDate);
        fetchTasks(taskDate);
        toast.success("आपका टास्क संपादित हो गया है।");
        setIsUpdate(false);
        setShowModal(false);
        setFormData({ ...defaultTaskData, task_date: new Date().toISOString().split("T")[0] });
        setSelectedProjects("");
        setSelectedCategory("");
        setAllCategory([]);
        setSubCategory([]);
      })
      .catch((err) => toast.error("टास्क अपडेट करने में त्रुटि हुई"));
  };

  const handleDeleteTask = (id) => {
    if (window.confirm("Are You Sure Remove Today Task !")) {
      axios.post(window.API_BASE + "/api/delete-task", { id })
        .then(() => {
          toast.success("Task Removed");
          fetchTasks(date);
        });
    }
  };

  const particularProject = (editProjectName) => {
    const currentProjectName = typeof editProjectName === "string" ? editProjectName : (formData.ProjectOrClientName || "");
    Promise.all([
      axios.get(`${window.API_BASE}/api/getProject/${user?.id}`),
      axios.get(window.API_BASE + "/api/projects")
    ])
      .then(([assignRes, projRes]) => {
        const particular_project = assignRes.data || [];
        const all_projects = projRes.data || [];
        setUserProject(particular_project);
        setAllProject(all_projects);

        const userDept = (user?.department || "").trim().toLowerCase();

        // 1. Projects assigned explicitly to this employee by Admin (`assigned_projects`)
        const assignedProjects = particular_project
          .filter((item) => item.project_name || item.name)
          .map((item) => ({
            id: item.project_id || item.id,
            name: item.project_name || item.name,
            department: item.department || ""
          }));

        // 2. Projects assigned/created for the employee's department (`projects.department`)
        const deptProjects = all_projects.filter((p) => {
          if (!userDept || !p.department || p.department.trim() === "" || p.department.trim().toLowerCase() === "all") {
            return false;
          }
          const projectDepts = p.department.split(",").map((d) => d.trim().toLowerCase());
          return projectDepts.includes(userDept) || p.department.toLowerCase().includes(userDept);
        });

        // Merge keeping unique projects by name
        const projectMap = new Map();
        assignedProjects.forEach((p) => {
          if (p.name) projectMap.set(p.name.trim().toLowerCase(), p);
        });
        deptProjects.forEach((p) => {
          if (p.name && !projectMap.has(p.name.trim().toLowerCase())) {
            projectMap.set(p.name.trim().toLowerCase(), p);
          }
        });

        // Ensure currently selected / editing project is preserved in options
        if (currentProjectName && currentProjectName.trim() !== "" && !projectMap.has(currentProjectName.trim().toLowerCase())) {
          const existingFromAll = all_projects.find((p) => p.name && p.name.trim().toLowerCase() === currentProjectName.trim().toLowerCase());
          if (existingFromAll) {
            projectMap.set(currentProjectName.trim().toLowerCase(), existingFromAll);
          } else {
            projectMap.set(currentProjectName.trim().toLowerCase(), { id: Date.now(), name: currentProjectName });
          }
        }

        const filteredList = Array.from(projectMap.values());
        setProjects(filteredList);
      })
      .catch((error) => {
        console.error("Error loading employee projects:", error);
      });
  };

  const fetchProjectListData = () => {
    particularProject();
  };

  const particularCategory = () => {
    setCategory(allCategory);
  };

  const handleProjectsChange = (e) => {
    const projectId = e?.target ? e.target.value : e;
    if (!projectId) return;
    setSelectedProjects(projectId);
    setFormData((prev) => ({ ...prev, ProjectOrClientName: projectId }));
    axios.get(`${window.API_BASE}/api/category-list?projects_id=${projectId}`).then((res) => {
      setAllCategory(res.data);
      setCategory(res.data);

      if (!isUpdate) { setSubCategory([]); setSelectedCategory(""); }
    });
  };

  const handleCategoryChange = (e) => {
    const categoryId = e.target.value;
    const selectedCategoryObj = allCategory.find((c) => c.name === categoryId);
    if (!selectedCategoryObj) return;
    setSelectedCategory(categoryId);
    setFormData((prev) => ({ ...prev, Category: categoryId, CategoryName: selectedCategoryObj.name, subCategory: "" }));
    axios.get(`${window.API_BASE}/api/sub-category-list?category_id=${selectedCategoryObj.id}`).then((res) => setSubCategory(res.data));
  };

  useEffect(() => { fetchProjectListData(); fetchTasks(date); }, [date]);

  // ═══ Attendance Lifecycle ═══
  const openCamera = async (onCapture) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement("video");
      video.srcObject = stream;
      video.style.transform = "scaleX(-1)";
      video.play();

      const captureLayer = document.createElement("div");
      Object.assign(captureLayer.style, { position: "fixed", inset: "0", background: "rgba(0,0,0,0.9)", display: "flex", flexFlow: "column", alignItems: "center", justifyContent: "center", zIndex: "99999" });

      const captureBtn = document.createElement("button");
      captureBtn.innerText = "CAPTURING IDENTITY...";
      Object.assign(captureBtn.style, { marginTop: "20px", padding: "12px 30px", background: "#4f46e5", color: "white", borderRadius: "12px", fontStyle: "bold", cursor: "pointer" });

      captureBtn.onclick = () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth; canvas.height = video.videoHeight;
        canvas.getContext("2d").drawImage(video, 0, 0);
        canvas.toBlob(blob => { onCapture(blob); stream.getTracks().forEach(t => t.stop()); }, "image/webp");
        document.body.removeChild(captureLayer);
      };

      captureLayer.append(video, captureBtn);
      document.body.appendChild(captureLayer);
    } catch (e) { alert("Camera failed."); setLoading(false); }
  };

  const getGeolocation = () => new Promise((res, rej) => navigator.geolocation.getCurrentPosition(p => res({ latitude: p.coords.latitude, longitude: p.coords.longitude }), () => rej("Location denied.")));

  const handleCheckIn = async () => { setLoading(true); try { await openCamera(blob => setCheckInSelfieBlob(blob)); } catch (e) { setLoading(false); } };

  useEffect(() => {
    if (!checkInSelfieBlob) return;
    (async () => {
      const loc = await getGeolocation().catch(() => ({}));
      const fd = new FormData();
      fd.append("user_id", user?.id); fd.append("latitude", loc.latitude); fd.append("longitude", loc.longitude); fd.append("selfie", checkInSelfieBlob, "in.webp");
      try {
        const res = await axios.post(window.API_BASE + "/api/checkInAttend", fd);
        if (res.data.success) { getCheckInData(); toast.success("Identity Verified: Check-in OK"); }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    })();
  }, [checkInSelfieBlob]);

  const handleCheckOut = async () => { setLoading(true); try { await openCamera(blob => setCheckOutSelfieBlob(blob)); } catch (e) { setLoading(false); } };

  useEffect(() => {
    if (!checkOutSelfieBlob) return;
    (async () => {
      const loc = await getGeolocation().catch(() => ({}));
      const fd = new FormData();
      fd.append("user_id", user?.id); fd.append("latitude", loc.latitude); fd.append("longitude", loc.longitude); fd.append("selfie", checkOutSelfieBlob, "out.webp");
      try {
        const res = await axios.put(window.API_BASE + "/api/checkOutAttend", fd);
        if (res.data.success) { getCheckInData(); toast.success(`Check-out OK: ${res.data.work_minutes} min`); }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    })();
  }, [checkOutSelfieBlob]);

  const getCheckInData = () => {
    const stored = localStorage.getItem("user");
    const parsed = stored ? JSON.parse(stored) : user;
    const userId = parsed?.id || parsed?.user_id || parsed?._id;
    if (userId) {
      axios.get(`${window.API_BASE}/api/getCheckInByUser/${userId}`).then(res => setCheckInData(res.data)).catch(e => console.error(e));
    }
  };
  useEffect(() => { getCheckInData(); }, []);

  // ═══ Metrics Calculation ═══
  const effortMinutes = useMemo(() => taskData.reduce((s, t) => s + (parseInt(t.ConsumingTimeInMin) || 0), 0), [taskData]);
  const effortPercent = Math.min(Math.round((effortMinutes / 480) * 100), 100);

  const shiftDuration = useMemo(() => {
    if (!checkInData[0]?.login_time) return "0:00";
    const login = moment(checkInData[0].login_time, "HH:mm:ss");
    const end = checkInData[0].logout_time ? moment(checkInData[0].logout_time, "HH:mm:ss") : moment(currentTime);
    const diff = moment.duration(end.diff(login));
    return `${Math.floor(diff.asHours())}:${String(diff.minutes()).padStart(2, '0')}`;
  }, [checkInData, currentTime]);

  return (
    <div className="min-h-screen bg-slate-50 p-3 md:p-6 pb-20 font-sans">
      <div className="max-w-[1400px] mx-auto space-y-4">

        {/* ═══ Dashboard Identity & Status Bar ═══ */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
              <FaUser size={20} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 leading-tight">Welcome, {user?.full_name}</h1>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-tighter">Workforce Dashboard • {moment().format("dddd, MMM Do")}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {leaveCheck.length > 0 ? (
              <span className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl font-black text-xs border border-rose-100 flex items-center gap-2"><FaExclamationCircle /> ON LEAVE</span>
            ) : !checkInData[0]?.login_time ? (
              <button disabled={loading} onClick={handleCheckIn} className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-2.5 rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2 text-xs">
                <FaSignInAlt /> {loading ? 'AUTHENTICATING...' : 'LOGIN SYSTEM'}
              </button>
            ) : !checkInData[0]?.logout_time ? (
              <button disabled={loading} onClick={handleCheckOut} className="bg-rose-600 hover:bg-rose-700 text-white font-black px-6 py-2.5 rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2 text-xs">
                <FaSignOutAlt /> {loading ? 'SIGNING OUT...' : 'LOGOUT SYSTEM'}
              </button>
            ) : (
              <span className="bg-slate-100 text-slate-500 px-4 py-2.5 rounded-xl font-black text-xs border border-slate-200 flex items-center gap-2"><FaCheckCircle /> SHIFT COMPLETED</span>
            )}

            <button onClick={() => { setShowModal(true); particularProject(); }} className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-6 py-2.5 rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2 text-xs">
              <FaPlus /> ADD TASK
            </button>
          </div>
        </div>

        {/* ═══ Metrics Monitor Grid ═══ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><FaSignInAlt size={14} /></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Login Time</p>
              </div>
              <p className="text-xl font-black text-slate-800 tracking-tight">{checkInData[0]?.login_time ? moment(checkInData[0].login_time, "HH:mm:ss").format("hh:mm A") : "--:--"}</p>
            </div>
            {checkInData[0]?.login_selfie_url && (
              <img
                src={`${window.API_BASE || (window.location.hostname === "localhost" ? "http://localhost:8080" : "https://sf.doaguru.com")}/${checkInData[0].login_selfie_url}`}
                alt="Login Selfie"
                className="w-12 h-12 rounded-xl object-cover border-2 border-emerald-100 shadow-md cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => window.open(`${window.API_BASE || (window.location.hostname === "localhost" ? "http://localhost:8080" : "https://sf.doaguru.com")}/${checkInData[0].login_selfie_url}`, '_blank')}
                title="Click to view full selfie"
              />
            )}
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-lg"><FaSignOutAlt size={14} /></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logout Time</p>
              </div>
              <p className="text-xl font-black text-slate-800 tracking-tight">{checkInData[0]?.logout_time ? moment(checkInData[0].logout_time, "HH:mm:ss").format("hh:mm A") : "--:--"}</p>
            </div>
            {checkInData[0]?.logout_selfie_url && (
              <img
                src={`${window.API_BASE || (window.location.hostname === "localhost" ? "http://localhost:8080" : "https://sf.doaguru.com")}/${checkInData[0].logout_selfie_url}`}
                alt="Logout Selfie"
                className="w-12 h-12 rounded-xl object-cover border-2 border-rose-100 shadow-md cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => window.open(`${window.API_BASE || (window.location.hostname === "localhost" ? "http://localhost:8080" : "https://sf.doaguru.com")}/${checkInData[0].logout_selfie_url}`, '_blank')}
                title="Click to view full selfie"
              />
            )}
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm overflow-hidden relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><FaClock size={14} /></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Shift Duration</p>
            </div>
            <p className="text-xl font-black text-indigo-600 tracking-tight">{shiftDuration} HRS</p>
            {!checkInData[0]?.logout_time && checkInData[0]?.login_time && <div className="absolute bottom-0 left-0 h-1 bg-indigo-500 w-full animate-pulse"></div>}
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><FaChartLine size={14} /></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Effort Goal</p>
              </div>
              <p className="text-xs font-black text-amber-600">{effortPercent}%</p>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-3">
              <motion.div initial={{ width: 0 }} animate={{ width: `${effortPercent}%` }} className="h-full bg-amber-500 rounded-full" />
            </div>
          </div>
        </div>

        {/* ═══ Activity Ledger ═══ */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-indigo-600 text-white rounded-lg shadow-lg shadow-indigo-100"><FaHistory size={14} /></div>
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">Today's Activity Ledger</h2>
            </div>
            <div className="flex items-center gap-2">
              <DatePicker selected={date} onChange={(d) => setDate(d)} dateFormat="yyyy-MM-dd" className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white shadow-sm focus:ring-2 focus:ring-indigo-100 outline-none w-28 text-center" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Project/Client</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Intel Group</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Time</th>
                  <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {taskData.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-4 py-3">
                      <p className="text-xs font-black text-slate-700">{task.ProjectOrClientName}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Category: {task.Category}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">{task.SubCategory}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-slate-500 font-medium line-clamp-1 max-w-[400px]">{task.TaskDescription}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-xs font-black text-slate-700 whitespace-nowrap">
                        <FaClock size={10} className="text-slate-300" /> {task.ConsumingTimeInMin} MIN
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => handleEditTask(task)} className="p-1.5 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><FaEdit size={14} /></button>
                        <button onClick={() => handleDeleteTask(task.id)} className="p-1.5 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><FaTrash size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {taskData.length === 0 && (
                  <tr><td colSpan="5" className="px-4 py-20 text-center text-slate-300 font-bold italic text-sm">No activity records synchronized for this date.</td></tr>
                )}
              </tbody>
              <tfoot className="bg-slate-50 font-black">
                <tr>
                  <td colSpan="3" className="px-4 py-3 text-right text-[10px] text-slate-400 uppercase tracking-widest">Cumulative Daily Effort:</td>
                  <td className="px-4 py-3 text-sm text-slate-800">{effortMinutes} MIN</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-[10px] uppercase tracking-widest px-3 py-1 rounded-full ${effortMinutes >= 480 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {effortMinutes >= 480 ? 'GOAL ACHIEVED' : `${480 - effortMinutes} MIN REMAINING`}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* ═══ Add/Edit Task Modal ═══ */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{isUpdate ? 'Recalibrate Task Effort' : 'Initialize Task Entry'}</h3>
                <button onClick={() => setShowModal(false)} className="bg-white p-2 rounded-xl text-slate-400 hover:text-rose-500 shadow-sm transition-all">&times;</button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[70vh]">
                <form onSubmit={!isUpdate ? handleSubmit : updateTask} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5 focus-within:text-indigo-600 transition-colors">
                    <label className="text-[10px] font-black uppercase tracking-widest ml-1">Project/Client</label>
                    <select required name="ProjectOrClientName" value={formData.ProjectOrClientName} onChange={handleProjectsChange} className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3 text-sm font-bold shadow-inner ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-all">
                      <option value="">Select Project</option>
                      {projects.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest ml-1">Category</label>
                    <select required name="Category" value={formData.Category} onChange={handleCategoryChange} disabled={!selectedProjects} className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3 text-sm font-bold shadow-inner ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none text-slate-600">
                      <option value="">Select Category</option>
                      {categorys.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest ml-1">Process Pillar</label>
                    <select required name="subCategory" value={formData.subCategory} onChange={handleChange} disabled={!selectedCategory} className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3 text-sm font-bold shadow-inner ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none text-slate-600">
                      <option value="">Select Activity</option>
                      {subCategorys.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest ml-1">Temporal Impact (MIN)</label>
                    <input required type="number" name="ConsumingTimeInMin" value={formData.ConsumingTimeInMin} onChange={handleChange} className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3 text-sm font-bold shadow-inner ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none" placeholder="Minutes Worked" />
                  </div>

                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest ml-1">Narrative Description</label>
                    <textarea name="TaskDescription" value={formData.TaskDescription} onChange={handleChange} required rows="3" className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3 text-sm font-bold shadow-inner ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none" placeholder="Elaborate on objectives achieved..." />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest ml-1">Effective Entry Date</label>
                    <input required type="date" name="task_date" value={formData.task_date} onChange={handleChange} className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3 text-sm font-black shadow-inner ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none" />
                  </div>

                  {/* Dynamic Status Pickers */}
                  {(formData.subCategory === "POST Create " || formData.subCategory === "Video Edittor" || formData.subCategory === "Other Graphic Design") && (
                    <div className="md:col-span-2 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-black uppercase tracking-widest mb-3">Milestone Progress State</p>
                      <div className="flex flex-wrap gap-3">
                        {["Complete", "In Progress", "ReEditing"].map((status) => (
                          <label key={status} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all border ${(formData.PostCreativeStatus === status || formData.VideoStatus === status || formData.OtherGraphicsStatus === status)
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100'
                            : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-200 hover:text-indigo-600 shadow-sm'
                            }`}>
                            <input type="radio" name={formData.subCategory === "POST Create " ? "PostCreativeStatus" : formData.subCategory === "Video Edittor" ? "VideoStatus" : "OtherGraphicsStatus"} value={status} checked={formData.PostCreativeStatus === status || formData.VideoStatus === status || formData.OtherGraphicsStatus === status} onChange={handleStatusChange} className="hidden" />
                            {status}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="md:col-span-2 pt-6 flex gap-3">
                    <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-95 text-xs">
                      {isUpdate ? 'RECALIBRATE ENTRY' : 'SYNCHRONIZE LEDGER'}
                    </button>
                    <button type="button" onClick={() => setFormData(defaultTaskData)} className="bg-slate-100 hover:bg-slate-200 text-slate-400 font-black px-6 rounded-2xl transition-all active:scale-95 text-xs uppercase tracking-widest border border-slate-200">Reset</button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default UserHome;
