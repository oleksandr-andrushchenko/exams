"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
 return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ExamTags;
const react_1 = require("@/components/bootstrap");
const Route_1 = __importDefault(require("../../enum/Route"));
const Link_1 = __importDefault(require("../elements/Link"));
function ExamTags({ tags = [] }) {
 if (!tags.length)
 return <span className="text-secondary">—</span>;
 return <div className="d-flex flex-wrap gap-1">
 {tags.map(tag => <Link_1.default key={tag.id || tag.slug} to={Route_1.default.ExamTag.replace(':tagSlug', tag.slug)} tooltip={`View ${tag.examsCount} exam${tag.examsCount === 1 ? '' : 's'} tagged ${tag.name}`} label={<react_1.Chip value={tag.name} className=" fw-normal"/>}/>)}
 </div>;
}
//# sourceMappingURL=ExamTags.js.map