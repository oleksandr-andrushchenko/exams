"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const apolloClient_1 = require("../../client/graphql/apolloClient");
const Error_1 = __importDefault(require("../Error"));
const Spinner_1 = __importDefault(require("../Spinner"));
const getActivities_1 = __importDefault(require("../../client/graphql/activity/getActivities"));
const ExamEvent_1 = __importDefault(require("../../enum/exam/ExamEvent"));
const ExamCreatedActivity_1 = __importDefault(require("./ExamCreatedActivity"));
const ExamApprovedActivity_1 = __importDefault(require("./ExamApprovedActivity"));
const renderers = {
    [ExamEvent_1.default.Created]: (activity) => <ExamCreatedActivity_1.default activity={activity}/>,
    [ExamEvent_1.default.Approved]: (activity) => <ExamApprovedActivity_1.default activity={activity}/>,
};
const LatestActivities = ({}) => {
    const [isLoading, setLoading] = (0, react_1.useState)(true);
    const [activities, setActivities] = (0, react_1.useState)([]);
    const [error, setError] = (0, react_1.useState)('');
    (0, react_1.useEffect)(() => {
        (0, apolloClient_1.apiQuery)((0, getActivities_1.default)({ size: 20 }), async (data) => setActivities(data.activities), setError, setLoading);
    }, []);
    if (isLoading) {
        return <Spinner_1.default />;
    }
    return <>
    {error && <Error_1.default text={error}/>}

    {activities.map((activity, index) => (<div key={index}>
        {activity.event && activity.event in renderers ? renderers[activity.event](activity) : <></>}
      </div>))}
  </>;
};
exports.default = (0, react_1.memo)(LatestActivities);
//# sourceMappingURL=LatestActivities.js.map