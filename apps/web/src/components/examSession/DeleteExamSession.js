"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const deleteExamSession_1 = __importDefault(require("../../client/graphql/examSession/deleteExamSession"));
const icons_1 = require("../../registry/icons");
const ConfirmDialog_1 = __importDefault(require("../dialogs/ConfirmDialog"));
const DeleteExamSession = ({ examSession, onSubmit, iconButton = false }) => {
    return (<ConfirmDialog_1.default mutateOptionsFn={() => (0, deleteExamSession_1.default)(examSession.id)} iconFn={icons_1.DeleteIcon} labelFn={(isSubmitting) => isSubmitting ? 'Deleting ExamSession...' : 'Delete ExamSession'} title={`Are you sure you want to delete "${examSession.exam.name}" examSession?`} body={<>This will delete "{examSession.exam.name}" examSession permanently.<br />You cannot undo this action.</>} onSubmit={onSubmit} iconButton={iconButton}/>);
};
exports.default = (0, react_1.memo)(DeleteExamSession);
//# sourceMappingURL=DeleteExamSession.js.map