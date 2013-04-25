/*
 * polyClip 2.1 by Zoltan Hawryluk
 * allows cross-browser, non-rectangular cropping and masking 
 * of images. Can also be used in animationed image masking.  Works in
 * all modern browsers (Firefox, Chrome, Safari and Opera) as well as
 * Internet Explorer 7.0 and higher.
 * 
 * More info is available on these blog posts:
 * 
 * - Clicking Through Clipped Images Using CSS Pointer Events, 
 *   SVG Paths and VML
 *   http://www.useragentman.com/blog/?p=5914
 * 
 * - Clipping JPEG Images Into Non-Rectangular Polygons Using polyClip.js
 *   http://www.useragentman.com/blog/?p=3526
 * 
 * - Cross-Browser Animated Image Masking (Even in IE) Using polyClip.js
 *   http://www.useragentman.com/blog/?p=5621
 *  
 * Released under the MIT license.
 * 
 * @requires jQuery http://jquery.org
 * 
 * For animations, it is recommended to use Silk.js if you want GPU accelerated
 * animations (included with the polyClip package available at:
 * 	
 * https://github.com/zoltan-dulac/polyClip  
 * 
 * For animations that require transformations (i.e. scaling, rotations, etc),
 * it is necessary to use sylvester.js (also included with the polyClip package).
 * The most up-to-date version of sylvester is available at
 * http://sylvester.jcoglan.com/ 
 * 
 * Usage Example: 
 * <div class="cropParent">
 *   <img data-polyclip="357, 0; 378, 421; 0, 203" src="photo.jpg" />
 * </div>
 */

if (!window.console) {
	window.console = {
		log: function () {},
		error: function () {},
		debug: function () {}
	}
}

