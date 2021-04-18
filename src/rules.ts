import { arrowFunc, methodCall, arrayExpression } from './pattern-matcher';
import { ReplacementRule } from './replace-node';

const filterWithArrowFunc = (params: string[]) => methodCall('filter', 
    arrayExpression('arrayExpression'),
    arrowFunc(params, 'filterExpression')
);

export const replacementRules: ReplacementRule[] = [
    /* a silly example to show the simplest replacement
    {
        name: 'wat?',
        matchPattern: {
            kind: ts.SyntaxKind.NumericLiteral,
            text: '10'
        },
        replacementCode: '(5+5)'
    }, */
    {
        name: 'forEach',
        matchPattern: methodCall('forEach', 
            arrayExpression('arrayExpression'), 
            arrowFunc(['_item', '_idx?', '_array?'], 'body')
        ),
        replacementCode: (match) => `
        ((_arr) => {
            for (let _i = 0; _i < _arr.length; ++_i) {
                let _item = _arr[_i];
                ${match._idx ? 'let _idx = _i;' : ''}
                ${match._array ? 'let _array = _arr;' : ''}
                body;
            }
        })(arrayExpression)`
    },
    {
        name: 'find',
        matchPattern: methodCall('find', 
            arrayExpression('arrayExpression'), 
            arrowFunc(['_item', '_idx?', '_array?'], 'condition')
        ),
        replacementCode: (match) => `
        ((_arr) => {
            for (let _i = 0; _i < _arr.length; ++_i) {
                let _item = _arr[_i];
                ${match._idx ? 'let _idx = _i;' : ''}
                ${match._array ? 'let _array = _arr;' : ''}
                if (condition) return _arr[_i];
            }
        })(arrayExpression)`
    },
    {
        name: 'filter_map_reduce',
        matchPattern: methodCall('reduce', 
            methodCall('map', 
                filterWithArrowFunc(['_filterItem?', '_filterIdx?', '_filterArr?']), 
                arrowFunc(['_mapItem?', '_mapIdx?'], 'mapExpression')
            ),
            arrowFunc(['_reduceAcc?', '_reduceCurrent?', '_reduceIdx?'], 'reduceExpression'),
            { _captureName: 'reduceInitVal' }
        ),
        replacementCode: (match) => `
        ((_arr) => {
            let _acc = reduceInitVal;
            ${match._mapIdx || match._reduceIdx ? 'let _mrIdx = 0;' : ''}
            for (let _i = 0; _i < _arr.length; _i++) {
                ${match._filterItem ? 'let _filterItem = _arr[_i];' : ''}
                ${match._filterIdx ? 'let _filterIdx = _i;' : ''}
                ${match._filterArr ? 'let _filterArr = _arr;' : ''}
                if (filterExpression) {
                    ${match._mapItem ? 'let _mapItem = _arr[_i];' : ''}
                    ${match._mapIdx ? 'let _mapIdx = _mrIdx;' : ''}
                    let _mapRes = mapExpression;
                    ${match._reduceAcc ? 'let _reduceAcc = _acc;' : ''}
                    ${match._reduceCurrent ? 'let _reduceCurrent = _mapRes;' : ''}
                    ${match._reduceIdx ? 'let _reduceIdx = _mrIdx;' : ''}
                    _acc = reduceExpression;
                    ${match._mapIdx || match._reduceIdx ? '_mrIdx++;' : ''}
                }
            }
            return _acc;
        })(arrayExpression)`
    },
    {
        name: 'filter_reduce',
        matchPattern: methodCall('reduce', 
            filterWithArrowFunc(['_filterItem?', '_filterIdx?', '_filterArr?']), 
            arrowFunc(['_reduceAcc?', '_reduceCurrent?', '_reduceIdx?'], 'reduceExpression'),
            { _captureName: 'reduceInitVal' }
        ),
        replacementCode: (match) => `
        ((_arr) => {
            let _acc = reduceInitVal;
            ${match._reduceIdx ? 'let _mrIdx = 0;' : ''}
            for (let _i = 0; _i < _arr.length; _i++) {
                ${match._filterItem ? 'let _filterItem = _arr[_i];' : ''}
                ${match._filterIdx ? 'let _filterIdx = _i;' : ''}
                ${match._filterArr ? 'let _filterArr = _arr;' : ''}
                if (filterExpression) {
                    ${match._reduceAcc ? 'let _reduceAcc = _acc;' : ''}
                    ${match._reduceCurrent ? 'let _reduceCurrent = _arr[_i];' : ''}
                    ${match._reduceIdx ? 'let _reduceIdx = _mrIdx;' : ''}
                    _acc = reduceExpression;
                    ${match._reduceIdx ? '_mrIdx++;' : ''}
                }
            }
            return _acc;
        })(arrayExpression)`
    },
    {
        name: 'filter_map',
        matchPattern: methodCall('map', 
            filterWithArrowFunc(['_filterItem?', '_filterIdx?', '_filterArr?']), 
            arrowFunc(['_mapItem?', '_mapIdx?'], 'mapExpression')
        ),
        replacementCode: (match) => `
        ((_arr) => {
            const _res = [];
            for (let _i = 0; _i < _arr.length; _i++) {
                ${match._filterItem ? 'let _filterItem = _arr[_i];' : ''}
                ${match._mapItem ? 'let _mapItem = _arr[_i];' : ''}
                ${match._filterIdx ? 'let _filterIdx = _i;' : ''}
                ${match._filterArr ? 'let _filterArr = _arr;' : ''}
                ${match._mapIdx ? 'let _mapIdx = _res.length;' : ''}
                if (filterExpression) _res.push(mapExpression);
            }
            return _res;
        })(arrayExpression)`
    },
    {
        name: 'map_filter',
        matchPattern: methodCall('filter', 
            methodCall('map', 
                arrayExpression('arrayExpression'), 
                arrowFunc(['_mapItem?', '_mapIdx?', '_mapArr?'], 'mapExpression')
            ), 
            arrowFunc(['_filterItem?', '_filterIdx?'], 'filterExpression')
        ),
        replacementCode: (match) => `
        ((_arr) => {
            const _res = [];
            for (let _i = 0; _i < _arr.length; _i++) {
                ${match._mapItem ? 'let _mapItem = _arr[_i];' : ''}
                ${match._mapIdx ? 'let _mapIdx = _i;' : ''}
                ${match._mapArr ? 'let _mapArr = _arr;' : ''}
                const _mapResult = mapExpression;
                ${match._filterItem ? 'let _filterItem = _mapResult;' : ''}
                ${match._filterIdx ? 'let _filterIdx = _i;' : ''}
                if (filterExpression) _res.push(_mapResult);
            }
            return _res;
        })(arrayExpression)`
    },
    {
        name: 'map_reduce',
        matchPattern: methodCall('reduce', 
                methodCall('map', 
                    arrayExpression('arrayExpression'), 
                    arrowFunc(['_mapItem?', '_mapIdx?', '_mapArr?'], 'mapExpression')
                ),
            arrowFunc(['_reduceAcc?', '_reduceCurrent?', '_reduceIdx?'], 'reduceExpression'),
            { _captureName: 'reduceInitVal' }
        ),
        replacementCode: (match) => `
        ((_arr) => {
            let _acc = reduceInitVal;
            for (let _i = 0; _i < _arr.length; _i++) {
                ${match._mapItem ? 'let _mapItem = _arr[_i];' : ''}
                ${match._mapIdx ? 'let _mapIdx = _i;' : ''}
                ${match._mapArr ? 'let _mapArr = _arr;' : ''}
                let _mapResult = mapExpression;
                ${match._reduceAcc ? 'let _reduceAcc = _acc;' : ''}
                ${match._reduceCurrent ? 'let _reduceCurrent = _mapResult;' : ''}
                ${match._reduceIdx ? 'let _reduceIdx = _i;' : ''}
                _acc = reduceExpression;
            }
            return _acc;
        })(arrayExpression)`
    },
    {
        name: 'filter',
        matchPattern: filterWithArrowFunc(['_filterItem?', '_filterIdx?', '_filterArr?']),
        replacementCode: (match) => `
        ((_arr) => {
            const _res = [];
            for (let _i = 0; _i < _arr.length; _i++) {
                ${match._filterItem ? 'let _filterItem = _arr[_i];' : ''}
                ${match._filterIdx ? 'let _filterIdx = _i;' : ''}
                ${match._filterArr ? 'let _filterArr = _arr;' : ''}
                if (filterExpression) _res.push(_arr[_i]);
            }
            return _res;
        })(arrayExpression)`
    },
    {
        name: 'map',
        matchPattern: methodCall('map', 
            arrayExpression('arrayExpression'), 
            arrowFunc(['_mapItem?', '_mapIdx?', '_mapArr?'], 'mapExpression')),
        replacementCode: (match) => `
        ((_arr) => {
            const _res = new Array(_arr.length);
            for (let _i = 0; _i < _arr.length; _i++) {
                ${match._mapItem ? 'let _mapItem = _arr[_i];' : ''}
                ${match._mapIdx ? 'let _mapIdx = _i;' : ''}
                ${match._mapArr ? 'let _mapArr = _arr;' : ''}
                _res[_i] = mapExpression;
            }
            return _res;
        })(arrayExpression)`
    },
    {
        name: 'reduce',
        matchPattern: methodCall('reduce', 
            arrayExpression('arrayExpression'),
            arrowFunc(['_reduceAcc?', '_reduceCurrent?', '_reduceIdx?', '_reduceArr?'], 'reduceExpression'),
            { _captureName: 'reduceInitVal' }
        ),
        replacementCode: (match) => `
        ((_arr) => {
            let _acc = reduceInitVal;
            for (let _i = 0; _i < _arr.length; _i++) {
                ${match._reduceAcc ? 'let _reduceAcc = _acc;' : ''}
                ${match._reduceCurrent ? 'let _reduceCurrent = _arr[_i];' : ''}
                ${match._reduceIdx ? 'let _reduceIdx = _i;' : ''}
                ${match._reduceArr ? 'let _reduceArr = _arr;' : ''}
                _acc = reduceExpression;
            }
            return _acc;
        })(arrayExpression)`
    }
];