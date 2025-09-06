const Counter = require('../models/Counter');
const Question = require('../models/Question'); // Needed to find highest questionNumber

const initializeQuestionNumberCounter = async () => {
    try {
        console.log('Attempting to initialize/correct questionNumber counter...');

        // 1. Find the highest existing questionNumber in the Question collection
        const highestQuestion = await Question.findOne().sort({ questionNumber: -1 }).lean();
        const maxExistingQuestionNumber = highestQuestion ? highestQuestion.questionNumber : 0;

        // 2. Use $max to ensure the counter's sequence is at least (maxExistingQuestionNumber + 1)
        const updatedCounter = await Counter.findOneAndUpdate(
            { _id: 'questionNumber' },
            { $max: { seq: maxExistingQuestionNumber + 1 } }, // This is the key improvement
            { upsert: true, new: true } // upsert: create if not exists, new: return the updated/created doc
        );

        console.log(`QuestionNumber counter initialized/corrected. Current sequence: ${updatedCounter.seq}`);
        
    } catch (error) {
        console.error('Failed to initialize or correct questionNumber counter:', error);
        // Depending on how critical this is, you might want to re-throw:
        // throw new Error('Counter initialization failed: ' + error.message);
    }
};

module.exports = initializeQuestionNumberCounter;