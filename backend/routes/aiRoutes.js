const express = require('express');
const { chatWithTutor } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Route: POST /api/ai/chat
// Description: Handles chat requests to the AI tutor
router.post('/chat', chatWithTutor);

module.exports = router;
