"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("@material-tailwind/react");
const react_2 = require("react");
const H2 = ({ icon, label, children, className, ...props }) => {
    return <react_1.Typography as="h2" variant="h6" className={`mt-4 text-black ${className}`} {...props}>
    {icon && (0, react_2.createElement)(icon, { className: 'h-4 w-4 inline-block' })}
    {icon && ' '}
    {label || children}
  </react_1.Typography>;
};
exports.default = (0, react_2.memo)(H2);
//# sourceMappingURL=H2.js.map