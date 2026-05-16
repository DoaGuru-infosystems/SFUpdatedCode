const { db } = require('../config/db');
const moment = require('moment-timezone');

// Get salary history for an employee
const getSalaryHistory = (req, res) => {
    const { empId } = req.params;
    const sql = `SELECT * FROM salary_payments WHERE employee_id = ? ORDER BY created_at DESC`;

    db.query(sql, [empId], (err, results) => {
        if (err) {
            console.error('Error fetching salary history:', err);
            return res.status(500).json({ success: false, message: 'Database error', error: err });
        }
        res.status(200).json({ success: true, data: results });
    });
};

// Record a new salary payment
const addSalaryPayment = (req, res) => {
    const {
        employee_id,
        total_salary,
        amount_paid,
        payment_duration,
        issue_date
    } = req.body;

    const remaining_amount = total_salary - amount_paid;
    const status = remaining_amount <= 0 ? 'Paid' : 'Partial';

    const sql = `
        INSERT INTO salary_payments 
        (employee_id, total_salary, amount_paid, remaining_amount, payment_duration, issue_date, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [employee_id, total_salary, amount_paid, remaining_amount, payment_duration, issue_date, status], (err, result) => {
        if (err) {
            console.error('Error adding salary payment:', err);
            return res.status(500).json({ success: false, message: 'Database error', error: err });
        }
        res.status(201).json({ success: true, message: 'Salary payment recorded successfully', id: result.insertId });
    });
};

// Update salary payment (e.g., clear remaining balance or full edit)
const updateSalaryPayment = (req, res) => {
    const { id } = req.params;
    const { amount_paid, remaining_paid_date, total_salary, payment_duration, issue_date } = req.body;

    const getSql = `SELECT * FROM salary_payments WHERE payment_id = ?`;

    db.query(getSql, [id], (err, rows) => {
        if (err || rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Payment record not found' });
        }

        const existing = rows[0];
        const new_total = total_salary !== undefined ? total_salary : existing.total_salary;
        const new_paid = amount_paid !== undefined ? amount_paid : existing.amount_paid;
        const new_duration = payment_duration !== undefined ? payment_duration : existing.payment_duration;
        const new_issue_date = issue_date !== undefined ? issue_date : existing.issue_date;
        // if remaining_paid_date is passed as a value, use it. if it's explicitly null/empty, clear it.
        let new_remaining_paid_date = existing.remaining_paid_date;
        if (remaining_paid_date !== undefined) {
            new_remaining_paid_date = remaining_paid_date;
        }

        const remaining_amount = new_total - new_paid;
        const status = remaining_amount <= 0 ? 'Paid' : 'Partial';

        const updateSql = `
            UPDATE salary_payments 
            SET total_salary = ?, amount_paid = ?, remaining_amount = ?, remaining_paid_date = ?, status = ?, payment_duration = ?, issue_date = ?
            WHERE payment_id = ?
        `;

        db.query(updateSql, [new_total, new_paid, remaining_amount, new_remaining_paid_date || null, status, new_duration, new_issue_date, id], (err2) => {
            if (err2) {
                console.error('Error updating salary payment:', err2);
                return res.status(500).json({ success: false, message: 'Database error', error: err2 });
            }
            res.status(200).json({ success: true, message: 'Salary payment updated successfully' });
        });
    });
};

// Delete a payment record
const deleteSalaryPayment = (req, res) => {
    const { id } = req.params;
    const sql = `DELETE FROM salary_payments WHERE payment_id = ?`;

    db.query(sql, [id], (err) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        res.status(200).json({ success: true, message: 'Payment record deleted' });
    });
};

module.exports = {
    getSalaryHistory,
    addSalaryPayment,
    updateSalaryPayment,
    deleteSalaryPayment
};
