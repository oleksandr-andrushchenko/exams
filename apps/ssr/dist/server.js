"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const jwt = __importStar(require("jsonwebtoken"));
const node_path_1 = __importDefault(require("node:path"));
const nunjucks_1 = __importDefault(require("nunjucks"));
const serverless_http_1 = __importDefault(require("serverless-http"));
const data_1 = require("./data");
const app = (0, express_1.default)();
exports.app = app;
const canViewUnapproved = (user, permission) => user?.permissions?.some((userPermission) => userPermission === permission || userPermission === 'root' || userPermission === '*') ?? false;
const templateDir = node_path_1.default.resolve(__dirname, '../templates');
const sharedTemplateDir = node_path_1.default.resolve(__dirname, '../../../shared/templates');
const publicDir = node_path_1.default.resolve(__dirname, '../public');
nunjucks_1.default.configure([templateDir, sharedTemplateDir], {
    autoescape: true,
    express: app,
    noCache: process.env.NODE_ENV !== 'production'
});
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/static', express_1.default.static(publicDir, { maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0 }));
app.use((request, response, next) => {
    response.locals.siteName = 'ExamMe';
    response.locals.siteDescription = 'Practice exams and explore questions.';
    response.locals.requestPath = request.path;
    response.locals.query = request.query;
    next();
});
app.use(async (request, response, next) => {
    const token = request.headers.cookie
        ?.split(';')
        .map((cookie) => cookie.trim())
        .find((cookie) => cookie.startsWith('authenticationToken='))
        ?.slice('authenticationToken='.length);
    if (token) {
        try {
            const payload = jwt.verify(token, 'any');
            if (payload.type === 'access' && payload.userId) {
                response.locals.currentUser = await (0, data_1.getUser)(payload.userId);
            }
        }
        catch {
            // Treat an absent, expired, or invalid token as an anonymous session.
        }
    }
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
    order: request.query.order === 'asc' ? 'asc' : 'desc'
});
app.get('/', async (_request, response, next) => {
    try {
        response.render('home.html', {
            data: await (0, data_1.getHomeData)(8, canViewUnapproved(response.locals.currentUser, 'getExam'), canViewUnapproved(response.locals.currentUser, 'getQuestion')),
            title: 'Home'
        });
    }
    catch (error) {
        next(error);
    }
});
app.get('/exams', async (request, response, next) => {
    try {
        response.render('exams.html', {
            page: await (0, data_1.getExamList)(queryFilters(request), canViewUnapproved(response.locals.currentUser, 'getExam')),
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
            page: await (0, data_1.getQuestionList)(queryFilters(request), canViewUnapproved(response.locals.currentUser, 'getQuestion')),
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
async function submitRating(request, response, id) {
    const mark = Number(request.body.mark);
    const token = request.headers.cookie
        ?.split(';')
        .map((cookie) => cookie.trim())
        .find((cookie) => cookie.startsWith('authenticationToken='))
        ?.slice('authenticationToken='.length);
    const target = '/questions/' + id;
    const wantsJson = request.headers.accept?.includes('application/json');
    if (!Number.isInteger(mark) || mark < 0 || mark > 5 || !token) {
        if (wantsJson) {
            response.status(400).json({ ok: false, error: 'Invalid rating request' });
            return;
        }
        response.redirect(target + '?ratingError=1');
        return;
    }
    const field = 'questionId';
    const mutation = 'rateQuestion';
    const result = await fetch(process.env.GRAPHQL_URL || 'http://localhost:8080/graphql', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: 'Bearer ' + token },
        body: JSON.stringify({
            query: 'mutation Rate($id: ID!, $mark: Int!) { ' +
                mutation +
                '(' +
                field +
                ': $id, mark: $mark) { id rating { html averageMark markCount } } }',
            variables: { id, mark }
        })
    });
    const payload = (await result.json());
    if (wantsJson) {
        if (!result.ok || payload.errors?.length) {
            response.status(400).json({ ok: false, error: payload.errors?.[0] || 'Unable to save rating' });
            return;
        }
        response.json({ ok: true, html: payload.data?.rateQuestion?.rating?.html });
        return;
    }
    response.redirect(target + (payload.errors?.length ? '?ratingError=1' : ''));
}
app.post('/questions/:questionId/rating', (request, response, next) => {
    submitRating(request, response, request.params.questionId).catch(next);
});
async function renderEdit(request, response, resource, id) {
    const permission = resource === 'user' ? 'updateUser' : resource === 'exam' ? 'updateExam' : 'updateQuestion';
    if (!response.locals.currentUser || !canViewUnapproved(response.locals.currentUser, permission)) {
        response.status(403).render('edit.html', { resource, error: 'You are not authorized to edit this resource' });
        return;
    }
    const data = resource === 'user'
        ? { user: await (0, data_1.getUser)(id) }
        : resource === 'exam'
            ? { exam: await (0, data_1.getExam)(id, true) }
            : { question: await (0, data_1.getQuestion)(id, response.locals.currentUser.id, true) };
    const entity = data[resource];
    response.status(entity ? 200 : 404).render('edit.html', { resource, ...data });
}
async function updateResource(request, response, resource, id) {
    const token = request.headers.cookie
        ?.split(';')
        .map((cookie) => cookie.trim())
        .find((cookie) => cookie.startsWith('authenticationToken='))
        ?.slice('authenticationToken='.length);
    if (!token) {
        response.status(401).render('edit.html', { resource, error: 'Authentication required' });
        return;
    }
    const definitions = {
        user: {
            query: 'mutation Update($id: ID!, $input: UpdateUser!) { updateUser(userId: $id, updateUser: $input) { id } }',
            input: { name: request.body.name, email: request.body.email },
            target: '/users/' + id
        },
        exam: {
            query: 'mutation Update($id: ID!, $input: UpdateExam!) { updateExam(examId: $id, updateExam: $input) { id } }',
            input: { name: request.body.name, requiredScore: Number(request.body.requiredScore) },
            target: '/exams/' + id
        },
        question: {
            query: 'mutation Update($id: ID!, $input: UpdateQuestion!) { updateQuestion(questionId: $id, updateQuestion: $input) { id } }',
            input: { title: request.body.title, difficulty: request.body.difficulty, type: request.body.type },
            target: '/questions/' + id
        }
    };
    const definition = definitions[resource];
    const result = await fetch(process.env.GRAPHQL_URL || 'http://localhost:8080/graphql', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: 'Bearer ' + token },
        body: JSON.stringify({ query: definition.query, variables: { id, input: definition.input } })
    });
    const payload = (await result.json());
    if (!result.ok || payload.errors?.length) {
        response
            .status(400)
            .render('edit.html', { resource, error: payload.errors?.[0]?.message || 'Unable to update resource' });
        return;
    }
    response.redirect(definition.target);
}
app.get('/users/:userId/edit', (request, response, next) => renderEdit(request, response, 'user', request.params.userId).catch(next));
app.post('/users/:userId/edit', (request, response, next) => updateResource(request, response, 'user', request.params.userId).catch(next));
app.get('/exams/:examId/edit', (request, response, next) => renderEdit(request, response, 'exam', request.params.examId).catch(next));
app.post('/exams/:examId/edit', (request, response, next) => updateResource(request, response, 'exam', request.params.examId).catch(next));
app.get('/questions/:questionId/edit', (request, response, next) => renderEdit(request, response, 'question', request.params.questionId).catch(next));
app.post('/questions/:questionId/edit', (request, response, next) => updateResource(request, response, 'question', request.params.questionId).catch(next));
app.get('/exams/:examId', async (request, response, next) => {
    try {
        const exam = await (0, data_1.getExam)(request.params.examId, canViewUnapproved(response.locals.currentUser, 'getExam'));
        response.status(exam ? 200 : 404).render('exam.html', { exam, title: exam?.name || 'Exam not found' });
    }
    catch (error) {
        next(error);
    }
});
app.get('/questions/:questionId', async (request, response, next) => {
    try {
        const question = await (0, data_1.getQuestion)(request.params.questionId, response.locals.currentUser?.id, canViewUnapproved(response.locals.currentUser, 'getQuestion'));
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
        const [exams, sessions] = user
            ? await Promise.all([(0, data_1.getUserExams)(user.id), (0, data_1.getUserExamSessions)(user.id)])
            : [undefined, []];
        response
            .status(user ? 200 : 404)
            .render('user.html', { user, exams, sessions, title: user?.name || 'User not found' });
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
    const variables = register ? { createMe: credentials, credentials } : credentials;
    const result = await fetch(process.env.GRAPHQL_URL || 'http://localhost:8080/graphql', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query, variables })
    });
    const payload = (await result.json());
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
app.post('/logout', (_request, response) => {
    response.clearCookie('authenticationToken');
    response.redirect('/');
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
app.get('/:userSlug/:examSlug/:questionSlug', async (request, response, next) => {
    try {
        const question = await (0, data_1.getQuestion)(request.params.questionSlug, response.locals.currentUser?.id, canViewUnapproved(response.locals.currentUser, 'getQuestion'));
        const matches = !!question &&
            question.exam?.slug === request.params.examSlug &&
            question.exam.userSlug === request.params.userSlug;
        response.status(matches ? 200 : 404).render('question.html', {
            question: matches ? question : undefined,
            title: matches ? question.title : 'Question not found'
        });
    }
    catch (error) {
        next(error);
    }
});
app.get('/:userSlug/:examSlug', async (request, response, next) => {
    try {
        const exam = await (0, data_1.getExam)(request.params.examSlug, canViewUnapproved(response.locals.currentUser, 'getExam'));
        const matches = !!exam && exam.slug === request.params.examSlug && exam.userSlug === request.params.userSlug;
        response
            .status(matches ? 200 : 404)
            .render('exam.html', { exam: matches ? exam : undefined, title: matches ? exam.name : 'Exam not found' });
    }
    catch (error) {
        next(error);
    }
});
app.get('/:userSlug', async (request, response, next) => {
    try {
        const user = await (0, data_1.getUser)(request.params.userSlug);
        const [exams, sessions] = user
            ? await Promise.all([(0, data_1.getUserExams)(user.id), (0, data_1.getUserExamSessions)(user.id)])
            : [undefined, []];
        response
            .status(user ? 200 : 404)
            .render('user.html', { user, exams, sessions, title: user?.name || 'User not found' });
    }
    catch (error) {
        next(error);
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
