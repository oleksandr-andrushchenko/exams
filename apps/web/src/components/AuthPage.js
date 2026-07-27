'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AuthPage;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
function AuthPage({ mode }) {
 const router = (0, navigation_1.useRouter)();
 const [email, setEmail] = (0, react_1.useState)('');
 const [password, setPassword] = (0, react_1.useState)('');
 const [confirmPassword, setConfirmPassword] = (0, react_1.useState)('');
 const [error, setError] = (0, react_1.useState)('');
 const [submitting, setSubmitting] = (0, react_1.useState)(false);
 const register = mode === 'register';
 async function submit(event) {
 event.preventDefault();
 setError('');
 if (register && password !== confirmPassword) {
 setError('Passwords do not match');
 return;
 }
 setSubmitting(true);
 const mutation = register
 ? 'mutation Register($createMe: CreateMe!, $credentials: Credentials!) { createMe(createMe: $createMe) { id } createAuthenticationToken(credentials: $credentials) { token } }'
 : 'mutation Login($email: String!, $password: String!) { createAuthenticationToken(credentials: { email: $email, password: $password }) { token } }';
 try {
 const response = await fetch(process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ query: mutation, variables: register ? { createMe: { email, password }, credentials: { email, password } } : { email, password } }) });
 const result = await response.json();
 if (result.errors?.length)
 throw new Error(result.errors[0].message);
 const token = register ? result.data.createAuthenticationToken : result.data.createAuthenticationToken;
 localStorage.setItem('authenticationToken', JSON.stringify(token));
 window.dispatchEvent(new Event('auth-changed'));
 await new Promise(resolve => setTimeout(resolve, 400));
 router.push('/');
 router.refresh();
 }
 catch (e) {
 setError(e instanceof Error ? e.message : 'Authentication failed');
 }
 finally {
 setSubmitting(false);
 }
 }
 return <section className="mx-auto col-12 col-md-8 col-lg-6"><div className="card"><div className="card-body">
 <h1>{register ? 'Register' : 'Login'}</h1>
 <form className="d-flex flex-column gap-2" onSubmit={submit}>
 <label className="d-block">Email<input className="form-control mt-1" type="email" required value={email} onChange={e => setEmail(e.target.value)}/></label>
 <label className="d-block">Password<input className="form-control mt-1" type="password" required value={password} onChange={e => setPassword(e.target.value)}/></label>
 {register && <label className="d-block">Confirm password<input className="form-control mt-1" type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}/></label>}
 {error && <p className="text-danger">{error}</p>}
 <button className="btn btn-primary" disabled={submitting} type="submit">{submitting ? 'Please wait...' : register ? 'Register' : 'Login'}</button>
 </form>
 </div></div></section>;
}
//# sourceMappingURL=AuthPage.js.map