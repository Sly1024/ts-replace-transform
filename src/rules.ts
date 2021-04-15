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
            arrowFunc(['element', 'index?', 'array?'], 'body')
        ),
        replacementCode: (match) => `
        ((arr) => {
            for (let i = 0; i < arr.length; ++i) {
                let item = arr[i];
                ${match.index ? 'let idx = i;' : ''}
                ${match.array ? 'let array = arr;' : ''}
                body;
            }
        })(arrayExpression)
        `,
        tempVariables: ['arr', 'i', 'item', 'idx', 'array'],
        processCaptureBlocks: {
            arrayExpression: {},
            body: { element: 'item', index: 'idx', array: 'array' }
        }
    },
    {
        name: 'find',
        matchPattern: methodCall('find', 
            arrayExpression('arrayExpression'), 
            arrowFunc(['element', 'index?', 'array?'], 'condition')
        ),
        replacementCode: (match) => `
        ((arr) => {
            for (let i = 0; i < arr.length; ++i) {
                let item = arr[i];
                ${match.index ? 'let idx = i;' : ''}
                ${match.array ? 'let array = arr;' : ''}
                if (condition) return arr[i];
            }
        })(arrayExpression)
        `,
        tempVariables: ['arr', 'i', 'item', 'idx', 'array'],
        processCaptureBlocks: {
            arrayExpression: {},
            condition: { element: 'item', index: 'idx', array: 'array' }
        }
    },
    {
        name: 'filter_map_reduce',
        matchPattern: methodCall('reduce', 
            methodCall('map', 
                filterWithArrowFunc(['filterItem?', 'filterIdx?', 'filterArr?']), 
                arrowFunc(['mapItem?', 'mapIdx?'], 'mapExpression')
            ),
            arrowFunc(['reduceAcc?', 'reduceCurrent?', 'reduceIdx?'], 'reduceExpression'),
            { _captureName: 'reduceInitVal' }
        ),
        replacementCode: (match) => `
        ((arr) => {
            let acc = reduceInitVal;
            ${match.mapIdx || match.reduceIdx ? 'let mrIdx = 0;' : ''}
            for (let i = 0; i < arr.length; i++) {
                ${match.filterItem ? 'let fItem = arr[i];' : ''}
                ${match.filterIdx ? 'let fIdx = i;' : ''}
                ${match.filterArr ? 'let fArray = arr;' : ''}
                if (filterExpression) {
                    ${match.mapItem ? 'let mItem = arr[i];' : ''}
                    ${match.mapIdx ? 'let mIdx = mrIdx;' : ''}
                    ${match.reduceAcc ? 'let currAcc = acc;' : ''}
                    ${match.reduceIdx ? 'let rIdx = mrIdx;' : ''}
                    let mapRes = mapExpression;
                    acc = reduceExpression;
                    ${match.mapIdx || match.reduceIdx ? 'mrIdx++;' : ''}
                }
            }
            return acc;
        })(arrayExpression)
        `,
        tempVariables: ['arr', 'acc', 'mrIdx', 'i', 'fItem', 'fIdx', 'fArray', 'mItem', 'mIdx', 'currAcc', 'rIdx', 'mapRes'],
        processCaptureBlocks: {
            arrayExpression: {},
            filterExpression: { filterItem: 'fItem', filterIdx: 'fIdx', filterArr: 'fArray' },
            mapExpression: { mapItem: 'mItem', mapIdx: 'midx' },
            reduceInitVal: {},
            reduceExpression: { reduceAcc: 'currAcc', reduceCurrent: 'mapRes', reduceIdx: 'rIdx' }
        }
    },
    {
        name: 'filter_reduce',
        matchPattern: methodCall('reduce', 
            filterWithArrowFunc(['filterItem?', 'filterIdx?', 'filterArr?']), 
            arrowFunc(['reduceAcc?', 'reduceCurrent?', 'reduceIdx?'], 'reduceExpression'),
            { _captureName: 'reduceInitVal' }
        ),
        replacementCode: (match) => `
        ((arr) => {
            let acc = reduceInitVal;
            ${match.reduceIdx ? 'let mrIdx = 0;' : ''}
            for (let i = 0; i < arr.length; i++) {
                ${match.filterItem ? 'let fItem = arr[i];' : ''}
                ${match.filterIdx ? 'let fIdx = i;' : ''}
                ${match.filterArr ? 'let fArr = arr;' : ''}
                if (filterExpression) {
                    ${match.reduceAcc ? 'let currAcc = acc;' : ''}
                    ${match.reduceCurrent ? 'let rItem = arr[i];' : ''}
                    ${match.reduceIdx ? 'let rIdx = mrIdx;' : ''}
                    acc = reduceExpression;
                    ${match.reduceIdx ? 'mrIdx++;' : ''}
                }
            }
            return acc;
        })(arrayExpression)
        `,
        tempVariables: ['arr', 'acc', 'mrIdx', 'i', 'fItem', 'fIdx', 'fArr', 'currAcc', 'rItem', 'rIdx'],
        processCaptureBlocks: {
            arrayExpression: {},
            filterExpression: { filterItem: 'fItem', filterIdx: 'fIdx', filterArr: 'fArr' },
            reduceInitVal: {},
            reduceExpression: { reduceAcc: 'currAcc', reduceCurrent: 'rItem', reduceIdx: 'rIdx' }
        }
    },
    {
        name: 'filter_map',
        matchPattern: methodCall('map', 
            filterWithArrowFunc(['filterItem?', 'filterIdx?', 'filterArr?']), 
            arrowFunc(['mapItem?', 'mapIdx?'], 'mapExpression')
        ),
        replacementCode: (match) => `
        ((arr) => {
            const res = [];
            for (let i = 0; i < arr.length; i++) {
                ${match.filterItem || match.mapItem ? 'let x = arr[i];' : ''}
                ${match.filterIdx ? 'let idx = i;' : ''}
                ${match.filterArr ? 'let array = arr;' : ''}
                ${match.mapIdx ? 'let rLen = res.length;' : ''}
                if (filterExpression) res.push(mapExpression);
            }
            return res;
        })(arrayExpression)
        `,
        tempVariables: ['arr', 'res', 'i', 'x', 'idx', 'array', 'rLen'],
        processCaptureBlocks: {
            arrayExpression: {},
            filterExpression: { filterItem: 'x', filterIdx: 'idx', filterArr: 'array' },
            mapExpression: { mapItem: 'x', mapIdx: 'rLen' }
        }
    },
    {
        name: 'map_filter',
        matchPattern: methodCall('filter', 
            methodCall('map', 
                arrayExpression('arrayExpression'), 
                arrowFunc(['mapItem?', 'mapIdx?', 'mapArr?'], 'mapExpression')
            ), 
            arrowFunc(['filterItem?', 'filterIdx?'], 'filterExpression')
        ),
        replacementCode: (match) => `
        ((arr) => {
            const res = [];
            for (let i = 0; i < arr.length; i++) {
                ${match.mapItem ? 'let mItem = arr[i];' : ''}
                ${match.mapIdx ? 'let mIdx = i;' : ''}
                ${match.mapArr ? 'let mArr = arr;' : ''}
                const mapResult = mapExpression;
                ${match.filterItem ? 'let fItem = mapResult;' : ''}
                ${match.filterIdx ? 'let fIdx = i;' : ''}
                if (filterExpression) res.push(mapResult);
            }
            return res;
        })(arrayExpression)
        `,
        tempVariables: ['arr', 'res', 'i', 'mItem', 'mIdx', 'mArr', 'mapResult', 'fItem', 'fIdx'],
        processCaptureBlocks: {
            arrayExpression: {},
            mapExpression: { mapItem: 'mItem', mapIdx: 'mIdx', mapArr: 'mArr' },
            filterExpression: { filterItem: 'fItem', filterIdx: 'fIdx' }
        }
    },
    {
        name: 'map_reduce',
        matchPattern: methodCall('reduce', 
                methodCall('map', 
                    arrayExpression('arrayExpression'), 
                    arrowFunc(['mapItem?', 'mapIdx?', 'mapArr?'], 'mapExpression')
                ),
            arrowFunc(['reduceAcc?', 'reduceCurrent?', 'reduceIdx?'], 'reduceExpression'),
            {
                _captureName: 'reduceInitVal'
            }
        ),
        replacementCode: (match) => `
        ((arr) => {
            let acc = reduceInitVal;
            for (let i = 0; i < arr.length; i++) {
                ${match.mapItem ? 'let x = arr[i];' : ''}
                ${match.mapIdx ? 'let midx = i;' : ''}
                ${match.mapArr ? 'let array = arr;' : ''}
                ${match.reduceAcc ? 'let currAcc = acc;' : ''}
                ${match.reduceIdx ? 'let ridx = i;' : ''}
                let mapRes = mapExpression;
                acc = reduceExpression;
            }
            return acc;
        })(arrayExpression)
        `,
        tempVariables: ['arr', 'acc', 'i', 'x', 'midx', 'array', 'currAcc', 'ridx', 'mapRes'],
        processCaptureBlocks: {
            arrayExpression: {},
            mapExpression: { mapItem: 'x', mapIdx: 'midx', mapArr: 'array' },
            reduceInitVal: {},
            reduceExpression: { reduceAcc: 'currAcc', reduceCurrent: 'mapRes', reduceIdx: 'ridx' }
        }
    },
    {
        name: 'filter',
        matchPattern: filterWithArrowFunc(['filterItem?', 'filterIdx?', 'filterArr?']),
        replacementCode: (match) => `
        ((arr) => {
            const res = [];
            for (let i = 0; i < arr.length; i++) {
                ${match.filterItem ? 'let item = arr[i];' : ''}
                ${match.filterIdx ? 'let idx = i;' : ''}
                ${match.filterArr ? 'let array = arr;' : ''}
                if (filterExpression) res.push(arr[i]);
            }
            return res;
        })(arrayExpression)
        `,
        tempVariables: ['arr', 'res', 'i', 'item', 'idx', 'array'],
        processCaptureBlocks: {
            arrayExpression: {},
            filterExpression: { filterItem: 'item', filterIdx: 'idx', filterArr: 'array' }
        }
    },
    {
        name: 'map',
        matchPattern: methodCall('map', 
            arrayExpression('arrayExpression'), 
            arrowFunc(['mapItem?', 'mapIdx?', 'mapArr?'], 'mapExpression')),
        replacementCode: (match) => `
        ((arr) => {
            const res = new Array(arr.length);
            for (let i = 0; i < arr.length; i++) {
                ${match.mapItem ? 'let x = arr[i];' : ''}
                ${match.mapIdx ? 'let idx = i;' : ''}
                ${match.mapArr ? 'let array = arr;' : ''}
                res[i] = mapExpression;
            }
            return res;
        })(arrayExpression)
        `,
        tempVariables: ['arr', 'res', 'i', 'x', 'idx', 'array'],
        processCaptureBlocks: {
            arrayExpression: {},
            mapExpression: { mapItem: 'x', mapIdx: 'idx', mapArr: 'array' }
        }
    },
    {
        name: 'reduce',
        matchPattern: methodCall('reduce', 
            arrayExpression('arrayExpression'),
            arrowFunc(['reduceAcc?', 'reduceCurrent?', 'reduceIdx?', 'reduceArr?'], 'reduceExpression'),
            {
                _captureName: 'reduceInitVal'
            }
        ),
        replacementCode: (match) => `
        ((arr) => {
            let acc = reduceInitVal;
            for (let i = 0; i < arr.length; i++) {
                ${match.reduceAcc ? 'let currAcc = acc;' : ''}
                ${match.reduceCurrent ? 'let x = arr[i];' : ''}
                ${match.reduceIdx ? 'let idx = i;' : ''}
                ${match.reduceArr ? 'let array = arr;' : ''}
                acc = reduceExpression;
            }
            return acc;
        })(arrayExpression)
        `,
        tempVariables: ['arr', 'acc', 'i', 'currAcc', 'x', 'idx', 'array'],
        processCaptureBlocks: {
            arrayExpression: {},
            reduceInitVal: {},
            reduceExpression: { reduceAcc: 'currAcc', reduceCurrent: 'x', reduceIdx: 'idx', reduceArr: 'array' }
        }
    }
];