const { parsePropTypes } =require("./prop-types"); 
const useCase={
    name:'jack',
    age:15,
    address:{
        country:'china',
        city:'qingdao'
    },
    other:['a','b']
}
test('parsePropTypes',()=>{
    console.log(parsePropTypes(useCase))
})