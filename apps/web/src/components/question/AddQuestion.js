"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
 if (k2 === undefined) k2 = k;
 var desc = Object.getOwnPropertyDescriptor(m, k);
 if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
 desc = { enumerable: true, get: function() { return m[k]; } };
 }
 Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
 if (k2 === undefined) k2 = k;
 o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
 Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
 o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
 var ownKeys = function(o) {
 ownKeys = Object.getOwnPropertyNames || function (o) {
 var ar = [];
 for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
 return ar;
 };
 return ownKeys(o);
 };
 return function (mod) {
 if (mod && mod.__esModule) return mod;
 var result = {};
 if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
 __setModuleDefault(result, mod);
 return result;
 };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
 return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("@/components/bootstrap");
const react_2 = require("react");
const CreateQuestion_1 = require("../../schema/question/CreateQuestion");
const apolloClient_1 = require("../../client/graphql/apolloClient");
const createQuestion_1 = __importDefault(require("../../client/graphql/question/createQuestion"));
const updateQuestion_1 = __importDefault(require("../../client/graphql/question/updateQuestion"));
const Spinner_1 = __importDefault(require("../Spinner"));
const Error_1 = __importDefault(require("../Error"));
const yup = __importStar(require("yup"));
const formik_1 = require("formik");
const FormikTextarea_1 = __importDefault(require("../formik/FormikTextarea"));
const FormikSelect_1 = __importDefault(require("../formik/FormikSelect"));
const FormikInput_1 = __importDefault(require("../formik/FormikInput"));
const FormikCheckbox_1 = __importDefault(require("../formik/FormikCheckbox"));
const icons_1 = require("../../registry/icons");
const IconButton_1 = __importDefault(require("../elements/IconButton"));
const Button_1 = __importDefault(require("../elements/Button"));
const useAuth_1 = __importDefault(require("../../hooks/useAuth"));
const Auth_1 = __importDefault(require("../Auth"));
const QuestionPermission_1 = __importDefault(require("../../enum/question/QuestionPermission"));
const H3_1 = __importDefault(require("../typography/H3"));
const AddExam_1 = __importDefault(require("../exam/AddExam"));
const getExamsForSelect_1 = __importDefault(require("../../client/graphql/exam/getExamsForSelect"));
const AddQuestion = ({ exam, question, onSubmit, iconButton = false }) => {
 const [open, setOpen] = (0, react_2.useState)(false);
 const [exams, setExams] = (0, react_2.useState)();
 const handleOpen = () => setOpen(!open);
 const [_, setLoading] = (0, react_2.useState)(true);
 const [error, setError] = (0, react_2.useState)('');
 const { authenticationToken, checkAuthorization } = (0, useAuth_1.default)();
 const refreshExams = () => (0, apolloClient_1.apiQuery)((0, getExamsForSelect_1.default)(), (data) => setExams(data.exams), setError, setLoading);
 (0, react_2.useEffect)(() => {
 if (!exam && !question) {
 refreshExams();
 }
 }, []);
 const icon = question ? icons_1.EditIcon : icons_1.CreateIcon;
 const label = question ? 'Update Question' : 'Add Question';
 if (!authenticationToken) {
 return <Auth_1.default button={{ icon, label, size: 'sm', iconOnly: iconButton }} dialog={{ label: 'You need to be authenticated' }} onSubmit={() => setOpen(true)}/>;
 }
 const buildButton = (props = {}) => {
 if (iconButton) {
 return <IconButton_1.default icon={icon} tooltip={label} onClick={handleOpen} {...props}/>;
 }
 return <Button_1.default icon={icon} label={label} onClick={handleOpen} {...props}/>;
 };
 const permission = question ? QuestionPermission_1.default.Update : QuestionPermission_1.default.Create;
 if (!checkAuthorization(permission, question)) {
 return buildButton({ disabled: true, tooltip: 'You are not allowed to do this' });
 }
 return <>
 {buildButton()}
 <react_1.Dialog open={open} handler={handleOpen} className="text-start">
 <react_1.Card>
 <react_1.CardBody className="d-flex flex-column gap-4">
 <H3_1.default icon={icon} label={label}/>
 <formik_1.Formik initialValues={{
 title: question?.title || '',
 type: question?.type || CreateQuestion_1.QuestionType.CHOICE,
 examId: question?.examId || '',
 difficulty: question?.difficulty || '',
 choices: question?.choices || [new CreateQuestion_1.QuestionChoice()],
 }} validationSchema={yup.object({
 title: yup.string()
 .min(10, 'Title must be at least 10 characters')
 .max(300, 'Title cannot exceed 300 characters')
 .matches(/^[a-zA-Z]/, 'Title must start with a letter')
 .required('Title is required'),
 examId: exam || question ? yup.string().optional() : yup.lazy(_ => {
 if (exams) {
 return yup.string()
 .oneOf(exams.map(exam => exam.id))
 .required('Exam is required');
 }
 return yup.string().required('Exam is required');
 }),
 type: yup.string()
 .oneOf(Object.values(CreateQuestion_1.QuestionType))
 .required('Type is required'),
 difficulty: yup.string()
 .oneOf(Object.values(CreateQuestion_1.QuestionDifficulty))
 .required('Difficulty is required'),
 choices: yup.mixed().when('type', {
 is: CreateQuestion_1.QuestionType.CHOICE,
 then: () => yup.array().of(yup.object().shape({
 title: yup.string()
 .min(10, 'Choice title must be at least 10 characters')
 .max(3000, 'Choice title cannot exceed 3000 characters')
 .matches(/^[a-zA-Z]/, 'Choice title must start with a letter')
 .required('Choice title is required'),
 explanation: yup.lazy((value) => {
 if (!!value) {
 return yup.string()
 .min(10, 'Choice explanation must be at least 10 characters')
 .max(3000, 'Choice explanation cannot exceed 3000 characters')
 .matches(/^[a-zA-Z]/, 'Explanation must start with a letter');
 }
 return yup.string()
 .nullable()
 .optional();
 }),
 correct: yup.boolean(),
 })),
 }),
 })} onSubmit={(values, { setSubmitting }) => {
 setError('');
 const transfer = {
 examId: exam?.id || question?.examId || values.examId || '',
 title: values.title,
 type: values.type,
 difficulty: values.difficulty,
 choices: values.choices.map(choice => {
 if (!choice.explanation) {
 delete choice.explanation;
 }
 return choice;
 }),
 };
 const callback = (question) => {
 setOpen(false);
 onSubmit && onSubmit(question);
 };
 if (question) {
 (0, apolloClient_1.apiMutate)((0, updateQuestion_1.default)(question.id, transfer), (data) => callback(data.updateQuestion), setError, setSubmitting);
 }
 else {
 (0, apolloClient_1.apiMutate)((0, createQuestion_1.default)(transfer), (data) => callback(data.createQuestion), setError, setSubmitting);
 }
 }}>
 {({ values, isSubmitting }) => (<formik_1.Form className="d-flex flex-column gap-5">
 {!exam && !question && (!exams ? <Spinner_1.default type="button"/> : (<FormikSelect_1.default name="examId" label="Exam" options={exams.map(exam => ({ value: exam.id, label: exam.name }))} append={<AddExam_1.default onSubmit={refreshExams}/>}/>))}

 <FormikTextarea_1.default name="title"/>

 <FormikSelect_1.default name="type" options={Object.values(CreateQuestion_1.QuestionType).map(type => ({ value: type, label: type }))}/>

 {values.type === CreateQuestion_1.QuestionType.CHOICE && (<formik_1.FieldArray name="choices">
 {({ remove, push }) => (<div className="d-flex flex-column gap-5">
 {values.choices.map((_choice, index) => (<div key={`choices.${index}`} className="d-flex flex-column gap-3">

 <FormikInput_1.default name={`choices.${index}.title`}>
 [{index + 1}] Choice title
 </FormikInput_1.default>

 <FormikTextarea_1.default name={`choices.${index}.explanation`}>
 [{index + 1}] Choice explanation
 </FormikTextarea_1.default>

 <FormikCheckbox_1.default name={`choices.${index}.correct`}>
 [{index + 1}] Choice correct
 </FormikCheckbox_1.default>

 {values.choices.length > 1 && (<Button_1.default icon={icons_1.DeleteIcon} label="Remove" className="-mt-3" onClick={() => remove(index)}/>)}
 </div>))}
 <Button_1.default icon={icons_1.CreateIcon} label="Add" type="button" className="-mt-3" onClick={() => push(new CreateQuestion_1.QuestionChoice())}/>
 </div>)}
 </formik_1.FieldArray>)}

 <FormikSelect_1.default name="difficulty" options={Object.values(CreateQuestion_1.QuestionDifficulty).map(difficulty => ({
 value: difficulty,
 label: difficulty,
 }))}/>

 {error && <Error_1.default text={error}/>}

 <div>
 <Button_1.default label="Cancel" type="reset" onClick={handleOpen}/>{' '}
 <Button_1.default icon={icon} label={question ? (isSubmitting ? 'Updating...' : 'Update') : (isSubmitting ? 'Adding...' : 'Add')} size="md" type="submit" disabled={isSubmitting}/>
 </div>
 </formik_1.Form>)}
 </formik_1.Formik>
 </react_1.CardBody>
 </react_1.Card>
 </react_1.Dialog>
 </>;
};
exports.default = (0, react_2.memo)(AddQuestion);
//# sourceMappingURL=AddQuestion.js.map