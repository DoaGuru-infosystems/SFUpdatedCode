const {db} = require('../config/db')  



// Route to delete projects 
const deleteProject = (req, res) => {
  const { id } = req.body;
// console.log(id);
  const deleteData = `DELETE FROM projects WHERE id = ?`;

  db.query(deleteData, [id], (err, result) => {
    if (err) {
    
      return res.status(500).json({
        success: false,
        error: 'Project Not Delete Internal Server Error',
      });
    }
    
    return res.status(200).json({ message: 'Project Deleted Successfully' });
  });
};


// Route to delete category 

// const deleteCategory = (req, res) => {
//   const { id } = req.body;

//   // Pehle subcategories ko delete kiya
//   const deleteSubcategories = `DELETE FROM subcategory WHERE category_id = ?`;
  
//   db.query(deleteSubcategories, [id], (err, result) => {
//     if (err) {
//       return res.status(500).json({
//         success: false,
//         error: 'Subcategories Not Deleted: Internal Server Error',
//       });
//     }
    
//     // Uske baad category ko delete kiya
//     const deleteCategoryQuery = `DELETE FROM category WHERE id = ?`;
    
//     db.query(deleteCategoryQuery, [id], (err, result) => {
//       if (err) {
//         return res.status(500).json({
//           success: false,
//           error: 'Category Not Deleted: Internal Server Error',
//         });
//       }
      
//       return res.status(200).json({ message: 'Category and Related Subcategories Deleted Successfully' });
//     });
//   });
// };

const deleteCategory = (req, res) => {
  const { id } = req.body;
console.log(id);
  const deleteCData = `DELETE FROM category WHERE id = ?`;

  db.query(deleteCData, [id], (err, result) => {
    if (err) {
      // Error handling block
      return res.status(500).json({
        success: false,
        error: 'Category Not Delete Internal Server Error',
      });
    }
    
    // Success block
    return res.status(200).json({ message: 'Category  Deleted Successfully' });
  });
};

// Route to delete sub-category 

// Remove User

const removeUser = (req, res) => {
  const { id } = req.params;
  console.log("Delete request for user id:", id); // Debug log
  let removeEmployee = `DELETE FROM task_users WHERE id = ?`;

  db.query(removeEmployee, [id], (err, result) => {
    if (err) {
      console.error("DB Error while deleting employee:", err); // Debug log
      return res.status(500).json({ success: false, error: 'Employee Not Removed Internal Server Error', details: err });
    }
    if (result.affectedRows === 0) {
      // No user deleted (ID may not exist)
      return res.status(404).json({ success: false, error: 'No employee found with that ID.' });
    }
    return res.status(200).json({ message: 'Employee Removed' });
  });
}





module.exports = {
  deleteProject,
  deleteCategory,
  removeUser,

}