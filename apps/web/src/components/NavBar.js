"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
 return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const solid_1 = require("@heroicons/react/24/solid");
const react_1 = require("react");
const react_2 = require("@/components/bootstrap");
const useAuth_1 = __importDefault(require("../hooks/useAuth"));
const Route_1 = __importDefault(require("../enum/Route"));
const Spinner_1 = __importDefault(require("./Spinner"));
const Auth_1 = __importDefault(require("./Auth"));
const react_bootstrap_icons_1 = require("react-bootstrap-icons");
const Link_1 = __importDefault(require("./elements/Link"));
const Button_1 = __importDefault(require("./elements/Button"));
const IconButton_1 = __importDefault(require("./elements/IconButton"));
const Text_1 = __importDefault(require("./typography/Text"));
const NavBar = () => {
 const links = [
 { name: 'Exams', href: Route_1.default.Exams },
 { name: 'Questions', href: Route_1.default.Questions },
 { name: 'Users', href: Route_1.default.Users },
 ];
 const [openNav, setOpenNav] = (0, react_1.useState)(false);
 const { authenticationToken, me, setAuthenticationToken } = (0, useAuth_1.default)();
 (0, react_1.useEffect)(() => {
 window.addEventListener('resize', () => window.innerWidth >= 960 && setOpenNav(false));
 }, []);
 const navList = <ul className="mt-2 mb-4 d-flex flex-column gap-2 mb-lg-0 mt-lg-0 d-lg-flex flex-row align-items-center gap-lg-3">
 {links.map(({ name, href }) => {
 return <react_2.Typography as="li" key={href} variant="small" color="blue-gray" className="p-1 fw-normal">
 <Link_1.default label={name} to={href} className="d-flex align-items-center"/>
 </react_2.Typography>;
 })}
 {authenticationToken && !me
 ? <react_2.Typography as="li" variant="small"><Spinner_1.default type="text"/></react_2.Typography>
 : (me
 ? <>
 <react_2.Typography as="li" variant="small" className="truncate">
 {me.id
 ? <Link_1.default to={Route_1.default.User.replace(":userId", me.id)} className="d-flex align-items-center" aria-label="Open your profile">
 <Text_1.default icon={solid_1.UserCircleIcon} label={me.email} variant="small" className="fw-normal"/>
 </Link_1.default>
 : <Text_1.default icon={solid_1.UserCircleIcon} label={me.email} variant="small" className="fw-normal"/>}
 </react_2.Typography>
 <react_2.Typography as="li" variant="small">
 <Button_1.default icon={solid_1.ArrowRightStartOnRectangleIcon} label="Logout" onClick={() => setAuthenticationToken(undefined)}/>
 </react_2.Typography>
 </>
 : <>
 <li><Auth_1.default /></li>
 <li><Auth_1.default register/></li>
 </>)}
 </ul>;
 return (<react_2.Navbar className=" w-100 rounded-0 px-4 py-2 px-lg-5 py-lg-4 text-black" fullWidth={true}>
 <div className="container mx-auto container px-4 px-lg-5 d-flex align-items-center justify-content-between text-secondary">
 <Link_1.default icon={react_bootstrap_icons_1.FolderPlus} iconSize="10" label="Exam Me" to={Route_1.default.Home} className="d-inline-flex align-items-center gap-1 fs-5"/>
 <div className="d-flex align-items-center gap-4">
 <div className="d-none d-lg-block">{navList}</div>
 <IconButton_1.default icon={openNav ? solid_1.XMarkIcon : solid_1.Bars3Icon} variant="text" className="ms-auto  text-inherit d-lg-none" onClick={() => setOpenNav(!openNav)}/>
 </div>
 </div>
 <react_2.Collapse open={openNav}>
 {navList}
 </react_2.Collapse>
 </react_2.Navbar>);
};
exports.default = (0, react_1.memo)(NavBar);
//# sourceMappingURL=NavBar.js.map