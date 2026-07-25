"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const solid_1 = require("@heroicons/react/24/solid");
const react_1 = require("@material-tailwind/react");
const react_2 = require("react");
const Text_1 = __importDefault(require("./typography/Text"));
const Error = ({ text, simple }) => {
    console.log(text);
    if (simple) {
        return (<react_1.Typography color="red">
        <solid_1.ExclamationCircleIcon className="inline-block h-5 w-5"/> {text.toString()}
      </react_1.Typography>);
    }
    return (<Text_1.default icon={solid_1.ExclamationCircleIcon} label={text.toString()} variant="small" color="red" className="flex items-center gap-1 font-normal"/>);
};
exports.default = (0, react_2.memo)(Error);
//# sourceMappingURL=Error.js.map