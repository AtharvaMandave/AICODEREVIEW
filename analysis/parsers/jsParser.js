import { parse } from '@babel/parser';
import traverse from '@babel/traverse';

/**
 * Parse JavaScript/TypeScript file and extract AST
 */
export const parseJavaScript = (code, filePath) => {
    try {
        const isTypeScript = filePath.endsWith('.ts') || filePath.endsWith('.tsx');

        const ast = parse(code, {
            sourceType: 'module',
            plugins: [
                'jsx',
                isTypeScript && 'typescript',
                'classProperties',
                'decorators-legacy',
                'dynamicImport',
                'objectRestSpread',
                'asyncGenerators',
                'optionalChaining',
                'nullishCoalescingOperator'
            ].filter(Boolean)
        });

        return ast;
    } catch (error) {
        console.error(`Parse error in ${filePath}:`, error.message);
        return null;
    }
};

/**
 * Extract functions from AST
 */
export const extractFunctions = (ast) => {
    const functions = [];

    traverse.default(ast, {
        FunctionDeclaration(path) {
            functions.push({
                type: 'function',
                name: path.node.id?.name || 'anonymous',
                params: path.node.params.length,
                async: path.node.async,
                generator: path.node.generator,
                loc: path.node.loc
            });
        },
        ArrowFunctionExpression(path) {
            const parent = path.parent;
            const name = parent.type === 'VariableDeclarator' ? parent.id.name : 'anonymous';

            functions.push({
                type: 'arrow',
                name,
                params: path.node.params.length,
                async: path.node.async,
                loc: path.node.loc
            });
        },
        FunctionExpression(path) {
            const parent = path.parent;
            const name = path.node.id?.name ||
                (parent.type === 'VariableDeclarator' ? parent.id.name : 'anonymous');

            functions.push({
                type: 'function-expression',
                name,
                params: path.node.params.length,
                async: path.node.async,
                loc: path.node.loc
            });
        },
        ClassMethod(path) {
            functions.push({
                type: 'method',
                name: path.node.key.name || path.node.key.value,
                params: path.node.params.length,
                async: path.node.async,
                static: path.node.static,
                loc: path.node.loc
            });
        }
    });

    return functions;
};

/**
 * Extract classes from AST
 */
export const extractClasses = (ast) => {
    const classes = [];

    traverse.default(ast, {
        ClassDeclaration(path) {
            const methods = [];
            const properties = [];

            path.traverse({
                ClassMethod(methodPath) {
                    methods.push({
                        name: methodPath.node.key.name || methodPath.node.key.value,
                        kind: methodPath.node.kind,
                        static: methodPath.node.static,
                        async: methodPath.node.async
                    });
                },
                ClassProperty(propPath) {
                    properties.push({
                        name: propPath.node.key.name || propPath.node.key.value,
                        static: propPath.node.static
                    });
                }
            });

            classes.push({
                name: path.node.id?.name || 'anonymous',
                superClass: path.node.superClass?.name || null,
                methods,
                properties,
                loc: path.node.loc
            });
        }
    });

    return classes;
};

/**
 * Extract imports from AST
 */
export const extractImports = (ast) => {
    const imports = [];

    traverse.default(ast, {
        ImportDeclaration(path) {
            imports.push({
                source: path.node.source.value,
                specifiers: path.node.specifiers.map(spec => ({
                    type: spec.type,
                    imported: spec.imported?.name || spec.local.name,
                    local: spec.local.name
                })),
                loc: path.node.loc
            });
        }
    });

    return imports;
};

/**
 * Extract exports from AST
 */
export const extractExports = (ast) => {
    const exports = [];

    traverse.default(ast, {
        ExportNamedDeclaration(path) {
            if (path.node.declaration) {
                exports.push({
                    type: 'named',
                    name: path.node.declaration.id?.name || 'anonymous',
                    loc: path.node.loc
                });
            }
        },
        ExportDefaultDeclaration(path) {
            exports.push({
                type: 'default',
                name: path.node.declaration.id?.name || path.node.declaration.name || 'default',
                loc: path.node.loc
            });
        }
    });

    return exports;
};
