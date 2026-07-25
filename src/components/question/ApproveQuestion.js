"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApproveQuestion = void 0;
const react_1 = require("react");
const icons_1 = require("../../registry/icons");
const toggleQuestionApprove_1 = __importDefault(require("../../client/graphql/question/toggleQuestionApprove"));
const IconButton_1 = __importDefault(require("../elements/IconButton"));
const Button_1 = __importDefault(require("../elements/Button"));
const apolloClient_1 = require("../../client/graphql/apolloClient");
const Error_1 = __importDefault(require("../Error"));
const YesNo_1 = __importDefault(require("../elements/YesNo"));
const _ApproveQuestion = ({ question, onChange, iconButton = false, readonly = false }) => {
    const [isApproved, setApproved] = (0, react_1.useState)(question.isApproved);
    const [isSubmitting, setSubmitting] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)('');
    if (readonly) {
        return (<YesNo_1.default yes={isApproved}/>);
    }
    const icon = isApproved ? icons_1.EnabledIcon : icons_1.DisabledIcon;
    const label = isApproved
        ? (isSubmitting ? 'Un-approving Question...' : 'Un-approve Question')
        : (isSubmitting ? 'Approving Question...' : 'Approve Question');
    const onClick = () => {
        (0, apolloClient_1.apiMutate)((0, toggleQuestionApprove_1.default)(question.id), (data) => {
            const updatedQuestion = data.toggleQuestionApprove;
            setApproved(updatedQuestion.isApproved);
            onChange && onChange(updatedQuestion);
        }, setError, setSubmitting);
    };
    return (<>
      {error && <Error_1.default text={error} simple/>}
      {iconButton
            ? <IconButton_1.default icon={icon} tooltip={label} onClick={onClick} disabled={isSubmitting}/>
            : <Button_1.default icon={icon} label={label} onClick={onClick} disabled={isSubmitting}/>}
    </>);
};
exports.ApproveQuestion = (0, react_1.memo)(_ApproveQuestion);
//# sourceMappingURL=ApproveQuestion.js.map