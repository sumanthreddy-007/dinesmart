import dotenv from 'dotenv';
import twilio from 'twilio';
dotenv.config();

const testSms = async () => {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  console.log('Using SID:', sid);
  console.log('Using From:', from);

  if (!sid || !token || !from) {
    console.error('Missing credentials in .env');
    return;
  }

  const client = twilio(sid, token);
  try {
    // We try to fetch account info to verify credentials
    const account = await client.api.v2010.accounts(sid).fetch();
    console.log('Twilio Account Verified:', account.friendlyName);
    
    // Attempt to send a test SMS to a dummy number or the 'from' number (if it supports receiving)
    // Actually, just verifying the client is enough for now to check credentials.
  } catch (err) {
    console.error('Twilio Verification Failed:', err.message);
  }
};

testSms();
