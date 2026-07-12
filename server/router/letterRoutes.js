const express = require("express");
const router = express.Router();

// Controllers
const { RegisterAuth, LoginAuth } = require("../controller/letters/Auth");
const { getOfferLetters, saveInternshipOffer, getOfferLetterById, updateOfferLetter, updateInternshipOffer, downloadPdf } = require("../controller/letters/Controller");
const { saveEmployee, saveintern, generatePDF } = require("../controller/letters/employeeController");
const { saveOfferLetter } = require("../controller/letters/PdfController");
const { saveWarningLetter } = require("../controller/letters/WarPdfController");
const {
    saveInternExperienceLetter,
    getInternExperienceLetters,
    saveInternPPOLetter,
    getInternPPOLetters,
    saveRelievingLetter,
    getRelievingLetters,
    saveTerminationLetter,
    getTerminationLetters,
    saveSalarySlip,
    getSalarySlips,
    getInternshipOffers,
    getExperienceLetters,
    deleteExperienceLetter
} = require("../controller/letters/LetterDownloadController");

// Auth Routes
router.post("/register", RegisterAuth);
router.post("/login", LoginAuth);

// Offer Letters (Controller.js & PdfController.js)
router.get("/getOfferLetters", getOfferLetters);
router.get("/offer-letters", getOfferLetters);
router.post("/saveInternshipOffer", saveInternshipOffer);
router.get("/getOfferLetterById/:id", getOfferLetterById);
router.get("/offer-letters/:id", getOfferLetterById);
router.put("/updateOfferLetter/:id", updateOfferLetter);
router.put("/updateInternshipOffer/:id", updateInternshipOffer);
router.post("/saveOfferLetter", saveOfferLetter);
router.get("/download-pdf/:id", downloadPdf);

// Employee / Experience Letter Routes (employeeController.js)
router.post("/saveEmployee", saveEmployee);
router.post("/saveintern", saveintern);
router.get("/generatePDF/:employeeId", generatePDF);

// Warning Letter Routes (WarPdfController.js)
router.post("/saveWarningLetter", saveWarningLetter);

// Letter Download Controller Routes (LetterDownloadController.js)
router.post("/intern-experience-letters", saveInternExperienceLetter);
router.get("/get-intern-experience-letters", getInternExperienceLetters);

router.post("/intern-ppo-letters", saveInternPPOLetter);
router.get("/get-intern-ppo-letters", getInternPPOLetters);

router.post("/relieving-letters", saveRelievingLetter);
router.get("/get-relieving-letters", getRelievingLetters);

router.post("/termination-letters", saveTerminationLetter);
router.get("/get-termination-letters", getTerminationLetters);

router.post("/salary-slips", saveSalarySlip);
router.get("/get-salary-slips", getSalarySlips);

router.get("/internship-offers", getInternshipOffers);
router.get("/experience-letters", getExperienceLetters);
router.delete("/experience-letters/:id", deleteExperienceLetter);

// Root Wildcard Routes (Must be at the bottom to prevent intercepting other literal routes)
router.get("/:id", getOfferLetterById);
router.put("/:id", updateOfferLetter);

module.exports = router;
