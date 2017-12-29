'use strict'

const express = require('express');
const {IpFilter, IpDeniedError} = require('express-ipfilter');
const errorHandler = require('express-error-handler');
const httpProxy = require('http-proxy');
const http = require('http');
const net = require('net');

const WEBGATE_PORT = 8213;
var whitelist = ['::1'];

//------------------------------------------------------------------

var proxy = httpProxy.createServer();

proxy.on('error', function (err, req, res) {
	res.status(404).end();
	console.log( err );
});

proxy.on('close', function (res, socket, head) {
	res.status(404).end();
	console.log( err );
});

//------------------------------------------------------------------

var app = express();

/*
app.all('/secret', function (req, res) {
	whitelist.push( '192.168.2.146' );
	console.log( 'secret ok: ', req.connection.remoteAddress );
	res.send('OK');
});

app.use( IpFilter( whitelist, { mode: 'allow' }));
*/

app.use( function( req, res ) {
	console.log( 'fuck: ', req.url );
	proxy.web(req, res, {target: req.url, secure: false});
});

var webGate = http.createServer( app );

app.use( function (err, req, res, next) {
	if(err instanceof IpDeniedError){
		console.log(err);
		res.status(401).end();
		return;
	}
	next(err);
});

app.use( errorHandler({ server: webGate }) );

webGate.on( 'connect', function(socket){
	console.log('user-agent: ', socket.headers['user-agent']);
});

webGate.on( 'error', function(err) {
	console.log('webgate error: ' + err);
});

webGate.listen( WEBGATE_PORT, function listening() {
	console.log( 'Listening on %d', WEBGATE_PORT );
});


// Test with:
// curl -vv -x http://127.0.0.1:8213 https://www.163.com
// curl -vv -x http://127.0.0.1:8213 http://www.163.com
