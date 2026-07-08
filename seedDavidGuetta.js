const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const User = require('./models/user.Model');

dotenv.config();

const DB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/soundwave';

async function seedDavidGuetta() {
  try {
    console.log('Connecting to database:', DB_URI);
    await mongoose.connect(DB_URI);
    console.log('Connected.');

    const email = 'david.guetta@streamflow.com';
    const username = 'davidguetta';
    const password = 'davidguetta123';
    
    let user = await User.findOne({ username });
    if (user) {
      console.log('David Guetta user already exists, updating role and image...');
      user.role = 'artist';
      user.profileImg = 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/David_Guetta_at_Tomorrowland_2012_-_2.jpg/440px-David_Guetta_at_Tomorrowland_2012_-_2.jpg';
      await user.save();
      console.log('Updated.');
    } else {
      console.log('Creating David Guetta profile...');
      const hashedPassword = await bcrypt.hash(password, 12);
      
      user = new User({
        name: 'David Guetta',
        username: username,
        email: email,
        password: hashedPassword,
        role: 'artist',
        profileImg: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/David_Guetta_at_Tomorrowland_2012_-_2.jpg/440px-David_Guetta_at_Tomorrowland_2012_-_2.jpg'
      });
      
      await user.save();
      console.log('Created successfully.');
    }
  } catch (error) {
    console.error('Error seeding David Guetta:', error);
  } finally {
    mongoose.connection.close();
  }
}

seedDavidGuetta();
