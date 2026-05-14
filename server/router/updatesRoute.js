const express = require("express");
const router = express.Router();
const {
  UpdateProject,
  UpdateSubcategory,
  UpdateEmployeeDetails,
  checkNoTaskEmployee,
  updateEmployeeKyc,
} = require("../controller/updateControler");
const uploadEmployeeDocs = require("../middleware/uploadEmployeeDocs");

router.post("/api/update-projects", UpdateProject);

router.post("/api/update-category", UpdateSubcategory);

router.post("/api/update-subcategory", UpdateSubcategory);

router.put("/api/Update-Employee-Details", UpdateEmployeeDetails);
router.get("/api/checkNoTaskEmployee/:date", checkNoTaskEmployee);
router.put(
  "/api/updateEmployeeKyc/:empId",
  uploadEmployeeDocs,
  updateEmployeeKyc
);

module.exports = router;
