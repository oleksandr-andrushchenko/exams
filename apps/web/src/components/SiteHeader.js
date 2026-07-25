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
    return <header className="h-max max-w-full rounded-none border-b bg-white px-4 py-2 text-black lg:px-8 lg:py-4"><nav className="mx-auto flex max-w-7xl items-center justify-between text-blue-gray-900 sm:px-6 lg:px-8">
    <link_1.default className="font-secondary text-xl" href="/">Exam Me</link_1.default>
    <div className="flex items-center gap-4 text-sm text-blue-gray-900"><link_1.default href="/exams">Exams</link_1.default><link_1.default href="/questions">Questions</link_1.default><link_1.default href="/users">Users</link_1.default>{loadingUser ? <span>Loading...</span> : user ? <><link_1.default href={`/users/${user.id}`}>{user.email || user.name}</link_1.default><button onClick={logout}>Logout</button></> : <a href="/login">Login</a>}</div>
  </nav></header>;
}
//# sourceMappingURL=SiteHeader.js.map