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
const apolloClient_1 = require("../../client/graphql/apolloClient");
const updateExam_1 = __importDefault(require("../../client/graphql/exam/updateExam"));
const createExam_1 = __importDefault(require("../../client/graphql/exam/createExam"));
const Error_1 = __importDefault(require("../Error"));
const formik_1 = require("formik");
const yup = __importStar(require("yup"));
const FormikTextarea_1 = __importDefault(require("../formik/FormikTextarea"));
const FormikInput_1 = __importDefault(require("../formik/FormikInput"));
const icons_1 = require("../../registry/icons");
const IconButton_1 = __importDefault(require("../elements/IconButton"));
const Button_1 = __importDefault(require("../elements/Button"));
const useAuth_1 = __importDefault(require("../../hooks/useAuth"));
const Auth_1 = __importDefault(require("../Auth"));
const ExamPermission_1 = __importDefault(require("../../enum/exam/ExamPermission"));
const H3_1 = __importDefault(require("../typography/H3"));
const FormikTagAutocomplete_1 = __importDefault(require("../formik/FormikTagAutocomplete"));
const AddExam = ({ exam, onSubmit, iconButton = false }) => {
 const [open, setOpen] = (0, react_2.useState)(false);
 const handleOpen = () => setOpen(!open);
 const [error, setError] = (0, react_2.useState)('');
 const { authenticationToken, checkAuthorization } = (0, useAuth_1.default)();
 const icon = exam ? icons_1.EditIcon : icons_1.CreateIcon;
 const label = exam ? 'Update Exam' : 'Add Exam';
 if (!authenticationToken) {
 return <Auth_1.default button={{ icon, label, size: 'sm', iconOnly: iconButton }} dialog={{ label: 'You need to be authenticated' }} onSubmit={() => setOpen(true)}/>;
 }
 const buildButton = (props = {}) => {
 if (iconButton) {
 return <IconButton_1.default icon={icon} tooltip={label} onClick={handleOpen} {...props}/>;
 }
 return <Button_1.default icon={icon} label={label} onClick={handleOpen} {...props}/>;
 };
 const permission = exam ? ExamPermission_1.default.Update : ExamPermission_1.default.Create;
 if (!checkAuthorization(permission, exam)) {
 return buildButton({ disabled: true, tooltip: 'You are not allowed to do this' });
 }
 return <>
 {buildButton()}
 <react_1.Dialog open={open} handler={handleOpen} className="text-start">
 <react_1.Card>
 <react_1.CardBody className="d-flex flex-column gap-4">
 <H3_1.default icon={icon} label={label}/>
 <formik_1.Formik initialValues={{
 name: exam?.name || '',
 requiredScore: exam?.requiredScore || 0,
 tags: exam?.tags?.map(tag => tag.name) || [],
 }} validationSchema={yup.object({
 name: yup.string()
 .min(3, 'Name must be at least 3 characters')
 .max(100, 'Name cannot exceed 100 characters')
 .matches(/^[a-zA-Z]/, 'Name must start with a letter')
 .required('Name is required'),
 requiredScore: yup.number()
 .min(0, 'Score must be at least 0')
 .max(100, 'Score cannot exceed 100')
 .optional(),
 tags: yup.array().of(yup.string().trim().max(50)).max(10),
 })} onSubmit={(values, { setSubmitting }) => {
 setError('');
 const transfer = {
 name: values.name,
 requiredScore: values.requiredScore,
 tags: values.tags,
 };
 const callback = (exam) => {
 setOpen(false);
 onSubmit && onSubmit(exam);
 };
 if (exam) {
 (0, apolloClient_1.apiMutate)((0, updateExam_1.default)(exam.id, transfer), (data) => callback(data.updateExam), setError, setSubmitting);
 }
 else {
 (0, apolloClient_1.apiMutate)((0, createExam_1.default)(transfer), (data) => callback(data.createExam), setError, setSubmitting);
 }
 }}>
 {({ isSubmitting }) => (<formik_1.Form className="d-flex flex-column gap-5">

 <FormikTextarea_1.default name="name" label="Name"/>
 <FormikInput_1.default name="requiredScore" type="number" label="Required score"/>
 <FormikTagAutocomplete_1.default name="tags" label="Tags"/>

 {error && <Error_1.default text={error}/>}

 <div>
 <Button_1.default label="Cancel" type="reset" onClick={handleOpen}/>{' '}
 <Button_1.default icon={icon} label={exam ? (isSubmitting ? 'Updating...' : 'Update') : (isSubmitting ? 'Adding...' : 'Add')} size="md" type="submit" disabled={isSubmitting}/>
 </div>
 </formik_1.Form>)}
 </formik_1.Formik>
 </react_1.CardBody>
 </react_1.Card>
 </react_1.Dialog>
 </>;
};
exports.default = (0, react_2.memo)(AddExam);
//# sourceMappingURL=AddExam.js.map