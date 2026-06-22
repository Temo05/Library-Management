const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB დაკავშირებულია: ${conn.connection.host}`);
  } catch (error) {
    console.error(`შეცდომა ბაზასთან დაკავშირებისას: ${error.message}, ვცდილობთ თავიდან 2 წამში...`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return connectDB();
  }
};

module.exports = connectDB;
