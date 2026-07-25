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
const react_1 = require("@material-tailwind/react");
const react_2 = require("react");
const apolloClient_1 = require("../../client/graphql/apolloClient");
const Error_1 = __importDefault(require("../Error"));
const formik_1 = require("formik");
const yup = __importStar(require("yup"));
const Permission_1 = __importDefault(require("../../enum/Permission"));
const updateUser_1 = __importDefault(require("../../client/graphql/users/updateUser"));
const FormikInput_1 = __importDefault(require("../formik/FormikInput"));
const FormikTags_1 = __importDefault(require("../formik/FormikTags"));
const icons_1 = require("../../registry/icons");
const IconButton_1 = __importDefault(require("../elements/IconButton"));
const Button_1 = __importDefault(require("../elements/Button"));
const createUser_1 = __importDefault(require("../../client/graphql/users/createUser"));
const H3_1 = __importDefault(require("../typography/H3"));
const AddUser = ({ user, onSubmit, iconButton }) => {
    const [open, setOpen] = (0, react_2.useState)(false);
    const handleOpen = () => setOpen(!open);
    const [error, setError] = (0, react_2.useState)('');
    const icon = user ? icons_1.EditIcon : icons_1.CreateIcon;
    const label = user ? 'Update User' : 'Add User';
    return <>
    {iconButton
            ? <IconButton_1.default icon={icon} tooltip={label} onClick={handleOpen}/>
            : <Button_1.default icon={icon} label={label} onClick={handleOpen}/>}
    <react_1.Dialog open={open} handler={handleOpen} className="text-left">
      <react_1.Card>
        <react_1.CardBody className="flex flex-col gap-4">
          <H3_1.default icon={icon} label={label}/>
          <formik_1.Formik initialValues={{
            name: user?.name || '',
            email: user?.email || '',
            password: '',
            permissions: user?.permissions || [Permission_1.default.Regular],
        }} validationSchema={yup.object({
            name: yup.string()
                .min(2, 'Name must be at least 2 characters')
                .max(30, 'Name cannot exceed 30 characters')
                .required('Name is required'),
            email: yup.string()
                .email('Invalid email address')
                .required('Email is required'),
            password: yup.string()
                .min(8, 'Password must be at least 8 characters')
                .max(24, 'Password cannot exceed 24 characters')
                .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[~!@#$%^&*()])/, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
            permissions: yup.array()
                .of(yup.string().oneOf(Object.values(Permission_1.default), 'Invalid permission'))
                .required('At least one permission is required'),
        })} onSubmit={(values, { setSubmitting }) => {
            setError('');
            const transfer = {
                name: values.name,
                email: values.email,
                permissions: [...new Set(values.permissions)],
            };
            if (values.password) {
                transfer.password = values.password;
            }
            const callback = (user) => {
                setOpen(false);
                onSubmit && onSubmit(user);
            };
            if (user) {
                (0, apolloClient_1.apiMutate)((0, updateUser_1.default)(user.id, transfer), (data) => callback(data.updateUser), setError, setSubmitting);
            }
            else {
                (0, apolloClient_1.apiMutate)((0, createUser_1.default)(transfer), (data) => callback(data.createUser), setError, setSubmitting);
            }
        }}>
            {({ isSubmitting }) => (<formik_1.Form className="flex flex-col gap-6">
                <FormikInput_1.default name="name" label="Name"/>
                <FormikInput_1.default name="email" label="Email"/>
                <FormikInput_1.default name="password" label="Password" type="password"/>
                <FormikTags_1.default name="permissions" label="Permission" whitelist={Object.values(Permission_1.default)}/>

                {error && <Error_1.default text={error}/>}

                <div>
                  <Button_1.default label="Cancel" type="reset" onClick={handleOpen}/>{' '}
                  <Button_1.default icon={icon} label={user ? (isSubmitting ? 'Updating...' : 'Update') : (isSubmitting ? 'Adding...' : 'Add')} size="md" type="submit" disabled={isSubmitting}/>
                </div>
              </formik_1.Form>)}
          </formik_1.Formik>
        </react_1.CardBody>
      </react_1.Card>
    </react_1.Dialog>
  </>;
};
exports.default = (0, react_2.memo)(AddUser);
//# sourceMappingURL=AddUser.js.map