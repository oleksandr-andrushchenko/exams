"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("@material-tailwind/react");
const react_2 = require("react");
const Spinner = ({ type, height, width, children }) => {
    if (type === 'button') {
        return (<span className="animate-pulse">
        <react_1.Button disabled tabIndex={-1} className={`${height ?? 'h-8'} ${width ?? 'w-24'} bg-gray-300 shadow-none hover:shadow-none`}>
        {children ?? ''}
      </react_1.Button>
      </span>);
    }
    if (type === 'icon-button') {
        return (<span className="animate-pulse">
        <react_1.IconButton disabled tabIndex={-1} className={`bg-gray-300 shadow-none hover:shadow-none`}>
          &nbsp;
        </react_1.IconButton>
      </span>);
    }
    if (type === 'text') {
        return (<react_1.Typography as="span" className={`animate-pulse inline-block ${height ?? 'h-2'} ${width ?? 'w-24'} rounded-full bg-gray-300`}>
        {children ?? ''}
      </react_1.Typography>);
    }
    return <react_1.Spinner className="h-8 w-8 text-gray-900/50"/>;
};
exports.default = (0, react_2.memo)(Spinner);
//# sourceMappingURL=Spinner.js.map