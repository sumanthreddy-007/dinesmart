import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const test = async () => {
  await mongoose.connect('mongodb://localhost:27017/dinesmart');
  console.log('Connected');

  const Restaurant = mongoose.connection.collection('restaurants');
  let res = await Restaurant.findOne({});
  if(!res) {
    const r = await Restaurant.insertOne({ name: 'TestRes', isActive: true, tables: 5 });
    res = { _id: r.insertedId };
  }

  const User = mongoose.connection.collection('users');
  let user = await User.findOne({ email: 'teststaff3@test.com' });
  if(!user) {
    const hash = await bcrypt.hash('123', 10);
    const u = await User.insertOne({ email: 'teststaff3@test.com', password: hash, role: 'staff', restaurantId: res._id });
    user = { _id: u.insertedId };
  } else {
    await User.updateOne({ _id: user._id }, { $set: { restaurantId: res._id } });
  }

  // now login
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'teststaff3@test.com', password: '123' })
  });
  const data = await loginRes.json();
  console.log('Login:', data.token ? 'Success' : data);

  const walkinRes = await fetch('http://localhost:5000/api/staff/walkin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + data.token },
    body: JSON.stringify({ guestName: 'John', partySize: 2, phone: '12345' })
  });
  console.log('Walkin:', await walkinRes.json());
  process.exit(0);
};
test();
