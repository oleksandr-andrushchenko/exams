"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const react_2 = require("@/components/bootstrap");
const CreatorBadge = ({ yes = true }) => {
 return yes ? <react_2.Chip value="Created by you" color="red" className="fw-normal"/> : '';
};
exports.default = (0, react_1.memo)(CreatorBadge);
//# sourceMappingURL=CreatorBadge.js.map