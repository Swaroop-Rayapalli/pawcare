require('dotenv').config();
const nodemailer = require('nodemailer');

// Email configuration
let transporter = null;

// Initialize email transporter
async function initializeEmailService() {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        // Production configuration with Gmail
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
        console.log('✅ Email service initialized with Gmail SMTP');
        console.log(`📧 Sending from: ${process.env.SMTP_USER}`);
    } else {
        // Development: Create test account
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass
            }
        });
        console.log('✅ Email service initialized with test account');
        console.log('📧 Test email credentials:', testAccount.user);
        console.log('⚠️  To use Gmail, create a .env file (see GMAIL_SETUP.md)');
    }
}

// Email templates
const emailTemplates = {
    confirmed: (booking) => ({
        subject: '✅ Booking Confirmed - PawCare',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f7fafc;">
                <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h1 style="color: #667eea; margin-bottom: 20px;">🐾 Booking Confirmed!</h1>
                    <p style="font-size: 16px; color: #2d3748; line-height: 1.6;">
                        Hi <strong>${booking.customer_name}</strong>,
                    </p>
                    <p style="font-size: 16px; color: #2d3748; line-height: 1.6;">
                        Great news! Your booking has been confirmed.
                    </p>
                    <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #4a5568; margin-bottom: 15px;">Booking Details</h3>
                        <p style="margin: 8px 0;"><strong>Booking ID:</strong> #${booking.id}</p>
                        <p style="margin: 8px 0;"><strong>Service:</strong> ${booking.service_name}</p>
                        <p style="margin: 8px 0;"><strong>Pet:</strong> ${booking.pet_name || 'N/A'} ${booking.pet_type ? '(' + booking.pet_type + ')' : ''}</p>
                        <p style="margin: 8px 0;"><strong>Date:</strong> ${booking.booking_date}</p>
                        <p style="margin: 8px 0;"><strong>Time:</strong> ${booking.booking_time}</p>
                    </div>
                    <p style="font-size: 16px; color: #2d3748; line-height: 1.6;">
                        We're looking forward to taking care of your furry friend! If you have any questions, feel free to contact us.
                    </p>
                    <p style="font-size: 14px; color: #718096; margin-top: 30px;">
                        Best regards,<br>
                        <strong>PawCare Team</strong>
                    </p>
                </div>
            </div>
        `
    }),

    completed: (booking) => ({
        subject: '✨ Service Completed - PawCare',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f7fafc;">
                <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h1 style="color: #10b981; margin-bottom: 20px;">✨ Service Completed!</h1>
                    <p style="font-size: 16px; color: #2d3748; line-height: 1.6;">
                        Hi <strong>${booking.customer_name}</strong>,
                    </p>
                    <p style="font-size: 16px; color: #2d3748; line-height: 1.6;">
                        Your ${booking.service_name} service has been completed successfully!
                    </p>
                    <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #4a5568; margin-bottom: 15px;">Service Summary</h3>
                        <p style="margin: 8px 0;"><strong>Booking ID:</strong> #${booking.id}</p>
                        <p style="margin: 8px 0;"><strong>Service:</strong> ${booking.service_name}</p>
                        <p style="margin: 8px 0;"><strong>Pet:</strong> ${booking.pet_name || 'N/A'}</p>
                        <p style="margin: 8px 0;"><strong>Date:</strong> ${booking.booking_date}</p>
                    </div>
                    <p style="font-size: 16px; color: #2d3748; line-height: 1.6;">
                        Thank you for choosing PawCare! We hope ${booking.pet_name || 'your pet'} had a wonderful experience.
                    </p>
                    <p style="font-size: 14px; color: #718096; margin-top: 30px;">
                        Best regards,<br>
                        <strong>PawCare Team</strong>
                    </p>
                </div>
            </div>
        `
    }),

    cancelled: (booking) => ({
        subject: '❌ Booking Cancelled - PawCare',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f7fafc;">
                <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h1 style="color: #ef4444; margin-bottom: 20px;">❌ Booking Cancelled</h1>
                    <p style="font-size: 16px; color: #2d3748; line-height: 1.6;">
                        Hi <strong>${booking.customer_name}</strong>,
                    </p>
                    <p style="font-size: 16px; color: #2d3748; line-height: 1.6;">
                        Your booking has been cancelled.
                    </p>
                    <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #4a5568; margin-bottom: 15px;">Cancelled Booking</h3>
                        <p style="margin: 8px 0;"><strong>Booking ID:</strong> #${booking.id}</p>
                        <p style="margin: 8px 0;"><strong>Service:</strong> ${booking.service_name}</p>
                        <p style="margin: 8px 0;"><strong>Date:</strong> ${booking.booking_date}</p>
                    </div>
                    <p style="font-size: 16px; color: #2d3748; line-height: 1.6;">
                        If you have any questions or would like to reschedule, please don't hesitate to contact us.
                    </p>
                    <p style="font-size: 14px; color: #718096; margin-top: 30px;">
                        Best regards,<br>
                        <strong>PawCare Team</strong>
                    </p>
                </div>
            </div>
        `
    })
};

// Send status update email
async function sendStatusUpdateEmail(booking, newStatus) {
    if (!transporter) {
        console.log('⚠️ Email service not initialized');
        return null;
    }

    // Only send emails for confirmed, completed, and cancelled statuses
    if (!['confirmed', 'completed', 'cancelled'].includes(newStatus)) {
        return null;
    }

    const template = emailTemplates[newStatus](booking);

    try {
        const info = await transporter.sendMail({
            from: `"PawCare" <${process.env.SMTP_USER || 'noreply@pawcare.com'}>`,
            to: booking.customer_email,
            subject: template.subject,
            html: template.html
        });

        console.log('✅ Status update email sent to customer:', booking.customer_email);

        // For development with Ethereal, log the preview URL
        if (!process.env.SMTP_HOST) {
            console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info));
        }

        return info;
    } catch (error) {
        console.error('❌ Email sending failed:', error.message);
        return null;
    }
}

// Send booking confirmation email (to customer and admin)
async function sendBookingConfirmationEmail(booking) {
    if (!transporter) {
        console.log('⚠️ Email service not initialized');
        return null;
    }

    const customerEmailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f7fafc;">
            <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h1 style="color: #667eea; margin-bottom: 20px;">🐾 Booking Received!</h1>
                <p style="font-size: 16px; color: #2d3748; line-height: 1.6;">
                    Hi <strong>${booking.customer_name}</strong>,
                </p>
                <p style="font-size: 16px; color: #2d3748; line-height: 1.6;">
                    Thank you for choosing PawCare! We've received your booking request and will review it shortly.
                </p>
                <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #4a5568; margin-bottom: 15px;">Booking Details</h3>
                    <p style="margin: 8px 0;"><strong>Booking ID:</strong> #${booking.id}</p>
                    <p style="margin: 8px 0;"><strong>Service:</strong> ${booking.service_name}</p>
                    <p style="margin: 8px 0;"><strong>Pet:</strong> ${booking.pet_name || 'N/A'}</p>
                    <p style="margin: 8px 0;"><strong>Status:</strong> Pending Review</p>
                </div>
                <p style="font-size: 16px; color: #2d3748; line-height: 1.6;">
                    You'll receive a confirmation email once we've reviewed and approved your booking.
                </p>
                <p style="font-size: 14px; color: #718096; margin-top: 30px;">
                    Best regards,<br>
                    <strong>PawCare Team</strong>
                </p>
            </div>
        </div>
    `;

    try {
        // Send to customer
        const customerInfo = await transporter.sendMail({
            from: `"PawCare" <${process.env.SMTP_USER || 'noreply@pawcare.com'}>`,
            to: booking.customer_email,
            subject: '📋 Booking Received - PawCare',
            html: customerEmailHtml
        });

        console.log('✅ Booking confirmation sent to customer:', booking.customer_email);

        // Send notification to admin
        const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
        if (adminEmail) {
            const adminEmailHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f7fafc;">
                    <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <h1 style="color: #667eea; margin-bottom: 20px;">🔔 New Booking Alert!</h1>
                        <p style="font-size: 16px; color: #2d3748; line-height: 1.6;">
                            A new booking has been submitted and requires your review.
                        </p>
                        <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="color: #4a5568; margin-bottom: 15px;">Booking Details</h3>
                            <p style="margin: 8px 0;"><strong>Booking ID:</strong> #${booking.id}</p>
                            <p style="margin: 8px 0;"><strong>Customer:</strong> ${booking.customer_name}</p>
                            <p style="margin: 8px 0;"><strong>Email:</strong> ${booking.customer_email}</p>
                            <p style="margin: 8px 0;"><strong>Phone:</strong> ${booking.customer_phone || 'N/A'}</p>
                            <p style="margin: 8px 0;"><strong>Service:</strong> ${booking.service_name}</p>
                            <p style="margin: 8px 0;"><strong>Pet:</strong> ${booking.pet_name || 'N/A'} ${booking.pet_type ? '(' + booking.pet_type + ')' : ''}</p>
                            <p style="margin: 8px 0;"><strong>Date:</strong> ${booking.booking_date}</p>
                            <p style="margin: 8px 0;"><strong>Time:</strong> ${booking.booking_time}</p>
                            <p style="margin: 8px 0;"><strong>Notes:</strong> ${booking.notes || 'None'}</p>
                        </div>
                        <p style="font-size: 16px; color: #2d3748; line-height: 1.6;">
                            Please review and confirm this booking in the admin dashboard.
                        </p>
                        <a href="http://localhost:3000/admin.html" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">
                            View in Admin Dashboard
                        </a>
                    </div>
                </div>
            `;

            await transporter.sendMail({
                from: `"PawCare System" <${process.env.SMTP_USER || 'noreply@pawcare.com'}>`,
                to: adminEmail,
                subject: `🔔 New Booking #${booking.id} - ${booking.customer_name}`,
                html: adminEmailHtml
            });

            console.log('✅ Admin notification sent to:', adminEmail);
        }

        if (!process.env.SMTP_HOST) {
            console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(customerInfo));
        }

        return customerInfo;
    } catch (error) {
        console.error('❌ Email sending failed:', error.message);
        return null;
    }
}

