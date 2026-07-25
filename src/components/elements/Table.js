"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_router_dom_1 = require("react-router-dom");
const react_1 = require("@material-tailwind/react");
const react_2 = require("react");
const IconButton_1 = __importDefault(require("./IconButton"));
const urlSearchParamsToPlainObject_1 = __importDefault(require("../../utils/urlSearchParamsToPlainObject"));
const apolloClient_1 = require("../../client/graphql/apolloClient");
const Error_1 = __importDefault(require("../Error"));
const Spinner_1 = __importDefault(require("../Spinner"));
const solid_1 = require("@heroicons/react/24/solid");
const Button_1 = __importDefault(require("./Button"));
const Buttons_1 = __importDefault(require("./Buttons"));
const Table = ({ className = '', key2, defaultSearchParams = { size: '20' }, queryOptions, queryData, buttons = {}, tabs = {}, filters = {}, columns = [], mapper, }) => {
    const [isLoading, setLoading] = (0, react_2.useState)(true);
    const [searchParams, setSearchParams] = (0, react_router_dom_1.useSearchParams)();
    const [items, setItems] = (0, react_2.useState)();
    const [error, setError] = (0, react_2.useState)('');
    const applySearchParams = (partialQueryParams) => {
        setItems(undefined);
        searchParams.delete('prevCursor');
        searchParams.delete('nextCursor');
        for (const key in partialQueryParams) {
            if (partialQueryParams[key] === undefined || partialQueryParams[key] === '') {
                searchParams.delete(key);
            }
            else {
                searchParams.set(key, partialQueryParams[key]);
            }
        }
        searchParams.sort();
        setSearchParams(searchParams);
    };
    const clearSearchParams = () => {
        setItems(undefined);
        setSearchParams();
    };
    const showClear = () => searchParams.toString() !== '';
    (0, react_2.useEffect)(() => {
        const filter = { ...defaultSearchParams, ...(0, urlSearchParamsToPlainObject_1.default)(searchParams) };
        if ('size' in filter) {
            filter.size = +filter.size;
        }
        (0, apolloClient_1.apiQuery)(queryOptions(filter), async (data) => setItems(await queryData(data, { setError, setLoading })), setError, setLoading);
    }, [searchParams, key2]);
    return <div className={className}>
    {error && <Error_1.default text={error}/>}

    {(Object.values(buttons).filter((button) => !!button).length > 0) && <Buttons_1.default buttons={buttons}/>}

    {(Object.keys(tabs).length > 0) && (<div className="flex gap-5 items-center mt-4">
        {Object.entries(tabs).map(([filter, values]) => (<div key={filter} className="flex gap-2 items-center">
            <react_1.Typography variant="small">{filter}:</react_1.Typography>
            <react_1.Tabs value={searchParams.get(filter) || 'all'}>
              <react_1.TabsHeader>
                {['all', ...values].map(value => (<react_1.Tab key={value} value={value} className="text-xs small text-small" onClick={() => applySearchParams({ [filter]: value === 'all' ? undefined : value })}>
                    {value}
                  </react_1.Tab>))}
              </react_1.TabsHeader>
            </react_1.Tabs>
          </div>))}
      </div>)}

    <div className="flex gap-1 items-center mt-4">
      {filters && Object.entries(filters).map(([filter, values]) => {
            return (<react_1.Select key={`${filter}-${Object.keys(values).join('')}`} label={filter} onChange={value => applySearchParams({ [filter]: value === '' ? undefined : value })} value={searchParams.get(filter) || ''} className="min-w-[200px] capitalize" containerProps={{ className: 'min-w-[200px]' }}>
            {Object.entries({ '': 'all', ...values }).map(([value, label]) => {
                    return (<react_1.Option key={`${filter}-${value}`} value={value} disabled={value === searchParams.get(filter)} className="capitalize">
                  {String(label)}
                </react_1.Option>);
                })}
          </react_1.Select>);
        })}

      <react_1.Input label="Search" value={searchParams.get('search') || ''} onChange={(e) => applySearchParams({ search: e.target.value === '' ? undefined : e.target.value })} icon={<solid_1.MagnifyingGlassIcon className="h-4 w-4"/>}/>

      <react_1.Select label="Size" onChange={(size) => applySearchParams({ size: size === defaultSearchParams['size'] ? undefined : size })} value={searchParams.get('size') || defaultSearchParams['size']} className="capitalize">
        {[1, 5, 10, 20, 30, 40, 50].map((size) => (<react_1.Option key={size} value={`${size}`} disabled={`${size}` === searchParams.get('size')}>
            {size}
          </react_1.Option>))}
      </react_1.Select>

      {items && ((items.meta.prevCursor || items.meta.nextCursor) &&
            <react_1.ButtonGroup variant="outlined">
          <IconButton_1.default icon={solid_1.ArrowLeftIcon} onClick={() => applySearchParams({ prevCursor: items?.meta.prevCursor })} disabled={!items.meta.prevCursor}/>
          <IconButton_1.default icon={solid_1.ArrowRightIcon} onClick={() => applySearchParams({ nextCursor: items?.meta.nextCursor })} disabled={!items.meta.nextCursor}/>
        </react_1.ButtonGroup>)}

      {showClear() && <div><Button_1.default label="Clear" variant="outlined" onClick={clearSearchParams}/></div>}
    </div>

    <table className="w-full table-auto text-left text-sm mt-4">
      <thead>
      <tr>{columns.map((head) => <th key={head}>{head}</th>)}</tr>
      </thead>
      <tbody>
      {isLoading && <tr>
        <td colSpan={columns.length} className="p-5 text-center">
          <Spinner_1.default type="text" width="w-full"/>
          <Spinner_1.default type="text" width="w-full"/>
          <Spinner_1.default type="text" width="w-full"/>
          <Spinner_1.default type="text" width="w-full"/>
          <Spinner_1.default type="text" width="w-full"/>
          <Spinner_1.default type="text" width="w-full"/>
          <Spinner_1.default type="text" width="w-full"/>
        </td>
      </tr>}
      {!isLoading && items && items.data.length === 0 && <tr>
        <td colSpan={columns.length} className="p-5 text-center">No data</td>
      </tr>}
      {!isLoading && items && items.data && items.data.map((item, index) => {
            const values = mapper(item, index);
            const key = values.shift();
            const controls = (values.pop() ?? {});
            return (<tr key={`${key}-${index}`}>
            {values.map((value, index2) => <td key={`${index}-${index2}`}>{value}</td>)}
            <td className="flex justify-end gap-1">
              {Object.entries(controls).filter(([_, control]) => !!control)
                    .map(([key, control]) => <span key={key}>{control}</span>)}
            </td>
          </tr>);
        })}
      </tbody>
    </table>
  </div>;
};
exports.default = (0, react_2.memo)(Table);
//# sourceMappingURL=Table.js.map