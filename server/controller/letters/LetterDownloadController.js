const { db } = require("../../config/db");

const pool = {
    query: (sql, values) => {
        return new Promise((resolve, reject) => {
            db.query(sql, values, (err, results) => {
                if (err) return reject(err);
                resolve([results]);
            });
        });
    }
};

exports.saveInternExperienceLetter = async (req, res) => {
    try {
        const { employeeName, employeeId, designation, department, startDate, endDate, gender, signatory } = req.body;
        const [result] = await pool.query(
            'INSERT INTO intern_experience_letters (employeeName, employeeId, designation, department, startDate, endDate, gender, signatory) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [employeeName, employeeId, designation, department, new Date(startDate).toISOString().split('T')[0], new Date(endDate).toISOString().split('T')[0], gender || null, signatory || null]
        );
        res.status(200).json({ success: true, message: 'Saved successfully', id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getInternExperienceLetters = async (req, res) => {
    try {
        const page = req.query.page ? parseInt(req.query.page) : null;
        const limit = req.query.limit ? parseInt(req.query.limit) : null;
        const search = req.query.search || '';
        const startDate = req.query.startDate || '';
        const endDate = req.query.endDate || '';
        const department = req.query.department || '';
        const designation = req.query.designation || '';

        let whereClauses = [];
        let params = [];

        if (search) {
            whereClauses.push('(employeeName LIKE ? OR employeeId LIKE ? OR designation LIKE ? OR department LIKE ?)');
            const wildcard = `%${search}%`;
            params.push(wildcard, wildcard, wildcard, wildcard);
        }
        if (startDate) {
            whereClauses.push('createdAt >= ?');
            params.push(`${startDate} 00:00:00`);
        }
        if (endDate) {
            whereClauses.push('createdAt <= ?');
            params.push(`${endDate} 23:59:59`);
        }
        if (department) {
            whereClauses.push('department = ?');
            params.push(department);
        }
        if (designation) {
            whereClauses.push('designation = ?');
            params.push(designation);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        if (page && limit) {
            const offset = (page - 1) * limit;
            const countQuery = `SELECT COUNT(*) as total FROM intern_experience_letters ${whereSql}`;
            const [[{ total }]] = await pool.query(countQuery, params);

            const selectQuery = `SELECT * FROM intern_experience_letters ${whereSql} ORDER BY createdAt DESC LIMIT ? OFFSET ?`;
            const [rows] = await pool.query(selectQuery, [...params, limit, offset]);

            res.status(200).json({
                data: rows,
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                limit: limit
            });
        } else {
            const selectQuery = `SELECT * FROM intern_experience_letters ${whereSql} ORDER BY createdAt DESC`;
            const [rows] = await pool.query(selectQuery, params);
            res.status(200).json(rows);
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.saveInternPPOLetter = async (req, res) => {
    try {
        const { employeeName, employeeId, oldDesignation, newDesignation, newCTC, joiningDate, gender, signatory, basicSalary, hra, allowances } = req.body;
        const [result] = await pool.query(
            'INSERT INTO intern_ppo_letters (employeeName, employeeId, oldDesignation, newDesignation, newCTC, joiningDate, gender, signatory, basic_salary, hra, allowances) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [employeeName, employeeId, oldDesignation, newDesignation, newCTC, new Date(joiningDate).toISOString().split('T')[0], gender || null, signatory || null, basicSalary || null, hra || null, allowances || null]
        );
        res.status(200).json({ success: true, message: 'Saved successfully', id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getInternPPOLetters = async (req, res) => {
    try {
        const page = req.query.page ? parseInt(req.query.page) : null;
        const limit = req.query.limit ? parseInt(req.query.limit) : null;
        const search = req.query.search || '';
        const startDate = req.query.startDate || '';
        const endDate = req.query.endDate || '';
        const oldDesignation = req.query.oldDesignation || '';
        const newDesignation = req.query.newDesignation || '';

        let whereClauses = [];
        let params = [];

        if (search) {
            whereClauses.push('(employeeName LIKE ? OR employeeId LIKE ? OR oldDesignation LIKE ? OR newDesignation LIKE ?)');
            const wildcard = `%${search}%`;
            params.push(wildcard, wildcard, wildcard, wildcard);
        }
        if (startDate) {
            whereClauses.push('createdAt >= ?');
            params.push(`${startDate} 00:00:00`);
        }
        if (endDate) {
            whereClauses.push('createdAt <= ?');
            params.push(`${endDate} 23:59:59`);
        }
        if (oldDesignation) {
            whereClauses.push('oldDesignation = ?');
            params.push(oldDesignation);
        }
        if (newDesignation) {
            whereClauses.push('newDesignation = ?');
            params.push(newDesignation);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        if (page && limit) {
            const offset = (page - 1) * limit;
            const countQuery = `SELECT COUNT(*) as total FROM intern_ppo_letters ${whereSql}`;
            const [[{ total }]] = await pool.query(countQuery, params);

            const selectQuery = `SELECT * FROM intern_ppo_letters ${whereSql} ORDER BY createdAt DESC LIMIT ? OFFSET ?`;
            const [rows] = await pool.query(selectQuery, [...params, limit, offset]);

            res.status(200).json({
                data: rows,
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                limit: limit
            });
        } else {
            const selectQuery = `SELECT * FROM intern_ppo_letters ${whereSql} ORDER BY createdAt DESC`;
            const [rows] = await pool.query(selectQuery, params);
            res.status(200).json(rows);
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.saveRelievingLetter = async (req, res) => {
    try {
        const { employeeName, department, designation, dateOfJoining, dateOfRelieving, lastWorkingDay, gender, signatory } = req.body;
        const [result] = await pool.query(
            'INSERT INTO relieving_letters (employeeName, department, designation, dateOfJoining, dateOfRelieving, lastWorkingDay, gender, signatory) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [employeeName, department, designation, new Date(dateOfJoining).toISOString().split('T')[0], new Date(dateOfRelieving).toISOString().split('T')[0], new Date(lastWorkingDay).toISOString().split('T')[0], gender || null, signatory || null]
        );
        res.status(200).json({ success: true, message: 'Saved successfully', id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getRelievingLetters = async (req, res) => {
    try {
        const page = req.query.page ? parseInt(req.query.page) : null;
        const limit = req.query.limit ? parseInt(req.query.limit) : null;
        const search = req.query.search || '';
        const startDate = req.query.startDate || '';
        const endDate = req.query.endDate || '';
        const department = req.query.department || '';
        const designation = req.query.designation || '';

        let whereClauses = [];
        let params = [];

        if (search) {
            whereClauses.push('(employeeName LIKE ? OR department LIKE ? OR designation LIKE ?)');
            const wildcard = `%${search}%`;
            params.push(wildcard, wildcard, wildcard);
        }
        if (startDate) {
            whereClauses.push('createdAt >= ?');
            params.push(`${startDate} 00:00:00`);
        }
        if (endDate) {
            whereClauses.push('createdAt <= ?');
            params.push(`${endDate} 23:59:59`);
        }
        if (department) {
            whereClauses.push('department = ?');
            params.push(department);
        }
        if (designation) {
            whereClauses.push('designation = ?');
            params.push(designation);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        if (page && limit) {
            const offset = (page - 1) * limit;
            const countQuery = `SELECT COUNT(*) as total FROM relieving_letters ${whereSql}`;
            const [[{ total }]] = await pool.query(countQuery, params);

            const selectQuery = `SELECT * FROM relieving_letters ${whereSql} ORDER BY createdAt DESC LIMIT ? OFFSET ?`;
            const [rows] = await pool.query(selectQuery, [...params, limit, offset]);

            res.status(200).json({
                data: rows,
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                limit: limit
            });
        } else {
            const selectQuery = `SELECT * FROM relieving_letters ${whereSql} ORDER BY createdAt DESC`;
            const [rows] = await pool.query(selectQuery, params);
            res.status(200).json(rows);
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.saveTerminationLetter = async (req, res) => {
    try {
        const { employeeName, employeeId, designation, department, terminationDate, gender, signatory, reason } = req.body;
        const [result] = await pool.query(
            'INSERT INTO termination_letters (employeeName, employeeId, designation, department, terminationDate, gender, signatory, reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [employeeName, employeeId, designation, department, new Date(terminationDate).toISOString().split('T')[0], gender || null, signatory || null, reason || null]
        );
        res.status(200).json({ success: true, message: 'Saved successfully', id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getTerminationLetters = async (req, res) => {
    try {
        const page = req.query.page ? parseInt(req.query.page) : null;
        const limit = req.query.limit ? parseInt(req.query.limit) : null;
        const search = req.query.search || '';
        const startDate = req.query.startDate || '';
        const endDate = req.query.endDate || '';
        const department = req.query.department || '';
        const designation = req.query.designation || '';
        const reason = req.query.reason || '';

        let whereClauses = [];
        let params = [];

        if (search) {
            whereClauses.push('(employeeName LIKE ? OR employeeId LIKE ? OR designation LIKE ? OR department LIKE ?)');
            const wildcard = `%${search}%`;
            params.push(wildcard, wildcard, wildcard, wildcard);
        }
        if (startDate) {
            whereClauses.push('createdAt >= ?');
            params.push(`${startDate} 00:00:00`);
        }
        if (endDate) {
            whereClauses.push('createdAt <= ?');
            params.push(`${endDate} 23:59:59`);
        }
        if (department) {
            whereClauses.push('department = ?');
            params.push(department);
        }
        if (designation) {
            whereClauses.push('designation = ?');
            params.push(designation);
        }
        if (reason) {
            whereClauses.push('reason = ?');
            params.push(reason);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        if (page && limit) {
            const offset = (page - 1) * limit;
            const countQuery = `SELECT COUNT(*) as total FROM termination_letters ${whereSql}`;
            const [[{ total }]] = await pool.query(countQuery, params);

            const selectQuery = `SELECT * FROM termination_letters ${whereSql} ORDER BY createdAt DESC LIMIT ? OFFSET ?`;
            const [rows] = await pool.query(selectQuery, [...params, limit, offset]);

            res.status(200).json({
                data: rows,
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                limit: limit
            });
        } else {
            const selectQuery = `SELECT * FROM termination_letters ${whereSql} ORDER BY createdAt DESC`;
            const [rows] = await pool.query(selectQuery, params);
            res.status(200).json(rows);
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.saveSalarySlip = async (req, res) => {
    try {
        const { employeeName, employeeId, month, year, grossSalary, netSalary, basicSalary, hra, pf, esi, allowances, gender, signatory } = req.body;
        const [result] = await pool.query(
            'INSERT INTO salary_slips (employeeName, employeeId, month, year, grossSalary, netSalary, basic_salary, hra, pf, esi, allowances, gender, signatory) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [employeeName, employeeId, month, year, grossSalary || 0, netSalary || 0, basicSalary || null, hra || null, pf || null, esi || null, allowances || null, gender || null, signatory || null]
        );
        res.status(200).json({ success: true, message: 'Saved successfully', id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getSalarySlips = async (req, res) => {
    try {
        const page = req.query.page ? parseInt(req.query.page) : null;
        const limit = req.query.limit ? parseInt(req.query.limit) : null;
        const search = req.query.search || '';
        const startDate = req.query.startDate || '';
        const endDate = req.query.endDate || '';
        const month = req.query.month || '';
        const year = req.query.year || '';

        let whereClauses = [];
        let params = [];

        if (search) {
            whereClauses.push('(employeeName LIKE ? OR employeeId LIKE ? OR month LIKE ? OR CAST(year AS CHAR) LIKE ?)');
            const wildcard = `%${search}%`;
            params.push(wildcard, wildcard, wildcard, wildcard);
        }
        if (startDate) {
            whereClauses.push('createdAt >= ?');
            params.push(`${startDate} 00:00:00`);
        }
        if (endDate) {
            whereClauses.push('createdAt <= ?');
            params.push(`${endDate} 23:59:59`);
        }
        if (month) {
            whereClauses.push('month = ?');
            params.push(month);
        }
        if (year) {
            whereClauses.push('year = ?');
            params.push(parseInt(year));
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        if (page && limit) {
            const offset = (page - 1) * limit;
            const countQuery = `SELECT COUNT(*) as total FROM salary_slips ${whereSql}`;
            const [[{ total }]] = await pool.query(countQuery, params);

            const selectQuery = `SELECT * FROM salary_slips ${whereSql} ORDER BY createdAt DESC LIMIT ? OFFSET ?`;
            const [rows] = await pool.query(selectQuery, [...params, limit, offset]);

            res.status(200).json({
                data: rows,
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                limit: limit
            });
        } else {
            const selectQuery = `SELECT * FROM salary_slips ${whereSql} ORDER BY createdAt DESC`;
            const [rows] = await pool.query(selectQuery, params);
            res.status(200).json(rows);
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getInternshipOffers = async (req, res) => {
    try {
        const page = req.query.page ? parseInt(req.query.page) : null;
        const limit = req.query.limit ? parseInt(req.query.limit) : null;
        const search = req.query.search || '';
        const startDate = req.query.startDate || '';
        const endDate = req.query.endDate || '';
        const position = req.query.position || '';

        let whereClauses = [];
        let params = [];

        if (search) {
            whereClauses.push('(name LIKE ? OR email LIKE ? OR phoneNumber LIKE ? OR position LIKE ?)');
            const wildcard = `%${search}%`;
            params.push(wildcard, wildcard, wildcard, wildcard);
        }
        if (startDate) {
            whereClauses.push('created_at >= ?');
            params.push(`${startDate} 00:00:00`);
        }
        if (endDate) {
            whereClauses.push('created_at <= ?');
            params.push(`${endDate} 23:59:59`);
        }
        if (position) {
            whereClauses.push('position = ?');
            params.push(position);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        if (page && limit) {
            const offset = (page - 1) * limit;
            const countQuery = `SELECT COUNT(*) as total FROM internship_offers ${whereSql}`;
            const [[{ total }]] = await pool.query(countQuery, params);

            const selectQuery = `SELECT * FROM internship_offers ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
            const [rows] = await pool.query(selectQuery, [...params, limit, offset]);

            res.status(200).json({
                data: rows,
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                limit: limit
            });
        } else {
            const selectQuery = `SELECT * FROM internship_offers ${whereSql} ORDER BY created_at DESC`;
            const [rows] = await pool.query(selectQuery, params);
            res.status(200).json(rows);
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getExperienceLetters = async (req, res) => {
    try {
        const page = req.query.page ? parseInt(req.query.page) : null;
        const limit = req.query.limit ? parseInt(req.query.limit) : null;
        const search = req.query.search || '';
        const startDate = req.query.startDate || '';
        const endDate = req.query.endDate || '';
        const designation = req.query.designation || '';

        let whereClauses = [];
        let params = [];

        if (search) {
            whereClauses.push('(name LIKE ? OR designation LIKE ?)');
            const wildcard = `%${search}%`;
            params.push(wildcard, wildcard);
        }
        if (startDate) {
            whereClauses.push('joining_date >= ?');
            params.push(startDate);
        }
        if (endDate) {
            whereClauses.push('joining_date <= ?');
            params.push(endDate);
        }
        if (designation) {
            whereClauses.push('designation = ?');
            params.push(designation);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        if (page && limit) {
            const offset = (page - 1) * limit;
            const countQuery = `SELECT COUNT(*) as total FROM experincel ${whereSql}`;
            const [[{ total }]] = await pool.query(countQuery, params);

            const selectQuery = `SELECT * FROM experincel ${whereSql} ORDER BY id DESC LIMIT ? OFFSET ?`;
            const [rows] = await pool.query(selectQuery, [...params, limit, offset]);

            res.status(200).json({
                data: rows,
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                limit: limit
            });
        } else {
            const selectQuery = `SELECT * FROM experincel ${whereSql} ORDER BY id DESC`;
            const [rows] = await pool.query(selectQuery, params);
            res.status(200).json(rows);
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.deleteExperienceLetter = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM experincel WHERE id = ?', [id]);
        res.status(200).json({ success: true, message: 'Deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
