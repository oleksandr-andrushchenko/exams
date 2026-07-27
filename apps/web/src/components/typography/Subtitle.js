"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("@/components/bootstrap");
const react_2 = require("react");
const Subtitle = ({ label, children, ...props }) => {
 return <react_1.Typography variant="small" {...props}>
 {label || children}
 </react_1.Typography>;
};
exports.default = (0, react_2.memo)(Subtitle);
//# sourceMappingURL=Subtitle.js.map