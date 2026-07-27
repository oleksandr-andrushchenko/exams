"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
 return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("@/components/bootstrap");
const react_2 = require("react");
const Subtitle_1 = __importDefault(require("./Subtitle"));
const H3 = ({ icon, label, sub, children, ...props }) => {
 const h3 = (<react_1.Typography as="h3" variant="h4" {...props}>
 {icon && (0, react_2.createElement)(icon, { className: ' d-inline-block' })}
 {icon && ' '}
 {label || children}
 </react_1.Typography>);
 if (sub) {
 return <>{h3} <Subtitle_1.default>{sub}</Subtitle_1.default></>;
 }
 return h3;
};
exports.default = (0, react_2.memo)(H3);
//# sourceMappingURL=H3.js.map