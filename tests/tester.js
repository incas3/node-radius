/**
 *  A little test helper...
 */

var sys = require('sys');

//A test is an object:
/*
    { name: "something Test",
      attrs: { <radius user attributes> }
      radius: <radius client object>
      expected: <response arguments for callback> }
*/

var stack = [];
var index = 0;
var pass = 0;
var fail = 0;

function run(tests){
    stack = tests;
    console.log( "Running "+stack.length+" tests.\n");    
    index = 0;
    doTest();
}

function doTest(){
    if(index >= stack.length){
		//done!
		console.log("\nTests Finished.");
		if(fail > 0){
    		console.log("FAILED! (only "+pass+"/"+stack.length+" tests passed)");
        }else{
       		console.log("PASSED! ("+stack.length+" tests passed)");
        }
	}else{
	    //run the next test.
		stack[index].radius.Auth(stack[index].attrs, callback);
	}
}
//callback after response
function callback(res, attr){
    //check response against expected
    var testfail = false;
    var failmsg = [];
    //check result.
    if(res !== stack[index].expected[0]){
        //console.log("Response not OK! Expected: '"+stack[index].expected[0]+"', Got: '"+res+"'");
        failmsg.push("Response not OK '"+stack[index].expected[0]+"' vs. '"+res+"'");
        testfail = true;
    }
    //check attributes
    if(attr.length !== stack[index].expected[1].length){
        //console.log("Attributes not OK! Expected: '"+sys.inspect(stack[index].expected[1])+"', Got: '"+sys.inspect(attr)+"'");
        failmsg.push("Attributes not OK, got "+attr.length+", expected: "+stack[index].expected[1].length);
        failmsg.push("\nReceived: "+sys.inspect(attr)+"\nExpected: "+sys.inspect(stack[index].expected[1]));
        testfail = true;
    }else{
        //check they are correct.
        for(var x=0,l=attr.length;x<l;x++){
            if( attr[x][0] !== stack[index].expected[1][x][0] || attr[x][1] !== stack[index].expected[1][x][1] ){
                failmsg.push("Attribute mismatch.\nReceived: "+sys.inspect(attr)+"\nExpected: "+sys.inspect(stack[index].expected[1]));
                testfail = true;
                break;
            }        
        }
    }
    
    //update stats.
    if( testfail ){
        var msg = '';
        if( failmsg.length > 0 ){
            msg = " ("+failmsg.join(", ")+")";
        }
        console.log("FAIL: "+stack[index].name+msg);
        fail++;
    }else{
        console.log("PASS: "+stack[index].name);
        pass++;
    }
    // trigger next test.
	index++;
    doTest();
};

var exports = module.exports = run;
