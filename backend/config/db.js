import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const hello = await mongoose.connection.db.admin().command({ hello: 1 });

    if (!hello.setName && !hello.msg?.includes("isdbgrid")) {
      throw new Error(
        "MongoDB Change Streams require a replica set or sharded cluster. Configure a replica set before starting ChronoMesh."
      );
    }

    console.log("MongoDB connected successfully");
    console.log("Database:", mongoose.connection.name);
    console.log("MongoDB topology:", hello.setName ? "Replica set" : "Sharded cluster");
  } catch (error) {
    console.error("MongoDB startup failed:", error.message);
    await mongoose.disconnect().catch(() => {});
    throw error;
  }
};

export default connectDB;