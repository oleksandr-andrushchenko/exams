"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("@/components/bootstrap");
const react_2 = require("react");
const Text = ({ icon, label, children, variant, color, className }) => {
 return <react_1.Typography as="span" variant={variant} color={color} className={className}>
 {icon && (0, react_2.createElement)(icon, { className: ' d-inline-block' })}
 {icon && ' '}
 {label || children}
 </react_1.Typography>;
};
exports.default = (0, react_2.memo)(Text);
//# sourceMappingURL=Text.js.map