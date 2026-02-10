const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  console.log('Testing MongoDB Connection...');
  console.log('URI:', process.env.MONGODB_URI.replace(/:[^:]*@/, ':***@'));
  
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected Successfully!');
    console.log('Connected to:', mongoose.connection.host);
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection Error:', error.message);
    console.error('Full Error:', error);
    process.exit(1);
  }
}

testConnection();
