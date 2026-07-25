"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const Route_1 = __importDefault(require("../../enum/Route"));
const Link_1 = __importDefault(require("../elements/Link"));
const AddQuestion_1 = __importDefault(require("../question/AddQuestion"));
const ExamCreatedActivity = ({ activity }) => {
    const exam = { id: activity.examId };
    const link = Route_1.default.Exam.replace(':examId', exam.id);
    return <>
    <b><Link_1.default label={activity.examName} to={link}/></b>
    {' '}
    exam has been created. You can add your own questions
    {' '}
    <b><Link_1.default label="here" to={link}/></b>
    {' '}
    or
    {' '}
    <AddQuestion_1.default exam={exam}/>
  </>;
};
exports.default = (0, react_1.memo)(ExamCreatedActivity);
//# sourceMappingURL=ExamCreatedActivity.js.map