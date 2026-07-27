"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
 return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("@/components/bootstrap");
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
const TagGrid = ({ tags }) => <div className="row row-cols-1 row-cols-sm-3 row-cols-md-4 g-3">
 {tags.map(tag => <Link_1.default key={tag.id} to={Route_1.default.ExamTag.replace(':tagSlug', tag.slug)}>
 <div className="position-relative ratio ratio-16x9 overflow-hidden rounded bg-secondary ">
 {tag.imageFilename && <img src={tag.imageFilename} alt="" className="h-100 w-100 object-fit-cover"/>}
 <div className="position-absolute top-0 bottom-0 start-0 end-0 d-flex align-items-end bg-dark bg-opacity-75 p-3"><span className="fw-semibold text-white">{tag.name}</span></div>
 </div>
 </Link_1.default>)}
</div>;
const ExamCards = ({ exams }) => <div className="row row-cols-1 row-cols-md-2 g-3">
 {exams.map(exam => <react_1.Card key={exam.id}><react_1.CardBody className="p-4">
 <Link_1.default label={exam.name} to={Route_1.default.Exam.replace(':examId', exam.id)} className="fw-semibold"/>
 <div className="mt-2 small text-secondary">{exam.approvedQuestionCount ?? 0}/{exam.questionCount ?? 0} questions · score {exam.requiredScore ?? 0}%</div>
 {exam.tags?.length ? <div className="mt-2 small text-secondary">{exam.tags.map(tag => tag.name).join(' · ')}</div> : null}
 </react_1.CardBody></react_1.Card>)}
</div>;
const QuestionCards = ({ questions }) => <div className="row row-cols-1 row-cols-md-2 g-3">
 {questions.map(question => <react_1.Card key={question.id}><react_1.CardBody className="p-4">
 <Link_1.default label={question.title} to={Route_1.default.Question.replace(':examId', question.exam?.id || question.examId || '').replace(':questionId', question.id)} className="fw-semibold"/>
 <div className="mt-1 small text-secondary">{question.exam?.name || 'Exam'} · {question.difficulty || 'Difficulty not set'}</div>
 </react_1.CardBody></react_1.Card>)}
</div>;
const UserCards = ({ users }) => <div className="row row-cols-1 row-cols-md-2 g-3">
 {users.map(user => <react_1.Card key={user.id}><react_1.CardBody className="p-4">
 <Link_1.default label={user.name || 'Unnamed user'} to={Route_1.default.User.replace(':userId', user.id)} className="fw-semibold"/>
 <div className="mt-1 small text-secondary">Joined {user.createdAt ? new Date(user.createdAt).toDateString() : 'recently'}</div>
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
 {loading ? <Spinner_1.default /> : <div className="row g-5">
 <main className="d-flex flex-column gap-2 col-xl-8">
 <section><H2_1.default icon={solid_1.TagIcon} label="Popular topics"/><TagGrid tags={tags.slice(0, 8)}/></section>
 <section><H2_1.default icon={solid_1.AcademicCapIcon} label="Popular exams"/><ExamCards exams={popularExams}/></section>
 <section><H2_1.default icon={solid_1.QuestionMarkCircleIcon} label="Popular questions"/><QuestionCards questions={popularQuestions}/></section>
 <section><H2_1.default icon={solid_1.UserGroupIcon} label="Popular users"/><UserCards users={users.slice(0, 6)}/></section>
 </main>
 <aside className="col-xl-4 d-flex flex-column gap-2">
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