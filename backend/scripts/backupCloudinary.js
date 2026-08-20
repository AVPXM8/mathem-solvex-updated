const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const axios = require('axios');
const fs = require('fs');
const Question = require('../models/Question');
const Post = require('../models/Post');

// Backup directory relative to the script
const BACKUP_DIR = path.join(__dirname, '..', 'cloudinary_backup');

const ensureDirectoryExists = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

const downloadImage = async (cloudinaryUrl, folderName) => {
    if (!cloudinaryUrl || !cloudinaryUrl.includes('res.cloudinary.com')) return null;

    try {
        // Extract filename from URL (e.g. rqtljy0wi1uzq3itqxoe.png)
        const urlParts = cloudinaryUrl.split('/');
        const filename = urlParts[urlParts.length - 1];
        
        const targetDir = path.join(BACKUP_DIR, folderName);
        ensureDirectoryExists(targetDir);
        
        const targetPath = path.join(targetDir, filename);

        // Skip if already downloaded
        if (fs.existsSync(targetPath)) {
            console.log(`Skipping (already exists): ${filename}`);
            return targetPath;
        }

        console.log(`Downloading: ${cloudinaryUrl}`);
        const response = await axios({
            url: cloudinaryUrl,
            method: 'GET',
            responseType: 'stream'
        });

        const writer = fs.createWriteStream(targetPath);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        console.log(`  -> Saved to: ${targetPath}`);
        return targetPath;
    } catch (error) {
        console.error(`Failed to download ${cloudinaryUrl}:`, error.message);
        return null;
    }
};

const extractUrlsFromHtml = (html) => {
    if (!html || typeof html !== 'string') return [];
    const urls = [];
    const cloudinaryRegex = /https:\/\/res\.cloudinary\.com\/[^"'\s]+/gi;
    const matches = html.match(cloudinaryRegex) || [];
    for (const match of matches) {
        urls.push(match);
    }
    return urls;
};

const runBackup = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to DB.');
        
        // Array to store a mapping of original URL -> local file just in case you need it later
        const mapping = [];

        // --- Backup Questions ---
        console.log('\n--- Backing up Question Images ---');
        const questions = await Question.find({});
        for (const q of questions) {
            if (q.questionImageURL) {
                const local = await downloadImage(q.questionImageURL, 'maarula-questions');
                if (local) mapping.push({ original: q.questionImageURL, local });
            }
            if (q.explanationImageURL) {
                const local = await downloadImage(q.explanationImageURL, 'maarula-explanations');
                if (local) mapping.push({ original: q.explanationImageURL, local });
            }
            if (q.options && q.options.length > 0) {
                for (const opt of q.options) {
                    if (opt.imageURL) {
                        const local = await downloadImage(opt.imageURL, 'maarula-options');
                        if (local) mapping.push({ original: opt.imageURL, local });
                    }
                }
            }
        }

        // --- Backup Posts ---
        console.log('\n--- Backing up Post Images ---');
        const posts = await Post.find({});
        for (const post of posts) {
            if (post.featuredImage) {
                const local = await downloadImage(post.featuredImage, 'maarula-posts');
                if (local) mapping.push({ original: post.featuredImage, local });
            }
            if (post.content) {
                const htmlUrls = extractUrlsFromHtml(post.content);
                for (const url of htmlUrls) {
                    const local = await downloadImage(url, 'maarula-posts');
                    if (local) mapping.push({ original: url, local });
                }
            }
        }

        // Save mapping file
        fs.writeFileSync(
            path.join(BACKUP_DIR, 'mapping.json'), 
            JSON.stringify(mapping, null, 2)
        );
        console.log('\nBackup complete! Saved to', BACKUP_DIR);
        console.log('Mapping file saved to', path.join(BACKUP_DIR, 'mapping.json'));

        process.exit(0);
    } catch (error) {
        console.error('Backup failed:', error);
        process.exit(1);
    }
};

runBackup();
