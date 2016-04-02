var SPI = require( 'spi' );

var 	IODIRA   = 0x00,
    	IODIRB   = 0x01,
	IPOLA    = 0x02,
	IPOLB    = 0x03,
	GPINTENA = 0x04,
	GPINTENB = 0x05,
	DEFVALA  = 0x06,
	DEFVALB  = 0x07,
	INTCONA  = 0x08,
	INTCONB  = 0x09,
	IOCONA   = 0x0A,
	IOCONB   = 0x0B,
	GPPUA    = 0x0C,
	GPPUB    = 0x0D,
	INTFA    = 0x0E,
	INTFB    = 0x0F,
	INTCAPA  = 0x10,
	INTCAPB  = 0x11,
	GPIOA    = 0x12,
	GPIOB    = 0x13,
	OLATA    = 0x14,
	OLATB    = 0x15,
	READ	 = 0x01,
	WRITE	 = 0x00,
	ADDR	 = 0x04;

function createBinaryString( dec ) {
  	var bin = dec.toString(2);
	while( bin.length < 8 ){
		bin = "0" + bin;
	}
	return bin;
}

var SLAVE = function( h_address, parent ){
	this.address = 0x00 | ADDR << 4 | h_address << 1;
	this.CS = parent;

	this.io =         [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
	this.dir =        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1];	
	this.interrupts = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
	this.pull = 	  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
}

SLAVE.prototype.addInterrupt = function( pin, callback ){
	if( this.dir[pin] == 1 ){
		this.interrupts[pin] = callback;
	} else if( pin < 0 || pin > 15 ){
		throw 'Pin <' + pin + '> out of range!';
	} else {
		throw 'Pin <' + pin + '> is not declared as an input!';
	}
}

SLAVE.prototype.changed = function( pin, value ){
	if( this.io[pin] != value ){
		if( this.interrupts[pin] != 0 ){
			this.interrupts[pin]( this.io[pin], value );
		}	
	}
}

SLAVE.prototype.directions = function( dir ){
	if( dir == null ){
		return this.dir;
	} else {
		this.dir = dir;
	}
}

/*
SLAVE.prototype.pullDirection = dunction( pull ){
	if( pull = null ){
		return this.pull;
	} else {
		this.pull = pull;
	}
}
*/

SLAVE.prototype.write = function(){
	// creating output for bank A
	var value = 0x00;
	for( var i = 7; i >= 0; i-- ){
		value = value | this.io[i];
		if( i != 0 )
			value = value << 1;
	}
	// write bank A
	this.CS.write( this.address, 'A', value );

	// creating output for bank B
	value = 0x00;
	for( var i = 15; i >= 8; i-- ){
		value = value | this.io[i];
		if( i != 8 )
			value = value << 1;
	}
	// write bank B
	this.CS.write( this.address, 'B', value );
}

SLAVE.prototype.read = function( cb ){
        var self = this;
        this.CS.read( this.address, 'A', function( value ){
        	for( var i = 0; i < 8; i++ ){
			self.changed( i, value[7-i] );
                        self.io[i] = parseInt( parseInt( value[7-i] ) );
                }
		self.CS.read( self.address, 'B', function( value ){
                	for( var i = 0; i < 8; i++ ){
                        	self.changed( 8+i, parseInt( value[7-i] ) );
				self.io[8+i] = parseInt( value[7-i] );
                	}
                	if( typeof( cb ) == 'function' ){
				cb( );
                	}
		});
        });
}

SLAVE.prototype.get = function( pin, f ){
	if( typeof( f ) != 'undefined' )
		this.read( );
	if( this.dir[pin] == 1 ){
		return this.io[pin];
	} else if( pin < 0 | pin > 15 ){
		throw 'Pin <' + pin + '> is out of range!';
	} else {
		throw 'Pin <' + pin + '> is not an input!';
	}
}

SLAVE.prototype.set = function( pin, value, f ){
	if( typeof(f)==='undefined' )
		f = true;

	// check if pin is initialized as an output
	if( this.dir[pin] == 0 ){
		this.io[pin] = value;

		if( f )
			this.write();

	} else if( pin > 16 || pin < 0 ){
		throw 'Pin <' + pin + '> is out of range!';
	} else {
		throw 'Pin <' + pin + '> is not an output!';
 	}
}

