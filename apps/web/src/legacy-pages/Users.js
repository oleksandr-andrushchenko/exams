"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("@/components/bootstrap");
const Route_1 = __importDefault(require("../enum/Route"));
const useAuth_1 = __importDefault(require("../hooks/useAuth"));
const solid_1 = require("@heroicons/react/24/solid");
const react_2 = require("react");
const getUsersForUsersPage_1 = __importDefault(require("../client/graphql/users/getUsersForUsersPage"));
const UserPermission_1 = __importDefault(require("../enum/users/UserPermission"));
const AddUser_1 = __importDefault(require("../components/users/AddUser"));
const icons_1 = require("../registry/icons");
const H1_1 = __importDefault(require("../components/typography/H1"));
const DeleteUser_1 = __importDefault(require("../components/users/DeleteUser"));
const Table_1 = __importDefault(require("../components/elements/Table"));
const Link_1 = __importDefault(require("../components/elements/Link"));
const Users = () => {
    const [tableKey, setTableKey] = (0, react_2.useState)(2);
    const refresh = () => setTableKey(Math.random());
    const { checkAuthorization } = (0, useAuth_1.default)();
    (0, react_2.useEffect)(() => {
        document.title = 'Users';
    }, []);
    return <>
    <react_1.Breadcrumbs>
      <Link_1.default icon={solid_1.HomeIcon} label="Home" to={Route_1.default.Home}/>
      <Link_1.default label="Users" to={Route_1.default.Users}/>
    </react_1.Breadcrumbs>

    <H1_1.default icon={icons_1.ListIcon} label="Users" sub="Users info"/>

    <Table_1.default key2={tableKey} buttons={{
            create: checkAuthorization(UserPermission_1.default.Create) && <AddUser_1.default onSubmit={refresh}/>,
        }} columns={['#', 'Name', '']} queryOptions={(filter) => (0, getUsersForUsersPage_1.default)(filter)} queryData={(data) => data.paginatedUsers} mapper={(user, index) => [
            user.id,
            index + 1,
            <Link_1.default label={user.name || 'Unnamed user'} to={Route_1.default.User.replace(':userId', user.id)}/>,
            {
                update: checkAuthorization(UserPermission_1.default.Update, user) &&
                    <AddUser_1.default user={user} onSubmit={refresh} iconButton/>,
                delete: checkAuthorization(UserPermission_1.default.Delete, user) &&
                    <DeleteUser_1.default user={user} onSubmit={refresh} iconButton/>,
            },
        ]}/>
  </>;
};
exports.default = (0, react_2.memo)(Users);
//# sourceMappingURL=Users.js.map