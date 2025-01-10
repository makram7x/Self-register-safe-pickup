const express = require("express");
const router = express.Router();
const {
  getParentLinks,
  createLink,
  deleteLink,
  verifyLink,
  debugLinks,
  deleteAllLinks,
  getLinksByStudentCode,
} = require("../controller/parentStudentController");

router.delete("/delete-all", deleteAllLinks);
router.get("/verify/:uniqueCode", verifyLink);
router.get("/debug/:parentId", debugLinks); // Fixed debug route path
router.post("/", createLink);
router.get("/:parentId", getParentLinks);
router.delete("/:linkId", deleteLink);
router.get("/by-code/:uniqueCode", getLinksByStudentCode);

module.exports = router;
