import { connectDb, UserModel } from "../server/db";
import { backfillMatchHistoryIfEmpty, DEFAULT_PROGRESS } from "../shared/progression";

async function main() {
  await connectDb();
  const users = await UserModel.find({});
  console.log(`Checking ${users.length} users in DB for match history backfill...`);
  let updatedCount = 0;
  for (const user of users) {
    if (user.progress && (!Array.isArray(user.progress.matchHistory) || user.progress.matchHistory.length === 0)) {
      const fullProg = { ...DEFAULT_PROGRESS, ...user.progress };
      const backfilled = backfillMatchHistoryIfEmpty(fullProg);
      if (backfilled.length > 0) {
        user.progress.matchHistory = backfilled;
        user.markModified("progress");
        user.updatedAt = new Date();
        await user.save();
        updatedCount++;
        console.log(`[Backfilled] ${user.name || user.openId} got ${backfilled.length} match history entries.`);
      }
    }
  }
  console.log(`Total users backfilled: ${updatedCount}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
