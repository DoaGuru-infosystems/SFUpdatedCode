const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const { getAdminNotifications, markNotificationAsRead } = require("../controller/notificationController.js");
const {
  test,
  addLead,
  updateLead,
  createFollowUpReport,
  getLeadDetails,
  updateMeeting,
  updateFollowReport,
  mailTest,
  AddData,
  DeleteTask,
  FetchData,
  UpdateTask,
  FetchFUllData,
  ProjectsList,
  CategoryList,
  SubCategoryList,
  myTask,
  AddCategory,
  AddSubcategory,
  AddProject,
  UserData,
  projectFromAssign,
  assignProject,
  getUserTasks,
  DownloadUserTaskReport,
  UpdateEmployeeAPI,
  upload,
  getEmployeeAPI,
  addCreativeCount,
  checkInAttend, checkOutAttend, getCheckInByUser,
  getCheckInByUserIdOnly,
  getMonthlyAttendance,
  applyForLeaves,
  getMonthlyEmployeeLeavesByUserId,
  getAllLeaveDataForAdmin,
  approveRejectLeaves,
  getEmployeeTodaysLeavesByUserId,
  adminAddAttendance,
  adminUpdateAttendanceLogoutTime,
  adminResetPassword,
  sendOtp,
  verifyOtp,
  employeeResetPassword,
  adminReverseLeave,
  SalaryCalculatorsByUser,
  getAllHolidaysCurrentYear,
  addHolidayManually,
  updateHolidayStatus,
  deleteHoliday,
  getEmployeeSalary,
  assignProjectTarget,
  getAllProjectTarget,
  getEmployeeWiseProjectTarget,
  updateProjectTarget,
  deleteProjectTarget,
  bulkAssignProjectTarget,
  AssignDevelopmentTask,
  getAssignDevelopmentTask,
  updateAssignDevelopmentTask,
  UserDataById,
  getHolidaysByMonthYear,
  getAllAssignments,
  deleteAssignment,
  deleteExpense,
  updateExpense,
  addExpense,
  getExpenses,
  updateAssignedProjectStatus,
  getAllAssignedDevelopmentTasks
} = require("../controller/itemController.js");

router.get("/test", test);
router.post("/lead", addLead);
router.post("/insertfollowup", createFollowUpReport);
router.get("/getlead/:user_id", getLeadDetails);
router.post("/updateLead", updateLead);
router.put("/updateMeeting", updateMeeting);
router.put("/updateFollowReport", updateFollowReport);
router.get("/mailTest", mailTest);
// Route to add data
router.post("/api/add-data", AddData);
router.post("/api/add-creative-count", addCreativeCount);
// Route to fetch data
router.get("/api/fetch-data", FetchData);
// this route for fetch full all user  task report
router.get("/api/fetch-full-data", FetchFUllData);
//Update User (Employee)
router.post('/api/updateEmployee', upload.single('profilePicture'), UpdateEmployeeAPI);
//fetch all details
router.get('/api/getEmployee/:id', getEmployeeAPI);
//  Update Task Details
router.post("/api/update-task", UpdateTask);
// Route to delete a task
router.post("/api/delete-task", DeleteTask);



// Router to Logout user
// router.post('/api/logout', UserLogout);
// Route for user show only self add task
router.get("/api/mytask/:id", myTask);

// Route for  Add project and categeory
router.post("/api/projects", AddProject);

router.post("/api/categories", AddCategory);

router.post("/api/subcategories", AddSubcategory);

// slect filed routes
router.get("/api/projects", ProjectsList);
router.get("/api/category-list", CategoryList);
router.get("/api/sub-category-list", SubCategoryList);


//User Data Fetch

router.get("/api/users", UserData);
router.get("/api/UserDataById/:empId", UserDataById);
router.get("/api/getProject/:user_id", projectFromAssign);
router.get("/api/getAllAssignments", getAllAssignments);
router.delete("/api/deleteAssignment/:id", deleteAssignment);
router.post("/api/assignProject", assignProject);
router.put("/api/update-assigned-project-status/:id", updateAssignedProjectStatus);

