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
        name: 'filter_map',
        matchPattern: methodCall('map', 
            filterWithArrowFunc(['filterItem?', 'filterIdx?', 'filterArr?']), 
            arrowFunc(['mapItem?', 'mapIdx?'], 'mapExpression')),
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
        name: 'filter',
        matchPattern: filterWithArrowFunc(['filterItem?', 'filterIdx?', 'filterArr?']),
        replacementCode: (match) => `
        ((arr) => {
            const res = [];
            for (let i = 0; i < arr.length; i++) {
                ${match.filterItem ? 'let x = arr[i];' : ''}
                ${match.filterIdx ? 'let idx = i;' : ''}
                ${match.filterArr ? 'let array = arr;' : ''}
                if (filterExpression) res.push(x);
            }
            return res;
        })(arrayExpression)
        `,
        tempVariables: ['arr', 'res', 'i', 'x', 'idx', 'array'],
        processCaptureBlocks: {
            arrayExpression: {},
            filterExpression: { filterItem: 'x', filterIdx: 'idx', filterArr: 'array' }
        }
    },
    {
        name: 'map',
        matchPattern: methodCall('map', 
            arrayExpression('arrayExpression'), 
            arrowFunc(['mapItem?', 'mapIdx?', 'mapArr?'], 'mapExpression')),
        replacementCode: (match) => `
        ((arr) => {
            const res = [];
            for (let i = 0; i < arr.length; i++) {
                ${match.mapItem ? 'let x = arr[i];' : ''}
                ${match.mapIdx ? 'let idx = i;' : ''}
                ${match.mapArr ? 'let array = arr;' : ''}
                res.push(mapExpression);
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
        tempVariables: ['arr', 'acc', 'i', 'x', 'currAcc', 'idx'],
        processCaptureBlocks: {
            arrayExpression: {},
            reduceInitVal: {},
            reduceExpression: { reduceAcc: 'currAcc', reduceCurrent: 'x', reduceIdx: 'idx', reduceArr: 'array' }
        }
    }
];