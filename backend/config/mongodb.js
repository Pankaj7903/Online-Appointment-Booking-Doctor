import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/prescripto`, {
      writeConcern: { w: "majority", wtimeout: 0 } // optional but safe
    });

    mongoose.connection.on('connected', () => {
      console.log("Database Connected");
    });

    mongoose.connection.on('error', (err) => {
      console.error("Database connection error:", err);
    });

  } catch (error) {
    console.error("Failed to connect to database:", error);
    process.exit(1);
  }
};

export default connectDB;
