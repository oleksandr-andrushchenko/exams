"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const deleteQuestion_1 = __importDefault(require("../../client/graphql/question/deleteQuestion"));
const icons_1 = require("../../registry/icons");
const ConfirmDialog_1 = __importDefault(require("../dialogs/ConfirmDialog"));
const DeleteQuestion = ({ question, onSubmit, iconButton = false }) => {
    return (<ConfirmDialog_1.default mutateOptionsFn={() => (0, deleteQuestion_1.default)(question.id)} iconFn={icons_1.DeleteIcon} labelFn={(isSubmitting) => isSubmitting ? 'Deleting Question...' : 'Delete Question'} title={`Are you sure you want to delete "${question.title}" question?`} body={<>This will delete "{question.title}" question permanently.<br />You cannot undo this action.</>} onSubmit={onSubmit} iconButton={iconButton}/>);
};
exports.default = (0, react_1.memo)(DeleteQuestion);
//# sourceMappingURL=DeleteQuestion.js.map