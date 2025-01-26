const express = require('express');
const bcrypt = require('bcryptjs'); // For password hashing
const { User } = require('./userSchema'); // Assuming User model is in userSchema.js
const router = express.Router();
const jwt = require('jsonwebtoken');
const { generateAccessToken, generateRefreshToken } = require('./tokenUtils'); // Use the above functions

// Route to create a new user
router.post('/register', async (req, res) => {
  const { username, email, password, firstName, lastName, userId } = req.body;

  // Basic validation
  if (!username || !email || !password || !firstName || !lastName) {
    return res.status(400).json({ message: 'firstName, lastName, Username, email, and password are required.' });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email.' });
    }

    // Hash the password before saving it to the database
      const hashedPassword = await bcrypt.hash(password, 10); // 10 rounds of hashing
      
      // In case the userID is already passed in (e.x. log in with google)
      let newID = userId ? userId : 'custom-id-' + Math.random().toString(36).substring(2, 15);

    // Create a new user object
    const newUser = new User({
        firstName,
        lastName,
        username,
        email,
        password: hashedPassword, // Store the hashed password
        userId: newID, // Generate a random user_id (for testing)
    });

    // Save the new user to the database
    await newUser.save();
      
    // Generate tokens (access and optionally refresh token)
    const accessToken = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser); // Optional
    
    // Send the response with both the token and user details
    res.status(201).json({
        message: 'User created successfully',
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          isAdmin: newUser.isAdmin,  // Include admin role if necessary
        },
        tokens: {
          accessToken,
          refreshToken, // Include refreshToken only if you're using it
        },
      });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user. Please try again later.', details : error });
  }
});

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'; // Make sure to use a real secret key


// Route to sign in with username and password
router.post('/login/username-password', async (req, res) => {

    // "email": "testghging@gmail.com",
    // "password": "testingpassword"
    const { email, password } = req.body;
  
    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }
  
    try {
      // Check if the user exists
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }
  
      // Compare the entered password with the stored hashed password
      const isMatch = bcrypt.compare(password.trim(), user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials. Please check your email and password.'});
      }
  
        // Generate a JWT token (you can store this token client-side)
        // Generate access and refresh tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

    //   const token = jwt.sign(
    //     { userId: user._id, username: user.username },
    //     JWT_SECRET,
    //     { expiresIn: '1h' } // Token will expire in 1 hour
    //   );
  
      // Send success response with the token
    //   res.status(200).json({
    //     message: 'Login successful',
    //       token: {accessToken: accessToken, refreshToken: refreshToken},
    //     user: {
    //       id: user._id,
    //       username: user.username,
    //         email: user.email,
    //         firstName: user.firstName,
    //       lastName: user.lastName
    //     }
        //   });
        // Send the new tokens
    res.json({
        accessToken: accessToken,
        refreshToken: refreshToken,
      });
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({ message: 'Error during login. Please try again later.', details: error });
    }
  });
  
  // Route to sign in with Google login (assuming Google login passes a googleId)
  router.post('/login/google', async (req, res) => {
    const { googleId } = req.body;
  
    if (!googleId) {
      return res.status(400).json({ message: 'Google ID is required.' });
    }
  
    try {
      // Check if a user with the provided googleId exists
      const user = await User.findOne({ user_id: googleId });
      if (!user) {
        return res.status(404).json({ message: 'User not found with this Google ID.' });
      }
  
      // Generate a JWT token (you can store this token client-side)
      const token = jwt.sign(
        { userId: user._id, username: user.username },
        JWT_SECRET,
        { expiresIn: '1h' } // Token will expire in 1 hour
      );
  
      // Send success response with the token
      res.status(200).json({
        message: 'Google login successful',
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email
        }
      });
    } catch (error) {
      console.error('Error during Google login:', error);
      res.status(500).json({ message: 'Error during Google login. Please try again later.', details: error });
    }
  });

  // Route to refresh the access token using the refresh token
router.post('/refresh-token', async (req, res) => {
    const { refreshToken } = req.body;
  
    // Basic validation
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required.' });
    }
  
    try {
      // Verify the refresh token (you can add more checks here if necessary)
      const decoded = jwt.verify(refreshToken, JWT_SECRET); // This will decode the token and validate it
      
      // Check if the refresh token is expired
      if (!decoded || !decoded.userId) {
        return res.status(401).json({ message: 'Invalid or expired refresh token.' });
      }
  
      // Find the user based on the decoded user ID (from the refresh token)
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }
  
      // If the refresh token is valid, issue a new access token (and optionally a new refresh token)
      const newAccessToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user); // Optionally, issue a new refresh token
  
      // Send the new tokens back to the client
      res.json({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken, // Optional
      });
  
    } catch (error) {
      console.error('Error during token refresh:', error);
      res.status(500).json({ message: 'Error refreshing tokens. Please try again later.', details: error });
    }
  });

module.exports = router;
