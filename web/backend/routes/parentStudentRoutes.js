const express = require("express");
const router = express.Router();
const {
  getParentLinks,
  createLink,
  deleteLink,
  verifyLink,
  debugLinks,
} = require("../controller/parentStudentController");

router.get("/verify/:uniqueCode", verifyLink);
router.get("/debug/:parentId", debugLinks); // Fixed debug route path
router.post("/", createLink);
router.get("/:parentId", getParentLinks);
router.delete("/:linkId", deleteLink);

module.exports = router;
