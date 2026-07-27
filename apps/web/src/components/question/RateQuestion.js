"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
 return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateQuestion = void 0;
const react_1 = require("react");
const apolloClient_1 = require("../../client/graphql/apolloClient");
const sleep_1 = __importDefault(require("../../utils/sleep"));
const Rating_1 = __importDefault(require("../Rating"));
const rateQuestion_1 = __importDefault(require("../../client/graphql/question/rateQuestion"));
const getQuestion_1 = __importDefault(require("../../client/graphql/question/getQuestion"));
const _RateQuestion = ({ className = '', question, onChange, showAverageMark = false, showMarkCount = false, readonly = false, }) => {
 return (<Rating_1.default className={className} rating={question.rating} showAverageMark={showAverageMark} showMarkCount={showMarkCount} onChange={(mark, setRating, { setError, setLoading }) => {
 setLoading(true);
 (0, apolloClient_1.apiMutate)((0, rateQuestion_1.default)(question.id, mark), async (data) => {
 await (0, sleep_1.default)(100);
 (0, apolloClient_1.apiQuery)((0, getQuestion_1.default)(data.rateQuestion.id), (data) => {
 setRating(data.question.rating ?? {});
 onChange && onChange(data.question);
 }, setError).finally(() => setLoading(false));
 }, setError);
 }} readonly={readonly}/>);
};
exports.RateQuestion = (0, react_1.memo)(_RateQuestion);
//# sourceMappingURL=RateQuestion.js.map