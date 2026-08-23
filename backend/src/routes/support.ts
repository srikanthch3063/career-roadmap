import express from 'express';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

// Setup Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, email, topic, problem } = req.body;
    
    if (!name || !email || !topic || !problem) {
      return res.status(400).json({ error: 'missing fields' });
    }
    
    if (problem.length > 500) {
      return res.status(400).json({ error: 'problem exceeds 500 characters' });
    }

    // 1. Insert into database
    const { error: dbError } = await supabase
      .from('support_tickets')
      .insert([
        { name, email, topic, problem }
      ]);
      
    if (dbError) {
      console.error('Support ticket DB error:', dbError);
      // We don't fail immediately, we can still try to email
    }

    // 2. Send email to admin
    const mailOptions = {
      from: `"${name}" <${process.env.EMAIL_USER}>`, // From our own email to prevent spoofing bounce
      replyTo: email,
      to: process.env.EMAIL_USER, // Send to ourselves
      subject: `[Support Ticket] ${topic.toUpperCase()} - from ${name}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>New Support Ticket</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Topic:</strong> ${topic}</p>
          <hr/>
          <h3>Message:</h3>
          <p style="white-space: pre-wrap;">${problem}</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    
    res.json({ success: true, message: 'Ticket submitted' });
  } catch (error: any) {
    console.error('Support endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
