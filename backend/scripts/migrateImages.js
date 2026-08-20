const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const axios = require('axios');
const fs = require('fs');
const os = require('os');
const { uploadImage, extractStorageUrlsFromHtml } = require('../utils/storageUtils');
const Question = require('../models/Question');
const Post = require('../models/Post');

// Migration Script: Cloudinary to S3 (Cloudflare R2)
const migrateImages = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to DB.');

        const tempDir = os.tmpdir();

        const downloadAndUpload = async (cloudinaryUrl, folder) => {
            if (!cloudinaryUrl || !cloudinaryUrl.includes('res.cloudinary.com')) return cloudinaryUrl;

            console.log(`Migrating: ${cloudinaryUrl}`);
            try {
                // Download from Cloudinary
                const response = await axios({
                    url: cloudinaryUrl,
                    method: 'GET',
                    responseType: 'stream'
                });

                // Extract filename from URL (e.g. sample.jpg)
                const urlParts = cloudinaryUrl.split('/');
                const filename = urlParts[urlParts.length - 1];
                const tempFilePath = path.join(tempDir, filename);

                // Save temporarily
                const writer = fs.createWriteStream(tempFilePath);
                response.data.pipe(writer);

                await new Promise((resolve, reject) => {
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });

                // Upload to S3
                const result = await uploadImage(tempFilePath, folder);
                
                // Cleanup temp file
                fs.unlinkSync(tempFilePath);

                console.log(`  -> New URL: ${result.secure_url}`);
                return result.secure_url;
            } catch (error) {
                console.error(`Failed to migrate ${cloudinaryUrl}:`, error.message);
                return cloudinaryUrl; // Return old URL on failure so we don't break the record
            }
        };

        // --- Migrate Questions ---
        console.log('--- Migrating Questions ---');
        const questions = await Question.find({});
        for (const q of questions) {
            let modified = false;

            if (q.questionImageURL && q.questionImageURL.includes('res.cloudinary.com')) {
                q.questionImageURL = await downloadAndUpload(q.questionImageURL, 'maarula-questions');
                modified = true;
            }

            if (q.explanationImageURL && q.explanationImageURL.includes('res.cloudinary.com')) {
                q.explanationImageURL = await downloadAndUpload(q.explanationImageURL, 'maarula-explanations');
                modified = true;
            }

            if (q.options && q.options.length > 0) {
                for (let i = 0; i < q.options.length; i++) {
                    if (q.options[i].imageURL && q.options[i].imageURL.includes('res.cloudinary.com')) {
                        q.options[i].imageURL = await downloadAndUpload(q.options[i].imageURL, 'maarula-options');
                        modified = true;
                    }
                }
            }

            if (modified) {
                // We use updateOne to avoid triggering pre-save hooks unnecessarily if not needed
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
        console.log('--- Migrating Posts ---');
        const posts = await Post.find({});
        for (const post of posts) {
            let modified = false;

            if (post.featuredImage && post.featuredImage.includes('res.cloudinary.com')) {
                post.featuredImage = await downloadAndUpload(post.featuredImage, 'maarula-posts');
                modified = true;
            }

            // Extract all cloudinary URLs from HTML content
            if (post.content && post.content.includes('res.cloudinary.com')) {
                // Find all cloudinary URLs manually since extractStorageUrlsFromHtml uses the NEW domain
                const cloudinaryRegex = /https:\/\/res\.cloudinary\.com\/[^"'\s]+/gi;
                const matches = post.content.match(cloudinaryRegex) || [];
                
                let newContent = post.content;
                for (const oldUrl of matches) {
                    const newUrl = await downloadAndUpload(oldUrl, 'maarula-posts');
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

        console.log('Migration complete!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrateImages();
