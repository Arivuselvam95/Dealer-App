import express from 'express';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { connectToDatabase, getCollection } from './mongodb.js';
import dotenv from 'dotenv';
import { ObjectId } from 'mongodb';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;


app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(express.json({ limit: '10mb' }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Email configuration with better error handling
const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error('Email credentials are not configured in environment variables');
    return null;
  }
  return nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

let transporter = createTransporter();

// Verify email configuration
const verifyEmailConfig = async () => {
  if (!transporter) {
    return false;
  }
  try {
    await transporter.verify();
    console.log('Email configuration is valid');
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    return false;
  }
};

// Password reset endpoint with better error handling
app.post('/api/forgot-password', async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ message: 'Username is required' });
  }

  // Verify email configuration first
  const isEmailConfigValid = await verifyEmailConfig();
  if (!isEmailConfigValid) {
    return res.status(500).json({ 
      message: 'Email service is not configured properly. Please contact administrator.' 
    });
  }
  try {
    const usersCollection = getCollection('users_data');
    const user = await usersCollection.findOne({ username });

    if (!user || !user.email) {
      return res.status(404).json({ 
        message: 'No user found with this username or email not configured' 
      });
    }
    if(user.status === 'inactive'){
      return res.status(404).json({ 
        message: 'User is inactive. Cannot access forget-password' 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour

    // Update user with reset token
    await usersCollection.updateOne(
      { username },
      {
        $set: {
          resetPasswordToken: resetToken,
          resetPasswordExpires: new Date(resetTokenExpiry)
        }
      }
    );

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Email content
    const mailOptions = {
      from: {
        name: 'Titan Dealer App Support',
        address: process.env.EMAIL_USER
      },
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hello,</p>
          <p>You have requested to reset your password. Click the button below to proceed:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #4CAF50; 
                      color: white; 
                      padding: 12px 25px; 
                      text-decoration: none; 
                      border-radius: 5px; 
                      display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>If you didn't request this reset, please ignore this email.</p>
          <p>This link will expire in 1 hour.</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply.</p>
        </div>
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.json({
      message: 'Password reset email sent successfully',
      email: user.email.replace(/(.{2})(.*)(?=@)/, (_, a, b) => a + '*'.repeat(b.length))
    });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      message: 'Failed to send password reset email',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Register new user in admin page
app.post('/api/register-user', async (req, res) => {
  const { username, email, status } = req.body;

  if (!username || !email) {
    return res.status(400).json({ message: 'Username and email are required' });
  }

  try {
    // Generate a random secure password
    const generateRandomPassword = () => {
      const length = 8;
      const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
      return Array.from(crypto.randomFillSync(new Uint8Array(length)))
        .map((n) => charset[n % charset.length])
        .join('');
    };

    const password = generateRandomPassword();

    const usersCollection = getCollection('users_data');
    await usersCollection.insertOne({ username, password, email, status: status || 'active' });

    // Send email with username and password
    const isEmailConfigValid = await verifyEmailConfig();
    if (!isEmailConfigValid) {
      return res.status(500).json({
        message: 'Email service is not configured properly. Please contact administrator.',
      });
    }

    const mailOptions = {
      from: {
        name: 'Titan Dealer App Support',
        address: process.env.EMAIL_USER,
      },
      to: email,
      subject: 'Welcome to Titan Dealer App!',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to Titan Dealer App!</h2>
          <p>Hello Dealer,</p>
          <p>Your account has been successfully created. Below are your login credentials:</p>
          <ul>
            <li><strong>Username:</strong> ${username}</li>
            <li><strong>Password:</strong> ${password}</li>
          </ul>
          <p>Please keep these credentials secure and do not share them with anyone.</p>
          <p>To login, visit: <a href="${process.env.FRONTEND_URL}/login">${process.env.FRONTEND_URL}/login</a></p>
          <p>If you did not request this account, please contact support immediately.</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({ message: 'User registered successfully, login credentials have been emailed.' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Failed to register user' });
  }
});


// Reset Password endpoint
app.post('/api/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ message: 'Token and new password are required' });
  }

  try {
    const usersCollection = getCollection('users_data');
    const user = await usersCollection.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ 
        message: 'Password reset token is invalid or has expired' 
      });
    }

    // Update password and clear reset token fields
    await usersCollection.updateOne(
      { resetPasswordToken: token },
      {
        $set: { password: newPassword },
        $unset: { resetPasswordToken: "", resetPasswordExpires: "" }
      }
    );

    res.json({ message: 'Password has been reset successfully' });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      message: 'Failed to reset password',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// incidents management
app.post('/api/incidents', async (req, res) => {
  const incident = req.body;

  if (!incident.dealerCode || !incident.issue || !incident.email) {
    return res.status(400).json({ message: 'Dealer code, issue, and email are required.' });
  }

  try {
    const incidentsCollection = getCollection('incidents'); // Ensure this connects to the "incidents" collection
    const result = await incidentsCollection.insertOne(incident);

    res.status(201).json({ 
      message: 'Incident reported successfully.', 
      incidentId: result.insertedId 
    });
  } catch (error) {
    console.error('Error saving incident:', error);
    res.status(500).json({ message: 'Failed to save incident.', error: error.message });
  }
});

// Fetch incidents from the MongoDB collection
app.get('/api/get-incidents', async (req, res) => {
  try {
    const incidentsCollection = getCollection('incidents');
    const incidents = await incidentsCollection.find({}).toArray();
    // console.log(incidents);
    res.status(200).json(incidents);
  } catch (error) {
    console.error('Error fetching incidents:', error);
    res.status(500).json({ error: 'Failed to fetch incidents' });
  }
});

//register new user in admin page
app.post('/api/register-user', async (req, res) => {
  const { username, password, email, status } = req.body;
  if (!username || !password || !email) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const usersCollection = getCollection('users_data');
    await usersCollection.insertOne({ username, password, email, status: status || 'active' });
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Failed to register user' });
  }
});

//get users_data in admin
app.get('/api/get-users', async (req, res) => {
  try {
    const usersCollection = getCollection('users_data');
    const users = await usersCollection.find({}).toArray();
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Reset Password for a User (Admin only)
app.post('/api/admin-reset-password', async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ message: 'Username is required' });
  }

  try {
    const usersCollection = getCollection('users_data');
    const user = await usersCollection.findOne({ username });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate a new random password
    const generateRandomPassword = () => {
      const length = 8;
      const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
      return Array.from(crypto.randomFillSync(new Uint8Array(length)))
        .map((n) => charset[n % charset.length])
        .join('');
    };

    const newPassword = generateRandomPassword();

    // Update user's password
    await usersCollection.updateOne(
      { username },
      { $set: { password: newPassword } }
    );

    // Send email with the new password
    const isEmailConfigValid = await verifyEmailConfig();
    if (!isEmailConfigValid) {
      return res.status(500).json({
        message: 'Email service is not configured properly. Please contact administrator.',
      });
    }

    const mailOptions = {
      from: {
        name: 'Titan Dealer App Support',
        address: process.env.EMAIL_USER,
      },
      to: user.email,
      subject: 'Password Reset by Admin',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset</h2>
          <p>Hello Dealer,</p>
          <p>Your password has been reset by the administrator. Below are your new login credentials:</p>
          <ul>
            <li><strong>Username:</strong> ${username}</li>
            <li><strong>Password:</strong> ${newPassword}</li>
          </ul>
          <p>Please change this password after logging in for security reasons.</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Password reset successfully. New password sent to the user.' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
});

//update users_data status in admin 
app.put('/api/update-user-status', async (req, res) => {
  const { username, status } = req.body;

  if (!username || !status) {
    return res.status(400).json({ message: 'Username and status are required' });
  }

  try {
    const usersCollection = getCollection('users_data');
    await usersCollection.updateOne(
      { username },
      { $set: { status } }
    );
    res.status(200).json({ message: 'Status updated successfully' });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Failed to update user status' });
  }
});

// Delete an incident by ID
app.delete('/api/delete-incident/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const incidentsCollection = getCollection('incidents');
    const result = await incidentsCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    res.status(200).json({ message: 'Incident deleted successfully' });
  } catch (error) {
    console.error('Error deleting incident:', error);
    res.status(500).json({ message: 'Failed to delete incident', error: error.message });
  }
});

//updating incident checked or unchecked
app.put('/api/update-incident/:id', async (req, res) => {
  const { id } = req.params;
  const { checked } = req.body;

  try {
    const incidentsCollection = getCollection('incidents');
    const result = await incidentsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { checked } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    res.status(200).json({ message: 'Incident status updated successfully' });
  } catch (error) {
    console.error('Error updating incident status:', error);
    res.status(500).json({ message: 'Failed to update status', error: error.message });
  }
});


// existing login endpoint
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const usersCollection = getCollection('users_data');
    const user = await usersCollection.findOne({ username, password });
    if (user && user.status === 'active') {
      // console.log(user);
      const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.json({ success: true, token });
    } else if(user && user.status==='inactive'){
      res.status(401).json({ success: false, message: 'Username is inactive.' });
    }
     else {
      res.status(401).json({ success: false, message: 'Invalid username or password' });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// connection to database
connectToDatabase()
  .then(async () => {
    await verifyEmailConfig();
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
