"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("@material-tailwind/react");
const Route_1 = __importDefault(require("../enum/Route"));
const solid_1 = require("@heroicons/react/24/solid");
const react_2 = require("react");
const useAuth_1 = __importDefault(require("../hooks/useAuth"));
const Spinner_1 = __importDefault(require("../components/Spinner"));
const AddQuestion_1 = __importDefault(require("../components/question/AddQuestion"));
const DeleteQuestion_1 = __importDefault(require("../components/question/DeleteQuestion"));
const apolloClient_1 = require("../client/graphql/apolloClient");
const getQuestionsForQuestionsPage_1 = __importDefault(require("../client/graphql/question/getQuestionsForQuestionsPage"));
const QuestionPermission_1 = __importDefault(require("../enum/question/QuestionPermission"));
const icons_1 = require("../registry/icons");
const Table_1 = __importDefault(require("../components/elements/Table"));
const getExamsForSelect_1 = __importDefault(require("../client/graphql/exam/getExamsForSelect"));
const Error_1 = __importDefault(require("../components/Error"));
const CreateQuestion_1 = require("../schema/question/CreateQuestion");
const H1_1 = __importDefault(require("../components/typography/H1"));
const Link_1 = __importDefault(require("../components/elements/Link"));
const createListFromObjects_1 = __importDefault(require("../utils/createListFromObjects"));
const createListFromEnum_1 = __importDefault(require("../utils/createListFromEnum"));
const ApproveQuestion_1 = require("../components/question/ApproveQuestion");
const YesNo_1 = __importDefault(require("../enum/YesNo"));
const CreatorBadge_1 = __importDefault(require("../components/badges/CreatorBadge"));
const RateQuestion_1 = require("../components/question/RateQuestion");
const Questions = () => {
    const [tableKey, setTableKey] = (0, react_2.useState)(2);
    const refresh = () => setTableKey(Math.random());
    const { authenticationToken, checkAuthorization } = (0, useAuth_1.default)();
    const [exams, setExams] = (0, react_2.useState)();
    const [_, setLoading] = (0, react_2.useState)(true);
    const [error, setError] = (0, react_2.useState)('');
    (0, react_2.useEffect)(() => {
        (0, apolloClient_1.apiQuery)((0, getExamsForSelect_1.default)(), (data) => setExams(data.exams), setError, setLoading);
    }, []);
    (0, react_2.useEffect)(() => {
        refresh();
    }, [authenticationToken]);
    (0, react_2.useEffect)(() => {
        document.title = 'Questions';
    }, []);
    const getExam = (id) => (exams || []).filter((exam) => exam.id === id)[0];
    return <>
    <react_1.Breadcrumbs>
      <Link_1.default icon={solid_1.HomeIcon} label="Home" to={Route_1.default.Home}/>
      <Link_1.default label="Questions" to={Route_1.default.Questions}/>
    </react_1.Breadcrumbs>

    <H1_1.default icon={icons_1.ListIcon} label="Questions" sub="Questions info"/>

    {error && <Error_1.default text={error}/>}

    <Table_1.default key2={tableKey} buttons={{
            create: <AddQuestion_1.default onSubmit={refresh}/>,
        }} tabs={{
            approved: Object.values(YesNo_1.default),
        }} filters={{
            exam: (0, createListFromObjects_1.default)(exams || [], 'id', 'name'),
            difficulty: (0, createListFromEnum_1.default)(CreateQuestion_1.QuestionDifficulty),
        }} columns={['#', 'Title', 'Exam', 'Choices', 'Difficulty', 'Approved', 'Rating', '']} queryOptions={(filter) => (0, getQuestionsForQuestionsPage_1.default)(filter)} queryData={(data) => data.paginatedQuestions} mapper={(question, index) => [
            question.id,
            index + 1,
            <Link_1.default label={question.title} sup={question.isCreator ? <CreatorBadge_1.default /> : ''} tooltip={question.title} to={Route_1.default.Question.replace(':examId', question.examId).replace(':questionId', question.id)}/>,
            !exams ? <Spinner_1.default /> : <react_1.Tooltip content={getExam(question.examId).name}>{getExam(question.examId).name}</react_1.Tooltip>,
            question.type === CreateQuestion_1.QuestionType.CHOICE ? (question.choices || []).length : 'N/A',
            question.difficulty,
            <ApproveQuestion_1.ApproveQuestion question={question} readonly={!checkAuthorization(QuestionPermission_1.default.Approve)} iconButton/>,
            <RateQuestion_1.RateQuestion question={question} readonly={!checkAuthorization(QuestionPermission_1.default.Rate)}/>,
            {
                update: checkAuthorization(QuestionPermission_1.default.Update, question) &&
                    <AddQuestion_1.default question={question} onSubmit={refresh} iconButton/>,
                delete: checkAuthorization(QuestionPermission_1.default.Delete, question) &&
                    <DeleteQuestion_1.default question={question} onSubmit={refresh} iconButton/>,
            },
        ]}/>
  </>;
};
exports.default = (0, react_2.memo)(Questions);
//# sourceMappingURL=Questions.js.map