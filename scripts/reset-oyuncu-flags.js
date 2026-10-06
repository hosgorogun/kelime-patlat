import mongoose from 'mongoose';

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/kelime_patlat');
  const res = await mongoose.connection.collection('users').updateOne(
    { username: 'oyuncu' },
    {
      $set: {
        'progress.welcomeRewardClaimed': false,
        'progress.loginDaysCount': 0,
        'progress.lastLoginDay': ''
      }
    }
  );
  console.log('Reset count:', res.modifiedCount);
  await mongoose.disconnect();
}

run().catch(console.error);
