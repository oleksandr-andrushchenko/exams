'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
 return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SiteHeader;
const link_1 = __importDefault(require("next/link"));
const react_1 = require("react");
const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
function SiteHeader() {
 const [user, setUser] = (0, react_1.useState)();
 const [loadingUser, setLoadingUser] = (0, react_1.useState)(true);
 (0, react_1.useEffect)(() => {
 const loadUser = async () => {
 const raw = localStorage.getItem('authenticationToken');
 if (!raw) {
 setUser(undefined);
 setLoadingUser(false);
 return;
 }
 try {
 const token = JSON.parse(raw);
 const response = await fetch(apiUrl, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token.token}` }, body: JSON.stringify({ query: 'query CurrentUser { me { id email name } }' }) });
 const result = await response.json();
 if (result.errors?.length || !result.data?.me)
 throw new Error('Invalid session');
 setUser(result.data.me);
 }
 catch {
 localStorage.removeItem('authenticationToken');
 setUser(undefined);
 }
 finally {
 setLoadingUser(false);
 }
 };
 loadUser();
 const refresh = () => loadUser();
 window.addEventListener('auth-changed', refresh);
 return () => window.removeEventListener('auth-changed', refresh);
 }, []);
 const logout = () => { localStorage.removeItem('authenticationToken'); setUser(undefined); window.dispatchEvent(new Event('auth-changed')); };
 return <header className=" w-100 rounded-0 border-bottom bg-white px-4 py-2 text-black px-lg-5 py-lg-4"><nav className="mx-auto d-flex container align-items-center justify-content-between text-secondary px-4 px-lg-5">
 <link_1.default className=" fs-5" href="/">Exam Me</link_1.default>
 <div className="d-flex align-items-center gap-4 small text-secondary"><link_1.default href="/exams">Exams</link_1.default><link_1.default href="/questions">Questions</link_1.default><link_1.default href="/users">Users</link_1.default>{loadingUser ? <span>Loading...</span> : user ? <><link_1.default href={`/users/${user.id}`}>{user.email || user.name}</link_1.default><button onClick={logout}>Logout</button></> : <a href="/login">Login</a>}</div>
 </nav></header>;
}
//# sourceMappingURL=SiteHeader.js.map