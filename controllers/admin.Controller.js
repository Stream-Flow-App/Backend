const User = require("../models/user.Model");
const hash = require("../utils/hash");

exports.getUsers = async function (req, res) {
  try {
    const { search = '', page = 1, limit = 10 } = req.query;
    
    let query = {
      _id: { $ne: req.user._id } // Exclude the current logged-in user
    };
    
    if (req.user.role === 'moderator') {
      // Moderators cannot see admins
      query.role = { $ne: 'admin' };
    }
    
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(query).skip(skip).limit(limitNum).lean(),
      User.countDocuments(query)
    ]);

    res.status(200).json({
      users,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      totalUsers: total
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load users!" });
  }
};

exports.getUser = async function (req, res) {
  try {
    const username = req.params.username;
    if (!username) {
      return res.status(400).json({ message: "username is required!" });
    }

    const user = await User.findOne({ username }).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }
    res.status(200).json({
      user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.createUser = async function (req, res) {
  try {
    const { name, username , email, phone, password } = req.body;

    if (!name || !email || !password || !username ) {
      return res.status(400).json({ message: "Name, Username , Email, and Password are required!" });
    }

    const normalizedEmail = email.toLowerCase();

    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({ message: "Email or Username already in use!" });
    }

    const hashedPassword = await hash.hashPassword(password);

    const newUser = new User({
      name,
      username,
      email: normalizedEmail,
      phone,
      password: hashedPassword
    });

    await newUser.save();

    // Never return password
    const { password: _, ...safeUser } = newUser.toObject();

    res.status(201).json({
      message: "User Created Successfully!",
      user: safeUser
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.updateUser = async function (req, res) {
  try {
    const currentusername = req.params.username;
    const { name, username, phone, profileImg, password, role } = req.body;

    const user = await User.findOne({ username: currentusername }).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User Not Found" });
    }

    if (name) user.name = name;

    if (username && username !== currentusername) {
      const matchusername = await User.findOne({ username });
      if (matchusername) {
        return res.status(400).json({ message: "username already used!" });
      }
      user.username = username;
    }

    if (phone) user.phone = phone;
    if (profileImg) user.profileImg = profileImg;

    if (password) {
      const hashedPassword = await hash.hashPassword(password);
      user.password = hashedPassword;
    }

    if (role) user.role = role;

    await user.save();

    const { password: _, ...safeUser } = user.toObject();

    res.status(200).json({
      message: "User Updated Successfully",
      user: safeUser
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.deactivateUser = async function (req, res) {
  try {
    const username = req.params.username;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    user.isActive = false;
    await user.save();

    res.status(200).json({ message: "User deactivated successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.updateUserBan = async function (req, res) {
  try {
    const username = req.params.username;
    const { durationHours } = req.body; // duration in hours, or 'forever', or null/0 to unban

    const targetUser = await User.findOne({ username });
    if (!targetUser) {
      return res.status(404).json({ message: "User not found!" });
    }

    // Moderators cannot ban admins or other moderators
    if (req.user.role === 'moderator' && ['admin', 'moderator'].includes(targetUser.role)) {
      return res.status(403).json({ message: "You cannot ban this user." });
    }

    if (durationHours === 'forever') {
      targetUser.isActive = false;
      targetUser.bannedUntil = new Date('2099-12-31');
    } else if (!durationHours || durationHours === 0) {
      targetUser.isActive = true;
      targetUser.bannedUntil = null;
    } else {
      const banEnd = new Date();
      banEnd.setHours(banEnd.getHours() + parseInt(durationHours, 10));
      targetUser.bannedUntil = banEnd;
      targetUser.isActive = true; // Still active, just temporarily suspended
    }

    await targetUser.save();
    res.status(200).json({ message: "User ban status updated.", user: targetUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.updateUserRole = async function (req, res) {
  try {
    const username = req.params.username;
    const { role } = req.body;

    if (!['user', 'moderator', 'admin'].includes(role)) {
      return res.status(400).json({ message: "Invalid role." });
    }

    const targetUser = await User.findOne({ username });
    if (!targetUser) {
      return res.status(404).json({ message: "User not found!" });
    }

    targetUser.role = role;
    await targetUser.save();

    res.status(200).json({ message: "User role updated successfully.", user: targetUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};