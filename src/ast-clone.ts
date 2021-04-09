import * as ts from 'typescript';

const syntaxNameMap = {
    argumentsArray: 'arguments',
    Parameter: 'ParameterDeclaration',
    TypeParameter: 'TypeParameterDeclaration',
    Constructor: 'ConstructorDeclaration',
    // first/last stuff
    FirstAssignment: 'EqualsToken',
    LastAssignment: 'CaretEqualsToken',
    FirstCompoundAssignment: 'PlusEqualsToken',
    LastCompoundAssignment: 'CaretEqualsToken',
    FirstReservedWord: 'BreakKeyword',
    LastReservedWord: 'WithKeyword',
    FirstKeyword: 'BreakKeyword',
    LastKeyword: 'OfKeyword',
    FirstFutureReservedWord: 'ImplementsKeyword',
    LastFutureReservedWord: 'YieldKeyword',
    FirstTypeNode: 'TypePredicate',
    LastTypeNode: 'ImportType',
    FirstPunctuation: 'OpenBraceToken',
    LastPunctuation: 'CaretEqualsToken',
    FirstToken: 'Unknown',
    LastToken: 'OfKeyword',
    FirstTriviaToken: 'SingleLineCommentTrivia',
    LastTriviaToken: 'ConflictMarkerTrivia',
    FirstLiteralToken: 'NumericLiteral',
    LastLiteralToken: 'NoSubstitutionTemplateLiteral',
    FirstTemplateToken: 'NoSubstitutionTemplateLiteral',
    LastTemplateToken: 'TemplateTail',
    FirstBinaryOperator: 'LessThanToken',
    LastBinaryOperator: 'CaretEqualsToken',
    FirstStatement: 'VariableStatement',
    LastStatement: 'DebuggerStatement',
    FirstNode: 'QualifiedName',
    FirstJSDocNode: 'JSDocTypeExpression',
    LastJSDocNode: 'JSDocPropertyTag',
    FirstJSDocTagNode: 'JSDocTag',
    LastJSDocTagNode: 'JSDocPropertyTag',
};

export function fixSyntaxName(name: string): string {
    return syntaxNameMap[name] || name;
}
const alternateProp = {
    'value': 'text',
    'operator': 'operatorToken',
    'index': 'argumentExpression'
};
const ignoreMissingProperty = {
    Identifier: ['typeArguments']
};

// JavaScript program to get the function
// parameter names dynamically
function getParams(func: Function) {
          
    // String representaation of the function code
    var str = func.toString();
  
    // Remove comments of the form /* ... */
    // Removing comments of the form //
    // Remove body of the function { ... }
    // removing '=>' if func is arrow function 
    str = str.replace(/\/\*[\s\S]*?\*\//g, '') 
            .replace(/\/\/(.)*/g, '')
            .replace(/{[\s\S]*}/, '')
            .replace(/=>/g, '')
            .trim();
  
    // Start parameter names after first '('
    var start = str.indexOf("(") + 1;
  
    // End parameter names is just before last ')'
    var end = str.length - 1;
  
    var result = str.substring(start, end).split(", ");
  
    var params: string[] = [];
  
    result.forEach(element => {
          
        // Removing any default value
        element = element.replace(/=[\s\S]*/g, '').trim();
  
        if(element.length > 0)
            params.push(element);
    });
      
    return params;
}

export type IdentifierReplacements = {
    [id_name: string]: ts.Node | string | ((node: ts.Node) => ts.Node)
}

export function cloneNode(node: ts.Node, replacements: IdentifierReplacements = {}) {
    if (typeof node === 'object') {
        if (typeof node.kind === 'number') {
            // replace identifiers
            let replacement: IdentifierReplacements[keyof IdentifierReplacements];
            if (node.kind === ts.SyntaxKind.Identifier && (replacement = replacements[(node as any).text])) {
                return typeof replacement === 'string' ? ts.factory.createIdentifier(replacement) :
                    typeof replacement === 'function' ? replacement(node) : replacement;
            }

            const kindName = fixSyntaxName(ts.SyntaxKind[node.kind]);
            const creatorFunc = ts.factory['create' + kindName];

            if (typeof creatorFunc === 'function') {
                const params = getParams(creatorFunc).map(fixSyntaxName);
                const args = params.map(paramName => {
                    if (!(paramName in node) && !(alternateProp[paramName] in node) && !ignoreMissingProperty[kindName].includes(paramName)) {
                        throw new Error(`[cloneNode] Could not find property "${paramName}" on node kind "${kindName}".`);
                    }
                    return cloneNode(node[paramName] || node[alternateProp[paramName]], replacements);
                });
                try {
                    return creatorFunc.apply(ts.factory, args);
                } catch (e) {
                    throw new Error(`[cloneNode] Creator "${creatorFunc.name}" threw an error:` + e.message);
                }
            } else if (kindName.endsWith('Token') || kindName.endsWith('Keyword')) {
                return ts.factory.createToken(node.kind as any);
            } else {
                throw new Error(`[cloneNode] Could not find creator function for kind "${kindName}".`);
            }
        }
        if (Array.isArray(node)) {
            return node.map(item => cloneNode(item, replacements));
        }
        throw new Error('[cloneNode] Unknown node object encountered.');
    }
    return node;
}

