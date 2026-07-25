"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApproveExam = void 0;
const react_1 = require("react");
const icons_1 = require("../../registry/icons");
const toggleExamApprove_1 = __importDefault(require("../../client/graphql/exam/toggleExamApprove"));
const IconButton_1 = __importDefault(require("../elements/IconButton"));
const Button_1 = __importDefault(require("../elements/Button"));
const apolloClient_1 = require("../../client/graphql/apolloClient");
const Error_1 = __importDefault(require("../Error"));
const YesNo_1 = __importDefault(require("../elements/YesNo"));
const _ApproveExam = ({ exam, onChange, iconButton = false, readonly = false }) => {
    const [isApproved, setApproved] = (0, react_1.useState)(exam.isApproved);
    const [isSubmitting, setSubmitting] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)('');
    if (readonly) {
        return (<YesNo_1.default yes={isApproved}/>);
    }
    const icon = isApproved ? icons_1.EnabledIcon : icons_1.DisabledIcon;
    const label = isApproved
        ? (isSubmitting ? 'Un-approving Exam...' : 'Un-approve Exam')
        : (isSubmitting ? 'Approving Exam...' : 'Approve Exam');
    const onClick = () => {
        (0, apolloClient_1.apiMutate)((0, toggleExamApprove_1.default)(exam.id), (data) => {
            const updatedExam = data.toggleExamApprove;
            setApproved(updatedExam.isApproved);
            onChange && onChange(updatedExam);
        }, setError, setSubmitting);
    };
    return (<>
      {error && <Error_1.default text={error} simple/>}
      {iconButton
            ? <IconButton_1.default icon={icon} tooltip={label} onClick={onClick} disabled={isSubmitting}/>
            : <Button_1.default icon={icon} label={label} onClick={onClick} disabled={isSubmitting}/>}
    </>);
};
exports.ApproveExam = (0, react_1.memo)(_ApproveExam);
//# sourceMappingURL=ApproveExam.js.map