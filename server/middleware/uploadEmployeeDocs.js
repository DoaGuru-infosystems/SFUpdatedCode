const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/employees/");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + "_" + file.fieldname + ext);
  },
});

const upload = multer({ storage });

module.exports = upload.fields([
  { name: "profileIMG" },
  { name: "previous_company_experience_letter" },
  { name: "previous_company_relieving_letter" },
  { name: "salary_slips" },
  { name: "graduation_degree_marksheets" },
  { name: "aadhar_card_image" },
  { name: "pan_card_image" },
  { name: "cancelled_cheque" },
  { name: "offer_letter" },
  { name: "bank_barcode" },
]);
