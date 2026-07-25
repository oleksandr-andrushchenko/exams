"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = App;
const react_router_dom_1 = require("react-router-dom");
const Layout_1 = __importDefault(require("./Layout"));
const Home_1 = __importDefault(require("../legacy-pages/Home"));
const Exams_1 = __importDefault(require("../legacy-pages/Exams"));
const ThemeProvider_1 = __importDefault(require("./ThemeProvider"));
const Exam_1 = __importDefault(require("../legacy-pages/Exam"));
const NotFound_1 = __importDefault(require("../legacy-pages/NotFound"));
const Terms_1 = __importDefault(require("../legacy-pages/Terms"));
const useAuth_1 = require("../hooks/useAuth");
const Route_1 = __importDefault(require("../enum/Route"));
const Question_1 = __importDefault(require("../legacy-pages/Question"));
const Questions_1 = __importDefault(require("../legacy-pages/Questions"));
const ExamSession_1 = __importDefault(require("../legacy-pages/ExamSession"));
const RequireAuthentication_1 = __importDefault(require("./RequireAuthentication"));
const client_1 = require("@apollo/client");
const apolloClient_1 = __importDefault(require("../client/graphql/apolloClient"));
const Users_1 = __importDefault(require("../legacy-pages/Users"));
const User_1 = __importDefault(require("../legacy-pages/User"));
const ExamTag_1 = __importDefault(require("../legacy-pages/ExamTag"));
const Login_1 = __importDefault(require("./Login"));
const Register_1 = __importDefault(require("./Register"));
const Link_1 = __importDefault(require("./elements/Link"));
const react_1 = require("@material-tailwind/react");
const solid_1 = require("@heroicons/react/24/solid");
const routes = <react_router_dom_1.Routes>
  <react_router_dom_1.Route element={<Layout_1.default />}>
    <react_router_dom_1.Route path={Route_1.default.Home} element={<Home_1.default />}/>
    <react_router_dom_1.Route path={Route_1.default.Exams} element={<Exams_1.default />}/>
    <react_router_dom_1.Route path={Route_1.default.Exam} element={<Exam_1.default />}/>
    <react_router_dom_1.Route path={Route_1.default.ExamTag} element={<ExamTag_1.default />}/>
    <react_router_dom_1.Route path={Route_1.default.Questions} element={<Questions_1.default />}/>
    <react_router_dom_1.Route path={Route_1.default.Question} element={<Question_1.default />}/>
    <react_router_dom_1.Route element={<RequireAuthentication_1.default />}>
      <react_router_dom_1.Route path={Route_1.default.ExamSession} element={<ExamSession_1.default />}/>
    </react_router_dom_1.Route>
    <react_router_dom_1.Route path={Route_1.default.Terms} element={<Terms_1.default />}/>
    <react_router_dom_1.Route path={Route_1.default.Users} element={<Users_1.default />}/>
    <react_router_dom_1.Route path={Route_1.default.User} element={<User_1.default />}/>
    <react_router_dom_1.Route path="*" element={<NotFound_1.default />}/>
  </react_router_dom_1.Route>
  <react_router_dom_1.Route path={Route_1.default.Login} element={<><react_1.Breadcrumbs><Link_1.default icon={solid_1.HomeIcon} label="Home" to={Route_1.default.Home}/></react_1.Breadcrumbs><Login_1.default /></>}/>
  <react_router_dom_1.Route path={Route_1.default.Register} element={<><react_1.Breadcrumbs><Link_1.default icon={solid_1.HomeIcon} label="Home" to={Route_1.default.Home}/></react_1.Breadcrumbs><Register_1.default /></>}/>
</react_router_dom_1.Routes>;
function App() {
    return (<useAuth_1.AuthenticationProvider>
      <ThemeProvider_1.default>
        <client_1.ApolloProvider client={apolloClient_1.default}>
          <react_router_dom_1.BrowserRouter>
            {routes}
          </react_router_dom_1.BrowserRouter>
        </client_1.ApolloProvider>
      </ThemeProvider_1.default>
    </useAuth_1.AuthenticationProvider>);
}
//# sourceMappingURL=App.js.map