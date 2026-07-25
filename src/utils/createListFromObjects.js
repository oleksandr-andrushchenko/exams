"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = createListFromObjects;
function createListFromObjects(items, keyProp = 'id', labelProp = 'name') {
    return items.reduce((acc, item) => {
        acc[String(item[keyProp])] = item[labelProp];
        return acc;
    }, {});
}
//# sourceMappingURL=createListFromObjects.js.map