"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Route;
(function (Route) {
    Route["Home"] = "/";
    Route["Exams"] = "/exams";
    Route["Exam"] = "/exams/:examId";
    Route["ExamTag"] = "/tags/:tagSlug";
    Route["Questions"] = "/questions";
    Route["Question"] = "/exams/:examId/questions/:questionId";
    Route["ExamSession"] = "/examSessions/:examSessionId";
    Route["Login"] = "/login";
    Route["Register"] = "/register";
    Route["Terms"] = "/terms-and-conditions";
    Route["Users"] = "/users";
    Route["User"] = "/users/:userId";
})(Route || (Route = {}));
exports.default = Route;
//# sourceMappingURL=Route.js.map