"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_router_dom_1 = require("react-router-dom");
const react_1 = require("@material-tailwind/react");
const Route_1 = __importDefault(require("../enum/Route"));
const useAuth_1 = __importDefault(require("../hooks/useAuth"));
const solid_1 = require("@heroicons/react/24/solid");
const react_2 = require("react");
const AddExam_1 = __importDefault(require("../components/exam/AddExam"));
const AddQuestion_1 = __importDefault(require("../components/question/AddQuestion"));
const DeleteExam_1 = __importDefault(require("../components/exam/DeleteExam"));
const getExamsForExamsPage_1 = __importDefault(require("../client/graphql/exam/getExamsForExamsPage"));
const AddExamSession_1 = __importDefault(require("../components/examSession/AddExamSession"));
const ExamPermission_1 = __importDefault(require("../enum/exam/ExamPermission"));
const H1_1 = __importDefault(require("../components/typography/H1"));
const icons_1 = require("../registry/icons");
const Table_1 = __importDefault(require("../components/elements/Table"));
const Link_1 = __importDefault(require("../components/elements/Link"));
const ApproveExam_1 = require("../components/exam/ApproveExam");
const YesNo_1 = __importDefault(require("../enum/YesNo"));
const canAddExamSession_1 = __importDefault(require("../services/examSessions/canAddExamSession"));
const CreatorBadge_1 = __importDefault(require("../components/badges/CreatorBadge"));
const RateExam_1 = require("../components/exam/RateExam");
const ExamTags_1 = __importDefault(require("../components/examTag/ExamTags"));
const Exams = ({ tagSlug }) => {
    const tagName = tagSlug?.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
    const [tableKey, setTableKey] = (0, react_2.useState)(0);
    const refresh = () => setTableKey(Math.random());
    const { authenticationToken, checkAuthorization } = (0, useAuth_1.default)();
    const navigate = (0, react_router_dom_1.useNavigate)();
    (0, react_2.useEffect)(() => {
        refresh();
    }, [authenticationToken]);
    (0, react_2.useEffect)(() => {
        document.title = tagName ? tagName + ' Exams' : 'Exams';
    }, [tagName]);
    return <>
    <react_1.Breadcrumbs>
      <Link_1.default icon={solid_1.HomeIcon} label="Home" to={Route_1.default.Home}/>
      <Link_1.default label="Exams" to={Route_1.default.Exams}/>
      {tagSlug && <Link_1.default label={tagName} to={Route_1.default.ExamTag.replace(':tagSlug', tagSlug)}/>}
    </react_1.Breadcrumbs>

    <H1_1.default icon={icons_1.ListIcon} label={tagName ? 'Exams tagged ' + tagName : 'Exams'} sub={tagName ? 'All exams with the ' + tagName + ' tag' : 'Exams info'}/>

    <Table_1.default key2={tableKey} buttons={{
            create: <AddExam_1.default onSubmit={(exam) => navigate(Route_1.default.Exam.replace(':examId', exam.id))}/>,
        }} tabs={{
            approved: Object.values(YesNo_1.default),
        }} columns={['#', 'Name', 'Tags', 'Questions', 'Required score', 'Approved', 'Rating', '']} queryOptions={(filter) => (0, getExamsForExamsPage_1.default)({ ...filter, tag: tagSlug })} queryData={(data) => data.paginatedExams} mapper={(exam, index) => [
            exam.id,
            index + 1,
            <Link_1.default label={exam.name} sup={exam.isCreator ? <CreatorBadge_1.default /> : ''} tooltip={exam.name} to={Route_1.default.Exam.replace(':examId', exam.id)}/>,
            <ExamTags_1.default tags={exam.tags}/>,
            `${exam.approvedQuestionCount ?? 0}/${exam.questionCount ?? 0}`,
            exam.requiredScore ?? 0,
            <ApproveExam_1.ApproveExam exam={exam} readonly={!checkAuthorization(ExamPermission_1.default.Approve)} iconButton/>,
            <RateExam_1.RateExam exam={exam} readonly={!checkAuthorization(ExamPermission_1.default.Rate)}/>,
            {
                addQuestion: <AddQuestion_1.default exam={exam} onSubmit={refresh} iconButton/>,
                update: checkAuthorization(ExamPermission_1.default.Update, exam) &&
                    <AddExam_1.default exam={exam} onSubmit={refresh} iconButton/>,
                delete: checkAuthorization(ExamPermission_1.default.Delete, exam) &&
                    <DeleteExam_1.default exam={exam} onSubmit={refresh} iconButton/>,
                examSession: (0, canAddExamSession_1.default)(exam) && <AddExamSession_1.default exam={exam} iconButton/>,
            },
        ]}/>
  </>;
};
exports.default = (0, react_2.memo)(Exams);
//# sourceMappingURL=Exams.js.map