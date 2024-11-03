const mongoose = require("mongoose");

const parentStudentLinkSchema = new mongoose.Schema(
  {
    parentId: {
      type: String,
      required: [true, "Parent ID is required"],
    },
    studentInfo: {
      uniqueCode: {
        type: String,
        required: [true, "Student unique code is required"],
      },
      name: {
        type: String,
        required: [true, "Student name is required"],
      },
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Clear existing model if it exists
if (mongoose.models.ParentStudentLink) {
  delete mongoose.models.ParentStudentLink;
}

// Add the new index structure
parentStudentLinkSchema.index(
  {
    parentId: 1,
    "studentInfo.uniqueCode": 1,
  },
  {
    unique: true,
    name: "unique_parent_student",
  }
);

const ParentStudentLink = mongoose.model(
  "ParentStudentLink",
  parentStudentLinkSchema
);

module.exports = ParentStudentLink;
