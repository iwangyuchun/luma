import assert from '../utils/assert';
import { parsePropTypes } from './filters/prop-types';

const VERTEX_SHADER = 'vs';
const FRAGMENT_SHADER = 'fs';

type ShaderModuleProps = {
    name: string;
    fs?: string;
    vs?: string;
    uniforms?: object;
    getUniforms?: any;
    defines?: object;
    dependencies?: Array<ShaderModule>;
    inject?: Injection;
    vertexShader?: string;
    fragmentShader?: string;
    deprecations: Array<any>
}

type Injection = {
    [key: string]: string | any
}

export default class ShaderModule {
    public name: string;
    public vs: string;
    public fs: string;
    public dependencies: Array<ShaderModule>;
    public deprecations: Array<any>;
    public defines: any;
    public injections: Injection
    public uniforms: any;
    //public getUniforms:Function;
    public getModuleUniforms: Function;

    constructor({ name, vs, fs, dependencies = [], uniforms, getUniforms, deprecations = [], defines = {}, inject = {}, vertexShader, fragmentShader }: ShaderModuleProps) {
        assert(typeof name === 'string');
        this.name = name;
        this.vs = vs || vertexShader;
        this.fs = fs || fragmentShader;
        this.getModuleUniforms = getUniforms;
        this.dependencies = dependencies;
        this.deprecations = this.parseDeprecationDefinitions(deprecations);
        this.defines = defines;
        this.injections = normalizeInjections(inject);
        if (uniforms) {
            this.uniforms = parsePropTypes(uniforms);
        }

    }

    private parseDeprecationDefinitions(deprecations: Array<any>) {
        deprecations.forEach(def => {
            switch (def.type) {
                case 'function':
                    def.regex = new RegExp(`\\b${def.old}\\(`);
                    break;
                default:
                    def.regex = new RegExp(`${def.type} ${def.old}`);
            }
        });
        return deprecations;
    }

    private defaultGetUniforms(opts: any = {}) {
        const uniforms = {};
        const propTypes = this.uniforms;

        for (const key in propTypes) {
            const propDef = propTypes[key];
            if (key in opts && !propDef.private) {
                if (propDef.validate) {
                    assert(propDef.validate(opts[key], propDef), `${this.name}:invalid ${key}`);
                }
                //@ts-ignore
                uniforms[key] = opts[key];
            } else {
                //@ts-ignore
                uniforms[key] = opts[key];
            }
        }
        return uniforms;
    }

    public getModuleSource(type: 'fs' | 'vs') {
        let moduleSource: string;
        switch (type) {
            case VERTEX_SHADER:
                moduleSource = this.vs || '';
                break;
            case FRAGMENT_SHADER:
                moduleSource = this.fs || '';
                break;
            default:
                assert(false);
        }
        return `\
        #define MODULE_${this.name.toUpperCase().replace(/[^0-9a-z]/gi, '_')}
        ${moduleSource}\
        // END MODULE_${this.name} 
        `
    }

    // Warn about deprecated uniforms or functions
    public checkDeprecations(shaderSource: string, log: any) {
        this.deprecations.forEach(def => {
            if (def.regex.test(shaderSource)) {
                if (def.deprecated) {
                    log.deprecated(def.old, def.new)();
                } else {
                    log.removed(def.old, def.new)();
                }
            }
        });
    }


    public getUniforms(opts: any, uniforms: any) {
        if (this.getModuleUniforms) {
            return this.getModuleUniforms(opts, uniforms);
        }
        if (this.uniforms) {
            return this.defaultGetUniforms(opts);
        }
        return {};
    }

    getDefines() {
        return this.defines;
    }

}

export function normalizeShaderModule(module: any) {
    if (!module.normalized) {
        module.normalized = true;
        if (module.uniforms && !module.getUniforms) {
            const shaderModule = new ShaderModule(module);
            module.getUniforms = shaderModule.getUniforms.bind(shaderModule);
        }
    }
    return module;
}


function normalizeInjections(injections: Injection) {
    const result = {
        vs: {},
        fs: {}
    };

    for (const hook in injections) {
        let injection = injections[hook];
        const stage: string = hook.slice(0, 2);

        if (typeof injection === 'string') {
            //@ts-ignore
            injection = {
                order: 0,
                injection
            };
        };
        //@ts-ignore
        result[stage][hook] = injection;
    }
    return result;

}