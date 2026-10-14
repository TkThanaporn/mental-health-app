
/**
 * File: server/services/emailService.js
 * HeartCare - Email Service using Resend API
 */

const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '..', '.env')
});

const RESEND_API_URL = 'https://api.resend.com/emails';

const getFromEmail = () => {
  return (
    process.env.RESEND_FROM_EMAIL ||
    'PCSHS Care System <onboarding@resend.dev>'
  );
};

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const apiKey = process.env.RESEND_API_KEY;

    // ตรวจสอบการตั้งค่าก่อนส่ง
    if (!apiKey) {
      console.error(
        '[Email Service] ไม่พบ RESEND_API_KEY ใน Environment Variables'
      );
      return false;
    }

    if (!to || !subject || (!html && !text)) {
      console.error(
        '[Email Service] ข้อมูลไม่ครบ ต้องมี to, subject และ html หรือ text'
      );
      return false;
    }

    const payload = {
      from: getFromEmail(),
      to: Array.isArray(to) ? to : [to],
      subject,
      ...(html ? { html } : {}),
      ...(text ? { text } : {})
    };

    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(20000)
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('[Email Service] Resend API ส่งไม่สำเร็จ:', {
        status: response.status,
        message: result.message || result.error || 'Unknown API error',
        name: result.name || undefined
      });

      return false;
    }

    console.log('[Email Service] ส่งคำขออีเมลสำเร็จ:', {
      to: payload.to,
      emailId: result.id
    });

    return true;
  } catch (error) {
    console.error('[Email Service] เกิดข้อผิดพลาด:', {
      message: error.message,
      name: error.name
    });

    return false;
  }
};

module.exports = { sendEmail };
