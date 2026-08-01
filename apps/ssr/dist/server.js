"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const node_path_1 = __importDefault(require("node:path"));
const nunjucks_1 = __importDefault(require("nunjucks"));
const serverless_http_1 = __importDefault(require("serverless-http"));
const data_1 = require("./data");
const app = (0, express_1.default)();
exports.app = app;
const templateDir = node_path_1.default.resolve(__dirname, '../templates');
const publicDir = node_path_1.default.resolve(__dirname, '../public');
nunjucks_1.default.configure(templateDir, { autoescape: true, express: app, noCache: process.env.NODE_ENV !== 'production' });
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/static', express_1.default.static(publicDir, { maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0 }));
app.use((request, response, next) => {
    response.locals.siteName = 'ExamMe';
    response.locals.siteDescription = 'Practice exams and explore questions.';
    response.locals.requestPath = request.path;
    response.locals.query = request.query;
    next();
});
const number = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};
const queryFilters = (request) => ({
    search: typeof request.query.search === 'string' ? request.query.search : undefined,
    approved: typeof request.query.approved === 'string' ? request.query.approved : undefined,
    difficulty: typeof request.query.difficulty === 'string' ? request.query.difficulty : undefined,
    type: typeof request.query.type === 'string' ? request.query.type : undefined,
    tag: typeof request.query.tag === 'string' ? request.query.tag : undefined,
    exam: typeof request.query.exam === 'string' ? request.query.exam : undefined,
    page: number(request.query.page, 1),
    size: Math.min(50, number(request.query.size, 20)),
    sort: typeof request.query.sort === 'string' ? request.query.sort : undefined,
    order: request.query.order === 'asc' ? 'asc' : 'desc',
});
app.get('/', async (_request, response, next) => {
    try {
        response.render('home.html', { data: await (0, data_1.getHomeData)(8), title: 'Home' });
    }
    catch (error) {
        next(error);
    }
});
app.get('/exams', async (request, response, next) => {
    try {
        response.render('exams.html', {
            page: await (0, data_1.getExamList)(queryFilters(request)),
            filters: queryFilters(request),
            title: 'Exams'
        });
    }
    catch (error) {
        next(error);
    }
});
app.get('/questions', async (request, response, next) => {
    try {
        response.render('questions.html', {
            page: await (0, data_1.getQuestionList)(queryFilters(request)),
            filters: queryFilters(request),
            title: 'Questions'
        });
    }
    catch (error) {
        next(error);
    }
});
app.get('/users', async (request, response, next) => {
    try {
        response.render('users.html', {
            page: await (0, data_1.getUserList)(queryFilters(request)),
            filters: queryFilters(request),
            title: 'Users'
        });
    }
    catch (error) {
        next(error);
    }
});
app.get('/exams/:examId', async (request, response, next) => {
    try {
        const exam = await (0, data_1.getExam)(request.params.examId);
        response.status(exam ? 200 : 404).render('exam.html', { exam, title: exam?.name || 'Exam not found' });
    }
    catch (error) {
        next(error);
    }
});
app.get('/questions/:questionId', async (request, response, next) => {
    try {
        const question = await (0, data_1.getQuestion)(request.params.questionId);
        response.status(question ? 200 : 404).render('question.html', {
            question,
            title: question?.title || 'Question not found'
        });
    }
    catch (error) {
        next(error);
    }
});
app.get('/users/:userId', async (request, response, next) => {
    try {
        const user = await (0, data_1.getUser)(request.params.userId);
        const [exams, sessions] = user ? await Promise.all([(0, data_1.getUserExams)(request.params.userId), (0, data_1.getUserExamSessions)(request.params.userId)]) : [undefined, []];
        response.status(user ? 200 : 404).render('user.html', { user, exams, sessions, title: user?.name || 'User not found' });
    }
    catch (error) {
        next(error);
    }
});
app.get('/tags/:slug', async (request, response, next) => {
    try {
        const tag = await (0, data_1.getTag)(request.params.slug);
        response.status(tag ? 200 : 404).render('tag.html', { tag, title: tag?.name || 'Tag not found' });
    }
    catch (error) {
        next(error);
    }
});
app.get('/login', (_request, response) => response.render('login.html', { title: 'Login' }));
app.get('/register', (_request, response) => response.render('register.html', { title: 'Register' }));
async function authenticate(response, credentials, register) {
    const query = register
        ? 'mutation Register($createMe: CreateMe!, $credentials: Credentials!) { createMe(createMe: $createMe) { id } createAuthenticationToken(credentials: $credentials) { token } }'
        : 'mutation Login($email: String!, $password: String!) { createAuthenticationToken(credentials: { email: $email, password: $password }) { token } }';
    const variables = register
        ? { createMe: credentials, credentials }
        : credentials;
    const result = await fetch(process.env.GRAPHQL_URL || 'http://localhost:8080/graphql', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ query, variables }),
    });
    const payload = await result.json();
    if (!result.ok || payload.errors?.length || !payload.data?.createAuthenticationToken?.token) {
        throw new Error(payload.errors?.[0]?.message || 'Authentication failed');
    }
    response.cookie('authenticationToken', payload.data.createAuthenticationToken.token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
    });
}
app.post('/login', async (request, response) => {
    try {
        await authenticate(response, { email: request.body.email, password: request.body.password }, false);
        response.redirect('/');
    }
    catch (error) {
        response.status(401).render('login.html', {
            title: 'Login',
            error: error instanceof Error ? error.message : 'Authentication failed'
        });
    }
});
app.post('/register', async (request, response) => {
    try {
        await authenticate(response, { email: request.body.email, password: request.body.password }, true);
        response.redirect('/');
    }
    catch (error) {
        response.status(400).render('register.html', {
            title: 'Register',
            error: error instanceof Error ? error.message : 'Registration failed'
        });
    }
});
app.use((error, _request, response, _next) => {
    console.error('SSR request failed', error);
    response.status(500).render('error.html', {
        title: 'Internal Server Error',
        error: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
});
exports.handler = (0, serverless_http_1.default)(app);
