import { Router } from 'express';
import nodemailer from 'nodemailer';

const router = Router();

// Configure the email transporter using Gmail App Password
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

router.post('/send-welcome', async (req: any, res: any) => {
  const { email, name } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // If credentials are missing in env, just log to console (useful for dev)
    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
      console.log('----------------------------------------');
      console.log(`[Email Mock] Sending Welcome Email to: ${email}`);
      console.log(`Subject: Welcome to Pathforge!`);
      console.log(`Hello ${name}, thanks for verifying your account!`);
      console.log('----------------------------------------');
      return res.json({ success: true, mocked: true });
    }

    const mailOptions = {
      from: `"Pathforge" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to Pathforge! 🚀',
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h1 style="color: #0052cc;">Welcome to Pathforge, ${name}!</h1>
          <p>We're thrilled to have you onboard.</p>
          <p>Your account is fully verified and you are ready to start building your career roadmap.</p>
          <p>If you have any questions, feel free to reply to this email.</p>
          <br/>
          <p>Best regards,<br/>The Pathforge Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true });
  } catch (error) {
    console.error('Error sending welcome email:', error);
    res.status(500).json({ error: 'Failed to send welcome email' });
  }
});

export default router;