// Employee Task Show to admin
router.get("/api/getUserTasks/:userId", getUserTasks);

// Downnload User task in excel

router.get("/api/downloadUserTasks/:userId", DownloadUserTaskReport);


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "selfiePicture/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const uploadFile = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    cb(null, true);
  },
});

router.post("/api/checkInAttend", uploadFile.single("selfie"), checkInAttend);
router.put("/api/checkOutAttend", uploadFile.single("selfie"), checkOutAttend);
router.get("/api/getCheckInByUser/:userId", getCheckInByUser);
router.get(
  "/api/getCheckInByUserIdOnly/:userId/:month/:year",
  getCheckInByUserIdOnly
);
router.get("/api/getMonthlyAttendance/:month/:year", getMonthlyAttendance);
router.post("/api/applyForLeaves", applyForLeaves);
router.get(
  "/api/getMonthlyEmployeeLeavesByUserId/:userId/:month/:year",
  getMonthlyEmployeeLeavesByUserId
);
router.get("/api/getAllLeaveDataForAdmin", getAllLeaveDataForAdmin);
router.put("/api/approveRejectLeaves/:leaveId", approveRejectLeaves);
router.get(
  "/api/getEmployeeTodaysLeavesByUserId/:userId",
  getEmployeeTodaysLeavesByUserId
);
router.post("/api/adminAddAttendance", adminAddAttendance);
router.put("/api/adminUpdateAttendanceLogoutTime/:attendId", adminUpdateAttendanceLogoutTime);
router.post("/api/sendOtp", sendOtp);
router.put("/api/adminResetPassword", adminResetPassword);
router.post("/api/verifyOtp", verifyOtp);
router.put("/api/employeeResetPassword", employeeResetPassword);
router.post("/api/adminReverseLeave", adminReverseLeave);
router.post("/api/SalaryCalculatorsByUser/:userId", SalaryCalculatorsByUser);
router.get("/api/getAllHolidaysCurrentYear", getAllHolidaysCurrentYear);
router.post("/api/addHolidayManually", addHolidayManually);
router.put("/api/updateHolidayStatus/:hid", updateHolidayStatus);
router.delete("/api/deleteHoliday/:hid", deleteHoliday);
router.get("/api/getEmployeeSalary/:userId", getEmployeeSalary)

// Project Target Routes
router.post("/api/assignProjectTarget", assignProjectTarget);
router.get("/api/getAllProjectTarget", getAllProjectTarget);
router.get("/api/getEmployeeWiseProjectTarget/:employeeId", getEmployeeWiseProjectTarget);
router.put("/api/updateProjectTarget/:id", updateProjectTarget);
router.delete("/api/deleteProjectTarget/:id", deleteProjectTarget);
router.post("/api/bulkAssignProjectTarget", bulkAssignProjectTarget);

// Development Task Route
router.post("/api/assign-project-target-development-team", AssignDevelopmentTask);
router.get("/api/get-assigned-development-tasks/:employeeId", getAssignDevelopmentTask);
router.put("/api/update-assigned-development-task/:id", updateAssignDevelopmentTask);
router.get("/api/get-all-assigned-development-tasks", getAllAssignedDevelopmentTasks);
router.get("/api/getHolidaysByMonthYear/:month/:year", getHolidaysByMonthYear);



router.get("/api/admin-notifications", getAdminNotifications);
router.put("/api/admin-notifications/mark-read/:id", markNotificationAsRead);

router.get("/api/get-expenses", getExpenses);
router.post("/api/add-expense", addExpense);
router.put("/api/update-expense/:id", updateExpense);
router.delete("/api/delete-expense/:id", deleteExpense);

module.exports = router;
