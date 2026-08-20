const s3Client = require('../config/s3');
const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');

const BUCKET_NAME = process.env.S3_BUCKET_NAME;
const PUBLIC_DOMAIN = process.env.S3_PUBLIC_DOMAIN;

// Helper to generate a unique key
const generateKey = (folder, filename) => {
    const timestamp = Date.now();
    return `${folder}/${timestamp}-${filename}`;
};

const uploadImage = async (filePath, folder) => {
    try {
        const fileContent = fs.readFileSync(filePath);
        const filename = filePath.split('/').pop().split('\\').pop(); // Handle windows & unix paths
        const key = generateKey(folder, filename);
        
        // Basic MIME type detection based on extension
        let contentType = 'image/jpeg';
        if (filePath.endsWith('.png')) contentType = 'image/png';
        if (filePath.endsWith('.gif')) contentType = 'image/gif';
        if (filePath.endsWith('.webp')) contentType = 'image/webp';
        
        const params = {
            Bucket: BUCKET_NAME,
            Key: key,
            Body: fileContent,
            ContentType: contentType,
        };
        
        await s3Client.send(new PutObjectCommand(params));
        
        // Return public URL
        const secureUrl = `${PUBLIC_DOMAIN}/${key}`;
        return { secure_url: secureUrl };
    } catch (error) {
        console.error('Failed to upload image to S3:', error);
        throw error;
    }
};

const extractObjectKey = (url) => {
    if (!url || typeof url !== 'string') return null;
    try {
        if (!url.startsWith(PUBLIC_DOMAIN)) return null;
        
        // Extract the key part after the public domain
        let key = url.replace(`${PUBLIC_DOMAIN}/`, '');
        return key;
    } catch (e) {
        return null;
    }
};

const deleteImage = async (url) => {
    const key = extractObjectKey(url);
    if (!key) return;
    try {
        await s3Client.send(new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key
        }));
        console.log(`Deleted S3 image: ${key}`);
    } catch (error) {
        console.error(`Failed to delete S3 image ${key}:`, error);
    }
};

const extractStorageUrlsFromHtml = (html) => {
    if (!html || typeof html !== 'string') return [];
    const urls = [];
    // Basic regex to find src="..." matching the PUBLIC_DOMAIN
    const domainRegex = PUBLIC_DOMAIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape domain
    const regex = new RegExp(`src=["'](${domainRegex}/[^"']+)["']`, 'gi');
    let match;
    while ((match = regex.exec(html)) !== null) {
        urls.push(match[1]);
    }
    return urls;
};

module.exports = {
    extractObjectKey,
    deleteImage,
    uploadImage,
    extractStorageUrlsFromHtml
};
