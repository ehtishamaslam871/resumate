const nodemailer = require('nodemailer');

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Email templates
const emailTemplates = {
  applicationReceived: (recruiterName, jobTitle, candidateName) => ({
    subject: `New Application for ${jobTitle}`,
    html: `
      <h2>New Application Received</h2>
      <p>Hi ${recruiterName},</p>
      <p><strong>${candidateName}</strong> has applied for the position of <strong>${jobTitle}</strong>.</p>
      <p>Please log in to your dashboard to review their application and resume.</p>
      <p>Best regards,<br>ResuMate Team</p>
    `,
  }),
  applicationStatus: (candidateName, jobTitle, status) => ({
    subject: `Application Status: ${status}`,
    html: `
      <h2>Application Update</h2>
      <p>Hi ${candidateName},</p>
      <p>Your application for <strong>${jobTitle}</strong> has been <strong>${status}</strong>.</p>
      <p>Thank you for your interest in joining our team.</p>
      <p>Best regards,<br>ResuMate Team</p>
    `,
  }),
  interviewScheduled: (candidateName, jobTitle, interviewTime) => ({
    subject: `Interview Scheduled for ${jobTitle}`,
    html: `
      <h2>Interview Scheduled</h2>
      <p>Hi ${candidateName},</p>
      <p>Congratulations! An interview has been scheduled for the position of <strong>${jobTitle}</strong>.</p>
      <p><strong>Interview Time:</strong> ${new Date(interviewTime).toLocaleString()}</p>
      <p>Please log in to your dashboard to access the interview.</p>
      <p>Best regards,<br>ResuMate Team</p>
    `,
  }),
  interviewFeedback: (candidateName, score, feedback) => ({
    subject: `Interview Feedback - Score: ${score}/10`,
    html: `
      <h2>Interview Feedback</h2>
      <p>Hi ${candidateName},</p>
      <p>Thank you for completing the interview. Here's your feedback:</p>
      <p><strong>Overall Score:</strong> ${score}/10</p>
      <p><strong>Feedback:</strong></p>
      <p>${feedback}</p>
      <p>Best regards,<br>ResuMate Team</p>
    `,
  }),
  welcomeEmail: (userName) => ({
    subject: 'Welcome to ResuMate!',
    html: `
      <h2>Welcome to ResuMate!</h2>
      <p>Hi ${userName},</p>
      <p>Thank you for joining ResuMate. We're excited to help you advance your career!</p>
      <p>Here's what you can do:</p>
      <ul>
        <li>Upload and manage your resume</li>
        <li>Browse and apply for jobs</li>
        <li>Practice interviews with AI</li>
        <li>Get personalized feedback</li>
      </ul>
      <p>Best regards,<br>ResuMate Team</p>
    `,
  }),
};

// Send email function
const sendEmail = async (to, emailType, data) => {
  try {
    let emailContent;

    switch (emailType) {
      case 'applicationReceived':
        emailContent = emailTemplates.applicationReceived(
          data.recruiterName,
          data.jobTitle,
          data.candidateName
        );
        break;
      case 'applicationStatus':
        emailContent = emailTemplates.applicationStatus(
          data.candidateName,
          data.jobTitle,
          data.status
        );
        break;
      case 'interviewScheduled':
        emailContent = emailTemplates.interviewScheduled(
          data.candidateName,
          data.jobTitle,
          data.interviewTime
        );
        break;
      case 'interviewFeedback':
        emailContent = emailTemplates.interviewFeedback(
          data.candidateName,
          data.score,
          data.feedback
        );
        break;
      case 'welcomeEmail':
        emailContent = emailTemplates.welcomeEmail(data.userName);
        break;
      default:
        throw new Error('Invalid email type');
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject: emailContent.subject,
      html: emailContent.html,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}: ${emailType}`);
    return result;
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
    throw error;
  }
};

// Send bulk emails
const sendBulkEmails = async (recipients, emailType, data) => {
  try {
    const results = await Promise.all(
      recipients.map((recipient) => sendEmail(recipient, emailType, data))
    );
    console.log(`Bulk email sent to ${recipients.length} recipients`);
    return results;
  } catch (error) {
    console.error('Error sending bulk emails:', error);
    throw error;
  }
};

module.exports = {
  sendEmail,
  sendBulkEmails,
};
