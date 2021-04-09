import * as fs from 'fs-extra';
import * as path from 'path';
import * as ts from 'typescript';

import { replaceNode } from './replace-node';
import { replacementRules } from './rules';

const program = ts.createProgram(['./test/file1.ts'], {
    target: ts.ScriptTarget.ESNext
});

program.emit(undefined, writeFileCb, undefined, undefined, { before: [
    context => sourceFile => visitSourceFile(sourceFile, context, node => replaceNode(program, replacementRules, node))
]});

function writeFileCb(fileName: string, data: string, writeByteOrderMark: boolean): void {
    console.log('file ---', fileName);
    const outFileName = path.join('out', fileName);
    fs.ensureFileSync(outFileName);
    fs.writeFileSync(outFileName, data);
}

function visitSourceFile(sourceFile: ts.SourceFile, context: ts.TransformationContext, visitNode: (node: ts.Node) => ts.Node) {
    return visitNodeAndChildren(sourceFile) as ts.SourceFile;

    function visitNodeAndChildren(node: ts.Node): ts.Node {
        return ts.visitEachChild(visitNode(node), visitNodeAndChildren, context);
    }
}

