"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
 return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_router_dom_1 = require("react-router-dom");
const react_1 = require("@/components/bootstrap");
const Route_1 = __importDefault(require("../enum/Route"));
const solid_1 = require("@heroicons/react/24/solid");
const react_2 = require("react");
const useAuth_1 = __importDefault(require("../hooks/useAuth"));
const Spinner_1 = __importDefault(require("../components/Spinner"));
const DeleteQuestion_1 = __importDefault(require("../components/question/DeleteQuestion"));
const CreateQuestion_1 = require("../schema/question/CreateQuestion");
const AddQuestion_1 = __importDefault(require("../components/question/AddQuestion"));
const apolloClient_1 = require("../client/graphql/apolloClient");
const getQuestionForQuestionPage_1 = __importDefault(require("../client/graphql/question/getQuestionForQuestionPage"));
const Error_1 = __importDefault(require("../components/Error"));
const QuestionPermission_1 = __importDefault(require("../enum/question/QuestionPermission"));
const H1_1 = __importDefault(require("../components/typography/H1"));
const Link_1 = __importDefault(require("../components/elements/Link"));
const InfoTable_1 = __importDefault(require("../components/elements/InfoTable"));
const ApproveQuestion_1 = require("../components/question/ApproveQuestion");
const CreatorBadge_1 = __importDefault(require("../components/badges/CreatorBadge"));
const RateQuestion_1 = require("../components/question/RateQuestion");
const Buttons_1 = __importDefault(require("../components/elements/Buttons"));
const Question = () => {
 const { questionId } = (0, react_router_dom_1.useParams)();
 const [question, setQuestion] = (0, react_2.useState)();
 const [infoTableKey, setInfoTableKey] = (0, react_2.useState)(1);
 const [_, setLoading] = (0, react_2.useState)(true);
 const [error, setError] = (0, react_2.useState)('');
 const { checkAuthorization } = (0, useAuth_1.default)();
 const navigate = (0, react_router_dom_1.useNavigate)();
 const updateQuestion = (question) => setQuestion(question);
 const refreshQuestion = () => (0, apolloClient_1.apiQuery)((0, getQuestionForQuestionPage_1.default)(questionId), (data) => setQuestion(data.question), setError, setLoading);
 const refreshInfoTable = () => {
 setInfoTableKey(Math.random());
 };
 const updateQuestionAndRefreshInfoTable = (question) => {
 updateQuestion(question);
 refreshInfoTable();
 };
 const onDelete = () => navigate(Route_1.default.Exam.replace(':examId', question.examId), { replace: true });
 (0, react_2.useEffect)(() => {
 document.title = question?.title || 'ExamMe';
 refreshQuestion();
 }, []);
 return <>
 <react_1.Breadcrumbs>
 <Link_1.default icon={solid_1.HomeIcon} label="Home" to={Route_1.default.Home}/>
 <Link_1.default label="Exams" to={Route_1.default.Exams}/>
 {!question ? <Spinner_1.default type="text"/> :
 <Link_1.default label={question.exam.name} to={Route_1.default.Exam.replace(':examId', question.examId)}/>}
 {!question ? <Spinner_1.default type="text"/> :
 <Link_1.default label={question.title} to={Route_1.default.Question.replace(':questionId', question.id)}/>}
 </react_1.Breadcrumbs>

 <H1_1.default label={question?.title ?? <Spinner_1.default type="text"/>} sup={question?.isCreator ? <CreatorBadge_1.default /> : ''}/>

 {question ?
 <RateQuestion_1.RateQuestion question={question} onChange={updateQuestion} readonly={!checkAuthorization(QuestionPermission_1.default.Rate)} showAverageMark showMarkCount/> : <Spinner_1.default type="text"/>}

 {error && <Error_1.default text={error}/>}

 <Buttons_1.default className="mt-2" buttons={{
 approve: !question ? <Spinner_1.default type="button"/> : (checkAuthorization(QuestionPermission_1.default.Approve) &&
 <ApproveQuestion_1.ApproveQuestion question={question} onChange={updateQuestionAndRefreshInfoTable}/>),
 update: !question ? <Spinner_1.default type="button"/> : (checkAuthorization(QuestionPermission_1.default.Update, question) &&
 <AddQuestion_1.default question={question} onSubmit={updateQuestion}/>),
 delete: !question ? <Spinner_1.default type="button"/> : (checkAuthorization(QuestionPermission_1.default.Delete, question) &&
 <DeleteQuestion_1.default question={question} onSubmit={onDelete}/>),
 }}/>

 <InfoTable_1.default className="mt-4" title="Question info" key2={infoTableKey} columns={['Title', 'Exam', 'Type', 'Choices', 'Difficulty', 'Rating', 'Approved']} source={question} mapper={(question) => [
 question.title,
 question.exam.name,
 question.type,
 question.type === CreateQuestion_1.QuestionType.CHOICE ? (question.choices || []).map((choice, index) => (<react_1.Checkbox key={`${question.id}-${index}`} name="choice" label={choice.title} disabled={true}/>)) : 'N/A',
 question.difficulty,
 <RateQuestion_1.RateQuestion question={question} readonly/>,
 <ApproveQuestion_1.ApproveQuestion question={question} readonly/>,
 ]}/>
 </>;
};
exports.default = (0, react_2.memo)(Question);
//# sourceMappingURL=Question.js.map