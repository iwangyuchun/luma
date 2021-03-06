// TRANSPILATION TABLES

/** Simple regex replacements for GLSL ES 1.00 syntax that has changed in GLSL ES 3.00 */
const ES300_REPLACEMENTS = [
    // Fix poorly formatted version directive
    [/^(#version[ \t]+(100|300[ \t]+es))?[ \t]*\n/, '#version 300 es\n'],
    // The individual `texture...()` functions were replaced with `texture()` overloads
    [/\btexture(2D|2DProj|Cube)Lod(EXT)?\(/g, 'textureLod('],
    [/\btexture(2D|2DProj|Cube)(EXT)?\(/g, 'texture(']
];

const ES300_VERTEX_REPLACEMENTS = [
    ...ES300_REPLACEMENTS,
    // `attribute` keyword replaced with `in`
    [/^[ \t]*attribute[ \t]+(.+;)/gm, 'in $1'],
    // `varying` keyword replaced with `out`
    [/^[ \t]*varying[ \t]+(.+;)/gm, 'out $1']
];

/** Simple regex replacements for GLSL ES 1.00 syntax that has changed in GLSL ES 3.00 */
const ES300_FRAGMENT_REPLACEMENTS = [
    ...ES300_REPLACEMENTS,
    // `varying` keyword replaced with `in`
    [/^[ \t]*varying[ \t]+(.+;)/gm, 'in $1']
];

const ES100_REPLACEMENTS = [
    [/^#version[ \t]+300[ \t]+es/, '#version 100'],

    // In GLSL 1.00 ES these functions are provided by an extension
    [/\btexture(2D|2DProj|Cube)Lod\(/g, 'texture$1LodEXT('],

    // Overloads in GLSL 3.00 map to individual functions. Note that we cannot
    // differentiate 2D,2DProj,Cube without type analysis so we choose the most common variant.
    [/\btexture\(/g, 'texture2D('],
    [/\btextureLod\(/g, 'texture2DLodEXT(']
];

const ES100_VERTEX_REPLACEMENTS = [
    ...ES100_REPLACEMENTS,
    [/^[ \t]*in[ \t]+(.+;)/gm, 'attribute $1'],
    [/^[ \t]*out[ \t]+(.+;)/gm, 'varying $1']
];

const ES100_FRAGMENT_REPLACEMENTS = [
    ...ES100_REPLACEMENTS,
    // Replace `in` with `varying`
    [/^[ \t]*in[ \t]+/gm, 'varying ']
];

const ES100_FRAGMENT_OUTPUT_NAME = 'gl_FragColor';
const ES300_FRAGMENT_OUTPUT_REGEX = /^[ \t]*out[ \t]+vec4[ \t]+(\w+)[ \t]*;\s+/m;

const REGEX_START_OF_MAIN = /void\s+main\s*\([^)]*\)\s*\{\n?/; // Beginning of main


function convertShader(source: string, replacements: any) {
    for (const [pattern, replacement] of replacements) {
        source = source.replace(pattern, replacement);
    }
    return source;
}

function convertFragmentShaderTo300(source: string) {
    source = convertShader(source, ES300_FRAGMENT_REPLACEMENTS);

    const outputMatch = source.match(ES300_FRAGMENT_OUTPUT_REGEX);
    if (outputMatch) {
        const outputName = outputMatch[1];
        source = source.replace(new RegExp(`\\b${ES100_FRAGMENT_OUTPUT_NAME}\\`, 'g'), outputName)
    } else {
        const outputName = `fragmentColor`;
        source = source.replace(REGEX_START_OF_MAIN, match => `out vec4 ${outputName};\n${match}`).replace(new RegExp(`\\b${ES100_FRAGMENT_OUTPUT_NAME}\\b`, 'g'), outputName);
    }
    return source;
}

function convertFragmentShaderTo100(source: string) {
    source = convertShader(source, ES100_FRAGMENT_REPLACEMENTS);

    const outputMatch = source.match(ES300_FRAGMENT_OUTPUT_REGEX);
    if (outputMatch) {
        const outputName = outputMatch[1];
        source = source.replace(ES300_FRAGMENT_OUTPUT_REGEX, '').replace(new RegExp(`\\b${outputName}\\b`, 'g'), ES100_FRAGMENT_OUTPUT_NAME)
    }
    return source;
}


export default function transpileShader(source: string, targetGLSLVersion: number, isVertex: boolean) {
    switch (targetGLSLVersion) {
        case 300:
            return isVertex ? convertShader(source, ES300_VERTEX_REPLACEMENTS) : convertFragmentShaderTo300(source);
        case 100:
            return isVertex ? convertShader(source, ES100_VERTEX_REPLACEMENTS) : convertFragmentShaderTo100(source);
        default:
            throw new Error(`unknow GLSL version ${targetGLSLVersion}`);
    }
}
