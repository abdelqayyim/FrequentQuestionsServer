const express = require('express');
const bcrypt = require('bcryptjs'); // For password hashing
const { User } = require('./userSchema'); // Assuming User model is in userSchema.js
const router = express.Router();
const jwt = require('jsonwebtoken');
const { generateAccessToken, generateRefreshToken } = require('./tokenUtils'); // Use the above functions

// Route to create a new user
router.post('/register', async (req, res) => {
  const { username, email, password, firstName, lastName, userId, profilePicture } = req.body;

  // Basic validation
  if (!username || !email || !firstName || !lastName) {
    return res.status(400).json({ message: 'firstName, lastName, Username, email, and password are required.' });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email.' });
    }

    // Hash the password before saving it to the database
    //   let hashedPassword;
    //   if (password) {
    //     hashedPassword = await bcrypt.hash(password.trim(), 10); // 10 rounds of hashing
    //   }
      
       // Generate a new userId if not passed or if invalid
    let newID = userId ? userId : 'custom-id-' + Math.random().toString(36).substring(2, 15);

    // Ensure userId is unique and valid (check if this userId already exists)
    const existingUserId = await User.findOne({ userId: newID });
    if (existingUserId) {
      // If the generated userId already exists, generate a new one
      newID = 'custom-id-' + Math.random().toString(36).substring(2, 15);
    }

    // Create a new user object
    const newUser = new User({
        firstName,
        lastName,
        username,
        email,
        // ...(hashedPassword != null && { password: hashedPassword }), // Store the hashed password
        password,
        userId: newID, // Generate a random userId (for testing)
        profilePicture
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
            userId: newUser.userId,
          username: newUser.username,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
            isAdmin: newUser.isAdmin,  // Include admin role if necessary
            profilePicture: newUser.profilePicture
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
router.post('/checkUser', async (req, res) => {
    const { userId } = req.body;

    // Validate input
    if (!userId) {
        return res.status(400).json({ message: 'userId is required.' });
    }

    try {
        // Check if user exists
        const user = await User.findOne({ userId });

        if (user) {
            // Generate tokens (access and optionally refresh token)
            const accessToken = generateAccessToken(user);
            const refreshToken = generateRefreshToken(user); // Optional

            return res.status(200).json({
                exists: true,
                message: 'User exists.',
                user: {
                    userId: user.userId,
                    username: user.username,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    isAdmin: user.isAdmin, // Include admin role if necessary
                    profilePicture: user.profilePicture
                },
                tokens: {
                    accessToken,
                    refreshToken, // Include refreshToken only if you're using it
                }
            });
        } else {
            return res.status(200).json({ exists: false, message: 'User not found.' });
        }
    } catch (error) {
        console.error('Error checking user:', error);
        res.status(500).json({ message: 'Internal server error.', details: error });
    }
});

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'; // Make sure to use a real secret key

// Route to sign in with username and password
router.post('/login/username-password', async (req, res) => {
    const { username, password } = req.body;

    // Basic validation
    if (!username || !password) {
      return res.status(400).json({ message: 'username and password are required.' });
    }

    try {
      // Check if the user exists
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(404).json({ message: 'User with that username does not exist.' });
      }

      // Compare the entered password with the stored hashed password
        let trimmedPassword = password.trim();
      const isMatch = await bcrypt.compare(trimmedPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid password. Try again.'});
      }

        // Generate a JWT token (you can store this token client-side)
        // Generate access and refresh tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        res.json({
            user: {
                userId: user.userId,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                isAdmin: user.isAdmin, // Include admin role if necessary
                profilePicture: user.profilePicture
            },
            tokens: {
                accessToken,
                refreshToken, // Include refreshToken only if you're using it
            }
        });
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({ message: 'Error during login. Please try again later.', details: error });
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
      // Verify the refresh token
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
      // const newRefreshToken = generateRefreshToken(user); // Optionally, issue a new refresh token
  
      // Send the new tokens back to the client
      res.json({
        accessToken: newAccessToken,
        // refreshToken: newRefreshToken, // Optional
      });
  
    } catch (error) {
      console.error('Error during token refresh:', error);
      res.status(500).json({ message: 'Error refreshing tokens. Please try again later.', details: error });
    }
  });

module.exports = router;
