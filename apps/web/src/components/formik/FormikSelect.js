"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
 return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = FormikSelect;
const formik_1 = require("formik");
const Error_1 = __importDefault(require("../Error"));
const react_1 = require("@/components/bootstrap");
function FormikSelect({ name, label, options, append }) {
 const [input, meta, helper] = (0, formik_1.useField)(name);
 const { touched, value, error } = meta;
 const { setTouched, setValue } = helper;
 return (<div className="d-flex flex-column gap-1">
 <react_1.Select {...input} name={name} label={label || name} onChange={value => setValue(value)} containerProps={{
 onBlur: (e) => !e.nativeEvent.relatedTarget && setTouched(false),
 }} defaultValue={value} success={touched && !error} error={touched && !!error} className="text-capitalize">
 {options.map(option => (<react_1.Option key={option.key || option.value} value={option.value} className="text-capitalize">
 {option.label}
 </react_1.Option>))}
 </react_1.Select>

 {touched && error && <Error_1.default text={error}/>}

 {append}
 </div>);
}
;
//# sourceMappingURL=FormikSelect.js.map