import ShaderModule from "./shoader-module";
import assert from '../utils/assert';

export function resolveModules(modules: any) {
    return getShaderDependencies(instantiateModules(modules));
}

function getShaderDependencies(modules: any) {
    const moduleMap = {};
    const moduleDepth = {};
    getDependencyGraph({ modules, level: 0, moduleMap, moduleDepth });
    //@ts-ignore
    return Object.keys(moduleDepth).sort((a, b) => moduleDepth[b] - moduleDepth[a]).map((name) => moduleMap[name])
}



function getDependencyGraph({ modules, level, moduleMap, moduleDepth }: any) {
    if (level >= 5) {
        throw new Error('Possible loop in shader dependency graph');
    }
    for (const module of modules) {
        moduleMap[module.name] = module;
        if (moduleDepth[module.name] == undefined || moduleDepth[module.name] < level) {
            moduleDepth[module.name] = level;
        }
    }

    for (const module of modules) {
        if (module.dependencies) {
            getDependencyGraph({ modules: module.dependencies, level: level + 1, moduleMap, moduleDepth });
        }
    }

}



function instantiateModules(modules: Array<any>, seen?: any) {
    return modules.map(module => {
        if (module instanceof ShaderModule) {
            return module;
        }

        assert(
            typeof module !== 'string',
            `Shader module use by name is deprecated. Import shader module ${module} and use it directly`
        );
        assert(module.name, 'shader module has no name');
        module = new ShaderModule(module);
        module.dependencies = instantiateModules(module.dependencies);
        return module;
    });
}

export const TEST_EXPORTS = {
    getShaderDependencies,
    getDependencyGraph
};