import { useEffect, useState } from "react";
import { Routes, Route, useNavigate, Link } from "react-router-dom";
import "react-multi-date-picker/styles/colors/green.css";
// import App from "./App";
// Sales App
import Sales_Navbar from "./components/navbar";
import Sales_Footer from "./components/footer";
import Sales_LoginPage from "./pages/sales_LoginPage";
import Sales_UserHome from "./pages/sales_UserHome";
import FollowUpPage from "./pages/follow_up";

// Task Efforts
import LoginPage from "./Task/pages/loginPage";
import Navbar from "./Task/components/navbar";
import Footer from "./Task/components/footer";
import UserHome from "./Task/pages/Employee/userHome";
import TaskView from "./Task/pages/Employee/taskShow";

// Admin file import
import AdminNavbar from "./Task/components/adminNavbar";
import AdminHomePage from "./Task/pages/Admin/adminHome";
import EmployeePage from "./Task/pages/Admin/Employees";
import RegisterUser from "./Task/pages/Admin/registerUser";
import ProjectsPage from "./Task/pages/Admin/projects";
import AddData from "./Task/pages/Admin/Addprojects";
import ProjectAssignmentForm from "./Task/pages/Admin/assignProoject";
import TaskReportDownload from "./Task/pages/Admin/Report";
import Blank from "./Task/pages/blank";
import { Toaster } from "react-hot-toast";
import NotFoundPage from "./Task/pages/pageNotfound";
import AssignProjectDetails from "./Task/pages/Employee/AssignProjects";
import EmployeeTaskReport from "./Task/pages/Employee/EmployeeReport";
import EmployeeDashboard from "./Task/pages/Employee/Profile/Dashboard";
import EmployeeCard from "./Task/pages/Employee/Profile/EmployeeCard";
import EmployeeAttendReport from "./Task/pages/Employee/EmployeeAttendReport";
import AdminAttendReport from "./Task/pages/Admin/AdminAttendReport";
import EmployeeAttendanceAdmin from "./Task/components/EmployeeAttendanceAdmin";
import EmployeeLeaveReport from "./Task/pages/Employee/EmployeeLeaveReport";
import AdminLeaveReport from "./Task/pages/Admin/AdminLeaveReport";
import EmployeePasswordReset from "./Task/pages/Employee/EmployeePasswordReset";
import AdminPasswordReset from "./Task/pages/Admin/AdminPasswordReset";
import HolidayManage from "./Task/pages/Admin/HolidayManage";
import BackdateAttendRequest from "./Task/pages/Admin/BackdateAttendRequest";
import EmployeeAssignTaskView from "./Task/components/EmployeeAssignTaskView";
import AssignProjectTarget from "./Task/pages/Admin/AssignProjecttarget";
import AssignDailyTarget from "./Task/pages/Employee/AssignTargetFIle";
import AdminAssignTaskDevlopment from "./Task/pages/Admin/AdminAssignTaskDevlopment";
import CheckAssignedTaskDevlopment from "./Task/pages/Employee/CheckAssignedTaskDevlopment";
import EmployeeDetails from "./Task/pages/Admin/EmployeeDetails";
import WorkforceInsights from "./Task/pages/Admin/WorkforceInsights";

