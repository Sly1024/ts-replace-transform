import * as ts from 'typescript';

import { cloneNode } from './ast-clone';
import { matchNode } from './pattern-matcher';

export interface ReplacementRule {
    name: string;
    matchPattern: object;
    replacementCode: string | ((matchResult: any) => string);
    tempVariables?: string[];
    processCaptureBlocks?: { [captureBlockName: string] : { [paramCaptureName: string]: string } };
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
            if (rule.tempVariables) {
                for (const varName of rule.tempVariables) {
                    tempVars[varName] = ts.factory.createTempVariable(null);
                }
            }
            const replacements = { ...tempVars };
            if (rule.processCaptureBlocks) {
                for (const captureName in rule.processCaptureBlocks) {
                    const paramReplacements = createReplacementMap(rule.processCaptureBlocks[captureName], matchResult, tempVars);
                    replacements[captureName] = () => cloneNode(matchResult[captureName], paramReplacements)
                }
            }

            try {
                stats[rule.name] = (stats[rule.name] || 0) + 1;
                return cloneNode(getReplacementNode(rule, matchResult), replacements);
            } catch (err) {
                console.log(`Error during replacement of "${rule.name}": `, err);
            }
        }
    }

    return node;
}

function createReplacementMap(config: object, matchResult: object, tempVars: object) {
    const replacementMap = {};
    for (const paramCaptureName in config) {
        if (matchResult[paramCaptureName]) {
            replacementMap[matchResult[paramCaptureName].text] = tempVars[config[paramCaptureName]];
        }
    }
    return replacementMap;
}

