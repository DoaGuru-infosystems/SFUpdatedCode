const express = require('express');
const router = express.Router();
const {
    getSalaryHistory,
    addSalaryPayment,
    updateSalaryPayment,
    deleteSalaryPayment
} = require('../controller/salaryController');

router.get('/salary/history/:empId', getSalaryHistory);
router.post('/salary/pay', addSalaryPayment);
router.put('/salary/update/:id', updateSalaryPayment);
router.delete('/salary/delete/:id', deleteSalaryPayment);

module.exports = router;
