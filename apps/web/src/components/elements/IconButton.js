"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("@material-tailwind/react");
const react_2 = require("react");
const IconButton = ({ icon, tooltip, size, className, onClick, disabled, type, variant, color, ...props }) => {
    const button = (<react_1.IconButton {...props} variant={variant} color={color} size={size} type={type} className={className} onClick={onClick} disabled={disabled}>
      {(0, react_2.createElement)(icon, { className: 'h-4 w-4 align-top' })}
    </react_1.IconButton>);
    if (tooltip) {
        return (<react_1.Tooltip content={tooltip}>{button}</react_1.Tooltip>);
    }
    return button;
};
exports.default = (0, react_2.memo)(IconButton);
//# sourceMappingURL=IconButton.js.map