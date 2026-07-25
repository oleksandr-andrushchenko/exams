"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RequireAuthentication;
const react_router_dom_1 = require("react-router-dom");
const useAuth_1 = __importDefault(require("../hooks/useAuth"));
const Spinner_1 = __importDefault(require("./Spinner"));
const Unauthorized_1 = __importDefault(require("../legacy-pages/Unauthorized"));
const Unauthenticated_1 = __importDefault(require("../legacy-pages/Unauthenticated"));
function RequireAuthentication({ permission }) {
    const { authenticationToken, me, checkAuthorization } = (0, useAuth_1.default)();
    if (!authenticationToken) {
        return <Unauthenticated_1.default />;
    }
    if (!me) {
        return <Spinner_1.default />;
    }
    if (permission && !checkAuthorization(permission)) {
        return <Unauthorized_1.default />;
    }
    return <react_router_dom_1.Outlet />;
}
//# sourceMappingURL=RequireAuthentication.js.map