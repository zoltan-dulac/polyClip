var example2 = new function () {
	var me = this,
		$zoltan2000,
		mouseOffset = 20,
		visibleImage,
		animationDone = true,
		count = 0;
	
	/* 
	 * Initialize the animation.  Cache jQuery objects
	 * and set up click event.
	 */
	me.init = function () {
		$zoltan2000 = $('#zoltan2000');
		
		/*
		 * Set the next button to be not disabled.  This is because during
		 * a reload when the button is disabled, the button may stay disabled,
		 * since most browsers tend to keep the form elements to the same 
		 * values before the reload.
		 */
		
		$next = $('#next').attr('disabled', false);
		visibleImage = 'zoltan2012';
		
		$next.click(clickEvent);
		
	}
	
	
	function clickEvent(e) {
		
		// If there is an animation running, don't do anything.
		if (!animationDone) {
			return;
		}
		
		animationDone = false;
		
		// Disable the next button.
		$next.attr('disabled', true)
		
		/*
		 * set up the start and end angle of the animation,
		 * depending on the state of the animation.
		 */
		var beginAngle, endAngle;
		if (visibleImage == 'zoltan2012') {
			beginAngle = 0;
			endAngle = 90;
		} else {
			beginAngle = 90;
			endAngle = 180;
		}
		
		
		/*
		 * Call Silk.js to do the animation.  Let's go
		 * through this step by step.
		 */
		var animation = new Silk(null, null, {
			
			// start and index of the animation
			stepStart: beginAngle,
			stepEnd: endAngle,
			
			// How long the animation is to run.
			duration: 1000,
			
			// What to do when the animation completes.
			complete: function () {
				
				animationDone = true;
				$next.attr('disabled', false)
				
				if (visibleImage == 'zoltan2012') {
					visibleImage = 'zoltan2000';
				} else {
					visibleImage = 'zoltan2012';
				}
			},
			
			// What easing function to use
			easing: 'easeInOutCubic',
			
			/*
			 * What to do at each step of the animation.  
			 * Note that 'now' will be set to a number
			 * between 'stepStart' and 'stepEnd', depending
			 * where we are in the animation.
			 */
			step: function (now) {
				
				polyClip.transformClip($zoltan2000, 'rotate(' + now + 'deg)');
			}
		});
		
	}
	
}

/*
 * Use this call instead of $(document).ready to initialize
 * to ensure that polyClip has initialized before you 
 * start the animation routines.
 */ 
polyClip.addCallback(example2.init);
