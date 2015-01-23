var example1 = new function () {
	var me = this,
		$dad2012,
		width, height,
		$clipParent,
		mouseOffset = 20,
		frameReq,
		hasGranularRequestAnimationFrame = window.requestAnimationFrame && requestAnimationFrame !== window.webkitRequestAnimationFrame && requestAnimationFrame.toString().indexOf('[native code]') > -1;
	
	me.init = function () {
		$dad2012 = $('#dad2012');
		$clipParent = $('#example1.clipParent')
		
		width = $dad2012.width();
		height = $dad2012.height();
		
		
		/*
		 * This code is only executed if it is embeded in my blog, due to
		 * the centered block (<div id="pageContainer">)that contains 
		 * the whole content.
		 */
		if(location.href.indexOf('http://www.useragentman.com/blog') > -1) {
			setMouseOffset();
			$(window).bind('resize', setMouseOffset);
			
		};
		
		/*
		 * Setup mouse and touch events to translate the clipping path to be 
		 * underneath the event fired.  Note that we use the click event as 
		 * well -- although iOS Safari can keep up with the touchmove event,
		 * Android Chrome and "Browser" cannot, so use the click event as a
		 * type of fallback.
		 */
		$clipParent.bind({
			mousemove: mouseoverEvent,
			touchmove: mouseoverEvent,
			    click: mouseoverEvent
		});
		
		
	}
	
	// Only executed when embedded in my blog. 
	function setMouseOffset(e) {
		//e.preventDefault();
		mouseOffset = $('#pageContainer').get(0).offsetLeft + 200;
		
	}
	
	function mouseoverEvent(e) {
		
		/*
		 * We use requestAnimationFrame() here to make the animation
		 * smoother, if:
		 * 
		 * a) a native implementation (i.e. non-polyfill) is available.
		 * b) it is not the WebkitRequestAnimationFrame.
		 * 
		 * Both the polyfill and WebkitRequestAnimationFrame slow down 
		 * the animation of the mouseover.
		 * 
		 */
		if (hasGranularRequestAnimationFrame) {
			if (frameReq) {
				cancelAnimationFrame(frameReq);
			}
			frameReq = requestAnimationFrame(
				function() { 
					animateClipRegion(e) 
				});
		} else {
			animateClipRegion(e);
		}
	}
	
	
	/*
	 * This is the function that is used by the mouseoverEvent()
	 * function to generate the clipping region underneath the
	 * mouse pointer.
	 */
	function animateClipRegion(e) {	
		
		var pos = $clipParent.position();
		var x =  e.pageX - mouseOffset - $clipParent.get(0).offsetLeft;
		
		polyClip.transformClip($dad2012, 'translateX(' + x + 'px)');
		
		
	}
}

/*
 * Use this call instead of $(document).ready to initialize
 * to ensure that polyClip has initialized before you 
 * start the animation routines.
 */ 
polyClip.addCallback(example1.init);
