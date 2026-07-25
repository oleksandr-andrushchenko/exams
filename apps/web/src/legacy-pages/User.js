"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("@material-tailwind/react");
const solid_1 = require("@heroicons/react/24/solid");
const react_2 = require("react");
const react_router_dom_1 = require("react-router-dom");
const apolloClient_1 = require("../client/graphql/apolloClient");
const getUserForUserPage_1 = __importDefault(require("../client/graphql/users/getUserForUserPage"));
const getExamsForExamsPage_1 = __importDefault(require("../client/graphql/exam/getExamsForExamsPage"));
const getExamSessionsForUserPage_1 = __importDefault(require("../client/graphql/examSession/getExamSessionsForUserPage"));
const Error_1 = __importDefault(require("../components/Error"));
const Spinner_1 = __importDefault(require("../components/Spinner"));
const InfoTable_1 = __importDefault(require("../components/elements/InfoTable"));
const Table_1 = __importDefault(require("../components/elements/Table"));
const H2_1 = __importDefault(require("../components/typography/H2"));
const Link_1 = __importDefault(require("../components/elements/Link"));
const H1_1 = __importDefault(require("../components/typography/H1"));
const Route_1 = __importDefault(require("../enum/Route"));
const User = () => {
    const { userId } = (0, react_router_dom_1.useParams)();
    const [user, setUser] = (0, react_2.useState)();
    const [error, setError] = (0, react_2.useState)('');
    const [_, setLoading] = (0, react_2.useState)(true);
    (0, react_2.useEffect)(() => {
        document.title = user?.name || 'User profile';
    }, [user?.name]);
    (0, react_2.useEffect)(() => {
        (0, apolloClient_1.apiQuery)((0, getUserForUserPage_1.default)(userId), (data) => setUser(data.user), setError, setLoading);
    }, [userId]);
    return <>
    <react_1.Breadcrumbs>
      <Link_1.default icon={solid_1.HomeIcon} label="Home" to={Route_1.default.Home}/>
      <Link_1.default label="Users" to={Route_1.default.Users}/>
      {user ? <Link_1.default label={user.name || 'Unnamed user'} to={Route_1.default.User.replace(':userId', userId)}/> : <Spinner_1.default type="text"/>}
    </react_1.Breadcrumbs>

    <H1_1.default icon={solid_1.UserCircleIcon} label={user?.name || <Spinner_1.default type="text"/>} sub="User profile"/>

    {error && <Error_1.default text={error}/>}

    {user && <InfoTable_1.default title="Profile info" columns={['Name', 'Joined', 'Updated']} source={user} mapper={(profile) => [
                profile.name || 'Unnamed user',
                profile.createdAt ? new Date(profile.createdAt).toDateString() : 'N/A',
                profile.updatedAt ? new Date(profile.updatedAt).toDateString() : 'N/A',
            ]}/>}

    {user && <>
      <H2_1.default label="Exams"/>
      <Table_1.default key2={userId} columns={['#', 'Name', 'Tags', 'Questions', 'Required score', 'Rating']} queryOptions={filter => (0, getExamsForExamsPage_1.default)({ ...filter, userId })} queryData={(data) => data.paginatedExams} mapper={(exam, index) => [
                exam.id,
                index + 1,
                <Link_1.default label={exam.name} to={Route_1.default.Exam.replace(':examId', exam.id)}/>,
                exam.tags?.map(tag => tag.name).join(', ') || '—',
                `${exam.approvedQuestionCount ?? 0}/${exam.questionCount ?? 0}`,
                exam.rating?.averageMark ?? 'N/A',
            ]}/>

      <H2_1.default label="Exam sessions"/>
      <Table_1.default key2={userId} columns={['#', 'Exam', 'Progress', 'Score', 'Status', 'Started']} queryOptions={filter => (0, getExamSessionsForUserPage_1.default)(userId, filter)} queryData={(data) => data.paginatedExamSessions} mapper={(session, index) => [
                session.id,
                index + 1,
                session.exam ? <Link_1.default label={session.exam.name} to={Route_1.default.Exam.replace(':examId', session.exam.id)}/> : session.examId,
                `${session.answeredQuestionCount ?? 0}/${session.questionCount ?? 0}`,
                session.correctAnswerCount ?? '—',
                session.completedAt ? 'Completed' : 'In progress',
                session.createdAt ? new Date(session.createdAt).toDateString() : 'N/A',
            ]}/>
    </>}
  </>;
};
exports.default = (0, react_2.memo)(User);
//# sourceMappingURL=User.js.map