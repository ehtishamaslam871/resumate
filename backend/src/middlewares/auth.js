const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.authMiddleware = async (req, res, next) => {
  const header = req.headers.authorization;
  console.log('Auth check - Header:', header ? 'Present' : 'Missing');
  
  if (!header) {
    console.log('❌ No authorization header');
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = header.split(' ')[1];
  console.log('Token:', token ? token.substring(0, 20) + '...' : 'invalid format');
  
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token verified, user ID:', payload.id);
    
    const user = await User.findById(payload.id);
    if (!user) {
      console.log('❌ User not found in DB');
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    req.user = { id: user._id, role: user.role };
    console.log('✅ Auth successful for user:', user._id);
    next();
  } catch (err) {
    console.log('❌ Token verification failed:', err.message);
    res.status(401).json({ message: 'Unauthorized', error: err.message });
  }
};
