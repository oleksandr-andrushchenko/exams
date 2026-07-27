"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ThemeProvider;
const bootstrap_1 = require("@/components/bootstrap");
function ThemeProvider({ children }) {
 return (0, bootstrap_1.ThemeProvider)({ children });
}
