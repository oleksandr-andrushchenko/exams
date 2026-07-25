"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const deleteExam_1 = __importDefault(require("../../client/graphql/exam/deleteExam"));
const icons_1 = require("../../registry/icons");
const ConfirmDialog_1 = __importDefault(require("../dialogs/ConfirmDialog"));
const DeleteExam = ({ exam, onSubmit, iconButton = false }) => {
    return (<ConfirmDialog_1.default mutateOptionsFn={() => (0, deleteExam_1.default)(exam.id)} iconFn={icons_1.DeleteIcon} labelFn={(isSubmitting) => isSubmitting ? 'Deleting Exam...' : 'Delete Exam'} title={`Are you sure you want to delete "${exam.name}" exam?`} body={<>This will delete "{exam.name}" exam and all its questions [ {exam.questionCount ?? 0} ]
        permanently.<br />You cannot undo this action.</>} onSubmit={onSubmit} iconButton={iconButton}/>);
};
exports.default = (0, react_1.memo)(DeleteExam);
//# sourceMappingURL=DeleteExam.js.map