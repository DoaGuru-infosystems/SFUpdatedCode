const { db } = require("../../config/db");
const path = require('path');

// Promisified query helper for the standard callback-based db connection
const query = (sql, values) => {
    return new Promise((resolve, reject) => {
        db.query(sql, values, (err, results) => {
            if (err) return reject(err);
            resolve([results]);
        });
    });
};

const saveInternshipOffer = async (req, res) => {
    const {
        name,
        address,
        phoneNumber,
        email,
        gender,
        startDate,
        endDate,
        position,
        stipend,
        mentorName,
        mentorContact,
        signatory,
        termsAndConditions
    } = req.body;

    const insertQuery = `
    INSERT INTO internship_offers 
    (name, email, gender, phoneNumber, address, position, startDate, endDate, stipend, mentorName, mentorContact, signatory, termsAndConditions)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

    const values = [
        name,
        email,
        gender || null,
        phoneNumber,
        address,
        position,
        new Date(startDate).toISOString().split('T')[0],
        new Date(endDate).toISOString().split('T')[0],
        stipend,
        mentorName,
        mentorContact,
        signatory || null,
        JSON.stringify(termsAndConditions),
    ];

    try {
        const [results] = await query(insertQuery, values);
        return res.status(200).json({
            success: true,
            message: 'Internship offer processed successfully',
            data: {
                id: results.insertId,
                name,
                email,
                gender: gender || null,
                signatory: signatory || null
            }
        });
    } catch (error) {
        console.error('Error saving internship offer:', error);
        return res.status(500).json({ success: false, message: 'Failed to save internship offer' });
    }
};

const getOfferLetters = async (req, res) => {
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
            whereClauses.push('(name LIKE ? OR email LIKE ? OR phoneNumber LIKE ? OR designation LIKE ?)');
            const searchWildcard = `%${search}%`;
            params.push(searchWildcard, searchWildcard, searchWildcard, searchWildcard);
        }

        if (startDate) {
            whereClauses.push('createdAt >= ?');
            params.push(`${startDate} 00:00:00`);
        }

        if (endDate) {
            whereClauses.push('createdAt <= ?');
            params.push(`${endDate} 23:59:59`);
        }

        if (designation) {
            whereClauses.push('designation = ?');
            params.push(designation);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        if (page && limit) {
            const offset = (page - 1) * limit;
            const countQuery = `SELECT COUNT(*) as total FROM offer_letters ${whereSql}`;
            const [[{ total }]] = await query(countQuery, params);
            const selectQuery = `SELECT * FROM offer_letters ${whereSql} ORDER BY createdAt DESC LIMIT ? OFFSET ?`;
            const [rows] = await query(selectQuery, [...params, limit, offset]);

            res.status(200).json({
                data: rows,
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                limit: limit
            });
        } else {
            const selectQuery = `SELECT * FROM offer_letters ${whereSql} ORDER BY createdAt DESC`;
            const [results] = await query(selectQuery, params);
            res.status(200).json(results);
        }
    } catch (error) {
        console.error('Failed to fetch offer letters:', error);
        res.status(500).send('Failed to fetch offer letters');
    }
};

// Get a single offer letter by ID
const getOfferLetterById = async (req, res) => {
  const { id } = req.params;

  try {
    const [results] = await query('SELECT * FROM offer_letters WHERE id = ?', [id]);
    if (results.length === 0) {
      return res.status(404).send('Offer letter not found');
    }
    res.status(200).json(results[0]);
  } catch (error) {
    console.error('Failed to fetch offer letter:', error);
    res.status(500).send('Failed to fetch offer letter');
  }
};

const updateOfferLetter = async (req, res) => {
    const { id } = req.params;
    const {
        name,
        address,
        phoneNumber,
        email,
        offerReleaseDate,
        joiningDate,
        designation,
        salary,
        probationPeriod,
        noticePeriod,
        confirmationNoticePeriod,
        jobResponsibilities,
        gender,
        signatory
    } = req.body;

    const updateSql = `
    UPDATE offer_letters 
    SET 
      name = ?,
      address = ?,
      phoneNumber = ?,
      email = ?,
      offerReleaseDate = ?,
      joiningDate = ?,
      designation = ?,
      salary = ?,
      probationPeriod = ?,
      noticePeriod = ?,
      confirmationNoticePeriod = ?,
      jobResponsibilities = ?,
      gender = ?,
      signatory = ?
    WHERE id = ?
  `;

    const values = [
        name,
        address,
        phoneNumber,
        email,
        new Date(offerReleaseDate).toISOString().split('T')[0],
        new Date(joiningDate).toISOString().split('T')[0],
        designation,
        salary,
        probationPeriod,
        noticePeriod,
        confirmationNoticePeriod,
        JSON.stringify(jobResponsibilities || []),
        gender || null,
        signatory || null,
        id
    ];

    try {
        const [results] = await query(updateSql, values);

        if (results.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Offer letter not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Offer letter updated successfully',
            data: { id, ...req.body }
        });
    } catch (error) {
        console.error('Failed to update offer letter:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update offer letter',
            error: error.message
        });
    }
};

// Update an internship offer by ID
const updateInternshipOffer = async (req, res) => {
    const { id } = req.params;
    const {
        name,
        email,
        gender,
        phoneNumber,
        address,
        position,
        startDate,
        endDate,
        stipend,
        mentorName,
        mentorContact,
        signatory,
        termsAndConditions
    } = req.body;

    const updateSql = `
    UPDATE internship_offers 
    SET 
      name = ?,
      email = ?,
      gender = ?,
      phoneNumber = ?,
      address = ?,
      position = ?,
      startDate = ?,
      endDate = ?,
      stipend = ?,
      mentorName = ?,
      mentorContact = ?,
      signatory = ?,
      termsAndConditions = ?
    WHERE id = ?
  `;

    const values = [
        name,
        email,
        gender || null,
        phoneNumber,
        address,
        position,
        new Date(startDate).toISOString().split('T')[0],
        new Date(endDate).toISOString().split('T')[0],
        stipend,
        mentorName,
        mentorContact,
        signatory || null,
        JSON.stringify(termsAndConditions || []),
        id
    ];

    try {
        const [results] = await query(updateSql, values);

        if (results.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Internship offer not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Internship offer updated successfully',
            data: { id, ...req.body }
        });
    } catch (error) {
        console.error('Failed to update internship offer:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update internship offer',
            error: error.message
        });
    }
};

// Download PDF by ID
const downloadPdf = async (req, res) => {
    const { id } = req.params;

    try {
        const [results] = await query('SELECT pdfPath FROM offer_letters WHERE id = ?', [id]);
        if (results.length > 0) {
            const pdfPath = results[0].pdfPath;
            res.sendFile(path.resolve(pdfPath));
        } else {
            res.status(404).send('PDF not found');
        }
    } catch (error) {
        console.error('Failed to get PDF path:', error);
        res.status(500).send('Failed to get PDF path');
    }
};

module.exports = {
    saveInternshipOffer,
    getOfferLetters,
    getOfferLetterById,
    updateOfferLetter,
    updateInternshipOffer,
    downloadPdf
};
