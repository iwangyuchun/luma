export default function asserts(condition:any,message?:string){
    if(!condition){
        throw new Error(message||'shadertools:assertion failed.');
    }
}