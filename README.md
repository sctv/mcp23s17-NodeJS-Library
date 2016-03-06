## MPC23S17 ##
_Readme-Version 1.0.12_

This is a small library to communicate with a MCP23S17 io-expander.

[GIT repository](https://github.com/Kochchri/node-mcp23s17)

[Instructables project](http://www.instructables.com/id/Raspberry-Pi-Port-Expander/)

[![Preview](http://img.youtube.com/vi/mUcTAFFTMto/0.jpg)](https://youtu.be/mUcTAFFTMto)

## Fixed ##
- fixed the chip.set( pin, value, true ) issue

## What's working? ##
You can easily use this library to communicate with 16 of the MCP23S17 chips.
You can read from and write to each of its 16 pins.

You should set the directions of each pin you are using. Connect every not used pin to GND and set as an input.
```javascript
// 0 => Output  Equivalent to the R/W bit
// 1 => Input
s.directions([0, 0, 0, 0, 0, 0, 0, 0,
	          1, 1, 1, 1, 1, 1, 1, 1]);
```

You can easily set any pin to hight or low with this code:
```javascript
// s.set( pin, value );
// this function will immediately publish the values to the chip
s.set( 0, 0 );
s.set( 0, 1 );

// s.set( pin, value, false );
// this will NOT publish to the chip
s.set( 0, 0, false );
// you have to manually publish to the chip
s.write( );
```
To read one of the pins you can chose between this two functions:
```javascript
// s.get( pin );
// returns latest input of pin 0 (might be not the real one)
s.get( 0 );

s.read( function( ){
	// returns the actual value of pin 0
	s.get( 0 );
});
```

Is you want to read more than one pin with its real values, you can use this code:
```javascript
s.read( function( ){ 
    console.log( "All pins are read!" );
    console.log( s.get( 0 );
    console.log( s.get( 1 );
    console.log( s.get( 2 );
} );
```

You can also add callback functions to pins to detect changes.
```javascript
// add a callback function to a single pin
// this is NOT a hardware interrupt. The performance depends on how ofter you vall the read function
// a hardware-implementation will may follow
s1.addInterrupt( 8, function( oldValue, newValue ){
    console.log( "Pin <8> changed from " + oldValue + " to " + newValue );
});
```

## Coming soon ##
- Support hardware-interrupts with callback functions

## Example ##
_v0.0.5_

```javascript
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

// add a callback function to a single pin
// this is NOT a hardware interrupt. The performance depends on how ofter you vall the read function
// a hardware-implementation will may follow
s1.addInterrupt( 8, function( oldValue, newValue ){
	console.log( "Pin <8> changed from " + oldValue + " to " + newValue );
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

	// this function will read all input pins and check for changes
	// it there was a change, the linked callback function will be called
	s1.read();
}, 250);
```
