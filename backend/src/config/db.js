const mongoose = require('mongoose');

const connectDB = async () => {
  const primaryUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/resumate';
  const fallbackUri = process.env.MONGODB_FALLBACK_URI || 'mongodb://127.0.0.1:27017/resumate';
  const isDev = process.env.NODE_ENV !== 'production';

  const connectOptions = {
    serverSelectionTimeoutMS: isDev ? 8000 : 15000,
  };

  try {
    const conn = await mongoose.connect(primaryUri, connectOptions);
    console.log(` MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    const isAuthFailure = error?.code === 8000 || /Authentication failed/i.test(error?.message || '');
    const isDnsOrNetworkFailure = /ENOTFOUND|querySrv|queryTxt|ETIMEOUT|ECONNREFUSED|server selection timed out|timed out/i.test(error?.message || '');
    const shouldTryFallback = isDev && primaryUri !== fallbackUri && (isAuthFailure || isDnsOrNetworkFailure);

    // In development, local fallback prevents crash loops when Atlas is unreachable.
    if (shouldTryFallback) {
      try {
        console.warn(' Primary MongoDB connection failed. Trying local fallback URI...');
        const fallbackConn = await mongoose.connect(fallbackUri, connectOptions);
        console.log(` MongoDB Connected (fallback): ${fallbackConn.connection.host}/${fallbackConn.connection.name}`);
        return fallbackConn;
      } catch (fallbackError) {
        console.error(' MongoDB fallback connection failed:', fallbackError.message);
      }
    }

    if (error?.code === 8000 || /Authentication failed/i.test(error?.message || '')) {
      console.error(' MongoDB auth failed: check DB username/password in backend/.env (MONGODB_URI).');
    } else if (/ENOTFOUND|querySrv/i.test(error?.message || '')) {
      console.error(' MongoDB DNS error: verify Atlas cluster host in MONGODB_URI and internet/DNS access.');
    } else if (/IP|whitelist|timed out|ECONNREFUSED|server selection/i.test(error?.message || '')) {
      console.error(' MongoDB network access issue: add current public IP in Atlas Network Access.');
    }
    console.error(' MongoDB Connection Error:', error.message);
    throw error;
  }
};

module.exports = connectDB;

