const mongoose = require('mongoose');
const Question = require('../models/Question.js'); // Use require for CommonJS
const cloudinary = require('../config/cloudinary.js'); // Use require for CommonJS

// Helper for cache headers
const setCache = (res, seconds = 60, sMax = 300) => {
  res.set('Cache-Control', `public, max-age=${seconds}, s-maxage=${sMax}, stale-while-revalidate=600`);
};

/**
 * GET /api/questions (Admin)
 * Paginated list with advanced filters, search, and sorting
 */
exports.getQuestions = async (req, res) => { // Use exports for CommonJS
  try {
    const page = Math.max(parseInt(req.query.page ?? '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit ?? '15', 10), 1), 50);
    const search = (req.query.search ?? '').trim();
    // Ensure 'questionNumber' is an allowed sort key
    const sortBy = ['createdAt', 'updatedAt', 'year', 'questionNumber'].includes(req.query.sortBy) ? req.query.sortBy : 'createdAt';
    const order = req.query.order === 'asc' ? 1 : -1;
    const { exam, subject, year } = req.query;

    const filter = {};
    if (exam) filter.exam = exam;
    if (subject) filter.subject = subject;
    if (year) filter.year = year;

    // Search by questionNumber if the search term is a number, otherwise search text
    if (search) {
      if (!isNaN(search) && search.trim() !== '') {
        filter.questionNumber = parseInt(search);
      } else {
        filter.$text = { $search: search };
      }
    }

    // Explicitly include questionNumber in the projection
    const projection = {
      questionText: 1, exam: 1, subject: 1, year: 1, updatedAt: 1, createdAt: 1, questionNumber: 1,
      ...(search && isNaN(search) ? { score: { $meta: 'textScore' } } : {})
    };
    const sort = search && isNaN(search) ? { score: { $meta: 'textScore' } } : { [sortBy]: order };
    const skip = (page - 1) * limit;

    const [questions, totalCount] = await Promise.all([
      Question.find(filter, projection).sort(sort).skip(skip).limit(limit).lean(),
      Question.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalCount / limit);
    res.status(200).json({ questions, totalPages, totalCount, currentPage: page });
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ message: 'Server error while fetching questions.' });
  }
};

/**
 * GET /api/questions/public
 * Public endpoint to fetch questions for students (can be simplified)
 */
exports.getPublicQuestions = async (req, res) => { // Use exports for CommonJS
  try {
    // For now, this sends all questions. This can be updated later for public-side pagination.
    const questions = await Question.find({}, { correctOption: 0, solutionText: 0 })
      .sort({ year: -1 })
      .lean();
    setCache(res, 120, 600);
    res.status(200).json(questions);
  } catch (error) {
    console.error('Error fetching public questions:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};


/**
 * GET /api/questions/:id
 * Fetches a single question by ID, ensuring all fields are included.
 */
exports.getQuestionById = async (req, res) => { // Use exports for CommonJS
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid question id' });
    }

    // Fetches the full document to ensure all fields like 'topic' and 'questionNumber' are present
    const question = await Question.findById(id).lean();

    if (!question) return res.status(404).json({ message: 'Question not found' });

    setCache(res, 120, 600);
    res.status(200).json(question);
  } catch (error) {
    console.error('Error fetching question by id:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * POST /api/questions
 * Creates a new question
 */
exports.createQuestion = async (req, res) => { // Use exports for CommonJS
  try {
    const questionData = { ...req.body };
    const parsedOptions = JSON.parse(req.body.options || '[]');

    if (req.files) {
      for (const key in req.files) {
        const result = await cloudinary.uploader.upload(req.files[key][0].path);
        if (key === 'questionImage') questionData.questionImageURL = result.secure_url;
        if (key === 'explanationImage') questionData.explanationImageURL = result.secure_url;
        if (key.startsWith('option_')) {
          const optionIndex = parseInt(key.split('_')[1], 10);
          if (parsedOptions[optionIndex]) {
            parsedOptions[optionIndex].imageURL = result.secure_url;
          }
        }
      }
    }

    const newQuestion = new Question({ ...questionData, options: parsedOptions });
    const savedQuestion = await newQuestion.save();
    res.status(201).json(savedQuestion);
  } catch (error) {
    console.error('Error creating question:', error);
    res.status(400).json({ message: 'Error creating question', error: error.message });
  }
};

/**
 * PUT /api/questions/:id
 * Updates an existing question
 */
exports.updateQuestion = async (req, res) => { // Use exports for CommonJS
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid question id' });
    }

    const updateData = { ...req.body };
    if (updateData.options) {
      updateData.options = JSON.parse(updateData.options);
    }

    if (req.files) {
      for (const key in req.files) {
        const result = await cloudinary.uploader.upload(req.files[key][0].path);
        if (key === 'questionImage') updateData.questionImageURL = result.secure_url;
        if (key === 'explanationImage') updateData.explanationImageURL = result.secure_url;
        if (key.startsWith('option_')) {
          const optionIndex = parseInt(key.split('_')[1], 10);
          if (updateData.options?.[optionIndex]) {
            updateData.options[optionIndex].imageURL = result.secure_url;
          }
        }
      }
    }

    const updatedQuestion = await Question.findByIdAndUpdate(id, updateData, { new: true, lean: true });
    if (!updatedQuestion) return res.status(404).json({ message: 'Question not found' });

    res.status(200).json(updatedQuestion);
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(400).json({ message: 'Error updating question', error: error.message });
  }
};

/**
 * DELETE /api/questions/:id
 * Deletes a question
 */
exports.deleteQuestion = async (req, res) => { // Use exports for CommonJS
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid question id' });
    }
    const deletedQuestion = await Question.findByIdAndDelete(id).lean();
    if (!deletedQuestion) return res.status(404).json({ message: 'Question not found' });
    res.status(200).json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * GET /api/questions/stats
 * Gets dashboard statistics
 */
exports.getQuestionStats = async (req, res) => { // Use exports for CommonJS
  try {
    const totalQuestions = await Question.estimatedDocumentCount();
    const subjects = await Question.distinct('subject', { subject: { $ne: null, $ne: '' } });
    const exams = await Question.distinct('exam', { exam: { $ne: null, $ne: '' } });
    setCache(res, 300, 900);
    res.status(200).json({
      totalQuestions,
      totalSubjects: subjects.length,
      totalExams: exams.length
    });
  } catch (error) {
    console.error('Error fetching question stats:', error);
    res.status(500).json({ message: 'Server Error while fetching stats' });
  }
};

/**
 * GET /api/questions/filters
 * Gets unique values for filter dropdowns
 */
exports.getFilterOptions = async (req, res) => { // Use exports for CommonJS
  try {
    const subjects = await Question.distinct('subject', { subject: { $ne: null, $ne: '' } });
    const exams = await Question.distinct('exam', { exam: { $ne: null, $ne: '' } });
    const years = await Question.distinct('year', { year: { $ne: null } });
    setCache(res, 3600, 7200);
    res.status(200).json({
      subjects: subjects.sort(),
      exams: exams.sort(),
      years: years.sort((a, b) => b - a)
    });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

/**
 * GET /api/questions/:id/related
 * Gets related questions based on topic and exam
 */
exports.getRelatedQuestions = async (req, res) => { // Use exports for CommonJS
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid question id' });
    }

    const original = await Question.findById(id, { topic: 1, exam: 1 }).lean();
    if (!original) return res.status(404).json({ message: 'Original question not found' });

    const related = await Question.find(
      { topic: original.topic, exam: original.exam, _id: { $ne: id } },
      { questionText: 1, exam: 1, subject: 1, topic: 1 }
    )
      .limit(5)
      .lean();

    setCache(res, 300, 900);
    res.status(200).json(related);
  } catch (error) {
    console.error('Error fetching related questions:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};