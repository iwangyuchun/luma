import isOldIE from './isOldIE';
import assert from './assert';


const GL_VENDOR = 0x1f00;
const GL_RENDERER = 0x1f01;
const GL_VERSION = 0x1f02;
const GL_SHADING_LANGUAGE_VERSION = 0x8b8c;

// Defines luma feature names and semantics
const WEBGL_FEATURES = {
    GLSL_FRAG_DATA: ['WEBGL_draw_buffers', true],
    GLSL_FRAG_DEPTH: ['EXT_frag_depth', true],
    GLSL_DERIVATIVES: ['OES_standard_derivatives', true],
    GLSL_TEXTURE_LOD: ['EXT_shader_texture_lod', true]
}

//Create a key-mirrored FEATURES array
const FEATURES: { [key: string]: any } = {};
Object.keys(WEBGL_FEATURES).forEach(key => {
    FEATURES[key] = key;
});

export { FEATURES }

function isWebGL2(gl: WebGL2RenderingContext | WebGLRenderingContext) {
    if (typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext) {
        return true;
    }
    return false;//Boolean(gl&&gl._version===2);
}

export function getContextInfo(gl: WebGL2RenderingContext | WebGLRenderingContext) {
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const vendor = gl.getParameter((info && info.UNMASKED_VENDOR_WEBGL) || GL_VENDOR);
    const renderer = gl.getParameter((info && info.UNMASKED_RENDERER_WEBGL) || GL_RENDERER);
    const gpuVendor = identifyGPUVendor(vendor, renderer);
    const gpuInfo = {
        gpuVendor,
        vendor,
        renderer,
        version: gl.getParameter(GL_VERSION),
        shadingLanguageVersion: gl.getParameter(GL_SHADING_LANGUAGE_VERSION)
    };
    return gpuInfo;
}

function identifyGPUVendor(vendor: string, renderer: string) {
    if (vendor.match(/NVIDIA/i) || renderer.match(/NVIDIA/i)) {
        return 'NVIDIA';
    }
    if (vendor.match(/INTEL/i) || renderer.match(/INTEL/i)) {
        return 'INTEL';
    }
    if (
        vendor.match(/AMD/i) ||
        renderer.match(/AMD/i) ||
        vendor.match(/ATI/i) ||
        renderer.match(/ATI/i)
    ) {
        return 'AMD';
    }
    return 'UNKNOWN GPU';
}

const compiledGlslExtensions = {};

export function canCompileGLGSExtension(gl: WebGLRenderingContext | WebGL2RenderingContext, cap: string, opts: any) {
    //@ts-ignore
    const feature = WEBGL_FEATURES[cap];
    if (!isOldIE(opts)) {
        return true;
    }
    if (cap in compiledGlslExtensions) {
        //@ts-ignore
        return compiledGlslExtensions[cap];
    }
    const extensionName = feature[0];
    const behavior = opts.behavior || 'enable';
    const source = `#extension GL_${extensionName} : ${behavior}\nvoid main(void) {}`;

    const shader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    const canCompile = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    gl.deleteShader(shader);
    //@ts-ignore
    compiledGlslExtensions[cap] = canCompile;
    return canCompile;
}

function getFeature(gl:WebGLRenderingContext | WebGL2RenderingContext, cap:string) {
    //@ts-ignore
    const feature = WEBGL_FEATURES[cap];
    assert(feature, cap);
  
    // Get extension name from table
    const extensionName = isWebGL2(gl) ? feature[1] || feature[0] : feature[0];
  
    // Check if the value is dependent on checking an extension
    const value =
      typeof extensionName === 'string' ? Boolean(gl.getExtension(extensionName)) : extensionName;
  
    assert(value === false || value === true);
  
    return value;
  }
  
  export function hasFeatures(gl:WebGLRenderingContext | WebGL2RenderingContext, features:Array<string>|string) {
    features = Array.isArray(features) ? features : [features];
    return features.every(feature => getFeature(gl, feature));
  }