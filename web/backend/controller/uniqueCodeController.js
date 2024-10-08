const Student = require('../models/studentSchema');

const generateUniqueCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let uniqueCode = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    uniqueCode += characters[randomIndex];
  }
  return uniqueCode;
};

const generateUniqueCodes = async (req, res) => {
  try {
    const students = await Student.find();
    for (const student of students) {
      const uniqueCode = generateUniqueCode();
      await Student.findByIdAndUpdate(
        student._id,
        { uniqueCode },
        { new: true }
      );
    }
    res.json({ message: 'Unique codes generated successfully' });
  } catch (error) {
    console.error('Error generating unique codes:', error);
    res.status(500).json({ error: 'An error occurred while generating unique codes' });
  }
};

module.exports = { generateUniqueCodes };



// const updateStudentUniqueCode = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { uniqueCode } = req.body;

//     // Check if the provided id is a valid ObjectId
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({ message: 'Invalid student id' });
//     }

//     const updatedStudent = await Student.findByIdAndUpdate(
//       id,
//       { uniqueCode },
//       { new: true }
//     );

//     if (!updatedStudent) {
//       return res.status(404).json({ message: 'Student not found' });
//     }

//     res.status(200).json(updatedStudent);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// };

// module.exports = { generateUniqueCodes };