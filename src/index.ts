import * as fs from 'fs-extra';
import * as path from 'path';
import * as ts from 'typescript';

import { replaceNode } from './replace-node';
import { replacementRules } from './rules';

const program = ts.createProgram(['./test/file1.ts', './test/file2.ts'], {
    target: ts.ScriptTarget.ESNext
});

program.emit(undefined, writeFileCb, undefined, undefined, { before: [
    context => sourceFile => visitSourceFile(sourceFile, context)
]});

function writeFileCb(fileName: string, data: string, writeByteOrderMark: boolean): void {
    console.log('file ---', fileName);
    const outFileName = path.join('out', fileName);
    fs.ensureFileSync(outFileName);
    fs.writeFileSync(outFileName, data);
}

function visitSourceFile(sourceFile: ts.SourceFile, context: ts.TransformationContext) {
    const statistics = {};

    const source = visitNodeAndChildren(sourceFile) as ts.SourceFile;
    console.log(statistics);
    return source;

    function visitNodeAndChildren(node: ts.Node): ts.Node {
        return ts.visitEachChild(replaceNode(program, replacementRules, node, statistics), visitNodeAndChildren, context);
    }
}

