require('dotenv').config();
const mongoose = require('mongoose');
const Message = require('./model/Message')

async function run() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.TEACHMATE_DATABASE_URL);

    console.log("Updating documents...");
    const result = await Message.updateMany(
      { deletedFor: { $exists: false } },
      { $set: { deletedFor: [] } }
    );


    console.log(`Done! Updated ${result.modifiedCount} messages.`);
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

run();
