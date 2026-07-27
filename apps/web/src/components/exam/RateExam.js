"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
 return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateExam = void 0;
const react_1 = require("react");
const apolloClient_1 = require("../../client/graphql/apolloClient");
const rateExam_1 = __importDefault(require("../../client/graphql/exam/rateExam"));
const sleep_1 = __importDefault(require("../../utils/sleep"));
const Rating_1 = __importDefault(require("../Rating"));
const getExam_1 = __importDefault(require("../../client/graphql/exam/getExam"));
const _RateExam = ({ className = '', exam, onChange, showAverageMark = false, showMarkCount = false, readonly = false, }) => {
 return (<Rating_1.default className={className} rating={exam.rating} showAverageMark={showAverageMark} showMarkCount={showMarkCount} onChange={(mark, setRating, { setError, setLoading }) => {
 setLoading(true);
 (0, apolloClient_1.apiMutate)((0, rateExam_1.default)(exam.id, mark), async (data) => {
 await (0, sleep_1.default)(100);
 (0, apolloClient_1.apiQuery)((0, getExam_1.default)(data.rateExam.id), (data) => {
 setRating(data.exam.rating ?? {});
 onChange && onChange(data.exam);
 }, setError).finally(() => setLoading(false));
 }, setError);
 }} readonly={readonly}/>);
};
exports.RateExam = (0, react_1.memo)(_RateExam);
//# sourceMappingURL=RateExam.js.map