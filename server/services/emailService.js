
/**
 * File: server/services/emailService.js
 * HeartCare - Gmail API with OAuth2
 */

const path = require('path');

require('dotenv').config({
  path: path.join(__dirname, '..', '.env')
});

const { google } = require('googleapis');

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const emailUser = process.env.EMAIL_USER;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (!emailUser || !clientId || !clientSecret || !refreshToken) {
      console.error(
        '[Email Service] กรุณาตรวจสอบ EMAIL_USER และ GOOGLE OAuth Variables'
      );
      return false;
    }

    if (!to || !subject || (!html && !text)) {
      console.error('[Email Service] ข้อมูลอีเมลไม่ครบ');
      return false;
    }

    const recipients = (Array.isArray(to) ? to : [to])
      .map(email => String(email).trim())
      .filter(Boolean);

    if (recipients.length === 0) {
      console.error('[Email Service] ไม่พบอีเมลผู้รับ');
      return false;
    }

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret
    );

    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });

    const gmail = google.gmail({
      version: 'v1',
      auth: oauth2Client
    });

    const encodeMime = (value) =>
      `=?UTF-8?B?${Buffer.from(String(value)).toString('base64')}?=`;

    const body = html || text;
    const contentType = html ? 'text/html' : 'text/plain';

    const message = [
      `From: ${emailUser}`,
      `To: ${recipients.join(', ')}`,
      `Subject: ${encodeMime(subject)}`,
      'MIME-Version: 1.0',
      `Content-Type: ${contentType}; charset=UTF-8`,
      'Content-Transfer-Encoding: base64',
      '',
      Buffer.from(body, 'utf8').toString('base64')
    ].join('\r\n');

    const raw = Buffer.from(message, 'utf8')
      .toString('base64url');

    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw }
    });

    console.log('[Email Service] Gmail API ส่งสำเร็จ:', {
      to: recipients,
      messageId: result.data.id
    });

    return true;
  } catch (error) {
    console.error('[Email Service] Gmail API ส่งไม่สำเร็จ:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      details: error.response?.data?.error?.message
    });

    return false;
  }
};

module.exports = { sendEmail };
