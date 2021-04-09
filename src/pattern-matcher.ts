import * as ts from 'typescript';

import { getTypeName } from './replace-node';
import { fixSyntaxName } from './ast-clone';

function isValue(node: ts.Node) {
    return fixSyntaxName(ts.SyntaxKind[node.kind]).endsWith('Expression') || 
        fixSyntaxName(ts.SyntaxKind[node.kind]).endsWith('Literal') ||
        node.kind === ts.SyntaxKind.ThisKeyword ||
        node.kind === ts.SyntaxKind.TrueKeyword ||
        node.kind === ts.SyntaxKind.FalseKeyword ||
        node.kind === ts.SyntaxKind.UndefinedKeyword ||
        node.kind === ts.SyntaxKind.NullKeyword;
}

export const arrayExpression = (captureName: string) => ({ 
    _check: (node: ts.Node, program: ts.Program) => getTypeName(node, program).endsWith('[]'),
    _captureName: captureName
});

export const arrowFunc = (paramNames: string[], bodyName: string) => ({
    kind: ts.SyntaxKind.ArrowFunction,
    parameters: paramNames.map(paramName => 
        ({
            kind: ts.SyntaxKind.Parameter,
            _optional: paramName.endsWith('?'),
            name: {
                kind: ts.SyntaxKind.Identifier,
                _captureName: paramName.endsWith('?') ? paramName.slice(0, -1) : paramName
            }
        })
    ),
    body: {
        _check: isValue,
        _captureName: bodyName,
    }
});

export const methodCall = (methodName: string, hostObj: any, ...args: any[]) => ({
    kind: ts.SyntaxKind.CallExpression,
    expression: {
        kind: ts.SyntaxKind.PropertyAccessExpression,
        name: {
            kind: ts.SyntaxKind.Identifier,
            text: methodName
        },
        expression: hostObj
    },
    arguments: args
});

export function matchNode(program: ts.Program, node: any, pattern: any, captureMap = {}): any {
    if (typeof pattern === 'object') {
        if (typeof node !== 'object') return null;
        // both are type 'object' now
        if (Array.isArray(pattern)) {
            if (!Array.isArray(node) || node.length > pattern.length) return null;
            // both are Arrays
            for (let i = 0; i < pattern.length; i++) {
                if (!matchNode(program, node[i], pattern[i], captureMap) && !pattern[i]._optional) return null;
            }
        } else {
            for (const key of Object.keys(pattern)) {
                const patternVal = pattern[key];
                switch (key) {
                    case '_check':
                        if (typeof patternVal === 'function' && !patternVal(node, program)) return null;
                        continue;
                    case '_captureName':
                        captureMap[patternVal] = node;
                        continue;
                    case '_optional': continue;
                }
                if (!matchNode(program, node[key], patternVal, captureMap) && !patternVal?._optional) return null;
            }
        }
        return captureMap;
    }
    
    return node === pattern ? captureMap : null;
}