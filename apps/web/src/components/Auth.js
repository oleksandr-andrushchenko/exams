"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
 return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("@/components/bootstrap");
const solid_1 = require("@heroicons/react/24/solid");
const react_2 = require("react");
const Register_1 = __importDefault(require("./Register"));
const Login_1 = __importDefault(require("./Login"));
const react_router_dom_1 = require("react-router-dom");
const Button_1 = __importDefault(require("./elements/Button"));
const Text_1 = __importDefault(require("./typography/Text"));
const IconButton_1 = __importDefault(require("./elements/IconButton"));
const Auth = ({ button, dialog, register, onSubmit }) => {
 const [open, setOpen] = (0, react_2.useState)(false);
 const handleOpen = () => setOpen(!open);
 const navigate = (0, react_router_dom_1.useNavigate)();
 const [activeTab, setActiveTab] = (0, react_2.useState)(register ? 'register' : 'login');
 const buttons = [<Button_1.default key="cancel" label="Cancel" type="reset" onClick={handleOpen}/>];
 const _onSubmit = onSubmit || (() => navigate(0));
 const tabs = [
 {
 key: 'login',
 header: <Text_1.default icon={solid_1.ArrowRightEndOnRectangleIcon} label="Login"/>,
 content: <Login_1.default onSubmit={_onSubmit} buttons={buttons} onRegisterClick={() => setActiveTab('register')}/>,
 },
 {
 key: 'register',
 header: <Text_1.default icon={solid_1.UserPlusIcon} label="Register"/>,
 content: <Register_1.default onSubmit={_onSubmit} buttons={buttons}/>,
 },
 ];
 const icon = button?.icon || (register ? solid_1.UserPlusIcon : solid_1.ArrowRightEndOnRectangleIcon);
 const label = button?.label || (register ? 'Register' : 'Login');
 const size = button?.size || (register ? 'sm' : 'md');
 const color = button?.color;
 const iconOnly = button?.iconOnly;
 const buildButton = (props = {}) => {
 if (iconOnly) {
 return <IconButton_1.default icon={icon} tooltip={label} size={size} color={color} onClick={handleOpen} {...props}/>;
 }
 return <Button_1.default icon={icon} label={label} size={size} color={color} onClick={handleOpen} {...props}/>;
 };
 return <>
 {buildButton()}
 <react_1.Dialog open={open} handler={handleOpen} className="text-start">
 <react_1.Card>
 <react_1.CardBody className="d-flex flex-column gap-4">
 {dialog?.label || ''}
 <react_1.Tabs value={activeTab}>
 <react_1.TabsHeader className="rounded-0 border-bottom border-secondary-subtle bg-transparent p-0">
 {tabs.map(({ key, header }) => <react_1.Tab key={key} value={key}>{header}</react_1.Tab>)}
 </react_1.TabsHeader>
 <react_1.TabsBody>
 {tabs.map(({ key, content }) => <react_1.TabPanel key={key} value={key}>{content}</react_1.TabPanel>)}
 </react_1.TabsBody>
 </react_1.Tabs>
 </react_1.CardBody>
 </react_1.Card>
 </react_1.Dialog>
 </>;
};
exports.default = (0, react_2.memo)(Auth);
//# sourceMappingURL=Auth.js.map