const { db } = require('../config/db');

// Get all commitments for an employee
const getCommitments = (req, res) => {
    const { empId } = req.params;
    const sql = `SELECT * FROM employee_commitments WHERE employee_id = ? ORDER BY created_at DESC`;

    db.query(sql, [empId], (err, results) => {
        if (err) {
            console.error('Error fetching commitments:', err);
            return res.status(500).json({ success: false, message: 'Database error', error: err });
        }
        res.status(200).json({ success: true, data: results });
    });
};

// Add a new commitment
const addCommitment = (req, res) => {
    const { employee_id, commitment_text, role } = req.body;

    if (!commitment_text || !employee_id) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const sql = `INSERT INTO employee_commitments (employee_id, commitment_text, role) VALUES (?, ?, ?)`;

    db.query(sql, [employee_id, commitment_text, role || 'Collaborator'], (err, result) => {
        if (err) {
            console.error('Error adding commitment:', err);
            return res.status(500).json({ success: false, message: 'Database error', error: err });
        }
        res.status(201).json({ success: true, message: 'Commitment added successfully', id: result.insertId });
    });
};

// Update an existing commitment
const updateCommitment = (req, res) => {
    const { id } = req.params;
    const { commitment_text, role } = req.body;

    if (!commitment_text) {
        return res.status(400).json({ success: false, message: 'Commitment text is required' });
    }

    const sql = `UPDATE employee_commitments SET commitment_text = ?, role = ? WHERE id = ?`;

    db.query(sql, [commitment_text, role || 'Collaborator', id], (err) => {
        if (err) {
            console.error('Error updating commitment:', err);
            return res.status(500).json({ success: false, message: 'Database error', error: err });
        }
        res.status(200).json({ success: true, message: 'Commitment updated successfully' });
    });
};

// Delete a commitment
const deleteCommitment = (req, res) => {
    const { id } = req.params;
    const sql = `DELETE FROM employee_commitments WHERE id = ?`;

    db.query(sql, [id], (err) => {
        if (err) {
            console.error('Error deleting commitment:', err);
            return res.status(500).json({ success: false, message: 'Database error', error: err });
        }
        res.status(200).json({ success: true, message: 'Commitment deleted successfully' });
    });
};

// Get all unique roles from the database
const getUniqueRoles = (req, res) => {
    const sql = `SELECT DISTINCT role FROM employee_commitments WHERE role IS NOT NULL AND role != ''`;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching unique roles:', err);
            return res.status(500).json({ success: false, message: 'Database error', error: err });
        }
        const roles = results.map(row => row.role);
        res.status(200).json({ success: true, data: roles });
    });
};

module.exports = {
    getCommitments,
    addCommitment,
    updateCommitment,
    deleteCommitment,
    getUniqueRoles
};
