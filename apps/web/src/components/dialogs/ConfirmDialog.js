"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
 return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("@/components/bootstrap");
const react_2 = require("react");
const apolloClient_1 = require("../../client/graphql/apolloClient");
const Error_1 = __importDefault(require("../Error"));
const IconButton_1 = __importDefault(require("../elements/IconButton"));
const Button_1 = __importDefault(require("../elements/Button"));
const H3_1 = __importDefault(require("../typography/H3"));
const ConfirmDialog = ({ mutateOptionsFn, iconFn, labelFn, title, body, onSubmit, iconButton = false }) => {
 const [isOpened, setOpened] = (0, react_2.useState)(false);
 const [isSubmitting, setSubmitting] = (0, react_2.useState)(false);
 const handleOpen = () => setOpened(!isOpened);
 const [error, setError] = (0, react_2.useState)('');
 const onClick = () => {
 (0, apolloClient_1.apiMutate)(mutateOptionsFn(), data => {
 setOpened(false);
 onSubmit && onSubmit(data);
 }, setError, setSubmitting);
 };
 const icon = iconFn;
 const label = labelFn(isSubmitting);
 return <>
 {iconButton
 ? <IconButton_1.default icon={icon} tooltip={label} onClick={handleOpen} disabled={isSubmitting}/>
 : <Button_1.default icon={icon} label={label} onClick={handleOpen} disabled={isSubmitting}/>}
 <react_1.Dialog open={isOpened} handler={handleOpen}>
 <react_1.Card>
 <react_1.CardBody className="d-flex flex-column gap-4">
 <H3_1.default>{title}</H3_1.default>

 <react_1.Typography className="mb-3" variant="paragraph">{body}</react_1.Typography>

 {error && <Error_1.default text={error} simple/>}
 </react_1.CardBody>

 <react_1.CardFooter className="pt-0">
 <Button_1.default label="Cancel" onClick={handleOpen}/>{' '}
 <Button_1.default icon={icon} label={label} size="md" onClick={onClick} disabled={isSubmitting}/>
 </react_1.CardFooter>
 </react_1.Card>
 </react_1.Dialog>
 </>;
};
exports.default = (0, react_2.memo)(ConfirmDialog);
//# sourceMappingURL=ConfirmDialog.js.map