var polyClip = new function () {
	
	/* private variables */
	var me = this,
		ctx,
		images,
		pathFor = [], // lookup table to see paths.
		cache = [],
		canvasCache = [],
		loaded = 0,
		callbacks = [],
		callbacksExecuted = false,
		imagesLoaded = 0,
		isIOS = ( navigator.userAgent.match(/(iPad|iPhone|iPod)/i) ? true : false ),
		doesSupportSVG = !isIOS && !!document.createElementNS && !!document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect,
		configNode,
		clippreference,
		forcepointerevents,
		showDebugMessages = false,
		canUseSVG=false
		;
	
	/* public variables */
	// we do not allow iOS to render the SVG because of serious bugs: https://groups.google.com/forum/?fromgroups=#!topic/raphaeljs/oR7cr8aFBSU
	me.useSVGGlobally = false; //!isIOS && !!document.createElementNS && !!document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect; //document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#Shape", "1.0");
	me.aniamtionNode = null;
	me.index = -1;
	me.isOldIE = (window.G_vmlCanvasManager);
	me.polygonCache = [];

	
	

	me.init = function () {
		debug('Initializing.')
		configNode = getConfigNode();
		
		if (configNode) {
			clippreference = configNode.getAttribute('data-polyclip-clippreference');
			forcepointerevents = configNode.getAttribute('data-polyclip-forcepointerevents');
			showDebugMessages = configNode.getAttribute('data-polyclip-showdebugmessages') || false;
			canUseSVG = !me.isOldIE && !isIOS && forcepointerevents == 'true';
			
			if (clippreference == 'SVG' && canUseSVG && !supportsHTMLPointerEvents()) {
				me.useSVGGlobally = true;
			}
			
			
			
		}
		
		
		me.$animationNode = jQuery('<div id="polyClip-tmp" />');
		document.body.appendChild(me.$animationNode.get(0))
		images = jQuery('img[data-polyclip]');
		
		debug('Clipping ' + images.length + ' image(s).');
		
		if (images.length > 0) {
			images.each(cacheImage);
		} else {
			me.runCallbacks();
		}
		
	}
	
	
	function debug(s) {
		if (showDebugMessages) {
			console.log(s)
		}
	}
	
	// from https://github.com/ausi/Feature-detection-technique-for-pointer-events
	function supportsHTMLPointerEvents() {
	
		var element = document.createElement('x'),
	        documentElement = document.documentElement,
	        getComputedStyle = window.getComputedStyle,
	        supports;
	        
	    if(!('pointerEvents' in element.style)){
	        return false;
	    }
	    element.style.pointerEvents = 'auto';
	    element.style.pointerEvents = 'x';
	    documentElement.appendChild(element);
	    supports = getComputedStyle &&
	        getComputedStyle(element, '').pointerEvents === 'auto';
	    documentElement.removeChild(element);
	    return !!supports;
	}
	
	function getObjectSize (obj) {
	    var size = 0, key;
	    for (key in obj) {
	        if (obj.hasOwnProperty(key)) size++;
	    }
	    return size;
	};
	
	function cacheImage(index, element) {
		var im = new Image(); //cache[index];
		jQuery(element).attr('data-polyclip-index', index);
		//console.log(element.id)
		jQuery(im).bind('load', function (e) {
			var $element = jQuery(element);
			if (!$element.attr('data-polyclip-transformorigin')) {
				$element.attr('data-polyclip-transformorigin', (element.width/2) + ',' + (element.height/2));
			}
			debug('Cached ' + im.src)
			cache[im.src]=im;
			
			drawShape(index, element);
			var cacheSize = getObjectSize(cache);
			if (images.length == cacheSize) {
				me.runCallbacks();
			} else {
				debug('Cached ' + images.length + ' out of ' + cacheSize + ' images.');
			}
		});
	
		im.src = element.src;
		
	}
	
	
	
	function drawShapeEvent(e) {
		me.index++;
		
		drawShape(me.index, e.target);
	}
	
	
	function supports_canvas() {
	  return !!document.createElement('canvas').getContext;
	}
	
	function randInt(min,max) {
	    return (Math.floor(Math.random()*(max-min+1)))+min
	}
	
	function pushTransformCoords(M, V, Vbegin, Vend, pushTo) {
		var Vprime = M.x(V.add(Vbegin));
		Vprime = Vprime.add(Vend);
		pushTo.push(Vprime.e(1));
		pushTo.push(Vprime.e(2));
		return Vprime;
	}
	
	
	
	
	function getTransformedCoords(inputCoords, transformMatrix, TX, TY) {
		var coords = jQuery.trim(inputCoords),
			tx=(TX==null)?0:TX,
			ty=(TY==null)?0:TY,
			Vbegin = $V([-tx, -ty, 0]),
			Vend = $V([tx, ty, 0]),
			V, Vprime;
			
		// if this is a polygon, transform each point appropriately.
		if (coords.indexOf('path:') == 0) {
			coords = coords.substring(5);
			
			var path = coords.replace(',', ' ').split(/\s+/),
				transformedPath = [],
				lastCoord = $V([0, 0, 1]),
				lastCommand = null;
			
			for (var i=0; i<path.length; ) {
				
				var command = path[i];
				
				
				
				// if the command is a string, then use the last command
				if (!isNaN(parseFloat(command))) {
					
					command = lastCommand;
					i--;	
				} else {
					transformedPath.push(command);
				}
				
				var commandUpper = command.toUpperCase(),
					numberOfPoints = 0;

				
				switch(commandUpper) {
					case "M":
					case "L":
					case "T":
						numberOfPoints = 1;
						break;
					case "S":
					case "Q":
						numberOfPoints = 2;
						break;	
					case "C":
						numberOfPoints = 2;
						break;	
				}
				
				switch(commandUpper) {
					
						
					/*case "m":
					case "l":
					
						V = $V([ lastCoord.e(1) + parseFloat(path[i+1]), lastCoord.e(2) + (path[i+1]), 1]);
						Vprime = pushTransformCoords(transformMatrix, V, Vbegin, Vend, transformedPath); */
					case "H":
						V = $V([parseFloat(path[i+1]), lastCoord.e(2), 1]);
						pushTransformCoords(transformMatrix, V, Vbegin, Vend, transformedPath);
						break;
						
					case "V":
						V = $V([lastCoord.e(1), parseFloat(path[i+1]), 1]);
						pushTransformCoords(transformMatrix, V, Vbegin, Vend, transformedPath);
						break;
					case "M":
					case "L":
					case "T":
					case "S":
					case "Q":	
					case "C":
						for (var j = 0; j < numberOfPoints; j++) {
							V = $V([parseFloat(path[i+ (j*2) + 1]), parseFloat(path[i+ (j*2) + 2]), 1]);
							pushTransformCoords(transformMatrix, V, Vbegin, Vend, transformedPath);
						}
					 	break;
					 case "A":
					 	
					 	transformedPath.push(path[i+1], path[i+2], path[i+3], path[i+4], path[i+5]);
					 	V = $V([parseFloat(path[i+6]), parseFloat(path[i+7]), 1]);
						pushTransformCoords(transformMatrix, V, Vbegin, Vend, transformedPath);
					 	
					 	
					
				}
				
				i+= 1 + numberOfPoints*2;
				lastCommand = command;
				lastCoord = V;
			}
			
		} else {
			var scaledCoords = [],
				points = coords.split(',');
				
				
				
			for (var i=0; i<points.length; i+=2) {
				V = $V([parseInt(jQuery.trim(points[i])), parseInt(jQuery.trim(points[i+1])), 1]);
				
				Vprime = pushTransformCoords(transformMatrix, V, Vbegin, Vend, scaledCoords);
				debug(transformMatrix.e(1,1))
			}
				
			var r = scaledCoords.join(',');
			
			return r;
		}
	}
	
	me.clipImage = function (element, clipCoords, transform, tx, ty) {
		var $jNode = element.jquery?element:jQuery(element),
			transformedCoords = clipCoords,
			transformOriginSplit = $jNode.attr('data-polyclip-transformorigin'),
			txAttr, tyAttr;
		
		element = element.jquery?element.get(0):element;
		
		if (transformOriginSplit) {
			transformOriginSplit = transformOriginSplit.split(',');
		}
				
		if (transformOriginSplit && transformOriginSplit.length == 2) {
			txAttr = parseFloat(transformOriginSplit[0]);
			tyAttr = parseFloat(transformOriginSplit[1]);
		}
		
		
		if (!transformOriginSplit || isNaN(txAttr) || isNaN(tyAttr)) {
			tx = element.offsetWidth/2;
			ty = element.offsetHeight/2;
		} else {
			tx = txAttr;
			ty = tyAttr;
		}
		
		element = element.jquery?element.get(0):element;
		
		
		
		
		if (transform) {
			if (window.$M) {
				debug('transform: ' + transform);
				
				if (typeof(transform) == 'string') {
					transform = MatrixGenerator.getTransformationMatrix(transform);
				}
				transformedCoords = getTransformedCoords(
					clipCoords, transform, tx, ty);
					debug(transform)
			} else {
				debug('Sylvester.js is needed for scaling clip. Transformation aborted.');
			}
		}
		
		$jNode.attr('data-polyclip-transformcoords', transformedCoords)
		      .attr('data-polyclip-transformorigin', tx + "," + ty)
		      .each(drawShape);
		      
		return $jNode;
		
	}
	
	me.transformClip = function(element, transform, tx, ty) {
		var $jNode = element.jquery?element:jQuery(element);
		
		
		me.clipImage($jNode, $jNode.attr('data-polyclip'), transform, tx, ty);
	}
	
	drawShape = function (index, element) {
		var $element = jQuery(element),
			dataPolyclip = jQuery.trim($element.attr('data-polyclip')),
			dataPolyclipTransformCoords = jQuery.trim($element.attr('data-polyclip-transformcoords')),
			transformOriginAttr = $element.attr('data-polyclip-transformorigin').split(','),
			transformOrigin = {
				x: parseFloat(transformOriginAttr[0]),
				y: parseFloat(transformOriginAttr[1])
			},
			coordsToUse = (dataPolyclipTransformCoords || dataPolyclip),
			src,
			points, path,
			ctx, bufferCtx, src = element.src, $svg, $poly, sb,
			id = element.id?element.id:'polyClip' + index,
			r = $element,
			imageWidth, imageHeight,
			useSVG = (me.useSVGGlobally || element.getAttribute('data-polyclip-clippreference')=='SVG' || element.nodeName.toUpperCase() =='SVG') && canUseSVG,
			//dataset = $element.dataset(),
			svgString;
		sb = [];
		
		
		
		if (coordsToUse.indexOf('path:') == 0) {
			path = coordsToUse.substr(5);
		} else {
			points = coordsToUse.split(',')
			for (var i=0; i<points.length; i+=2) {
				var x = parseInt(jQuery.trim(points[i]));
				var y = parseInt(jQuery.trim(points[i+1]));
				
				sb.push(x + ',' + y + ' ');
			}
		}
		
		/*
		 * This SVG String is needed if we are rendering SVG *or* if the type
		 * of clip is a path (so that canvg can convert it to canvas calls)
		 */
		
		if (useSVG|| path) {
			
			var widthHeight = 'width="' +
							element.offsetWidth + '" height="' +
							element.offsetHeight + '"';
							
			svgString = '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" id="' + id + 
				   '" class="polyClip-clipped"  xmlns:xlink="http://www.w3.org/1999/xlink" ' + widthHeight + 
				   '><defs><pattern id="polyClip-img-for-' + id + '" patternUnits="userSpaceOnUse" ' +
					widthHeight + '><image xlink:href="' + 
					src + '" x="0" y="0" ' +
					widthHeight + '/></pattern></defs>';
					
			if (path) {
				svgString += '<path id="polyClip-poly-for-' + id
					+ '" d="' + path + '" style="fill:url(\'#polyClip-img-for-' + id + '\');" /></svg>';
			} else { // points 
				svgString += '<polygon id="polyClip-poly-for-' + id
					+ '" points="' + sb.join() + '" style="fill:url(\'#polyClip-img-for-' + id + '\');" /></svg>';
			}			
		}			
					
		switch (element.nodeName.toUpperCase()) {
		
			case "IMG":
				imageWidth = element.offsetWidth;
				imageHeight = element.offsetHeight;
				if (useSVG) {
					
					var svgNode;
						
							
						
					//$svg = jQuery(document.createElement('svg'));
					svgNode = new DOMParser().parseFromString(
					   svgString,
					   'application/xml'),
					importNode = element.ownerDocument.importNode(svgNode.documentElement, true);
					//dataset = $element.dataset();
					$element.attr('id', '').replaceWith(importNode);
					$svg = jQuery(importNode);
					$svg.attr('data-polyclip', dataPolyclip).
					     attr('data-polyclip-transformcoords', dataPolyclipTransformCoords).
					      attr('data-polyclip-transformorigin', transformOriginAttr).
					      attr('data-polyclip-transformoriginy', transformOriginAttr);
					
					
						
					me.polygonCache[id] = jQuery('#polyClip-poly-for-' + id, $svg).get(0);
					imageWidth = element.offsetWidth;
					imageHeight = element.offsetHeight;
					
					r = $svg;
						
				} else {
					var canvas = document.createElement('canvas'),
						$canvas = jQuery(canvas), customWidth, customHeight;
						
					var customWidth = $element.attr('data-polyclip-width');
					
					if (customWidth) {
						canvas.width = parseInt(customWidth);
					} else {
						canvas.width = imageWidth;
					}
					
					var customHeight = $element.attr('data-polyclip-height');
					
					if (customHeight) {
						canvas.height = parseInt(customHeight);
					} else {
						canvas.height = imageHeight;
					}
					
					canvas.id = id;
					
					
					$canvas.attr('data-polyclip', dataPolyclip)
					         .attr('data-polyclip-transformcoords', dataPolyclipTransformCoords)
					         .attr('data-polyclip-transformorigin', transformOriginAttr)
							 .attr('data-src', src)
							 .addClass('polyClip-clipped');  
					
					
					
					$element.replaceWith(canvas);
					
					
					if (me.isOldIE) {
						G_vmlCanvasManager.initElement(canvas);
					}
					
					
					ctx = canvas.getContext("2d");
					canvasCache[id] = ctx;
					
					
					jQuery(window).trigger('resize');
					r = $canvas;
					
					/* Now ... we must also trigger mousemove events if 
					 * pointerevents are supposed to be used
					 */
					var pointerEventCSS = r.css('pointer-events');
					
					me.polygonCache[id] = {
						ctx: ctx,
						imageData: ctx.getImageData?ctx.getImageData(0,0,canvas.width,canvas.height).data:null,
						pointerEventCSS: pointerEventCSS?pointerEventCSS.toLowerCase():null
					}
					
					
					/* if (forcepointerevents) {
						setupPointerEvents(r);
					} */
				}
				break;
			case "SVG" :
				//jQuery(element.getElementsByTagName('polygon')[0]).attr('points', sb.join());
				if (path) {
					me.polygonCache[id].setAttribute('d', path);
				} else { //points 
					me.polygonCache[id].setAttribute('points', sb.join());
				}
				
				break;
			case "CANVAS":
				canvas = element;
				src=$element.attr('data-src');
				ctx = canvasCache[id];
				break;
		
		}
		
		if (!useSVG) {
			
			pathFor[canvas.id] = [];
			
			var minx=0, maxx=canvas.width, miny=0, maxy = canvas.height;
			
			ctx.save();
			
			ctx.clearRect (0, 0 , canvas.width, canvas.height);
			
			
			if (path) {
				/* canvg(canvas, svgString, {
					ignoreMouse: true
				}); */
				ctx.drawSvg(svgString, 0, 0, imageWidth, imageHeight)
			} else { // points
			
			
			    ctx.beginPath();
			   	
				
				for (var i=0; i<points.length; i+=2) {
					
					//var point = points[i].split(',');
					var x = parseInt(jQuery.trim(points[i]));
					var y = parseInt(jQuery.trim(points[i+1]));
					
					
					
					pathFor[canvas.id].push({
						x: x,
						y: y
					});
					if (i == 0) {
						
						ctx.moveTo(x,y);
					} else {
						ctx.lineTo(x,y);
					}
					
					
					
				}
				
				ctx.closePath();
				
			}
			
			
		   	if (me.isOldIE) {
		   		/*  
		   		 * excanvas doesn't implement fill with images, so we must hack the 
		   		 * resultant VML.
		   		 */
		   		ctx.fillStyle = '';
		   		ctx.fill(); 
		   		var fill = jQuery('fill', canvas).get(0);
		   		var shape = jQuery('shape', canvas).get(0);
		   		
		   		/* 
		   		 * We must ensure the filled shape is transparent.  These two 
		   		 * lines ensure that.  From 
		   		 * http://stackoverflow.com/questions/4111054/get-vml-fillcolor-none-to-work-when-using-fill
		   		 */
				fill.color = 'none';
				shape.fillcolor='none';
				fill.src = src;
				fill.type = 'tile';
				fill.alignShape = false;
				
		   	} else {
				var imageObj = getFromCache(src),
					pattern = ctx.createPattern(imageObj, "repeat");
			    ctx.fillStyle = pattern;
			    ctx.fill();
				
				
			}
			ctx.restore();
			
			var pointerEventCSS = r.css('pointer-events');

			me.polygonCache[id] = {
				ctx: ctx,
				imageData: ctx.getImageData?ctx.getImageData(0,0,canvas.width,canvas.height).data:null,
				pointerEventCSS: pointerEventCSS?pointerEventCSS.toLowerCase():null
			}	
		}
		
	   	return r;
	   	
	}
	
	function isImageThere(ctx, points) {
		var r;
		var x0 = parseInt(jQuery.trim(points[0]));
		var y0 = parseInt(jQuery.trim(points[1]));
		
		for (var i=-1; i<=1; i++) {
			for (var j=0; j<=1; j++) {
				r = ctx.getImageData(x0 +i, y0 +j, 1, 1).data[3];
				if (r!=0) {
					return true;
				}
			}
		}
		
		return false;
		
		
	}
	
	me.findObject = function (e) {
		var target = e.currentTarget;
		
		/* If the target is an image, then we should return the parent */
		if (jQuery(target).hasClass('cropParent')) {
			return jQuery(target);
		}
		
		for (var i in pathFor) {
			if (pathFor.hasOwnProperty(i)) {
				var jEl = jQuery('#' + i);
				var x = e.pageX;
				var y = e.pageY;
				if (me.isInPolygon(jEl, x, y, true)) {
					return jEl;
				}
			}
			
		}
	}
	
	/* 
	 * isInPolygon: Fast algorithm that returns whether a point is inside a polygon, 
	 * given a set of points. From http://www.visibone.com/inpoly/
	 */
	
	me.isInPolygon = function (jObj, xt, yt, withOffset) {
	{
			 
			var obj = jObj.get(0);
			var poly = pathFor[obj.id];
			var npoints = poly.length;
		    var xnew,ynew, xold,yold, x1,y1, x2,y2, i, inside=false, offsets={left:0, top:0};
		    
		
			if (withOffset) {
				offsets = jObj.offset();
			} 
		
		     if (npoints < 3) {
		          return(false);
		     }
		     
		     xold=poly[npoints-1].x + offsets.left;
		     yold=poly[npoints-1].y + offsets.top;
		     
		     
		     
		     for (i=0 ; i < npoints ; i++) {
		          xnew=poly[i].x + offsets.left;
		          ynew=poly[i].y + offsets.top;
		          if (xnew > xold) {
		               x1=xold;
		               x2=xnew;
		               y1=yold;
		               y2=ynew;
		          }
		          else {
		               x1=xnew;
		               x2=xold;
		               y1=ynew;
		               y2=yold;
		          }
		          if ((xnew < xt) == (xt <= xold)          /* edge "open" at one end */
		           && (yt-y1)*(x2-x1)
		            < (y2-y1)*(xt-x1)) {
		               inside=!inside;
		          }
		          xold=xnew;
		          yold=ynew;
		     }
		     return(inside);
		}
		
		
	}
	
	function getFromCache(src) {
		return cache[src];
		
	}
	
	
	me.addCallback = function (f) {
			callbacks.push(f);
	}
	
	me.runCallbacks = function () {
		debug('Cached all images.  Running callbacks...');
				
		for (var i=0; i<callbacks.length; i++) {
			callbacks[i]();
		}
	}
	
	function getConfigNode() {
	
		var scriptNodes = document.getElementsByTagName('script');
		var r = null;
		
		for (var i=0; i<scriptNodes.length; i++) {
			var configNode = scriptNodes[i];
			
			if (configNode.src.match('polyclip(-p){0,1}\.js')) {	
				r =  configNode;
			}
		}
		
		if (!r || !hasDataset(r)) {
			r = document.body;
		}
		
		return r;
	}
	
	function hasDataset(node) {
		var r = false;
		jQuery.each(node.attributes, function(i, attrib){
			if (attrib.name.indexOf('data-') == 0 ) {
				r = true;
			}
		});
		return r;
	}
	
	
	/* 
	 * Matrix Generator object: for doing transformations on polygons.
	 * Originally from cssSandpaper.
	 */
	if (window.$M) {
		var MatrixGenerator = new function(){
			var me = this,
				reUnit = /[a-z]+$/,
				reTransformListSplitter = /[a-zA-Z]+\([^\)]*\)\s*/g,
    			reLeftBracket = /\(/g,
    			reRightBracket = /\)/g,
    			reComma = /,/g;
    			
			me.identity = $M([[1, 0, 0], [0, 1, 0], [0, 0, 1]]);
			
			
			function degreesToRadians(degrees){
				return degrees * Math.PI / 180;
			}
			
			function getRadianScalar(angleStr){
			
				var num = parseFloat(angleStr);
				var unit = angleStr.match(reUnit);
				
				
				if (jQuery.trim(angleStr) == '0') {
					num = 0;
					unit = 'rad';
				}
				
				if (unit.length != 1 || num == 0) {
					return 0;
				}
				
				
				unit = unit[0];
				
				
				var rad;
				switch (unit) {
					case "deg":
						rad = degreesToRadians(num);
						break;
					case "rad":
						rad = num;
						break;
					default:
						throw "Not an angle: " + angleStr;
				}
				return rad;
			}
			
			me.prettyPrint = function(m){
				return StringHelpers.sprintf('| %s %s %s | - | %s %s %s | - |%s %s %s|', m.e(1, 1), m.e(1, 2), m.e(1, 3), m.e(2, 1), m.e(2, 2), m.e(2, 3), m.e(3, 1), m.e(3, 2), m.e(3, 3))
			}
			
			me.rotate = function(angleStr){
				var num = getRadianScalar(angleStr);
				return Matrix.RotationZ(num);
				
			}
			
			me.scale = function(sx, sy){
				sx = parseFloat(sx)
				
				if (!sy) {
					sy = sx;
				}
				else {
					sy = parseFloat(sy)
				}
				
				
				return $M([[sx, 0, 0], [0, sy, 0], [0, 0, 1]]);
			}
			
			me.scaleX = function(sx){
				return me.scale(sx, 1);
			}
			
			me.scaleY = function(sy){
				return me.scale(1, sy);
			}
			
			me.skew = function(ax, ay){
				var xRad = getRadianScalar(ax);
				var yRad;
				
				if (ay != null) {
					yRad = getRadianScalar(ay)
				}
				else {
					yRad = xRad
				}
				
				if (xRad != null && yRad != null) {
				
					return $M([[1, Math.tan(xRad), 0], [Math.tan(yRad), 1, 0], [0, 0, 1]]);
				}
				else {
					return null;
				}
			}
			
			me.skewX = function(ax){
			
				return me.skew(ax, "0");
			}
			
			me.skewY = function(ay){
				return me.skew("0", ay);
			}
			
			me.translate = function(tx, ty){
			
				var TX = parseInt(tx);
				var TY = parseInt(ty)
				
				//jslog.debug(StringHelpers.sprintf('translate %f %f', TX, TY));
				
				return $M([[1, 0, TX], [0, 1, TY], [0, 0, 1]]);
			}
			
			me.translateX = function(tx){
				return me.translate(tx, 0);
			}
			
			me.translateY = function(ty){
				return me.translate(0, ty);
			}
			
			
			me.matrix = function(a, b, c, d, e, f){
			
				// for now, e and f are ignored
				return $M([[a, c, parseInt(e)], [b, d, parseInt(f)], [0, 0, 1]])
			}
			
			me.getTransformationMatrix = function(transformString, doThrowIfError){
    			debug('transformString is ' + transformString)
		        var transforms = transformString.match(reTransformListSplitter);
				
				/*
				 * Do a check here to see if there is anything in the transformation
				 * besides legit transforms
				 */
				if (doThrowIfError) {
					var checkString = transforms.join(" ").replace(/\s*/g, ' ');
					var normalizedCSSProp = transformString.replace(/\s*/g, ' ');
					
					if (checkString != normalizedCSSProp) {
						throw ("An invalid transform was given: " + transformString)	
					}
				}
				
				
		        var resultantMatrix = MatrixGenerator.identity;
		        debug('num of transforms ' + transforms.length)
		        for (var j = 0; j < transforms.length; j++) {
		        
		            var transform = transforms[j];
					
		            transform = transform.replace(reLeftBracket, '("').replace(reComma, '", "').replace(reRightBracket, '")');
		            
		            
		            try {
		            	debug('looking up : ' + transform)
		                var matrix = eval('MatrixGenerator.' + transform);
						
						
		                //jslog.debug( transform + ': ' + MatrixGenerator.prettyPrint(matrix))
		                resultantMatrix = resultantMatrix.x(matrix);
		            } 
		            catch (ex) {
		            	
						if (doThrowIfError) {
							var method = transform.split('(')[0];
		
							var funcCall = transform.replace(/\"/g, '');
		
							if (MatrixGenerator[method]  == undefined) {
								throw "Error: invalid tranform function: " + funcCall;
							} else {
								throw "Error: Invalid or missing parameters in function call: " + funcCall;
		
							}
						}
		                // do nothing;
		            }
		        }
		        
		        return resultantMatrix;
		        
		    }
			
		}
	}
	
	
	
	/* function setupPointerEvents($canvas) {
		
		var canvas = $canvas.get(0),
			polygon = me.polygonCache[canvas.id];
		
		if (polygon.pointerEventCSS == 'visiblefill') {
			
			$canvas.bind('mousemove', function (e) {
				
				var idx;
				
				var data = polygon.ctx.getImageData(0,0,canvas.width,canvas.height).data;
				
				idx = 4 * (e.pageX + e.pageY * canvas.width) + 3;
				if (data[idx]) { // alpha 0
					$canvas.css('pointer-events', 'none');
				} else {
					$canvas.css('pointer-events', 'auto');
				}
				console.log(e.pageX + ', ' + e.pageY + ', '+ data[idx])
				
			})
		
		}
	} */
}



// Minimizes FOUC in newer browsers. If older browsers that don't understand
// attribute selectors, add a class of polyClip to the images you are clipping.
document.write('<style type="text/css">img[data-polyclip], img.polyClip { visibility: hidden; } </style>')

if (polyClip.isOldIE) {
	jQuery(window).bind('load', polyClip.init);
} else {
	jQuery(document).ready(polyClip.init);
}
