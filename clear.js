// obtener todolos eventos activos  0xa92A6B698a5374CF3B1D89285D7634A7d8F0Fc87
const { getArenatonEvents } = require("./utils/getArenatonEvents");
function main() {
    console.log("Hello World");

    const events = getArenatonEvents("-1",0,"0x35BB6B2757C004A1662e83FdA9a034f4aFbBEdb3","total",1,12);
}

// Call the function
main();

