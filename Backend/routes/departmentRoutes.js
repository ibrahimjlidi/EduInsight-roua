const express = require("express");
const router = express.Router();
const departmentController = require("../controllers/departmentController");
const protect = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/roleMiddleware");

router.post("/ajouter", protect, authorize(["admin"]), departmentController.ajouterDepartment);
router.get("/list", departmentController.listerDepartments);
router.get("/:id", departmentController.getDepartmentById);
router.put("/:id", protect, authorize(["admin"]), departmentController.updateDepartment);
router.delete("/:id", protect, authorize(["admin"]), departmentController.deleteDepartment);

module.exports = router;