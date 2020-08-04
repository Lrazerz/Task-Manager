const jwt = require('jsonwebtoken');
const UserModel = require('../models/User');
const config = require('config');

const authMiddleware = async (req,res,next) => {
  try {
    // Get only token string from header
    const token = req.header('Authorization').replace('Bearer ','');
    // Try to verify token
    const decryptedToken = await jwt.verify(token, config.get('jwtSecret'));
    const user = await UserModel.findOne({_id: decryptedToken._id, 'tokens.token': token});
    if(!user) {
      throw new Error();
    }
    req.user = user;
    next();
  } catch (e) {
    res.status(401).json({errors: [{msg: 'Authorization failed'}]})
  }
};

module.exports = authMiddleware;