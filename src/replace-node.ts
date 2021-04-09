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

export function getNodeForCode(code: string | ((matchResult: any) => string), matchResult: any) {
    if (typeof code !== 'string') {
        code = code(matchResult);
    }
    const source = ts.createSourceFile('', code, ts.ScriptTarget.ESNext);
    return source.statements[0]['expression'];
}
export function replaceNode(program: ts.Program, rules: ReplacementRule[], node: ts.Node) {
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

            return cloneNode(getNodeForCode(rule.replacementCode, matchResult), replacements);
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

