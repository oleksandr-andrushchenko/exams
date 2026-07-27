"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
 return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = FormikInput;
const formik_1 = require("formik");
const Error_1 = __importDefault(require("../Error"));
const react_1 = require("@/components/bootstrap");
function FormikInput({ name, type = 'text', size = 'lg', label, children }) {
 const [input, meta] = (0, formik_1.useField)(name);
 const { touched, error } = meta;
 const inputLabel = label || (Array.isArray(children) ? children.join('') : children) || name;
 return (<div className="d-flex flex-column gap-1">
 <react_1.Input {...input} type={type} size={size} label={inputLabel} placeholder={String(inputLabel)} success={touched && !error} error={touched && !!error}/>

 {touched && error && <Error_1.default text={error}/>}
 </div>);
}
;
//# sourceMappingURL=FormikInput.js.map