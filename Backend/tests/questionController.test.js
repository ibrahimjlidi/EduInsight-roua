const assert = require("node:assert/strict");
const { test } = require("node:test");
const Answer = require("../models/Answer");
const Choice = require("../models/Choice");
const Question = require("../models/Question");
const controller = require("../controllers/questionController");

const makeResponse = () => ({
  statusCode: 200,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

test("deleting a question removes its choices but preserves attempt history without dangling references", async () => {
  const originals = {
    questionFindById: Question.findById,
    questionFindByIdAndDelete: Question.findByIdAndDelete,
    choiceFind: Choice.find,
    choiceDeleteMany: Choice.deleteMany,
    answerUpdateMany: Answer.updateMany,
  };
  const questionId = "507f1f77bcf86cd799439011";
  const choiceId = "507f1f77bcf86cd799439012";
  let answerFilter;
  let answerUpdate;
  let choiceFilter;

  Question.findById = async () => ({ _id: questionId, quiz: "quiz-1" });
  Question.findByIdAndDelete = async () => ({ _id: questionId });
  Choice.find = () => ({ select: async () => [{ _id: choiceId }] });
  Choice.deleteMany = async (filter) => {
    choiceFilter = filter;
  };
  Answer.updateMany = async (filter, update) => {
    answerFilter = filter;
    answerUpdate = update;
  };

  try {
    const response = makeResponse();
    await controller.deleteQuestion({
      params: { id: questionId },
      user: { role: "admin", id: "admin-1" },
    }, response);

    assert.deepEqual(answerFilter, {
      $or: [
        { question: questionId },
        { selectedChoice: { $in: [choiceId] } },
      ],
    });
    assert.deepEqual(answerUpdate, { $unset: { question: 1, selectedChoice: 1 } });
    assert.deepEqual(choiceFilter, { question: questionId });
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.message, "Question deleted successfully");
  } finally {
    Question.findById = originals.questionFindById;
    Question.findByIdAndDelete = originals.questionFindByIdAndDelete;
    Choice.find = originals.choiceFind;
    Choice.deleteMany = originals.choiceDeleteMany;
    Answer.updateMany = originals.answerUpdateMany;
  }
});
