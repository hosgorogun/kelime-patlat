import { connectDb, UserModel } from "../server/db";

async function main() {
  await connectDb();
  const users = await UserModel.find({}).lean();
  console.log(`Found ${users.length} users in DB`);
  for (const u of users) {
    console.log(`User: ${u.openId} | Name: ${u.name} | Role: ${u.role}`);
    console.log(`Progress keys:`, Object.keys(u.progress || {}));
    console.log(`Progress.matchHistory length:`, (u.progress?.matchHistory || []).length);
    if (u.progress?.matchHistory?.length) {
      console.log(`Sample matchHistory:`, JSON.stringify(u.progress.matchHistory.slice(0, 3), null, 2));
    }
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
