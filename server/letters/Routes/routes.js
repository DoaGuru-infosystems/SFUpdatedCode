const express = require('express');
const router = express.Router();

// Import controllers
const employeeController = require('../Controller/employeeController');
const {
  getOfferLetters,
  getOfferLetterById,
  updateOfferLetter,
  downloadPdf,
  saveInternshipOffer
} = require('../Controller/Controller');
const { saveOfferLetter } = require('../Controller/PdfController');
const { RegisterAuth, LoginAuth } = require('../Controller/Auth');

const letterDownloadController = require('../Controller/LetterDownloadController');

// Define routes

// Auth Routes
router.post('/api/register', RegisterAuth); 
router.post('/api/login', LoginAuth);

// Offer Letters
router.post('/api/saveOfferLetter', saveOfferLetter);
router.put('/api/updateOfferLetter/:id', updateOfferLetter);
router.post('/api/saveInternshipOffer', saveInternshipOffer);
router.get('/api/offer-letters', getOfferLetters);
router.get('/api/offer-letters/:id', getOfferLetterById);
router.get('/api/download-pdf/:id', downloadPdf); 

// New Experience Letter Routes
router.post('/api/saveEmployee', employeeController.saveEmployee); 
router.get('/api/generatePDF/:employeeId', employeeController.generatePDF); 

// Salary Slip Routes
// router.get('/api/generateSalarySlip/:employeeId', employeeController.generateSalarySlip);

// Letter Download API Routes
router.post('/api/intern-experience-letters', letterDownloadController.saveInternExperienceLetter);
router.get('/api/intern-experience-letters', letterDownloadController.getInternExperienceLetters);

router.post('/api/intern-ppo-letters', letterDownloadController.saveInternPPOLetter);
router.get('/api/intern-ppo-letters', letterDownloadController.getInternPPOLetters);

router.post('/api/relieving-letters', letterDownloadController.saveRelievingLetter);
router.get('/api/relieving-letters', letterDownloadController.getRelievingLetters);

router.post('/api/termination-letters', letterDownloadController.saveTerminationLetter);
router.get('/api/termination-letters', letterDownloadController.getTerminationLetters);

router.post('/api/salary-slips', letterDownloadController.saveSalarySlip);
router.get('/api/salary-slips', letterDownloadController.getSalarySlips);

router.get('/api/internship-offers', letterDownloadController.getInternshipOffers);
router.get('/api/experience-letters', letterDownloadController.getExperienceLetters);
router.delete('/api/experience-letters/:id', letterDownloadController.deleteExperienceLetter);

module.exports = router;
