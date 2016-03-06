// load the library
MCPLib = require('mcp23s17');

// create new instance width device and chip_adress
// needed default settings are set (more options will follow)
mcp_1 = new MCPLib.MCP23S17( '/dev/spidev0.0' );

s0 = mcp_1.addSlave( 0b00000000 );
s0.directions([0, 0, 0, 0, 0, 0, 0, 0,
	       1, 1, 1, 1, 1, 1, 1, 1]);

s1 = mcp_1.addSlave( 0b00000001 );
s1.directions([0, 0, 0, 0, 0, 0, 0, 0,
	       1, 1, 1, 1, 1, 1, 1, 1]);

// connect decive
mcp_1.connect();

s1.addInterrupt( 8, function( o, n ){
	console.log( "Pin <8> changed from " + o + " to " + n );
});

var pin = 0;
setInterval( function(){

	// the set function without additional parameter sets the pin and update to the chip automatically
	// if you want to set more pins and only need to update after, you can pass an additional
	// false parameter. After you set all pins, call the update function, which sends all changes 
	// to the chip.

	s1.set( pin, 0, false );
	s0.set( pin++, 0, false );
	if( pin > 7 )
		pin = 0;

	s0.set( pin, 1, false );
	s1.set( pin, 1, false );
	s0.write();
	s1.write();

	// calling the get command without callback function uses the old data.
	// if you want to get the new data from the chip you have to use this function with a 
	// callback function. After you called it once all input pins are updated and you can use 
	// without callback to read the rest of your pins.


	s1.read( );
}, 250);


