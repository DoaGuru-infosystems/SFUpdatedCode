
const Employee = require('../models/employeeModel'); // Assuming you have a model
const generatePDF = require('../utils/pdfGenerator');

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
exports.saveIntran = async (req, res) => {
  const { name, designation, joining_date, resignation_date } = req.body;
  const employeeData = [name, designation, joining_date, resignation_date];
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
