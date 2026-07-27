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
const react_router_dom_1 = require("react-router-dom");
const useAuth_1 = __importDefault(require("../hooks/useAuth"));
const Route_1 = __importDefault(require("../enum/Route"));
const Error_1 = __importDefault(require("./Error"));
const formik_1 = require("formik");
const yup = __importStar(require("yup"));
const FormikInput_1 = __importDefault(require("./formik/FormikInput"));
const FormikCheckbox_1 = __importDefault(require("./formik/FormikCheckbox"));
const apolloClient_1 = require("../client/graphql/apolloClient");
const createMeAndAuthenticationToken_1 = __importDefault(require("../client/graphql/me/createMeAndAuthenticationToken"));
const Register = ({ buttons, onSubmit }) => {
 const [error, setError] = (0, react_2.useState)('');
 const { setAuthenticationToken } = (0, useAuth_1.default)();
 return (<formik_1.Formik initialValues={{
 email: '',
 password: '',
 confirmPassword: '',
 terms: false,
 }} validationSchema={yup.object({
 email: yup.string()
 .email('Invalid email address')
 .required('Email is required'),
 password: yup.string()
 .min(8, 'Password must be at least 8 characters')
 .max(24, 'Password cannot exceed 24 characters')
 .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[~!@#$%^&*()])/, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
 .required('Password is required'),
 confirmPassword: yup.string()
 .required('Confirm password is required')
 .oneOf([yup.ref('password')], 'Passwords must match'),
 terms: yup.bool()
 .oneOf([true], 'Terms must be accepted'),
 })} onSubmit={(values, { setSubmitting }) => {
 setError('');
 const transfer = {
 email: values.email,
 password: values.password,
 };
 (0, apolloClient_1.apiMutate)((0, createMeAndAuthenticationToken_1.default)(transfer), data => {
 setAuthenticationToken(data.createAuthenticationToken);
 onSubmit && onSubmit();
 }, setError, setSubmitting);
 }}>
 {({ isSubmitting, isValid, dirty }) => (<formik_1.Form className="d-flex flex-column gap-5">
 <react_1.Typography variant="h4" color="blue-gray">Register</react_1.Typography>

 <FormikInput_1.default name="email" type="email" label="Email Address"/>
 <FormikInput_1.default name="password" type="password" label="Password"/>
 <FormikInput_1.default name="confirmPassword" type="password" label="Confirm password"/>

 <FormikCheckbox_1.default name="terms">
 I agree to the <react_router_dom_1.Link to={Route_1.default.Terms}>Terms and Conditions</react_router_dom_1.Link>
 </FormikCheckbox_1.default>

 {error && <Error_1.default text={error}/>}

 <div>
 {buttons}

 <react_1.Button type="submit" className="ms-1" size="md" disabled={isSubmitting || !dirty || !isValid}>
 {isSubmitting ? 'Registering...' : 'Register'}
 </react_1.Button>
 </div>
 </formik_1.Form>)}
 </formik_1.Formik>);
};
exports.default = (0, react_2.memo)(Register);
//# sourceMappingURL=Register.js.map