const Commonjs = () => {
  const navigate = useNavigate();
  const [render, setRender] = useState(false);
  const [page, setPage] = useState(null);
  const [userRole, setUserRole] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setRender(true);
    handleRender();
    // navigate('/');
    window.location.href = "/";
  };

  const handleRender = () => {
    setRender(!render);
  };

  useEffect(() => {
    let path = window.location.pathname;
    if (path.includes("sales")) {
      setPage("sales");
    } else if (path.includes("task")) {
      setPage("task");
    } else {
      setPage(null);
    }
    console.log(page);
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      setUserRole(user.role);
      if (path === "/") {
        if (user.role === "admin") {
          navigate("/task/Admin-Home-page");
        } else if (user.role === "user") {
          navigate("/task/UserHome");
        }
      }
    }
    // console.log(user, "line 65");
  }, [window.location.pathname]);

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      {page == "task" ? (
        userRole === "admin" ? (
          <AdminNavbar Logout={handleLogout} render={render} />
        ) : (
          <Navbar Logout={handleLogout} render={render} />
        )
      ) : page === "sales" ? (
        <Sales_Navbar Logout={handleLogout} />
      ) : (
        ""
      )}
      <Routes>
        <Route
          path="/"
          element={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-white mb-8">
                  Choose Your Platform
                </h1>
                <div className="space-x-4">
                  {/* <Link
                                    to={'/sales/login'}
                                    className="bg-white text-blue-500 font-semibold py-2 px-4 rounded-full shadow-lg hover:bg-blue-500 hover:text-black transition-all duration-300 transform hover:scale-105"
                                >
                                    Sales
                                </Link> */}
                  <Link
                    to={
                      userRole === "admin"
                        ? "/task/Admin-Home-page"
                        : userRole === "user"
                        ? "/task/UserHome"
                        : "/task/login"
                    }
                    className="bg-white text-purple-500 font-semibold py-2 px-4 rounded-full shadow-lg hover:bg-purple-500 hover:text-black transition-all duration-300 transform hover:scale-105"
                  >
                    Task
                  </Link>
                </div>
              </div>
            </div>
          }
        />
        {/*--------------- Sales app ----------------- */}
        {/* <App /> */}
        <Route
          path="/sales/login"
          element={<Sales_LoginPage Login={setRender} />}
        ></Route>
        <Route path="/sales/HomePage" element={<Sales_UserHome />}></Route>
        <Route
          path="/sales/HomePage/FollowUpPage/:lead_Id"
          element={<FollowUpPage />}
        ></Route>

        {/*--------------- Task app ----------------- */}
        {/* <TaskApp /> */}
        {page === "task" && userRole === "admin" && (
          <Route path="/task/Admin-Home-page" element={<AdminHomePage />} />
        )}

        {page === "task" && userRole === "user" && (
          <Route path="/task/UserHome" element={<UserHome />} />
        )}

        {page === "task" && userRole !== "admin" && userRole !== "user" && (
          <Route
            path="/task/login"
            element={<LoginPage setRender={handleRender} />}
          />
        )}

        {/* <Route path="/task/UserHome" element={<UserHome />} /> */}
        <Route path="/task/TaskView" element={<TaskView />} />
        <Route
          path="/task/AssignProjectDetails"
          element={<AssignProjectDetails />}
        />
        <Route
          path="/task/EmployeeTaskReport"
          element={<EmployeeTaskReport />}
        />
        <Route path="/task/EmployeeDashboard" element={<EmployeeDashboard />} />
        <Route path="/task/EmployeeProfile Card" element={<EmployeeCard />} />
        <Route
          path="/task/AssignTaskView"
          element={<EmployeeAssignTaskView />}
        />
        <Route
          path="/task/employee-attendance-report"
          element={<EmployeeAttendReport />}
        />
        <Route
          path="/task/employee-leave-report"
          element={<EmployeeLeaveReport />}
        />
        <Route
          path="/task/reset-password"
          element={<EmployeePasswordReset />}
        />
        <Route
          path="/task/AssignProjectTarget-Details"
          element={<AssignDailyTarget />}
        />
        <Route
          path="/task/check-assigned-development-task"
          element={<CheckAssignedTaskDevlopment />}
        />

        {/* Admin Routes  */}
        <Route
          path="/task/admin-reset-password"
          element={<AdminPasswordReset />}
        />
        <Route path="/task/Admin-Home-page" element={<AdminHomePage />} />
        <Route
          path="/task/employee-show-register-page"
          element={<EmployeePage userRole={userRole} />}
        />
        <Route
          path="/task/employee-details-page/:empId"
          element={<EmployeeDetails />}
        />
        <Route path="/task/registerUser" element={<RegisterUser />} />
        <Route path="/task/project-add" element={<ProjectsPage />} />
        <Route path="/task/AddProject" element={<AddData />} />
        <Route
          path="/task/assign-projects"
          element={<ProjectAssignmentForm />}
        />
        <Route
          path="/task/assign-projects-target"
          element={<AssignProjectTarget />}
        />
        <Route
          path="/task/assign-task-development-team"
          element={<AdminAssignTaskDevlopment />}
        />
        <Route path="/task/Employee-report" element={<TaskReportDownload />} />
        <Route
          path="/task/admin/employee-attendance-report"
          element={<AdminAttendReport />}
        />

        <Route
          path="/task/admin/holiday-management"
          element={<HolidayManage />}
        />

        <Route
          path="/task/admin/employee-attendance-admin/:uid"
          element={<EmployeeAttendanceAdmin userRole={userRole} />}
        />
        <Route
          path="/task/admin/employee-leave-report"
          element={<AdminLeaveReport />}
        />
        <Route
          path="/task/admin/backdate-attendance-request"
          element={<BackdateAttendRequest />}
        />
        <Route
          path="/task/admin/workforce-insights"
          element={<WorkforceInsights />}
        />
        <Route path="/task/Page-Not-Found" element={<NotFoundPage />} />
        <Route path="/task/blank" element={<Blank />} />
      </Routes>
      {page == "task" ? <Footer /> : page == "sales" ? <Sales_Footer /> : ""}
    </>
  );
};

export default Commonjs;
