const nodemailer = require('nodemailer');

function createEmailTransporter() {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
        throw new Error('Email credentials not configured. Please set EMAIL_USER and EMAIL_APP_PASSWORD environment variables.');
    }

    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_APP_PASSWORD
        }
    });
}

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTPEmail(toEmail, otp, firstName) {
    try {
        const transporter = createEmailTransporter();
        
        const mailOptions = {
            from: `"ProctorX" <${process.env.EMAIL_USER}>`,
            to: toEmail,
            subject: 'ProctorX - Email Verification Code',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 5px 5px 0 0; text-align: center; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
                        .otp-box { background: white; border: 2px solid #667eea; border-radius: 5px; padding: 20px; text-align: center; margin: 20px 0; }
                        .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
                        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>ProctorX</h1>
                        </div>
                        <div class="content">
                            <h2>Hello ${firstName || 'there'}!</h2>
                            <p>Thank you for signing up with ProctorX. To complete your registration, please verify your email address using the code below:</p>
                            
                            <div class="otp-box">
                                <p style="margin: 0; font-size: 14px; color: #666;">Your verification code is:</p>
                                <p class="otp-code">${otp}</p>
                            </div>
                            
                            <p><strong>This code will expire in 10 minutes.</strong></p>
                            <p>If you didn't request this code, please ignore this email.</p>
                            
                            <div class="footer">
                                <p>© 2025 ProctorX. All rights reserved.</p>
                                <p>This is an automated email. Please do not reply.</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        
        console.log('Email sent successfully:', info.messageId);
        return { success: true, data: { id: info.messageId } };
    } catch (error) {
        console.error('Error sending OTP email:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    sendOTPEmail,
    generateOTP
};
