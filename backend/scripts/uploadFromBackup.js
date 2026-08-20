const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const { uploadImage } = require('../utils/storageUtils');
const Question = require('../models/Question');
const Post = require('../models/Post');

const BACKUP_DIR = path.join(__dirname, '..', 'cloudinary_backup');

// Backup to R2 Migration Script
const uploadFromBackup = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to DB.');

        const uploadLocalFile = async (url, folder) => {
            if (!url) return url;
            const isCloudinary = url.includes('res.cloudinary.com');
            const isBrokenR2 = url.includes('pub-d9f2e46da3864704870f2be4c5e3fccf.r2.dev');
            if (!isCloudinary && !isBrokenR2) return url;

            const urlParts = url.split('/');
            let filename = urlParts[urlParts.length - 1];
            
            // If it's a broken R2 URL, strip the timestamp prefix (e.g., 1787168328305-sample.jpg -> sample.jpg)
            if (isBrokenR2 && filename.includes('-')) {
                filename = filename.substring(filename.indexOf('-') + 1);
            }

            const localFilePath = path.join(BACKUP_DIR, folder, filename);

            if (!fs.existsSync(localFilePath)) {
                console.error(`Local backup file not found for: ${url}`);
                return url;
            }

            console.log(`Uploading local file to R2: ${localFilePath}`);
            try {
                const result = await uploadImage(localFilePath, folder);
                console.log(`  -> New URL: ${result.secure_url}`);
                return result.secure_url;
            } catch (error) {
                console.error(`Failed to upload ${localFilePath}:`, error.message);
                return cloudinaryUrl;
            }
        };

        // --- Migrate Questions ---
        console.log('--- Migrating Questions from Backup ---');
        const questions = await Question.find({});
        for (const q of questions) {
            let modified = false;

            if (q.questionImageURL && (q.questionImageURL.includes('res.cloudinary.com') || q.questionImageURL.includes('pub-d9f2e46da3864704870f2be4c5e3fccf.r2.dev'))) {
                q.questionImageURL = await uploadLocalFile(q.questionImageURL, 'maarula-questions');
                modified = true;
            }

            if (q.explanationImageURL && (q.explanationImageURL.includes('res.cloudinary.com') || q.explanationImageURL.includes('pub-d9f2e46da3864704870f2be4c5e3fccf.r2.dev'))) {
                q.explanationImageURL = await uploadLocalFile(q.explanationImageURL, 'maarula-explanations');
                modified = true;
            }

            if (q.options && q.options.length > 0) {
                for (let i = 0; i < q.options.length; i++) {
                    if (q.options[i].imageURL && (q.options[i].imageURL.includes('res.cloudinary.com') || q.options[i].imageURL.includes('pub-d9f2e46da3864704870f2be4c5e3fccf.r2.dev'))) {
                        q.options[i].imageURL = await uploadLocalFile(q.options[i].imageURL, 'maarula-options');
                        modified = true;
                    }
                }
            }

            if (modified) {
                await Question.updateOne({ _id: q._id }, { 
                    $set: { 
                        questionImageURL: q.questionImageURL,
                        explanationImageURL: q.explanationImageURL,
                        options: q.options
                    } 
                });
                console.log(`Updated Question ID: ${q._id}`);
            }
        }

        // --- Migrate Posts ---
        console.log('--- Migrating Posts from Backup ---');
        const posts = await Post.find({});
        for (const post of posts) {
            let modified = false;

            if (post.featuredImage && (post.featuredImage.includes('res.cloudinary.com') || post.featuredImage.includes('pub-d9f2e46da3864704870f2be4c5e3fccf.r2.dev'))) {
                post.featuredImage = await uploadLocalFile(post.featuredImage, 'maarula-posts');
                modified = true;
            }

            if (post.content && (post.content.includes('res.cloudinary.com') || post.content.includes('pub-d9f2e46da3864704870f2be4c5e3fccf.r2.dev'))) {
                const cloudinaryRegex = /https:\/\/(res\.cloudinary\.com|pub-d9f2e46da3864704870f2be4c5e3fccf\.r2\.dev)\/[^"'\s]+/gi;
                const matches = post.content.match(cloudinaryRegex) || [];
                
                let newContent = post.content;
                for (const oldUrl of matches) {
                    const newUrl = await uploadLocalFile(oldUrl, 'maarula-posts');
                    newContent = newContent.replace(new RegExp(oldUrl, 'g'), newUrl);
                    modified = true;
                }
                post.content = newContent;
            }

            if (modified) {
                await Post.updateOne({ _id: post._id }, {
                    $set: {
                        featuredImage: post.featuredImage,
                        content: post.content
                    }
                });
                console.log(`Updated Post ID: ${post._id}`);
            }
        }

        console.log('Backup Migration complete!');
        process.exit(0);
    } catch (error) {
        console.error('Backup Migration failed:', error);
        process.exit(1);
    }
};

uploadFromBackup();
