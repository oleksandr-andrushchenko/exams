"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const Buttons = ({ className = '', buttons }) => {
    return (<div className={`flex gap-1 items-center ${className}`}>
      {Object.entries(buttons).filter(([_, button]) => !!button)
            .map(([key, button]) => <span key={key}>{button}</span>)}
    </div>);
};
exports.default = (0, react_1.memo)(Buttons);
//# sourceMappingURL=Buttons.js.map