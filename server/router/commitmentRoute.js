const express = require('express');
const router = express.Router();
const {
    getCommitments,
    addCommitment,
    updateCommitment,
    deleteCommitment,
    getUniqueRoles
} = require('../controller/commitmentController');

router.get('/api/commitments/history/:empId', getCommitments);
router.get('/api/commitments/roles', getUniqueRoles);
router.post('/api/commitments/add', addCommitment);
router.put('/api/commitments/update/:id', updateCommitment);
router.delete('/api/commitments/delete/:id', deleteCommitment);

module.exports = router;
