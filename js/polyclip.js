/*
 * polyClip 1.0 by Zoltan Hawryluk
 * allows cropping of images using non-rectangular shapes.
 * released under the MIT license.
 * 
 * requires jQuery and the dataset plugin: 	http://www.orangesoda.net/jquery.dataset.html
 * 
 * Usage Example: 
 * <div class="cropParent">
 *   <img data-polyclip="357, 0; 378, 421; 0, 203" src="photo.jpg" />
 * </div>
 */

var polyClip = new function () {
	var me = this;
	
	var ctx;
	var images;
	var pathFor = []; // lookup table to see paths.
	var index = -1;
	var cache = [];
	var loaded = 0;
	
	me.isOldIE = (window.G_vmlCanvasManager);

	me.init = function () {
		images = $('img[data-polyclip]');
		images.each(cacheImage);
	}
	
	function cacheImage(index, element) {
		cache[index] = new Image();
		var im = cache[index];
		$(element).attr('data-polyclip-index', index);
		$(im).bind('load', function () {
			me.drawShape(index, element);
		});
	
		im.src = element.src;
	}
	
	
	
	function drawShapeEvent(e) {
		index++;
		
		me.drawShape(index, e.target);
	}
	
	
	function supports_canvas() {
	  return !!document.createElement('canvas').getContext;
	}
	
	function randInt(min,max) {
	    return (Math.floor(Math.random()*(max-min+1)))+min
	} 
	
	me.drawShape = function (index, element) {
		var jElement = $(element)
		var canvas = document.createElement('canvas');
		canvas.width = element.offsetWidth;
		canvas.height = element.offsetHeight;
		canvas.id = 'polyClip' + index;
		
		var points = jQuery.trim(jElement.attr('data-polyclip')).split(',');
		var src = element.src;
		pathFor[canvas.id] = [];
		
		jElement.replaceWith(canvas);
		if (me.isOldIE) {
			G_vmlCanvasManager.initElement(canvas);
		}
		
	   	var ctx = canvas.getContext("2d");
	   	
	   	
		
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
		
	   	if (me.isOldIE) {
	   		/*  
	   		 * excanvas doesn't implement fill with images, so we must hack the 
	   		 * resultant VML.
	   		 */
	   		ctx.fillStyle = '';
	   		ctx.fill(); 
	   		var fill = $('fill', canvas).get(0);
			fill.color = '';
			fill.src = element.src;
			fill.type = 'tile';
			fill.alignShape = false;
	   	} else {
			var imageObj = new Image();
		    imageObj.onload = function(){
		    	
		        var pattern = ctx.createPattern(imageObj, "repeat");
		        
		        ctx.fillStyle = pattern;
		        ctx.fill();
				
				
				
				/*
				 * The if statement below fixes a problem in Chrome 15 (and
				 * possibly other versions where the image doesn't fill correctly.
				 * This forces a reload of the image from the server in that 
				 * case.
				 */
				if (!isImageThere(ctx, points)) {
					if (imageObj.src.indexOf('?chromeError') < 0) {
						imageObj.src += "?chromeError"; 
					}
				}
				
		    };
		 
		    
	    	imageObj.src = src;
		}
	   	
	   	
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
		if ($(target).hasClass('cropParent')) {
			return $(target);
		}
		
		for (var i in pathFor) {
			if (pathFor.hasOwnProperty(i)) {
				var jEl = $('#' + i);
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
}

// Minimizes FOUC in newer browsers. If older browsers that don't understand
// attribute selectors, add a class of polyClip to the images you are clipping.
document.write('<style type="text/css">img[data-polyclip], img.polyClip { visibility: hidden; }</style>')

if (polyClip.isOldIE) {
	$(window).bind('load', polyClip.init);
} else {
	$(document).ready(polyClip.init);
}