"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const react_2 = require("@material-tailwind/react");
const YesNo = ({ yes }) => {
    return yes ? <react_2.Chip value="Yes" color="green"/> : <react_2.Chip value="No" color="orange"/>;
};
exports.default = (0, react_1.memo)(YesNo);
//# sourceMappingURL=YesNo.js.map