"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = FormikTags;
const formik_1 = require("formik");
const Error_1 = __importDefault(require("../Error"));
const Button_1 = __importDefault(require("../elements/Button"));
const icons_1 = require("../../registry/icons");
const FormikSelect_1 = __importDefault(require("./FormikSelect"));
function FormikTags({ name, label, whitelist }) {
    const [input, meta] = (0, formik_1.useField)(name);
    const { value } = input;
    const { touched, error } = meta;
    const options = whitelist.map(item => ({ value: item, label: item }));
    return (<div className="flex flex-col gap-1">
      <formik_1.FieldArray name={name}>
        {({ remove, push }) => (<div className="flex flex-col gap-3">
            {value.map((_tag, index) => (<div key={`${name}.${index}`} className="grid grid-cols-2 gap-1">

                <FormikSelect_1.default name={`${name}.${index}`} label={`${label} #${index + 1}`} options={options}/>

                {value.length > 1 && (<div>
                    <Button_1.default icon={icons_1.DeleteIcon} label="Remove" onClick={() => remove(index)}/>
                  </div>)}
              </div>))}
            <div>
              <Button_1.default icon={icons_1.CreateIcon} label="Add" type="button" onClick={() => push('_')}/>
            </div>
          </div>)}
      </formik_1.FieldArray>

      {touched && error && <Error_1.default text={[...new Set(error)].filter(error => !!error).join(', ')}/>}
    </div>);
}
;
//# sourceMappingURL=FormikTags.js.map