// Send password reset email
async function sendPasswordResetEmail(email, tempPassword) {
    if (!transporter) {
        console.log('⚠️ Email service not initialized');
        return null;
    }

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f7fafc;">
            <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h1 style="color: #667eea; margin-bottom: 20px;">🔒 Password Reset Request</h1>
                <p style="font-size: 16px; color: #2d3748; line-height: 1.6;">
                    Hello,
                </p>
                <p style="font-size: 16px; color: #2d3748; line-height: 1.6;">
                    We received a request to reset your password. Here is your temporary password:
                </p>
                <div style="background: #e2e8f0; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
                    <span style="font-family: monospace; font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #2d3748;">${tempPassword}</span>
                </div>
                <p style="font-size: 16px; color: #2d3748; line-height: 1.6;">
                    Please log in with this password and change it immediately from your profile settings.
                </p>
                <p style="font-size: 14px; color: #718096; margin-top: 30px;">
                    If you didn't request this, please ignore this email.
                </p>
                <p style="font-size: 14px; color: #718096; margin-top: 30px;">
                    Best regards,<br>
                    <strong>PawCare Team</strong>
                </p>
            </div>
        </div>
    `;

    try {
        const info = await transporter.sendMail({
            from: `"PawCare Security" <${process.env.SMTP_USER || 'noreply@pawcare.com'}>`,
            to: email,
            subject: '🔒 Password Reset - PawCare',
            html: html
        });

        console.log('✅ Password reset email sent to:', email);

        if (!process.env.SMTP_HOST) {
            console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info));
        }

        return info;
    } catch (error) {
        console.error('❌ Email sending failed:', error.message);
        return null;
    }
}

module.exports = {
    initializeEmailService,
    sendStatusUpdateEmail,
    sendBookingConfirmationEmail,
    sendPasswordResetEmail
};
