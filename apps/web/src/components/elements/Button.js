"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("@/components/bootstrap");
const react_2 = require("react");
const Button = ({ label, tooltip, size, className, icon, onClick, disabled, type, variant, color, children, ...props }) => {
 const button = (<react_1.Button {...props} variant={variant} color={color} size={size} type={type} className={className} onClick={onClick} disabled={disabled}>
 {icon && (0, react_2.createElement)(icon, { className: 'd-inline-block  align-top' })}
 {icon && ' '}
 {label || children}
 </react_1.Button>);
 if (tooltip) {
 return (<react_1.Tooltip content={tooltip}>
 {disabled ? <div>{button}</div> : button}
 </react_1.Tooltip>);
 }
 return button;
};
exports.default = (0, react_2.memo)(Button);
//# sourceMappingURL=Button.js.map