SLAVE.prototype.print = function(){
  var d = [];
  for( var i = 0; i < this.dir.length; i++ ){
	if( i > 7 )
    		d.push( this.dir[i] == 0 ? ' <- ' : ' -> ' );
	else
		d.push( this.dir[i] == 0 ? ' -> ' : ' <- ' );
  }
  var a = createBinaryString( this.address );

  console.log( '        Slave <' + a + '>' );
  console.log(                       '        _________________     ')
  console.log(                       '       |       \\_/       |')
  console.log( '  ' + this.io[ 8] + d[ 8] + '| GPB0       GPA7 |' + d[ 7] + this.io[ 7] );
  console.log( '  ' + this.io[ 9] + d[ 9] + '| GPB1       GPA6 |' + d[ 6] + this.io[ 6] );
  console.log( '  ' + this.io[10] + d[10] + '| GPB2   M   GPA5 |' + d[ 5] + this.io[ 5] );
  console.log( '  ' + this.io[11] + d[11] + '| GPB3   C   GPA4 |' + d[ 4] + this.io[ 4] );
  console.log( '  ' + this.io[12] + d[12] + '| GPB4   P   GPA3 |' + d[ 3] + this.io[ 3] );
  console.log( '  ' + this.io[13] + d[13] + '| GPB5   2   GPA2 |' + d[ 2] + this.io[ 2] );
  console.log( '  ' + this.io[14] + d[14] + '| GPB6   3   GPA1 |' + d[ 1] + this.io[ 1] );
  console.log( '  ' + this.io[15] + d[15] + '| GPB7   S   GPA0 |' + d[ 0] + this.io[ 0] );
  console.log(                       ' 5V -> | VDD    1   INTA | -> 0 ');
  console.log(                       'GND -> | VSS    7   INTB | -> 0 ');
  console.log(                       ' CS -> | CS         ~RST | -> 5V ');
  console.log(                       'SCK -> | SCK          A2 | <- ' + a[4] );
  console.log(                       ' SI -> | SI           A1 | <- ' + a[5] );
  console.log(                       ' SO <- | SO           A0 | <- ' + a[6] );
  console.log(                       '       |_________________| ' );
}

var MCP23S17 = function( device ){
	this.spi = new SPI.Spi( device, {
		'mode': SPI.MODE['MODE_0'],
    		'chipSelect': SPI.CS['low']
	});
	
	this.slaves = [];

	// this address is used to init all chips without hardware_adress
	this.chip_addr = 0x00 | ADDR << 4 | 0x00 << 1;

	this.rxBuffer = null;
	this.txBuffer = null;
}

MCP23S17.prototype.addSlave = function( slave_addr ){
	var slave = new SLAVE( slave_addr, this );
	this.slaves.push( slave );
	return slave;
}

MCP23S17.prototype.read = function( address,  bank, cb ){
	command = ( bank === 'A' ) ? GPIOA : GPIOB;

	rxBuffer = new Buffer( [ address | READ, command, 0x00 ] );
	txBuffer = new Buffer( [ 0x00, 0x00, 0x00 ] );

	var self = this;
	this.spi.transfer( rxBuffer, txBuffer, function( d, b ){
		var result = createBinaryString( b[ 2 ] );
		cb( result );
	});
}

MCP23S17.prototype.write = function( address, bank, value ){
	command = ( bank === "A" ) ? GPIOA : GPIOB;

	rxBuffer = new Buffer( [ address | WRITE, command, value ] );
	this.spi.write( rxBuffer, function(){} );
}

MCP23S17.prototype.connect = function(){
	this.spi.open();

	// activate hardware address on all chips
	rxBuffer = new Buffer( [ this.chip_addr | WRITE, IOCONA, 0b00001000 ] );
	this.spi.write( rxBuffer, function( d, v ){});
	rxBuffer = new Buffer( [ this.chip_addr | WRITE, IOCONB, 0b00001000 ] );
	this.spi.write( rxBuffer, function( d, v ){});

	// init all ports as output
	for( var i = 0; i < this.slaves.length; i ++ ){
		var dirA = 0x00;
		// var pullA = 0x00;
		for( var j = 7; j >= 0; j-- ){
			dirA = dirA | this.slaves[i].dir[j];
			//pullA = pullA | this.slaves[i].pull[j];
			if( j != 0 ){
				dirA = dirA << 1;
				//pullA = pullA << 1;
			}
		}
		var dirB = 0x00;
		// var pullB = 0x00;
		for( var j = 15; j >= 8; j-- ){
			//pullB = pullB | this.slaves[i].pull[j];
			dirB = dirB | this.slaves[i].dir[j];
			if( j != 8 ){
				dirB = dirB << 1;
				//pullB = pullB << 1;
			}
		}
		rxBuffer = new Buffer( [ this.slaves[i].address | WRITE, IODIRA, dirA ] );
        	this.spi.write( rxBuffer, function( d, v ){});
        	rxBuffer = new Buffer( [ this.slaves[i].address | WRITE, IODIRB, dirB ] );
        	this.spi.write( rxBuffer, function( d, v ){});
        	/*
        	rxBuffer = new Buffer( [ this.slaves[i].address | WRITE, GPPUA, pullA ] );
        	this.spi.write( rxBuffer, function( d, v ){});
        	rxBuffer = new Buffer( [ this.slaves[i].address | WRITE, GPPUB, pullB ] );
        	this.spi.write( rxBuffer, function( d, v ){});
        	*/
	}
}

module.exports.MCP23S17 = MCP23S17;
module.exports.createBinaryString = createBinaryString;
