"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
 return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const react_2 = require("@/components/bootstrap");
const react_bootstrap_icons_1 = require("react-bootstrap-icons");
const Spinner_1 = __importDefault(require("./Spinner"));
const Error_1 = __importDefault(require("./Error"));
const Rating = ({ className = '', rating = {}, showAverageMark = false, showMarkCount = false, onChange = () => {
}, readonly = false, }) => {
 const [_rating, _setRating] = (0, react_1.useState)(rating);
 const [isLoading, setLoading] = (0, react_1.useState)(false);
 const [error, setError] = (0, react_1.useState)('');
 const { averageMark = 0, markCount = 0, mark } = _rating ?? {};
 const marked = mark !== null && mark !== undefined;
 if (error) {
 return (<Error_1.default text={error} simple/>);
 }
 if (isLoading) {
 return (<Spinner_1.default />);
 }
 const setRating = (rating) => _setRating(rating);
 return (<div className={`d-flex align-items-center gap-2 ${className}`}>
 {showAverageMark && (averageMark > 0) && <react_2.Typography type="small">{averageMark}</react_2.Typography>}

 <react_2.Rating value={Math.floor(averageMark)} count={5} onChange={(mark) => onChange(mark, setRating, { setLoading, setError })} ratedIcon={<react_bootstrap_icons_1.StarFill className=""/>} unratedIcon={<react_bootstrap_icons_1.Star className=""/>} ratedColor={marked ? 'yellow' : 'gray'} unratedColor={marked ? 'yellow' : 'gray'} readonly={readonly || marked}/>

 {showMarkCount && (markCount > 0) && <react_2.Typography type="small">Based on {markCount} Reviews</react_2.Typography>}
 </div>);
};
exports.default = (0, react_1.memo)(Rating);
//# sourceMappingURL=Rating.js.map