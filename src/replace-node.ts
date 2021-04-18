import * as ts from 'typescript';

import { cloneNode, getTempVar, IdentifierReplacements } from './ast-clone';
import { matchNode } from './pattern-matcher';

export interface ReplacementRule {
    name: string;
    matchPattern: object;
    replacementCode: string | ((matchResult: any) => string);
    tempVariables?: string[];
    processCaptureBlocks?: { [captureBlockName: string] : string[] };
}

export const getTypeName = (node: ts.Node, program: ts.Program) => program.getTypeChecker().typeToString(program.getTypeChecker().getTypeAtLocation(node), node);

export function getReplacementNode({ replacementCode }: ReplacementRule, matchResult: object) {
    if (typeof replacementCode !== 'string') {
        replacementCode = replacementCode(matchResult);
    }
    const source = ts.createSourceFile('', replacementCode, ts.ScriptTarget.ESNext);
    return source.statements[0]['expression'];
}
export function replaceNode(program: ts.Program, rules: ReplacementRule[], node: ts.Node, stats: any = {}) {
    for (const rule of rules) {
        const matchResult = matchNode(program, node, rule.matchPattern);
        if (matchResult) {
            const tempVars = {};
            const replacements = {};
            for (const captureName of Object.keys(matchResult)) {
                if (!captureName.startsWith('_')) {
                    const paramReplacements = createReplacementMap(matchResult[captureName + '_parameterNames'], matchResult, tempVars);
                    replacements[captureName] = () => cloneNode(matchResult[captureName], paramReplacements);
                }
            }

            try {
                stats[rule.name] = (stats[rule.name] || 0) + 1;
                return cloneNode(getReplacementNode(rule, matchResult), replacements, tempVars);
            } catch (err) {
                console.log(`Error during replacement of "${rule.name}": `, err);
            }
        }
    }

    return node;
}

function createReplacementMap(vars: string[] = [], matchResult: object, tempVars: IdentifierReplacements) {
    const replacementMap = {};
    for (const varName of vars) {
        if (matchResult[varName]) {
            replacementMap[matchResult[varName].text] = getTempVar(tempVars, varName);
        }
    }
    return replacementMap;
}

