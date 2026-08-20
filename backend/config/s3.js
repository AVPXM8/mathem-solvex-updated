const { S3Client } = require('@aws-sdk/client-s3');

// Configure S3 client (e.g. for Cloudflare R2, AWS, Supabase)
const s3Client = new S3Client({
    region: process.env.S3_REGION || 'auto',
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY,
    },
});

module.exports = s3Client;
