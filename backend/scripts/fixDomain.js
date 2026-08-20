const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Question = require('../models/Question');
const Post = require('../models/Post');

const oldDomain = 'pub-d9f2e46da3864704870f2be4c5e3fccf.r2.dev';
const newDomain = 'pub-4223189c1d9f4877afe3fd68e7458a4e.r2.dev';

const fixDomain = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        console.log('Fixing Questions...');
        const questions = await Question.find({});
        for (const q of questions) {
            let modified = false;

            if (q.questionImageURL && q.questionImageURL.includes(oldDomain)) {
                q.questionImageURL = q.questionImageURL.replace(oldDomain, newDomain);
                modified = true;
            }

            if (q.explanationImageURL && q.explanationImageURL.includes(oldDomain)) {
                q.explanationImageURL = q.explanationImageURL.replace(oldDomain, newDomain);
                modified = true;
            }

            if (q.options && q.options.length > 0) {
                for (let i = 0; i < q.options.length; i++) {
                    if (q.options[i].imageURL && q.options[i].imageURL.includes(oldDomain)) {
                        q.options[i].imageURL = q.options[i].imageURL.replace(oldDomain, newDomain);
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
            }
        }

        console.log('Fixing Posts...');
        const posts = await Post.find({});
        for (const post of posts) {
            let modified = false;

            if (post.featuredImage && post.featuredImage.includes(oldDomain)) {
                post.featuredImage = post.featuredImage.replace(oldDomain, newDomain);
                modified = true;
            }

            if (post.content && post.content.includes(oldDomain)) {
                post.content = post.content.replace(new RegExp(oldDomain, 'g'), newDomain);
                modified = true;
            }

            if (modified) {
                await Post.updateOne({ _id: post._id }, {
                    $set: {
                        featuredImage: post.featuredImage,
                        content: post.content
                    }
                });
            }
        }
        console.log('Fixed all DB records!');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

fixDomain();
