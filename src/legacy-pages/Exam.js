"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_router_dom_1 = require("react-router-dom");
const react_1 = require("@material-tailwind/react");
const Route_1 = __importDefault(require("../enum/Route"));
const solid_1 = require("@heroicons/react/24/solid");
const react_2 = require("react");
const useAuth_1 = __importDefault(require("../hooks/useAuth"));
const Spinner_1 = __importDefault(require("../components/Spinner"));
const DeleteExam_1 = __importDefault(require("../components/exam/DeleteExam"));
const AddQuestion_1 = __importDefault(require("../components/question/AddQuestion"));
const AddExam_1 = __importDefault(require("../components/exam/AddExam"));
const DeleteQuestion_1 = __importDefault(require("../components/question/DeleteQuestion"));
const CreateQuestion_1 = require("../schema/question/CreateQuestion");
const AddExamSession_1 = __importDefault(require("../components/examSession/AddExamSession"));
const apolloClient_1 = require("../client/graphql/apolloClient");
const getExamForExamPage_1 = __importDefault(require("../client/graphql/exam/getExamForExamPage"));
const Error_1 = __importDefault(require("../components/Error"));
const ExamPermission_1 = __importDefault(require("../enum/exam/ExamPermission"));
const QuestionPermission_1 = __importDefault(require("../enum/question/QuestionPermission"));
const Table_1 = __importDefault(require("../components/elements/Table"));
const getQuestionsForExamPage_1 = __importDefault(require("../client/graphql/exam/getQuestionsForExamPage"));
const Link_1 = __importDefault(require("../components/elements/Link"));
const H1_1 = __importDefault(require("../components/typography/H1"));
const InfoTable_1 = __importDefault(require("../components/elements/InfoTable"));
const createListFromEnum_1 = __importDefault(require("../utils/createListFromEnum"));
const ApproveQuestion_1 = require("../components/question/ApproveQuestion");
const ApproveExam_1 = require("../components/exam/ApproveExam");
const YesNo_1 = __importDefault(require("../enum/YesNo"));
const canAddExamSession_1 = __importDefault(require("../services/examSessions/canAddExamSession"));
const ExamTags_1 = __importDefault(require("../components/examTag/ExamTags"));
const CreatorBadge_1 = __importDefault(require("../components/badges/CreatorBadge"));
const RateQuestion_1 = require("../components/question/RateQuestion");
const RateExam_1 = require("../components/exam/RateExam");
const Buttons_1 = __importDefault(require("../components/elements/Buttons"));
const Exam = () => {
    const [tableKey, setTableKey] = (0, react_2.useState)(1);
    const [infoTableKey, setInfoTableKey] = (0, react_2.useState)(1);
    const { authenticationToken, checkAuthorization } = (0, useAuth_1.default)();
    const { examId } = (0, react_router_dom_1.useParams)();
    const [exam, setExam] = (0, react_2.useState)();
    const [_, setLoading] = (0, react_2.useState)(true);
    const [error, setError] = (0, react_2.useState)('');
    const navigate = (0, react_router_dom_1.useNavigate)();
    const updateExam = (exam) => setExam(exam);
    const refreshExam = () => (0, apolloClient_1.apiQuery)((0, getExamForExamPage_1.default)(examId), (data) => setExam(data.exam), setError, setLoading);
    const refreshTable = () => {
        setTableKey(Math.random());
    };
    const refreshInfoTable = () => {
        setInfoTableKey(Math.random());
    };
    const updateExamAndRefreshInfoTable = (exam) => {
        updateExam(exam);
        refreshInfoTable();
    };
    const onDelete = () => navigate(Route_1.default.Exams, { replace: true });
    const refreshExamAndTable = () => {
        refreshExam();
        refreshTable();
    };
    (0, react_2.useEffect)(() => {
        refreshExamAndTable();
    }, [authenticationToken]);
    (0, react_2.useEffect)(() => {
        document.title = exam?.name || 'ExamMe';
    }, [exam]);
    return <>
    <react_1.Breadcrumbs>
      <Link_1.default icon={solid_1.HomeIcon} label="Home" to={Route_1.default.Home}/>
      <Link_1.default label="Exams" to={Route_1.default.Exams}/>
      {!exam ? <Spinner_1.default type="text"/> :
            <Link_1.default label={exam.name} to={Route_1.default.Exam.replace(':examId', exam.id)}/>}
    </react_1.Breadcrumbs>

    <H1_1.default label={exam?.name ?? <Spinner_1.default type="text"/>} sup={exam?.isCreator ? <CreatorBadge_1.default /> : ''}/>

    {exam
            ? <RateExam_1.RateExam exam={exam} onChange={updateExam} readonly={!checkAuthorization(ExamPermission_1.default.Rate)} showAverageMark showMarkCount/> : <Spinner_1.default type="text"/>}

    {error && <Error_1.default text={error}/>}

    <Buttons_1.default className="mt-2" buttons={{
            create: !exam ? <Spinner_1.default type="button"/> :
                <AddQuestion_1.default exam={exam} onSubmit={refreshExamAndTable}/>,
            approve: !exam ? <Spinner_1.default type="button"/> : (checkAuthorization(ExamPermission_1.default.Approve) &&
                <ApproveExam_1.ApproveExam exam={exam} onChange={updateExamAndRefreshInfoTable}/>),
            update: checkAuthorization(ExamPermission_1.default.Update, exam) && (!exam ? <Spinner_1.default type="button"/> :
                <AddExam_1.default exam={exam} onSubmit={updateExam}/>),
            delete: checkAuthorization(ExamPermission_1.default.Delete, exam) && (!exam ? <Spinner_1.default type="button"/> :
                <DeleteExam_1.default exam={exam} onSubmit={onDelete}/>),
            examSession: !exam ? <Spinner_1.default type="button"/> : (0, canAddExamSession_1.default)(exam) && <AddExamSession_1.default exam={exam}/>,
        }}/>

    <InfoTable_1.default className="mt-4" title="Exam info" key2={infoTableKey} source={exam} columns={['Name', 'Tags', 'Questions', 'Required score', 'Rating', 'Approved']} mapper={(exam) => [
            exam.name,
            <ExamTags_1.default tags={exam.tags}/>,
            `${exam.approvedQuestionCount ?? 0}/${exam.questionCount ?? 0}`,
            exam.requiredScore ?? 0,
            <RateExam_1.RateExam exam={exam} readonly/>,
            <ApproveExam_1.ApproveExam exam={exam} readonly/>,
        ]}/>

    <Table_1.default key2={tableKey} tabs={{
            approved: Object.values(YesNo_1.default),
        }} filters={{
            difficulty: (0, createListFromEnum_1.default)(CreateQuestion_1.QuestionDifficulty),
        }} columns={['#', 'Title', 'Choices', 'Difficulty', 'Approved', 'Rating', '']} queryOptions={(filter) => (0, getQuestionsForExamPage_1.default)(examId, filter)} queryData={(data) => data.paginatedQuestions} mapper={(question, index) => [
            question.id,
            index + 1,
            <Link_1.default label={question.title} sup={question.isCreator ? <CreatorBadge_1.default /> : ''} tooltip={question.title} to={Route_1.default.Question.replace(':examId', question.examId).replace(':questionId', question.id)}/>,
            question.type === CreateQuestion_1.QuestionType.CHOICE ? (question.choices || []).length : 'N/A',
            question.difficulty,
            <ApproveQuestion_1.ApproveQuestion question={question} readonly={!checkAuthorization(QuestionPermission_1.default.Approve)} onChange={refreshExam} iconButton/>,
            <RateQuestion_1.RateQuestion question={question} readonly={!checkAuthorization(QuestionPermission_1.default.Rate)}/>,
            {
                update: checkAuthorization(QuestionPermission_1.default.Update, question) &&
                    <AddQuestion_1.default question={question} onSubmit={refreshExamAndTable} iconButton/>,
                delete: checkAuthorization(QuestionPermission_1.default.Delete, question) &&
                    <DeleteQuestion_1.default question={question} onSubmit={refreshExamAndTable} iconButton/>,
            },
        ]}/>
  </>;
};
exports.default = (0, react_2.memo)(Exam);
//# sourceMappingURL=Exam.js.map