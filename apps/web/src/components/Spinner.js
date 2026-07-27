"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("@/components/bootstrap");
const react_2 = require("react");
const Spinner = ({ type, height, width, children }) => {
 if (type === 'button') {
 return (<span className="placeholder-glow">
 <react_1.Button disabled tabIndex={-1} className={`${height ?? ''} ${width ?? 'w-100'}  `}>
 {children ?? ''}
 </react_1.Button>
 </span>);
 }
 if (type === 'icon-button') {
 return (<span className="placeholder-glow">
 <react_1.IconButton disabled tabIndex={-1} className={` `}>
 &nbsp;
 </react_1.IconButton>
 </span>);
 }
 if (type === 'text') {
 return (<react_1.Typography as="span" className={`placeholder-glow d-inline-block ${height ?? 'placeholder'} ${width ?? 'w-100'} rounded `}>
 {children ?? ''}
 </react_1.Typography>);
 }
 return <react_1.Spinner className=" text-secondary"/>;
};
exports.default = (0, react_2.memo)(Spinner);
//# sourceMappingURL=Spinner.js.map