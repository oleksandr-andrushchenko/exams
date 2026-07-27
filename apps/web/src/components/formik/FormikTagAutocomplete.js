"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
 return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = FormikTagAutocomplete;
const react_1 = require("@/components/bootstrap");
const react_2 = require("react");
const formik_1 = require("formik");
const apolloClient_1 = require("../../client/graphql/apolloClient");
const getExamTags_1 = __importDefault(require("../../client/graphql/examTag/getExamTags"));
const Error_1 = __importDefault(require("../Error"));
const Button_1 = __importDefault(require("../elements/Button"));
function FormikTagAutocomplete({ name, label, max = 10 }) {
 const [field, meta, helpers] = (0, formik_1.useField)(name);
 const [text, setText] = (0, react_2.useState)('');
 const [suggestions, setSuggestions] = (0, react_2.useState)([]);
 const tags = field.value || [];
 (0, react_2.useEffect)(() => {
 const timer = window.setTimeout(() => {
 (0, apolloClient_1.apiQuery)((0, getExamTags_1.default)(text.trim()), ({ examTags }) => {
 setSuggestions(examTags.filter(tag => !tags.some(value => value.toLowerCase() === tag.name.toLowerCase())));
 });
 }, 200);
 return () => window.clearTimeout(timer);
 }, [text, tags.join('|')]);
 const add = (value = text) => {
 const normalized = value.trim().replace(/\s+/g, ' ');
 if (!normalized || tags.length >= max || tags.some(tag => tag.toLowerCase() === normalized.toLowerCase()))
 return;
 helpers.setValue([...tags, normalized]);
 helpers.setTouched(true);
 setText('');
 setSuggestions([]);
 };
 const onKeyDown = (event) => {
 if (event.key === 'Enter' || event.key === ',') {
 event.preventDefault();
 add();
 }
 };
 return <div className="d-flex flex-column gap-2">
 <div className="d-flex gap-2">
 <div className="position-relative flex-grow-1">
 <react_1.Input label={label} value={text} onChange={event => setText(event.target.value)} onKeyDown={onKeyDown} disabled={tags.length >= max}/>
 {text && suggestions.length > 0 && <div className="position-absolute z-3 mt-1 w-100 overflow-auto rounded border bg-white ">
 {suggestions.map(tag => <button key={tag.id} type="button" className="btn btn-link d-block w-100 text-start " onMouseDown={event => event.preventDefault()} onClick={() => add(tag.name)}>{tag.name} <span className="small text-secondary">({tag.examsCount})</span></button>)}
 </div>}
 </div>
 <Button_1.default type="button" label="Add" disabled={!text.trim() || tags.length >= max} onClick={() => add()}/>
 </div>

 {tags.length > 0 && <div className="d-flex flex-wrap gap-2">
 {tags.map(tag => <button key={tag} type="button" className="btn btn-sm btn-secondary" title="Remove tag" onClick={() => helpers.setValue(tags.filter(value => value !== tag))}>{tag} ×</button>)}
 </div>}

 <div className="small text-secondary">Press Enter or comma to add a tag ({tags.length}/{max}).</div>
 {meta.touched && meta.error && <Error_1.default text={String(meta.error)}/>}
 </div>;
}
//# sourceMappingURL=FormikTagAutocomplete.js.map