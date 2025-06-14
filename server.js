const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

// Load email template
const emailTemplate = fs.readFileSync(
  path.join(__dirname, 'templates', 'order-email.html'), 
  'utf8'
);

// Function to replace placeholders in template
function generateEmailHTML(data) {
  let html = emailTemplate;
  
  // Replace all placeholders
  for (const [key, value] of Object.entries(data)) {
    html = html.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  
  return html;
}

// Email sending endpoint
app.post('/send-email', async (req, res) => {
  try {
    const { toEmail, orderData } = req.body;
    
    // Validate required fields
    if (!toEmail || !orderData.orderNumber || !orderData.customerName) {
      return res.status(400).send('Missing required fields');
    }

    // Create transporter using Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      }
    });

    // Generate email HTML
    const emailHTML = generateEmailHTML(orderData);

    // Email options
    const mailOptions = {
      from: `"PB Tech Web Sales" <${process.env.GMAIL_USER}>`,
      to: toEmail,
      subject: `Order Confirmation for Order ${orderData.orderNumber}`,
      html: emailHTML,
      headers: {
        'X-Mailer': 'PB Tech Web Sales'
      }
    };

    // Send email
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Email send error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error sending email',
      error: error.message 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
