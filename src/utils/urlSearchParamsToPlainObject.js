"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = urlSearchParamsToPlainObject;
function urlSearchParamsToPlainObject(params) {
    const result = {};
    for (const [key, value] of params.entries()) {
        result[key] = value;
    }
    return result;
}
//# sourceMappingURL=urlSearchParamsToPlainObject.js.map