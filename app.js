(function(/*! Brunch !*/) {
  'use strict';

  var globals = typeof window !== 'undefined' ? window : global;
  if (typeof globals.require === 'function') return;

  var modules = {};
  var cache = {};

  var has = function(object, name) {
    return ({}).hasOwnProperty.call(object, name);
  };

  var expand = function(root, name) {
    var results = [], parts, part;
    if (/^\.\.?(\/|$)/.test(name)) {
      parts = [root, name].join('/').split('/');
    } else {
      parts = name.split('/');
    }
    for (var i = 0, length = parts.length; i < length; i++) {
      part = parts[i];
      if (part === '..') {
        results.pop();
      } else if (part !== '.' && part !== '') {
        results.push(part);
      }
    }
    return results.join('/');
  };

  var dirname = function(path) {
    return path.split('/').slice(0, -1).join('/');
  };

  var localRequire = function(path) {
    return function(name) {
      var dir = dirname(path);
      var absolute = expand(dir, name);
      return globals.require(absolute, path);
    };
  };

  var initModule = function(name, definition) {
    var module = {id: name, exports: {}};
    cache[name] = module;
    definition(module.exports, localRequire(name), module);
    return module.exports;
  };

  var require = function(name, loaderPath) {
    var path = expand(name, '.');
    if (loaderPath == null) loaderPath = '/';

    if (has(cache, path)) return cache[path].exports;
    if (has(modules, path)) return initModule(path, modules[path]);

    var dirIndex = expand(path, './index');
    if (has(cache, dirIndex)) return cache[dirIndex].exports;
    if (has(modules, dirIndex)) return initModule(dirIndex, modules[dirIndex]);

    throw new Error('Cannot find module "' + name + '" from '+ '"' + loaderPath + '"');
  };

  var define = function(bundle, fn) {
    if (typeof bundle === 'object') {
      for (var key in bundle) {
        if (has(bundle, key)) {
          modules[key] = bundle[key];
        }
      }
    } else {
      modules[bundle] = fn;
    }
  };

  var list = function() {
    var result = [];
    for (var item in modules) {
      if (has(modules, item)) {
        result.push(item);
      }
    }
    return result;
  };

  globals.require = require;
  globals.require.define = define;
  globals.require.register = define;
  globals.require.list = list;
  globals.require.brunch = true;
})();
(function() {
  var WebSocket = window.WebSocket || window.MozWebSocket;
  var br = window.brunch = (window.brunch || {});
  var ar = br['auto-reload'] = (br['auto-reload'] || {});
  if (!WebSocket || ar.disabled) return;

  var cacheBuster = function(url){
    var date = Math.round(Date.now() / 1000).toString();
    url = url.replace(/(\&|\\?)cacheBuster=\d*/, '');
    return url + (url.indexOf('?') >= 0 ? '&' : '?') +'cacheBuster=' + date;
  };

  var reloaders = {
    page: function(){
      window.location.reload(true);
    },

    stylesheet: function(){
      [].slice
        .call(document.querySelectorAll('link[rel="stylesheet"]'))
        .filter(function(link){
          return (link != null && link.href != null);
        })
        .forEach(function(link) {
          link.href = cacheBuster(link.href);
        });

      // hack to force page repaint
      var el = document.body;
      var bodyDisplay = el.style.display || 'block';
      el.style.display = 'none';
      el.offsetHeight;
      el.style.display = bodyDisplay;
    }
  };
  var port = ar.port || 9485;
  var host = br.server || window.location.hostname;

  var connect = function(){
    var connection = new WebSocket('ws://' + host + ':' + port);
    connection.onmessage = function(event){
      if (ar.disabled) return;
      var message = event.data;
      var reloader = reloaders[message] || reloaders.page;
      reloader();
    };
    connection.onerror = function(){
      if (connection.readyState) connection.close();
    };
    connection.onclose = function(){
      window.setTimeout(connect, 1000);
    };
  };
  connect();
})();

require.register("canvas", function(exports, require, module) {
'use strict';

var el = document.createElement('canvas');
var context = el.getContext('2d');

el.width = window.innerWidth;
el.height = window.innerHeight;

document.body.appendChild(el);

module.exports = {
	el: el,
	context: context,
	width: el.width,
	height: el.height
}

});

