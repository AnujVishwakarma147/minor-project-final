import mongoose from "mongoose";
import { config } from "dotenv";
config();

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not configured");
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("MongoDB Connected Successfully");
};

export default connectDB;
