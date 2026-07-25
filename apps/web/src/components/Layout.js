"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const NavBar_1 = __importDefault(require("./NavBar"));
const react_router_dom_1 = require("react-router-dom");
const react_1 = require("react");
const Layout = () => {
    return (<div className="min-h-full">
      <NavBar_1.default />
      <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        <react_router_dom_1.Outlet />
      </main>
    </div>);
};
exports.default = (0, react_1.memo)(Layout);
//# sourceMappingURL=Layout.js.map