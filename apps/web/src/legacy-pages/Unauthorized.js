"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
 return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_router_dom_1 = require("react-router-dom");
const react_1 = require("@/components/bootstrap");
const Route_1 = __importDefault(require("../enum/Route"));
const react_2 = require("react");
const H1_1 = __importDefault(require("../components/typography/H1"));
const Button_1 = __importDefault(require("../components/elements/Button"));
const Link_1 = __importDefault(require("../components/elements/Link"));
const icons_1 = require("../registry/icons");
const Unauthorized = () => {
 const navigate = (0, react_router_dom_1.useNavigate)();
 const goBack = () => navigate(-1);
 (0, react_2.useEffect)(() => {
 document.title = 'Unauthorized';
 }, []);
 return <>
 <react_1.Breadcrumbs>
 <Link_1.default icon={icons_1.HomeIcon} label="Home" to={Route_1.default.Home}/>
 </react_1.Breadcrumbs>

 <H1_1.default label="Unauthorized" sub="You do not have access to the requested page"/>

 <div className="d-inline-flex align-items-center gap-1 mt-3">
 <Button_1.default icon={icons_1.GoBackIcon} label="Go Back" onClick={goBack}/>
 <Link_1.default label={<Button_1.default icon={icons_1.HomeIcon} label="Go Home" size="md"/>} to={Route_1.default.Home}/>
 </div>
 </>;
};
exports.default = (0, react_2.memo)(Unauthorized);
//# sourceMappingURL=Unauthorized.js.map