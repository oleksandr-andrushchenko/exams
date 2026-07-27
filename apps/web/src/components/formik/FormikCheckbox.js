"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
 return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = FormikCheckbox;
const formik_1 = require("formik");
const Error_1 = __importDefault(require("../Error"));
const react_1 = require("@/components/bootstrap");
function FormikCheckbox({ name, label, children }) {
 const [input, meta] = (0, formik_1.useField)(name);
 const { touched, error } = meta;
 return (<div className="d-flex flex-column gap-1">
 <react_1.Checkbox {...input} name={name} defaultChecked={input.value} label={label || (<react_1.Typography variant="small" color="gray" className="d-flex align-items-center fw-normal">
 {children}
 </react_1.Typography>)}/>

 {touched && error && <Error_1.default text={error}/>}
 </div>);
}
;
//# sourceMappingURL=FormikCheckbox.js.map