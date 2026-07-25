"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = createListFromEnum;
function createListFromEnum(items) {
    return Object.values(items).reduce((acc, item) => {
        acc[item] = item;
        return acc;
    }, {});
}
//# sourceMappingURL=createListFromEnum.js.map