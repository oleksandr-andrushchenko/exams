"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ExamTag;
const react_router_dom_1 = require("react-router-dom");
const Exams_1 = __importDefault(require("./Exams"));
function ExamTag() {
    const { tagSlug = '' } = (0, react_router_dom_1.useParams)();
    return <Exams_1.default tagSlug={tagSlug}/>;
}
//# sourceMappingURL=ExamTag.js.map