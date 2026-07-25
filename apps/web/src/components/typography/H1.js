"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("@material-tailwind/react");
const react_2 = require("react");
const Subtitle_1 = __importDefault(require("./Subtitle"));
const H1 = ({ icon, label, sub, sup, children, className, ...props }) => {
    const h1 = (<react_1.Typography as="h1" variant="h2" className={`mt-1 font-primary text-black ${className}`} {...props}>
      {icon && (0, react_2.createElement)(icon, { className: 'h-8 w-8 inline-block' })}
      {icon && ' '}
      {label || children}
      {sup && ' '}
      {sup && <sup>{sup}</sup>}
    </react_1.Typography>);
    if (sub) {
        return <>{h1} <Subtitle_1.default>{sub}</Subtitle_1.default></>;
    }
    return h1;
};
exports.default = (0, react_2.memo)(H1);
//# sourceMappingURL=H1.js.map