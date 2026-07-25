"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const solid_1 = require("@heroicons/react/24/solid");
const react_1 = require("react");
const createExamSessionCompletion_1 = __importDefault(require("../../client/graphql/examSession/createExamSessionCompletion"));
const ConfirmDialog_1 = __importDefault(require("../dialogs/ConfirmDialog"));
const CompleteExamSession = ({ examSession, onSubmit, iconButton = false }) => {
    return (<ConfirmDialog_1.default mutateOptionsFn={() => (0, createExamSessionCompletion_1.default)(examSession.id)} iconFn={solid_1.CheckIcon} labelFn={(isSubmitting) => isSubmitting ? 'Completing ExamSession...' : 'Complete ExamSession'} title={`Are you sure you want to complete "${examSession.exam.name}" examSession?`} body={<>This will complete "{examSession.exam.name}" examSession permanently.<br />You cannot undo this action.</>} onSubmit={onSubmit} iconButton={iconButton}/>);
};
exports.default = (0, react_1.memo)(CompleteExamSession);
//# sourceMappingURL=CompleteExamSession.js.map