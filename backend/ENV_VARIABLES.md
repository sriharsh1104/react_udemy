# Environment Variables Reference

Copy these to your `.env` file in the `backend` directory.

## Required for Scaling

```bash
# MongoDB Atlas Connection
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/chatapp?retryWrites=true&w=majority

# Redis Connection (REQUIRED for horizontal scaling)
REDIS_URL=redis://default:password@redis-xxxxx.c1.us-east-1-1.ec2.cloud.redislabs.com:12345

# MongoDB Connection Pool Settings
MONGODB_MAX_POOL_SIZE=100
MONGODB_MIN_POOL_SIZE=10
```

## Server Configuration

```bash
NODE_ENV=production
PORT=3001
BASE_URL=https://your-domain.com
FRONTEND_URL=https://your-frontend.com
CORS_ORIGIN=https://your-frontend.com
```

## Email Service (Choose One)

### SendGrid
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.your-sendgrid-api-key-here
```

### Gmail
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password-here
```

## File Storage (Choose One)

### AWS S3
```bash
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

### Cloudinary
```bash
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
```

## Security

```bash
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
SESSION_SECRET=your-random-secret-key-here-minimum-32-characters-long
```

## Where to Get These Values

See `SETUP_GUIDE.md` for detailed instructions on creating accounts and getting API keys.

