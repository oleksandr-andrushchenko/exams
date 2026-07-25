"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiQuery = apiQuery;
exports.apiMutate = apiMutate;
const client_1 = require("@apollo/client");
const context_1 = require("@apollo/client/link/context");
const testsRunning_1 = __importDefault(require("../../utils/testsRunning"));
const httpLink = (0, client_1.createHttpLink)({
    uri: process.env.NEXT_PUBLIC_API_BASE_URL || process.env.VITE_API_BASE_URL || '',
    fetch: (0, testsRunning_1.default)()
        ? (() => Promise.reject(new Error('Unexpected network request during tests')))
        : undefined,
});
const authLink = (0, context_1.setContext)((_, { headers }) => {
    const authenticationTokenString = localStorage.getItem('authenticationToken');
    const authenticationToken = authenticationTokenString ? JSON.parse(authenticationTokenString) : undefined;
    if (authenticationToken) {
        return {
            headers: {
                ...headers,
                authorization: `Bearer ${authenticationToken.token}`,
            },
        };
    }
    return {
        headers,
    };
});
const apolloClient = new client_1.ApolloClient({
    link: authLink.concat(httpLink),
    cache: new client_1.InMemoryCache({
        addTypename: false,
    }),
});
exports.default = apolloClient;
function apiQuery(options, setData, setError = () => {
}, setLoading = () => {
}) {
    setLoading(true);
    options = {
        errorPolicy: 'all',
        fetchPolicy: 'network-only',
        ...options,
    };
    return apolloClient.query(options)
        .then(({ data, errors }) => {
        if (errors) {
            const error = errors
                .filter(error => !error.message.startsWith('Access denied!'))
                .map(error => error.message).join('\n');
            if (error) {
                setError && setError(error);
                return;
            }
        }
        if (data != null) {
            setData(data);
        }
    })
        .catch(err => setError && setError(err.message))
        .finally(() => setLoading && setLoading(false));
}
function apiMutate(options, setData, setError = () => {
}, setLoading = () => {
}) {
    setLoading(true);
    options = {
        errorPolicy: 'all',
        fetchPolicy: 'network-only',
        ...options,
    };
    return apolloClient.mutate(options)
        .then(({ data, errors }) => {
        if (errors) {
            const error = errors
                .filter(error => !error.message.startsWith('Access denied!'))
                .map(error => error.message).join('\n');
            if (error) {
                setError && setError(error);
                return;
            }
        }
        if (data != null) {
            setData(data);
        }
    })
        .catch(err => setError && setError(err.message))
        .finally(() => setLoading && setLoading(false));
}
//# sourceMappingURL=apolloClient.js.map