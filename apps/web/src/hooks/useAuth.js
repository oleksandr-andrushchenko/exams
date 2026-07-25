"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationProvider = AuthenticationProvider;
exports.default = useAuth;
const react_1 = require("react");
const Permission_1 = __importDefault(require("../enum/Permission"));
const apolloClient_1 = require("../client/graphql/apolloClient");
const getMeAndPermissions_1 = __importDefault(require("../client/graphql/me/getMeAndPermissions"));
const authenticationContext = (0, react_1.createContext)({});
function AuthenticationProvider({ children }) {
    const authenticationTokenString = localStorage.getItem('authenticationToken');
    const [authenticationToken, setAuthenticationToken] = (0, react_1.useState)(authenticationTokenString ? JSON.parse(authenticationTokenString) : undefined);
    const defaultData = { me: undefined, permissionHierarchy: undefined };
    const [{ me, permissionHierarchy }, setData] = (0, react_1.useState)(defaultData);
    const checkAuthorization = (permission, resource, permissions) => {
        if (!authenticationToken || !me || !permissionHierarchy) {
            return false;
        }
        if (resource) {
            if (('ownerId' in resource) && resource.ownerId === me.id) {
                return true;
            }
            if (('isOwner' in resource) && resource.isOwner) {
                return true;
            }
        }
        const effectivePermissions = permissions ?? me.permissions ?? [];
        if (effectivePermissions.indexOf(Permission_1.default.All) !== -1) {
            return true;
        }
        if (effectivePermissions.indexOf(permission) !== -1) {
            return true;
        }
        for (const mePermission of effectivePermissions) {
            if (permissionHierarchy.hasOwnProperty(mePermission)) {
                if (checkAuthorization(permission, resource, permissionHierarchy[mePermission])) {
                    return true;
                }
            }
        }
        return false;
    };
    (0, react_1.useEffect)(() => {
        if (authenticationToken) {
            localStorage.setItem('authenticationToken', JSON.stringify(authenticationToken));
            (0, apolloClient_1.apiQuery)((0, getMeAndPermissions_1.default)(), data => setData({ me: data.me, permissionHierarchy: data.permission.hierarchy }), () => setAuthenticationToken(undefined), () => {
            });
        }
        else {
            localStorage.removeItem('authenticationToken');
            setData(defaultData);
        }
    }, [authenticationToken]);
    const value = {
        authenticationToken,
        setAuthenticationToken,
        me,
        checkAuthorization,
    };
    return (<authenticationContext.Provider value={value}>
      {children}
    </authenticationContext.Provider>);
}
function useAuth() {
    return (0, react_1.useContext)(authenticationContext);
}
//# sourceMappingURL=useAuth.js.map