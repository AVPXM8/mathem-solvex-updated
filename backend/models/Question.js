const mongoose = require('mongoose');
const Counter = require('./Counter.js'); // Make sure this path is correct

const optionSchema = new mongoose.Schema({
    text: { type: String, default: '' },
    imageURL: { type: String, default: '' },
    isCorrect: { type: Boolean, required: true, default: false }
});

const questionSchema = new mongoose.Schema({
    questionNumber: {
        type: Number,
        unique: true,
        sparse: true // Allows multiple null values, enforcing uniqueness only on documents that have the field
    },
    questionText: { type: String, required: true },
    questionImageURL: { type: String, default: '' },
    options: [optionSchema],
    explanationText: { type: String, default: '' },
    explanationImageURL: { type: String, default: '' },
    videoURL: { type: String, default: '' },
    subject: { type: String, required: true, trim: true },
    topic: { type: String, required: true, trim: true },
    exam: { type: String, required: true, enum: ['NIMCET', 'CUET PG', 'JEE'] },
    year: { type: Number }
}, { timestamps: true });

// This function runs before a new question is saved to the database
questionSchema.pre('save', async function(next) {
    // Only generate a number if the document is new
    if (this.isNew) {
        try {
            this.questionNumber = await Counter.getNextSequence('questionNumber');
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// --- Database Indexes for Performance ---
questionSchema.index({ subject: 1, exam: 1, year: -1, updatedAt: -1 });
questionSchema.index({ topic: 1, exam: 1, _id: 1 });
questionSchema.index({ updatedAt: -1 });
questionSchema.index({ questionText: 'text' });

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;