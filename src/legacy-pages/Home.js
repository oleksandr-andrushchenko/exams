"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("@material-tailwind/react");
const solid_1 = require("@heroicons/react/24/solid");
const Route_1 = __importDefault(require("../enum/Route"));
const react_2 = require("react");
const apolloClient_1 = require("../client/graphql/apolloClient");
const getHomeData_1 = __importDefault(require("../client/graphql/home/getHomeData"));
const H1_1 = __importDefault(require("../components/typography/H1"));
const H2_1 = __importDefault(require("../components/typography/H2"));
const Link_1 = __importDefault(require("../components/elements/Link"));
const Spinner_1 = __importDefault(require("../components/Spinner"));
const Error_1 = __importDefault(require("../components/Error"));
const score = (value) => value?.averageMark || 0;
const TagGrid = ({ tags }) => <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
  {tags.map(tag => <Link_1.default key={tag.id} to={Route_1.default.ExamTag.replace(':tagSlug', tag.slug)}>
    <div className="relative h-28 overflow-hidden rounded-lg bg-gradient-to-br from-blue-gray-500 to-blue-gray-800 shadow transition hover:shadow-lg">
      {tag.imageFilename && <img src={tag.imageFilename} alt="" className="h-full w-full object-cover"/>}
      <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/75 to-transparent p-3"><span className="font-semibold text-white">{tag.name}</span></div>
    </div>
  </Link_1.default>)}
</div>;
const ExamCards = ({ exams }) => <div className="grid gap-3 sm:grid-cols-2">
  {exams.map(exam => <react_1.Card key={exam.id}><react_1.CardBody className="p-4">
    <Link_1.default label={exam.name} to={Route_1.default.Exam.replace(':examId', exam.id)} className="font-semibold"/>
    <div className="mt-2 text-sm text-blue-gray-600">{exam.approvedQuestionCount ?? 0}/{exam.questionCount ?? 0} questions · score {exam.requiredScore ?? 0}%</div>
    {exam.tags?.length ? <div className="mt-2 text-xs text-blue-gray-500">{exam.tags.map(tag => tag.name).join(' · ')}</div> : null}
  </react_1.CardBody></react_1.Card>)}
</div>;
const QuestionCards = ({ questions }) => <div className="space-y-2">
  {questions.map(question => <react_1.Card key={question.id}><react_1.CardBody className="p-4">
    <Link_1.default label={question.title} to={Route_1.default.Question.replace(':examId', question.exam?.id || question.examId || '').replace(':questionId', question.id)} className="font-semibold"/>
    <div className="mt-1 text-sm text-blue-gray-600">{question.exam?.name || 'Exam'} · {question.difficulty || 'Difficulty not set'}</div>
  </react_1.CardBody></react_1.Card>)}
</div>;
const UserCards = ({ users }) => <div className="grid gap-3 sm:grid-cols-2">
  {users.map(user => <react_1.Card key={user.id}><react_1.CardBody className="p-4">
    <Link_1.default label={user.name || 'Unnamed user'} to={Route_1.default.User.replace(':userId', user.id)} className="font-semibold"/>
    <div className="mt-1 text-sm text-blue-gray-600">Joined {user.createdAt ? new Date(user.createdAt).toDateString() : 'recently'}</div>
  </react_1.CardBody></react_1.Card>)}
</div>;
const Home = () => {
    const [data, setData] = (0, react_2.useState)();
    const [error, setError] = (0, react_2.useState)('');
    const [loading, setLoading] = (0, react_2.useState)(true);
    (0, react_2.useEffect)(() => { document.title = 'ExamMe'; }, []);
    (0, react_2.useEffect)(() => { (0, apolloClient_1.apiQuery)((0, getHomeData_1.default)(), setData, setError, setLoading); }, []);
    const tags = data?.examTags || [];
    const exams = data?.paginatedExams.data || [];
    const questions = data?.paginatedQuestions.data || [];
    const users = data?.paginatedUsers.data || [];
    const popularExams = [...exams].sort((a, b) => score(b.rating) - score(a.rating)).slice(0, 6);
    const popularQuestions = [...questions].sort((a, b) => score(b.rating) - score(a.rating)).slice(0, 6);
    return <>
    <react_1.Breadcrumbs><Link_1.default icon={solid_1.HomeIcon} label="Home" to={Route_1.default.Home}/></react_1.Breadcrumbs>
    <H1_1.default label="Home" sub="Explore exams, questions, and the ExamMe community"/>
    {error && <Error_1.default text={error}/>}
    {loading ? <Spinner_1.default /> : <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
      <main className="space-y-8 xl:col-span-2">
        <section><H2_1.default icon={solid_1.TagIcon} label="Popular topics"/><TagGrid tags={tags.slice(0, 8)}/></section>
        <section><H2_1.default icon={solid_1.AcademicCapIcon} label="Popular exams"/><ExamCards exams={popularExams}/></section>
        <section><H2_1.default icon={solid_1.QuestionMarkCircleIcon} label="Popular questions"/><QuestionCards questions={popularQuestions}/></section>
        <section><H2_1.default icon={solid_1.UserGroupIcon} label="Popular users"/><UserCards users={users.slice(0, 6)}/></section>
      </main>
      <aside className="space-y-8">
        <section><H2_1.default label="Latest exams"/><ExamCards exams={exams.slice(0, 5)}/></section>
        <section><H2_1.default label="Latest questions"/><QuestionCards questions={questions.slice(0, 5)}/></section>
        <section><H2_1.default label="Latest tags"/><TagGrid tags={tags.slice(0, 5)}/></section>
        <section><H2_1.default label="Latest users"/><UserCards users={users.slice(0, 5)}/></section>
      </aside>
    </div>}
  </>;
};
exports.default = (0, react_2.memo)(Home);
//# sourceMappingURL=Home.js.map