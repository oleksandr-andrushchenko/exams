"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("@material-tailwind/react");
const solid_1 = require("@heroicons/react/24/solid");
const Route_1 = __importDefault(require("../enum/Route"));
const react_2 = require("react");
const Link_1 = __importDefault(require("../components/elements/Link"));
const H1_1 = __importDefault(require("../components/typography/H1"));
const Terms = () => {
    (0, react_2.useEffect)(() => {
        document.title = 'Terms and conditions';
    }, []);
    return <>
    <react_1.Breadcrumbs>
      <Link_1.default icon={solid_1.HomeIcon} label="Home" to={Route_1.default.Home}/>
      <Link_1.default label="Terms and conditions" to={Route_1.default.Terms}/>
    </react_1.Breadcrumbs>

    <H1_1.default label="Terms and conditions" sub="Our rules and policies"/>
  </>;
};
exports.default = (0, react_2.memo)(Terms);
//# sourceMappingURL=Terms.js.map