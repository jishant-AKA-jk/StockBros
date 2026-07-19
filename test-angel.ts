import { config } from 'dotenv';
import * as OTPAuth from 'otpauth';

// Load credentials from .env.prod or .env.local
config({ path: '.env.prod' });

const API_KEY = process.env.ANGELONE_API_KEY;
const CLIENT_CODE = process.env.ANGELONE_CLIENT_CODE;
const PASSWORD = process.env.ANGELONE_PASSWORD;
const TOTP_SECRET = process.env.ANGELONE_TOTP_SECRET;

async function testAngelOne() {
  console.log('Testing Angel One API Login...');
  
  if (!API_KEY || !CLIENT_CODE || !PASSWORD || !TOTP_SECRET) {
    console.error('Missing credentials in .env.prod');
    return;
  }

  try {
    const totpGen = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(TOTP_SECRET) });
    const totp = totpGen.generate();

    const payload = {
      clientcode: CLIENT_CODE,
      password: PASSWORD,
      totp: totp,
    };

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-UserType': 'USER',
      'X-SourceID': 'WEB',
      'X-ClientLocalIP': '127.0.0.1',
      'X-ClientPublicIP': '127.0.0.1',
      'X-MACAddress': '00-00-00-00-00-00',
      'X-PrivateKey': API_KEY,
    };

    const response = await fetch('https://apiconnect.angelbroking.com/rest/auth/angelbroking/user/v1/loginByPassword', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    console.log(`\nHTTP Status: ${response.status} ${response.statusText}`);
    
    let data;
    try {
      data = JSON.parse(text);
      console.log('Response is valid JSON.');
    } catch (e) {
      console.error('\nERROR: Response is NOT JSON (Likely blocked by Web Application Firewall).');
      console.log('Raw text received from Angel One:');
      console.log(text.substring(0, 500));
      return;
    }

    if (data.status) {
      console.log('✅ LOGIN SUCCESSFUL! Angel One API is working perfectly.');
      console.log(`JWT Token Length: ${data.data.jwtToken.length}`);
    } else {
      console.error('❌ LOGIN FAILED but reached backend.');
      console.error('Message:', data.message);
    }
    
  } catch (err: any) {
    console.error('Network or Execution Error:', err.message);
  }
}

testAngelOne();
