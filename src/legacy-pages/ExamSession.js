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
const ExamSessionPermission_1 = __importDefault(require("../enum/examSession/ExamSessionPermission"));
const DeleteExamSession_1 = __importDefault(require("../components/examSession/DeleteExamSession"));
const CreateQuestion_1 = require("../schema/question/CreateQuestion");
const CompleteExamSession_1 = __importDefault(require("../components/examSession/CompleteExamSession"));
const apolloClient_1 = require("../client/graphql/apolloClient");
const createExamSessionQuestionAnswer_1 = __importDefault(require("../client/graphql/examSession/createExamSessionQuestionAnswer"));
const getExamSessionQuestion_1 = __importDefault(require("../client/graphql/examSession/getExamSessionQuestion"));
const getCurrentExamSessionQuestion_1 = __importDefault(require("../client/graphql/examSession/getCurrentExamSessionQuestion"));
const deleteExamSessionQuestionAnswer_1 = __importDefault(require("../client/graphql/examSession/deleteExamSessionQuestionAnswer"));
const Error_1 = __importDefault(require("../components/Error"));
const Unauthenticated_1 = __importDefault(require("./Unauthenticated"));
const Unauthorized_1 = __importDefault(require("./Unauthorized"));
const H1_1 = __importDefault(require("../components/typography/H1"));
const Link_1 = __importDefault(require("../components/elements/Link"));
const H2_1 = __importDefault(require("../components/typography/H2"));
const Button_1 = __importDefault(require("../components/elements/Button"));
const InfoTable_1 = __importDefault(require("../components/elements/InfoTable"));
const YesNo_1 = __importDefault(require("../components/elements/YesNo"));
const ExamSession = () => {
    const { examSessionId } = (0, react_router_dom_1.useParams)();
    const [questionNumber, setQuestionNumber] = (0, react_2.useState)();
    const [examSessionQuestion, setExamSessionQuestion] = (0, react_2.useState)();
    const [answering, setAnswering] = (0, react_2.useState)(false);
    const [clearing, setClearing] = (0, react_2.useState)(false);
    const [_, setLoading] = (0, react_2.useState)(true);
    const [error, setError] = (0, react_2.useState)('');
    const { authenticationToken, me, checkAuthorization } = (0, useAuth_1.default)();
    const navigate = (0, react_router_dom_1.useNavigate)();
    const examSession = examSessionQuestion?.examSession;
    const exam = examSession?.exam;
    const onPrevQuestionClick = () => setQuestionNumber(getQuestionNumber() - 1);
    const onNextQuestionClick = () => setQuestionNumber(getQuestionNumber() + 1);
    const onCompleted = (data) => setExamSessionQuestion({
        ...examSessionQuestion,
        ...{ examSession: data.createExamSessionCompletion },
    });
    const onDeleted = () => navigate(Route_1.default.Exam.replace(':examId', examSessionQuestion.examSession.examId), { replace: true });
    const getQuestionNumber = () => {
        if (questionNumber !== undefined) {
            return questionNumber;
        }
        if (examSessionQuestion === undefined) {
            return 0;
        }
        return examSessionQuestion.number ?? 0;
    };
    const showPrev = () => {
        if (answering || clearing) {
            return false;
        }
        const questionNumber = getQuestionNumber();
        return questionNumber > 0;
    };
    const showNext = () => {
        if (answering || clearing) {
            return false;
        }
        const questionNumber = getQuestionNumber();
        return questionNumber < (examSessionQuestion?.examSession?.questionCount ?? 0) - 1;
    };
    const createAnswer = (answer) => {
        const transfer = examSessionQuestion.question.type === CreateQuestion_1.QuestionType.CHOICE
            ? { choice: answer }
            : { answer: answer };
        (0, apolloClient_1.apiMutate)((0, createExamSessionQuestionAnswer_1.default)(examSessionId, getQuestionNumber(), transfer), (data) => setExamSessionQuestion(data.createExamSessionQuestionAnswer), setError, setAnswering);
    };
    const clearAnswer = () => {
        (0, apolloClient_1.apiMutate)((0, deleteExamSessionQuestionAnswer_1.default)(examSessionId, getQuestionNumber()), (data) => setExamSessionQuestion(data.deleteExamSessionQuestionAnswer), setError, setClearing);
    };
    (0, react_2.useEffect)(() => {
        if (questionNumber === undefined) {
            (0, apolloClient_1.apiQuery)((0, getCurrentExamSessionQuestion_1.default)(examSessionId), (data) => setExamSessionQuestion(data.currentExamSessionQuestion), setError, setLoading);
        }
        else {
            (0, apolloClient_1.apiQuery)((0, getExamSessionQuestion_1.default)(examSessionId, questionNumber), (data) => setExamSessionQuestion(data.examSessionQuestion), setError, setLoading);
        }
    }, [questionNumber]);
    (0, react_2.useEffect)(() => {
        document.title = `ExamSession: ${examSessionQuestion?.examSession?.exam?.name || 'ExamMe'}`;
    }, [examSessionQuestion?.examSession?.exam?.name]);
    if (!authenticationToken) {
        return <Unauthenticated_1.default />;
    }
    if (!me) {
        return <Spinner_1.default />;
    }
    if (examSessionQuestion && !checkAuthorization(ExamSessionPermission_1.default.Get, examSessionQuestion?.examSession)) {
        return <Unauthorized_1.default />;
    }
    const layout = (header, body) => {
        return <>
      <react_1.Breadcrumbs>
        <Link_1.default icon={solid_1.HomeIcon} label="Home" to={Route_1.default.Home}/>
        <Link_1.default label="Exams" to={Route_1.default.Exams}/>
        {!examSessionQuestion ? <Spinner_1.default type="text"/> : <Link_1.default label={examSessionQuestion.examSession.exam.name} to={Route_1.default.Exam.replace(':examId', examSessionQuestion.examSession.examId)}/>}
        <Link_1.default label="ExamSession" to={Route_1.default.ExamSession.replace(':examSessionId', examSessionId)}/>
      </react_1.Breadcrumbs>

      <H1_1.default sub={header}>ExamSession: {examSessionQuestion ? examSessionQuestion.examSession.exam.name : <Spinner_1.default type="text"/>}</H1_1.default>

      {error && <Error_1.default text={error}/>}

      {body}
    </>;
    };
    if (examSession?.completedAt) {
        const score = Math.floor(100 * (examSession.correctAnswerCount ?? 0) / (examSession.questionCount ?? 1));
        const requiredScore = exam?.requiredScore ?? 0;
        const passed = score > requiredScore;
        return layout('ExamSession completed', (<InfoTable_1.default columns={['Completion date', 'Correct answers', 'Required score', 'Passed']} source={examSession} mapper={(examSession) => [
                new Date(examSession.completedAt).toDateString(),
                <>{examSession.correctAnswerCount}/{examSession?.questionCount} ({score}%)</>,
                <>{requiredScore}%</>,
                <YesNo_1.default yes={passed}/>,
            ]}/>));
    }
    return layout('ExamSession questions', <>
    {!examSessionQuestion ? <Spinner_1.default type="text" height="h-3"/> :
            <react_1.Progress value={Math.floor(100 * (getQuestionNumber() + 1) / (examSessionQuestion.examSession?.questionCount ?? 1))} label="Steps" size="sm" className="mt-4"/>}

    {!examSessionQuestion ? <Spinner_1.default type="text" height="h-4"/> :
            <react_1.Progress value={Math.floor(100 * (examSessionQuestion.examSession?.answeredQuestionCount ?? 0) / (examSessionQuestion.examSession?.questionCount ?? 1))} label="Answered" size="lg" className="mt-4"/>}

    {!examSessionQuestion ? <Spinner_1.default type="text"/> :
            <H2_1.default className="min-h-8">Question #{getQuestionNumber() + 1}: {examSessionQuestion.question.title}</H2_1.default>}

    <div className="flex flex-col gap-2 mt-4 min-h-48">
      {!examSessionQuestion ? <Spinner_1.default /> : (examSessionQuestion.question.type === CreateQuestion_1.QuestionType.CHOICE
            ? examSessionQuestion.choices.map((choice, index) => (<react_1.Checkbox key={`${examSessionQuestion.question.id}-${index}-${examSessionQuestion.choice}`} name="choice" defaultChecked={index === examSessionQuestion.choice} onChange={(e) => e.target.checked ? createAnswer(index) : clearAnswer()} label={choice} disabled={answering}/>))
            : <react_1.Input type="text" name="answer" size="lg" label="Answer" onChange={(e) => createAnswer(e.target.value)} disabled={answering}/>)}
    </div>

    <div className="flex gap-1 items-center mt-4">
      {examSessionQuestion &&
            <react_1.ButtonGroup variant="outlined">
          <Button_1.default icon={solid_1.ArrowLeftIcon} label="Prev" onClick={onPrevQuestionClick} disabled={!showPrev()}/>
          <Button_1.default icon={solid_1.ArrowRightIcon} label="Next" onClick={onNextQuestionClick} disabled={!showNext()}/>
        </react_1.ButtonGroup>}

      {examSessionQuestion && checkAuthorization(ExamSessionPermission_1.default.CreateCompletion, examSessionQuestion.examSession) &&
            <CompleteExamSession_1.default examSession={examSessionQuestion.examSession} onSubmit={onCompleted}/>}

      {examSessionQuestion && checkAuthorization(ExamSessionPermission_1.default.Delete, examSessionQuestion.examSession) &&
            <DeleteExamSession_1.default examSession={examSessionQuestion.examSession} onSubmit={onDeleted}/>}
    </div>
  </>);
};
exports.default = (0, react_2.memo)(ExamSession);
//# sourceMappingURL=ExamSession.js.map