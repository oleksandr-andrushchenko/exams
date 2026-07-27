"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const react_router_dom_1 = require("react-router-dom");
const react_2 = require("@/components/bootstrap");
const Link = ({ label, to, tooltip, className, icon, iconSize = 4, children, sup, ...props }) => {
 const link = (<react_router_dom_1.Link {...props} to={to} className={className}>
 {icon && (0, react_1.createElement)(icon, { className: `d-inline-block h-${iconSize} w-${iconSize} align-top` })}
 {icon && ' '}
 {label || children}
 {sup && ' '}
 {sup && <sup>{sup}</sup>}
 </react_router_dom_1.Link>);
 if (tooltip) {
 return (<react_2.Tooltip content={tooltip}>
 {link}
 </react_2.Tooltip>);
 }
 return link;
};
exports.default = (0, react_1.memo)(Link);
//# sourceMappingURL=Link.js.map