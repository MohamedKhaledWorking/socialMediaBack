import mongoose from "mongoose";

const database_connection = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Database connected");
  } catch (error) {
    console.log(`something went wrong with database ${error}`);
  }
};

export default database_connection;
