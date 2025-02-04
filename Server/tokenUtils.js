const jwt = require('jsonwebtoken');
const { jwtConfig } = require('./config');

// Function to generate JWT (Access Token)
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName
    },
    jwtConfig.jwtSecret,
    { expiresIn: jwtConfig.accessTokenExpiresIn }
  );
};
// Function to generate Refresh Token
const generateRefreshToken = (user) => {
  return jwt.sign(
    { userId: user._id, email: user.email },
    jwtConfig.jwtSecret,
    { expiresIn: jwtConfig.refreshTokenExpiresIn }
  );
};
// Export the functions
module.exports = {
  generateAccessToken,
  generateRefreshToken,
};
