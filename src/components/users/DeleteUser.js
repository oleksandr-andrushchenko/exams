"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const deleteUser_1 = __importDefault(require("../../client/graphql/users/deleteUser"));
const icons_1 = require("../../registry/icons");
const ConfirmDialog_1 = __importDefault(require("../dialogs/ConfirmDialog"));
const DeleteUser = ({ user, onSubmit, iconButton = false }) => {
    return (<ConfirmDialog_1.default mutateOptionsFn={() => (0, deleteUser_1.default)(user.id)} iconFn={icons_1.DeleteIcon} labelFn={(isSubmitting) => isSubmitting ? 'Deleting User...' : 'Delete User'} title={`Are you sure you want to delete "${user.name}" user?`} body={<>This will delete "{user.name}" user permanently.<br />You cannot undo this action.</>} onSubmit={onSubmit} iconButton={iconButton}/>);
};
exports.default = (0, react_1.memo)(DeleteUser);
//# sourceMappingURL=DeleteUser.js.map