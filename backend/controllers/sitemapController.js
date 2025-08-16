const { SitemapStream, streamToPromise } = require('sitemap');
const { Readable } = require('stream');
const Question = require('../models/Question'); // Adjust path to your Question model
const Post = require('../models/Post');       // Adjust path to your Post model

exports.generateSitemap = async (req, res) => {
  try {
    const links = [];
    const baseUrl = 'https://question.maarula.in';

    // 1. Add static pages
    links.push({ url: '/', changefreq: 'daily', priority: 1.0 });
    links.push({ url: '/questions', changefreq: 'daily', priority: 0.9 });
    links.push({ url: '/articles', changefreq: 'weekly', priority: 0.8 });

    // 2. Fetch all public questions from the database
    const questions = await Question.find({ isPublic: true }).select('_id updatedAt');
    questions.forEach(question => {
      links.push({
        url: `/question/${question._id}`,
        changefreq: 'weekly',
        priority: 0.7,
        lastmod: question.updatedAt,
      });
    });

    // 3. Fetch all posts from the database
    const posts = await Post.find().select('slug updatedAt');
    posts.forEach(post => {
      links.push({
        url: `/articles/${post.slug}`,
        changefreq: 'monthly',
        priority: 0.6,
        lastmod: post.updatedAt,
      });
    });

    // Create a stream to write to
    const stream = new SitemapStream({ hostname: baseUrl });

    // Set the response header to XML
    res.writeHead(200, {
      'Content-Type': 'application/xml'
    });

    // Pipe the sitemap stream to the response
    const xmlStream = Readable.from(links).pipe(stream);
    const sitemap = await streamToPromise(xmlStream);
    res.end(sitemap.toString());

  } catch (error) {
    console.error(error);
    res.status(500).send('Error generating sitemap');
  }
};
