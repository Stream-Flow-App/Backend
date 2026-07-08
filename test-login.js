const mongoose = require('mongoose');
const User = require('./models/user.Model');

async function test() {
  await mongoose.connect('mongodb://localhost:27017/stream_flow');
  const user = await User.findOne({ email: 'zackriverdev@gmail.com' });
  console.log("User:", user);
  mongoose.disconnect();
}
test();
