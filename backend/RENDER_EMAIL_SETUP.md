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

### Email not sending
- Verify `EMAIL_USER` and `EMAIL_PASS` are set correctly
- Check App Password is correct (16 characters)
- Verify 2-Step Verification is enabled
- Check Render logs for error messages

### OTP in console
- This is normal if email config is not set
- Set `EMAIL_USER` and `EMAIL_PASS` in Render
- Redeploy after setting environment variables

