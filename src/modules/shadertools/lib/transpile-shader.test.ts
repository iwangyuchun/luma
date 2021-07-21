import transpileShader from './transpile-shader'
const testVertexShaderTranspile = `
layout (location=0) in vec2 a_position;
uniform vec2 u_resolution;
uniform vec2 u_min_max_pos;
void main(){
    float x=a_position.x*(u_resolution.x/u_min_max_pos.x);
    float y=a_position.y*(u_resolution.y/u_min_max_pos.y);
    vec2 clipspace=vec2(x,y)/u_resolution*2.0-1.0;
    gl_Position=vec4(clipspace,0,1.0);
    gl_PointSize=4.0;
}
`
const testFragmentShaderTranspile = `
precision highp float;
void main(){
    outColor=vec4(0.5,0.5,0.6,1.0);
}`

test("transpile-shader", () => {
    console.log(transpileShader(testFragmentShaderTranspile,300,false))
})