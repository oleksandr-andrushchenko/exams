"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_router_dom_1 = require("react-router-dom");
const react_1 = require("@material-tailwind/react");
const Route_1 = __importDefault(require("../enum/Route"));
const react_2 = require("react");
const Auth_1 = __importDefault(require("../components/Auth"));
const H1_1 = __importDefault(require("../components/typography/H1"));
const Button_1 = __importDefault(require("../components/elements/Button"));
const icons_1 = require("../registry/icons");
const Link_1 = __importDefault(require("../components/elements/Link"));
const Unauthenticated = () => {
    const navigate = (0, react_router_dom_1.useNavigate)();
    const goBack = () => navigate(-1);
    (0, react_2.useEffect)(() => {
        document.title = 'Unauthenticated';
    }, []);
    return <>
    <react_1.Breadcrumbs>
      <Link_1.default icon={icons_1.HomeIcon} label="Home" to={Route_1.default.Home}/>
    </react_1.Breadcrumbs>

    <H1_1.default label="Unauthenticated" sub="You do not logged in"/>

    <div className="inline-flex items-center gap-1 mt-3">
      <Auth_1.default />
      <Button_1.default icon={icons_1.GoBackIcon} label="Go Back" onClick={goBack}/>
      <Link_1.default label={<Button_1.default icon={icons_1.HomeIcon} label="Go Home" size="md"/>} to={Route_1.default.Home}/>
    </div>
  </>;
};
exports.default = (0, react_2.memo)(Unauthenticated);
//# sourceMappingURL=Unauthenticated.js.map