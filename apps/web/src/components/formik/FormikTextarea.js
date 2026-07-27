"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
 return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = FormikTextarea;
const formik_1 = require("formik");
const Error_1 = __importDefault(require("../Error"));
const react_1 = require("@/components/bootstrap");
function FormikTextarea({ name, label, children }) {
 const [input, meta] = (0, formik_1.useField)(name);
 const { touched, error } = meta;
 return (<div className="d-flex flex-column gap-1">
 <react_1.Textarea {...input} rows={1} resize name={name} label={label || (children || []).join('') || name} success={touched && !error} error={touched && !!error}/>

 {touched && error && <Error_1.default text={error}/>}
 </div>);
}
;
//# sourceMappingURL=FormikTextarea.js.map