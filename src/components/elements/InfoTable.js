"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const Spinner_1 = __importDefault(require("../Spinner"));
const InfoTable = ({ className = '', title, columns, source, mapper, key2 = 1 }) => {
    const data = source ? mapper(source) : {};
    return (<table className={`w-full table-auto text-left text-sm ${className}`}>
      {title && <legend>{title}</legend>}
      <tbody>
      {columns.map((column, index) => (<tr key={`${column}-${data[index] ?? ''}-${key2}`}>
          <th className="w-2/12">{column}</th>
          <td>{data ? data[index] : <Spinner_1.default type="text"/>}</td>
        </tr>))}
      </tbody>
    </table>);
};
exports.default = (0, react_1.memo)(InfoTable);
//# sourceMappingURL=InfoTable.js.map