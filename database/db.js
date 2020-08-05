const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        useUnifiedTopology: true,
        useFindAndModify: false
      },
      err => {
        if (err) {
          console.log('database does not connected')
          throw err;
        }
        console.log('database connected');
      });

  } catch (e) {
    console.error(e);
    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;



