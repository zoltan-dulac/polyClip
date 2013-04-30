/*
 * Silk.js - simplify animations using requestAnimationFrame
 *           by Zoltan Hawryluk.  Released under MIT License
 */

function Silk ($jObj, css, params) {
	var me = this,
		startTime,
		intervalLength = params.end - params.start,
		lastTimeRendered,
		startStates = new Hashtable(),
		easing = params.easing || 'linear',
		done = false;
		
	
	me.css = css;
	me.params = params;
	me.framesRendered=0;
	
	/*
	 * Sets GPU acceleration on webkit browsers.  If there is anything that
	 * can trigger this in other browsers, it should go here.
	 */
	function setGPUAcc() {	
		if ($jObj) {
			$jObj.each(function(index, el){
				var $el = $(el);
				
				var transform = $el.css('-webkit-transform');
				$el.css('-webkit-transform', transform + ' translateZ(0)')
				
			})
		}
	}
	
	me.start = function () {
		
		setGPUAcc();
		startTime = null; //new Date().getTime();
		endTime = null; //startTime + me.params.duration;
		intervalStart=0;
		intervalEnd = endTime
		
		storeBeginState();
		
		requestAnimationFrame(step);
		
		
	}
	
	function storeBeginState() {
		if (!$jObj) return;
		
		$jObj.each(function(index, el) {
			var startState = {},
				$el = $(el);
			
			for (var i in css) {
				startState[i] = {
					begin: parseInt($el.css(i)),   // assume pixels for now
					end: css[i]
				};
				
			}
			startStates.put(el, startState);
		})
	}

	// time is in ms.  now is relative to params.start and params.end.
	function step(time) {
		if (startTime === null) {
			startTime = time;
			endTime = startTime + me.params.duration;
		}
		
		if (time > endTime) {
			time = endTime
		}
		
		var relTime = time - startTime;
		
		var pos = getPos(relTime);
		cssStep(relTime, pos);
			
			
			
		var now = ((me.params.stepEnd - me.params.stepStart) * pos) + me.params.stepStart;
			
		me.params.step(now, me.params);
		lastTimeRendered = relTime;
		me.framesRendered++;
			
		if (time < endTime) {
			requestAnimationFrame(step);
			
		} else  {
			runComplete();
			done = true;
		}
		
		
		
	}
	
	function runComplete() {
		
		var complete = me.params.complete;
		me.startStates = null;
		me.params = null;
		
		complete();
		
		// attempt to free up memory
		for (var i in me) {
			delete me[i];
		}
	}
	
	
	
	function getPos(relTime) {
		 var state = relTime/me.params.duration;
		 
		 var pos = jQuery.easing[easing](state, relTime, 0, 1, me.params.duration);
		 return pos;
	}
	
	function cssStep(now, pos) {
		/* for each element, calc where it is supposed to be */
		if ($jObj) {
			$jObj.each(function(index, el) {
				moveElement(el, now, pos);
			});
		}
	}
	
	function moveElement(el, relTime, pos) {
		var state = startStates.get(el);
		
		for (var cssProp in state) {
			var cssPropState = state[cssProp];
			var now = ((cssPropState.end - cssPropState.begin)  * pos ) + cssPropState.begin;
			$(el).css(cssProp, now);
			
		}
			
	}
	
	
	me.start();
	
	
}

/*
 * Stuff here allows developers to manipulate legecy IE Visual Filters a lot
 * more easily that with what Microsoft provides.
 */
var filterHelpers = new function () {
	var me = this;
	
	me.replaceFilter = function(obj, filterName, filterValue, instance) {
		
		// If this is a jQuery object, execute this method on all of the nodes in it.
		if (obj.jquery) {
			obj.each(function(index, el) {
				 me.replaceFilter(el, filterName, filterValue, instance);
			})
		} else {
			
			if (instance == null) {
				instance = 0;
			}
			var count = 0,
				done = false,
				newFilter = filterName + '(' + filterValue + ')';
			
			var filters = obj.currentStyle.filter.split(/\)\s*,\s*/),
				newFilters = [];
			//console.log('before:' + obj.style.filter + " ... " + newFilter)
			for (var i=0; i<filters.length; i++) {
				var filter,
					isBlank = (filters[i] == '');
					
				if (!isBlank) {
					filter = filters[i] + ')';
				 
				
					if (filter.indexOf(filterName) == 0) {
						if (instance == count) {
							
							filter = newFilter;
							done = true;
						} else {
							count++;
						}
					}
					
					newFilters.push(filter);
				}
				
					
				
				//filters[i] = filter;
			}
		
			if (!done) {
				newFilters.push(newFilter)
			}
			
			var fullFilter = newFilters.join(', ');
			
			obj.style.filter = fullFilter;
			//console.log('after:' + obj.style.filter)
		}
	}
}

// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
 
// requestAnimationFrame polyfill by Erik Möller
// fixes from Paul Irish and Tino Zijdel
 
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame']
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());
