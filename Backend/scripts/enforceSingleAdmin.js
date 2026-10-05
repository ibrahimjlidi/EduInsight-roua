require("dotenv").config();
const mongoose = require("mongoose");

const KEEP_ADMIN_EMAIL = "admin@eduinsight.com";

const enforceSingleAdmin = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing. Add it to Backend/.env before running this command.");
  }

  await mongoose.connect(process.env.MONGO_URI);
  const users = mongoose.connection.collection("users");
  const keeper = await users.findOne({
    email: KEEP_ADMIN_EMAIL,
    role: "admin",
    isActive: { $ne: false },
  });

  if (!keeper) {
    throw new Error(`Active admin account ${KEEP_ADMIN_EMAIL} was not found. No accounts were changed.`);
  }

  const result = await users.updateMany(
    { role: "admin", _id: { $ne: keeper._id } },
    { $set: { isActive: false } }
  );
  await users.updateOne({ _id: keeper._id }, { $set: { isActive: true } });
  await users.createIndex(
    { role: 1, isActive: 1 },
    {
      unique: true,
      partialFilterExpression: { role: "admin", isActive: true },
      name: "unique_active_admin",
    }
  );

  console.log(`Kept ${KEEP_ADMIN_EMAIL} as the only active admin.`);
  console.log(`Deactivated ${result.modifiedCount} other admin account(s); their records were preserved.`);
};

enforceSingleAdmin()
  .catch((error) => {
    console.error("Could not enforce a single active admin:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
