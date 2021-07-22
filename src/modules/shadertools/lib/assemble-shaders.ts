import { VERTEX_SHADER, FRAGMENT_SHADER } from './constants';
import { resolveModules } from './resolve-module';
import { getPlatformShaderDefines, getVersionDefines } from './platform-defines';
import injectShader, { DECLARATION_INJECT_MARKER } from './inject-shader';
import transpileShader from './transpile-shader';
import assert from '../utils/assert';



function getApplicationDefines(defines={}) {
    let count=0;
    let sourceText='';
    for(const define in defines){
        if(count===0){
            sourceText+='\n//APPLICATION DEFINES\n';
        }
        count++;
        //@ts-ignore
        const value=defines[define];
        if(value||Number.isFinite(value)){
            //@ts-ignore
            sourceText+=`#define ${define.toUpperCase()} ${defines[define]}\n`;
        }
    }
    if(count===0){
        sourceText+='\n';
    }
    return sourceText;
}

function getHookFunctions(hookFunctions: Array<any>, hookInjections: Array<any>) {
    let result = '';
    for(const hookName in hookFunctions){
        const hookFunction=hookFunctions[hookName];
        result+=`void ${hookFunction.signature}{\n`;
        if(hookFunction.header){
            result+=`  ${hookFunction.header}`;
        }
        if(hookInjections[hookName]){
            const injections=hookInjections[hookName];
            //@ts-ignore
            injections.sort((a,b)=>a.order-b.order);
            for(const injection of injections){
                result+=`  ${injection.injection}\n`
            }
        }
        if(hookFunction.footer){
            result+=`  ${hookFunction.footer}`;
        }
        result+='}\n';
    }
    return result;
}

function normalizeHookFunctions(hookFunctions: Array<string>) {
    const result = {
        vs: {},
        fs: {}
    };

    hookFunctions.forEach(hook => {
        let opts;
        if (typeof hook !== 'string') {
            opts = hook;
            //@ts-ignore
            hook = opts.hook;
        } else {
            opts = {};
        }
        hook = hook.trim();
        const [stage, signature] = hook.split(':');
        const name = hook.replace(/\(.+/, '');
        //@ts-ignore
        result[stage][name] = Object.assign(opts, { signature });
    });
    return result;
}