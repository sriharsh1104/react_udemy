# Render Email Configuration Setup

## ✅ Email Environment Variables

Render dashboard mein yeh environment variables set karein:

| Key | Value | Description |
|-----|-------|-------------|
| `EMAIL_USER` | `your-email@gmail.com` | Your Gmail address |
| `EMAIL_PASS` | `your-app-password` | Gmail App Password (not regular password) |

## 📧 Gmail App Password Setup

1. **Enable 2-Step Verification**:
   - Go to https://myaccount.google.com/security
   - Enable "2-Step Verification"

2. **Generate App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter name: "Chat App"
   - Copy the 16-character password

3. **Set in Render**:
   - Use the 16-character app password (not your regular Gmail password)
   - Set it as `EMAIL_PASS` in Render environment variables

## ✅ Verification

After setting environment variables:

1. **Check Logs**: Deploy ke baad logs check karein
2. **Test OTP**: Send OTP endpoint test karein
3. **Check Console**: Agar email send fail ho, to console mein OTP log hoga

## 🔍 How It Works

- **Email Config Set**: OTP email se send hoga
- **Email Config Not Set**: OTP console mein log hoga (development ke liye)

## ⚠️ Important Notes

- Use **App Password**, not regular Gmail password
- App Password 16 characters ka hota hai (spaces ignore karein)
- Environment variables Render dashboard mein set karein
- `.env` file git mein commit mat karein

## 🐛 Troubleshooting

### Connection Timeout Error
**Problem**: "Error sending email: Connection timeout" when sending OTP from Render staging.

**Possible Causes**:
1. Gmail blocking connections from Render's IP addresses
2. Network firewall restrictions
3. Gmail rate limiting
4. SMTP port blocking

**Solutions**:

#### Solution 1: Use Alternative Email Service (Recommended for Production)
Gmail often blocks connections from cloud hosting providers. Use these services instead:

**Option A: SendGrid (Free tier: 100 emails/day)**
```javascript
// Update otpService.js getTransporter() method:
this.transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY, // Your SendGrid API key
  },
  connectionTimeout: 10000,
  socketTimeout: 10000,
});
```

**Option B: AWS SES (Free tier: 62,000 emails/month)**
```javascript
this.transporter = nodemailer.createTransport({
  host: process.env.AWS_SES_HOST || 'email-smtp.us-east-1.amazonaws.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.AWS_SES_USER,
    pass: process.env.AWS_SES_PASS,
  },
});
```

**Option C: Mailgun (Free tier: 5,000 emails/month)**
```javascript
this.transporter = nodemailer.createTransport({
  host: 'smtp.mailgun.org',
  port: 587,
  auth: {
    user: process.env.MAILGUN_USER,
    pass: process.env.MAILGUN_PASS,
  },
});
```

#### Solution 2: Gmail OAuth2 (More Reliable than App Password)
Use OAuth2 instead of App Password for better reliability:
- More secure
- Less likely to be blocked
- Better for production use

#### Solution 3: Check Render Logs
1. Go to Render dashboard → Your service → Logs
2. Look for OTP in logs (it's logged as fallback)
3. Check for specific error messages

#### Solution 4: Temporary Workaround
- OTP is automatically logged to console when email fails
- Check Render logs to get the OTP
- This is a temporary solution until you switch to a proper email service

### Email not sending
- Verify `EMAIL_USER` and `EMAIL_PASS` are set correctly
- Check App Password is correct (16 characters)
- Verify 2-Step Verification is enabled
- Check Render logs for error messages
- **If timeout persists**: Switch to SendGrid/AWS SES/Mailgun

### OTP in console
- This is normal if email config is not set
- This also happens if email sending fails (timeout, auth error, etc.)
- Set `EMAIL_USER` and `EMAIL_PASS` in Render
- Redeploy after setting environment variables
- **For production**: Use SendGrid, AWS SES, or Mailgun instead of Gmail

