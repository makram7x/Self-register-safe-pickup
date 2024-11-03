const User = require("../models/userSchema");

exports.createUser = async (req, res) => {
  try {
    console.log("Request body:", req.body);
    const { googleId, name, email, profilePicture } = req.body;

    let user = await User.findOne({ googleId });

    if (user) {
      return res.status(200).json(user);
    }

    user = new User({
      googleId,
      name,
      email,
      profilePicture,
    });

    await user.save();

    res.status(201).json(user);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
