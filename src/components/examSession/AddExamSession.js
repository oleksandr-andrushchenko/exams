"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const solid_1 = require("@heroicons/react/24/solid");
const react_1 = require("react");
const react_router_dom_1 = require("react-router-dom");
const Route_1 = __importDefault(require("../../enum/Route"));
const useAuth_1 = __importDefault(require("../../hooks/useAuth"));
const apolloClient_1 = require("../../client/graphql/apolloClient");
const createExamSession_1 = __importDefault(require("../../client/graphql/examSession/createExamSession"));
const Error_1 = __importDefault(require("../Error"));
const Link_1 = __importDefault(require("../elements/Link"));
const IconButton_1 = __importDefault(require("../elements/IconButton"));
const Button_1 = __importDefault(require("../elements/Button"));
const Auth_1 = __importDefault(require("../Auth"));
const AddExamSession = ({ exam, iconButton = false }) => {
    const { authenticationToken } = (0, useAuth_1.default)();
    const [processing, setProcessing] = (0, react_1.useState)(false);
    const [create, setCreate] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)('');
    const navigate = (0, react_router_dom_1.useNavigate)();
    (0, react_1.useEffect)(() => {
        if (create) {
            (0, apolloClient_1.apiMutate)((0, createExamSession_1.default)({ examId: exam.id }), (data) => navigate(Route_1.default.ExamSession.replace(':examId', exam.id).replace(':examSessionId', data.createExamSession.id)), setError, setProcessing);
        }
    }, [create]);
    const onClick = () => setCreate(true);
    const icon = solid_1.PlayIcon;
    const label = 'Start examSession';
    const color = 'indigo';
    if (!authenticationToken) {
        return <Auth_1.default button={{ icon, label, size: 'sm', iconOnly: iconButton, color }} dialog={{ label: 'You need to be authenticated' }} onSubmit={onClick}/>;
    }
    if (exam.examSessionId) {
        const url = Route_1.default.ExamSession.replace(':examId', exam.id).replace(':examSessionId', exam.examSessionId);
        const label = 'Continue examSession';
        const color = 'blue';
        if (iconButton) {
            return <Link_1.default to={url} label={<IconButton_1.default icon={icon} color={color}/>} tooltip={label}/>;
        }
        return <Link_1.default to={url} label={<Button_1.default icon={icon} label={label} color={color}/>}/>;
    }
    return <>
    {error && <Error_1.default text={error}/>}

    {iconButton
            ? <IconButton_1.default icon={icon} tooltip={label} color={color} onClick={onClick} disabled={processing}/>
            : <Button_1.default icon={icon} label={label} color={color} onClick={onClick} disabled={processing}/>}
  </>;
};
exports.default = (0, react_1.memo)(AddExamSession);
//# sourceMappingURL=AddExamSession.js.map