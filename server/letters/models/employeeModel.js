const db = require('../Config/DB');

exports.saveEmployee = async (employeeData) => {
  const query = `INSERT INTO experincel (name, designation, joining_date, resignation_date, gender, signatory) VALUES (?, ?, ?, ?, ?, ?)`;
  console.log(employeeData, 'model');
  const [result] = await db.query(query, employeeData);
  return result;
};

exports.getEmployeeById = async (employeeId) => {
  const query = 'SELECT * FROM experincel WHERE id = ?'; // Adjust table name and fields if necessary
  const [result] = await db.query(query, [employeeId]);
  if (result.length === 0) {
    return null; // No employee found
  }
  return result[0];
};
