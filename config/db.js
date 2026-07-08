const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log('✅ MongoDB Connected!');
    
    // Seed default admin user
    const User = require('../models/user.Model');
    const hash = require('../utils/hash');
    
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      const hashedPassword = await hash.hashPassword('Admin@123');
      const defaultAdmin = new User({
        name: 'Super Admin',
        username: 'admin',
        email: 'admin@streamflow.com',
        password: hashedPassword,
        role: 'admin'
      });
      await defaultAdmin.save();
      console.log('✅ Default Admin User Created (Username: admin | Password: Admin@123)');
    }

  } catch (err) {
    console.error('❌ MongoDB Connection Failed:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;