;require.register("main", function(exports, require, module) {
'use strict';
var canvas 		= require('canvas');
var Particle  	= require('particle');

var context 	= canvas.context;
var canvasW 	= canvas.width;
var canvasH 	= canvas.height;
var words 		= ["Gobelins", "Ninja de l'image"]
var particles 	= [];
var density 	= 15;
var end;
var audio = new Audio("sound2.mp3");
var img = new Image();
img.src = 'Gobelins_School_of_the_Image_logo.svg';

var start = function() {
    audio.play();
  	context.font = "bold 170px Arial";
  	context.fillText(words[0], ( canvasW / 2 ) - ( Math.round( context.measureText(words[0]).width/2 ) ), canvasH / 2);
  	context.fillText(words[1], ( canvasW / 2 ) - ( Math.round( context.measureText(words[1]).width/2 ) ), canvasH / 2 + 200);
  	setupShurikens();
    draw();
}

var setupShurikens  = function() {
    var imageData;
    var pixel;
    var width   	= 0;
    var i       	= 0;
    var slide   	= false;
  	imageData	= context.getImageData( 0, 0, canvasW, canvasH ).data;

    for (var height = 0; height < canvasH; height += density) {
    	++i;
        slide   = ((i % 2) == 0);
        width   = 0;
	    if (slide === true) {
	        width += 6;
	    }
	    for (width; width < canvasW; width += density) {
	        pixel = imageData[ ( ( width + ( height * canvasW )) * 4 ) - 1 ];               
	        if( pixel == 255 ) {
	            particles.push(new Particle(
	                width,
	                height
	                )
	            );
	        }
	    }
    }
}

function draw() {
    context.clearRect( 0, 0, canvasW, canvasH );
   	var end = true;
    for ( var i = 0, len = particles.length; i < len ; ++i ) {
	    if (particles[i].f < 1) {
    		particles[i].update();
    		particles[i].render(particles[i].x, particles[i].y);
    		end = false;
    	} else {
    		particles[i].render(particles[i].x2, particles[i].y2);
    	}
    }
    if (!end)
  		window.requestAnimationFrame(draw);
    else
      audio.pause();
};

img.onload = function() {
  context.drawImage(img, -330, 20, 1000, 500);
  start();
}

});

;require.register("particle", function(exports, require, module) {
'use strict';

var canvas = require('canvas');
var context = canvas.context;
var j = -30;
function Particle (x, y) {
	this.x1 = j;
	j -= 100;
	this.y1 = Math.round(Math.random() * canvas.height);
	this.x2 = x;
	this.y2 = y;

    this.x = 0;
    this.y = 0;
    var dx = this.x2 - this.x1,
        dy = this.y2 - this.y1;
    
    var dist = Math.abs(Math.sqrt(dx * dx + dy * dy));
    this.speed = 25 / dist;

 	this.f = this.speed;
	this.size = 30;
	this.angle = 0;
	this.finalAngle = Math.round(Math.random() * 20);
}

Particle.prototype.render = function (x, y) {
    context.save();

	context.translate(x, y);
    if (x === this.x2 && y === this.y2) {
    	context.rotate(this.finalAngle * Math.PI/180);
		context.drawImage(shurikenPersp, 0, 0, this.size, this.size);
	} else {
    	context.rotate(this.angle * Math.PI/180);
		context.drawImage(shuriken, 0, 0, this.size, this.size);
	}

    context.restore();
}

Particle.prototype.update = function () {
	this.f += this.speed;
	this.angle += 10;
    this.x = this.x1 + (this.x2 - this.x1) * this.f;
    this.y = this.y1 + (this.y2 - this.y1) * this.f;
}
var event = new CustomEvent('imageLoaded');
var shuriken = new Image();
shuriken.onload = function () {
	canvas.el.dispatchEvent(event);
};

var shurikenPersp = new Image();
shurikenPersp.src = 'shuriken-persp.png';
shuriken.src = 'shuriken.png';

module.exports = Particle;

});


//# sourceMappingURL=app.js.map