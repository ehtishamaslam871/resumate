const mongoose = require('mongoose');

const connectDB = async () => {
  const primaryUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/resumate';
  const fallbackUri = process.env.MONGODB_FALLBACK_URI || 'mongodb://127.0.0.1:27017/resumate';

  try {
    const conn = await mongoose.connect(primaryUri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    const isAuthFailure = error?.code === 8000 || /Authentication failed/i.test(error?.message || '');

    // In development, a local DB fallback prevents crash loops when Atlas creds are stale.
    if (process.env.NODE_ENV !== 'production' && isAuthFailure && primaryUri !== fallbackUri) {
      try {
        console.warn('⚠️ MongoDB auth failed for MONGODB_URI. Trying local fallback URI...');
        const fallbackConn = await mongoose.connect(fallbackUri);
        console.log(`✅ MongoDB Connected (fallback): ${fallbackConn.connection.host}/${fallbackConn.connection.name}`);
        return fallbackConn;
      } catch (fallbackError) {
        console.error('❌ MongoDB fallback connection failed:', fallbackError.message);
      }
    }

    if (error?.code === 8000 || /Authentication failed/i.test(error?.message || '')) {
      console.error('❌ MongoDB auth failed: check DB username/password in backend/.env (MONGODB_URI).');
    } else if (/ENOTFOUND|querySrv/i.test(error?.message || '')) {
      console.error('❌ MongoDB DNS error: verify Atlas cluster host in MONGODB_URI and internet/DNS access.');
    } else if (/IP|whitelist|timed out|ECONNREFUSED|server selection/i.test(error?.message || '')) {
      console.error('❌ MongoDB network access issue: add current public IP in Atlas Network Access.');
    }
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;

