"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionDifficulty = exports.QuestionType = exports.QuestionChoice = void 0;
class QuestionChoice {
    constructor() {
        this.title = '';
        this.correct = false;
        this.explanation = '';
    }
}
exports.QuestionChoice = QuestionChoice;
var QuestionType;
(function (QuestionType) {
    QuestionType["CHOICE"] = "choice";
})(QuestionType || (exports.QuestionType = QuestionType = {}));
var QuestionDifficulty;
(function (QuestionDifficulty) {
    QuestionDifficulty["EASY"] = "easy";
    QuestionDifficulty["MODERATE"] = "moderate";
    QuestionDifficulty["DIFFICULT"] = "difficult";
    QuestionDifficulty["EXPERT"] = "expert";
})(QuestionDifficulty || (exports.QuestionDifficulty = QuestionDifficulty = {}));
//# sourceMappingURL=CreateQuestion.js.map