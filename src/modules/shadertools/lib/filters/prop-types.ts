export interface PropType{
    max?:Number;
    min?:Number;
}

const TYPE_DEFINITIONS={
    number:{
        validate(value:any,propType:PropType){
            return (
                Number.isFinite(value)&&
                (!('max' in propType)||value<=propType.max)&&
                (!('min' in propType)||value>=propType.min)
            );
        }
    },
    array:{
        validate(value:any,porpType:PropType){
            return Array.isArray(value)||ArrayBuffer.isView(value);
        }
    },
   
} as {
    [key:string]:any
}

export function parsePropTypes(propDefs:any){
    const propTypes={} as {[key:string]:any};
    for(const propName in propDefs){
        const propDef=propDefs[propName];
        const propType=parsePropType(propDef);
        propTypes[propName]=propType;
    }
    return propTypes;
}

export type PropDef={type?:string,value?:any}|null

/**
 * 解析属性的定义，包含一个有效的type object 或者一个默认值
 * @param propDef 
 */
function parsePropType(propDef:PropDef){
    let type=getTypeOf(propDef)
    let protoType:{type:string,value:any}
    if(type==='object'){
        if(!propDef){
           protoType={
               type:'object',
               value:null
           }
           return protoType;
        }
        if('type' in propDef){
            return Object.assign({},propDef,TYPE_DEFINITIONS[propDef.type])
        }
        if(!('value' in propDef)){
            protoType={
                type:'object',
                value:propDef
            }
            return protoType;
        }
        type=getTypeOf(propDef.value);
        return Object.assign({type},propDef,TYPE_DEFINITIONS[type]);
    }
    return Object.assign({type,value:propDef},TYPE_DEFINITIONS[type]);

}

function getTypeOf(value:any){
    if(Array.isArray(value)||ArrayBuffer.isView(value)){
        return 'array';
    }
    return typeof value;
}