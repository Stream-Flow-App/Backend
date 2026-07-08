const mongoose = require('mongoose');
const User = require('./models/user.Model');

async function test() {
  await mongoose.connect('mongodb://localhost:27017/stream_flow');
  
  const users = await User.find({}).select("+email +password +profileImg");
  console.log("All users:");
  users.forEach(u => console.log(`- username: ${u.username}, profileImg: "${u.profileImg}"`));
  
  mongoose.disconnect();
}

test().catch(console.error);
