
const { db } = require("../../config/db");

const queryHelper = (sql, values) => {
    return new Promise((resolve, reject) => {
        db.query(sql, values, (err, results) => {
            if (err) return reject(err);
            resolve([results]);
        });
    });
};

const Employee = {
    saveEmployee: async (employeeData) => {
        const query = `INSERT INTO experincel (name, designation, joining_date, resignation_date, gender, signatory) VALUES (?, ?, ?, ?, ?, ?)`;
        console.log(employeeData, 'model');
        const [result] = await queryHelper(query, employeeData);
        return result;
    },
    getEmployeeById: async (employeeId) => {
        const query = 'SELECT * FROM experincel WHERE id = ?';
        const [result] = await queryHelper(query, [employeeId]);
        if (result.length === 0) {
            return null;
        }
        return result[0];
    }
};
const generatePDF = require('../../utils/pdfGenerator');

exports.saveEmployee = async (req, res) => {
    const { name, designation, joining_date, resignation_date, gender, signatory } = req.body;
    const employeeData = [name, designation, joining_date, resignation_date, gender || null, signatory || null];
    console.log(employeeData);

    try {
        const result = await Employee.saveEmployee(employeeData);
        const insertedEmployeeId = result.insertId;
        res.status(200).json({ message: 'Employee saved successfully', employeeId: insertedEmployeeId });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Error saving employee data.', error: err });
    }
};

//intran Offerlete ke liye
exports.saveintern = async (req, res) => {
    const { name, designation, joining_date, resignation_date, gender, signatory } = req.body;
    const employeeData = [name, designation, joining_date, resignation_date, gender || null, signatory || null];
    console.log(employeeData);

    try {
        const result = await Employee.saveEmployee(employeeData);
        const insertedEmployeeId = result.insertId;
        res.status(200).json({ message: 'Employee saved successfully', employeeId: insertedEmployeeId });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Error saving employee data.', error: err });
    }
};

exports.generatePDF = async (req, res) => {
    const employeeId = req.params.employeeId;

    try {
        const employee = await Employee.getEmployeeById(employeeId);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        try {
            // Call the utility function to generate the PDF
            generatePDF(employee, res);
        } catch (error) {
            res.status(500).json({ message: 'Error generating PDF', error });
        }
    } catch (err) {
        return res.status(404).json({ message: 'Employee not found' });
    }
};
