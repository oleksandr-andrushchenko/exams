"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = FormikTagAutocomplete;
const react_1 = require("@material-tailwind/react");
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
    return <div className="flex flex-col gap-2">
    <div className="flex gap-2">
      <div className="relative grow">
        <react_1.Input label={label} value={text} onChange={event => setText(event.target.value)} onKeyDown={onKeyDown} disabled={tags.length >= max}/>
        {text && suggestions.length > 0 && <div className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-md border bg-white shadow-lg">
          {suggestions.map(tag => <button key={tag.id} type="button" className="block w-full px-3 py-2 text-left hover:bg-blue-gray-50" onMouseDown={event => event.preventDefault()} onClick={() => add(tag.name)}>{tag.name} <span className="text-xs text-blue-gray-500">({tag.examsCount})</span></button>)}
        </div>}
      </div>
      <Button_1.default type="button" label="Add" disabled={!text.trim() || tags.length >= max} onClick={() => add()}/>
    </div>

    {tags.length > 0 && <div className="flex flex-wrap gap-2">
      {tags.map(tag => <button key={tag} type="button" className="rounded-full bg-blue-gray-100 px-3 py-1 text-sm" title="Remove tag" onClick={() => helpers.setValue(tags.filter(value => value !== tag))}>{tag} ×</button>)}
    </div>}

    <div className="text-xs text-blue-gray-500">Press Enter or comma to add a tag ({tags.length}/{max}).</div>
    {meta.touched && meta.error && <Error_1.default text={String(meta.error)}/>}
  </div>;
}
//# sourceMappingURL=FormikTagAutocomplete.js.map