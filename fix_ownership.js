const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/user.Model');
const Audio = require('./models/audio.Model');

async function fixOwnership() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const users = await User.find({});
  let updatedCount = 0;

  for (const user of users) {
    const trimmedUsername = user.username.trim();
    const normalizedUsernameChars = trimmedUsername.toLowerCase().replace(/\s+/g, '').split('');
    const regexPattern = '^\\s*' + normalizedUsernameChars.join('\\s*') + '\\s*$';
    const singerRegex = new RegExp(regexPattern, 'i');

    const matchingAudios = await Audio.find({ singer: singerRegex, uploadedBy: { $ne: user._id } });
    
    if (matchingAudios.length > 0) {
      console.log(`Found ${matchingAudios.length} songs for ${user.username}`);
      const audioIds = matchingAudios.map(a => a._id);
      
      await Audio.updateMany(
        { _id: { $in: audioIds } },
        { $set: { uploadedBy: user._id } }
      );
      
      if (user.role !== 'artist' && user.role !== 'admin' && user.role !== 'moderator') {
        user.role = 'artist';
        await user.save();
      }
      updatedCount += matchingAudios.length;
    }
  }

  console.log(`Total audios updated: ${updatedCount}`);
  process.exit(0);
}

fixOwnership();
