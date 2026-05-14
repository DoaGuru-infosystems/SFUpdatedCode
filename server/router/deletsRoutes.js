const express = require("express");
const router = express.Router();
const { 
   deleteProject,
   deleteCategory,
   removeUser,
   
   } = require("../controller/deleteControler");


// Route to delete a projects
router.post('/api/delete-projects', deleteProject);
//Route for Delete Category 
router.post('/api/delete-categorys', deleteCategory);

//Route for delete user Employee 
router.delete('/api/delete-employee/:id', removeUser);



module.exports = router;