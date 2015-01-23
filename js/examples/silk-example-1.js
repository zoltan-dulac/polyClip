var example1 = new function () {

	var me = this,
		$sun, origin, $planets, animReqs = [];
	
	me.init = function () {
		$sun = $('#sun');
		
		centerSun();
		rotatePlanets();
		
		$(window).bind('resize', centerSun);
	}
	
	function centerSun() {
		origin = {
			x: $(window).width()/2,
			y:  $(window).height()/2
		}
		$sun.css({
			left: origin.x - $sun.width()/2,
			top:  origin.y - $sun.height()/2
		})
	}
	
	function rotatePlanets() {
		$('#planets li').each(function(index, el) {
			var $el = $(el);
			var distance = parseInt($el.attr('data-distance'));
			
			animReqs.push(new Silk(null, null, {
				// start and index of the animation
				stepStart: 0,
				stepEnd: 2 * Math.PI,
				
				// How long the animation is to run.
				duration: distance * 40,
				
				// What to do when the animation completes.
				complete: function () {
					
					
				},
				
				// What easing function to use
				easing: 'linear',
				
				/*
				 * What to do at each step of the animation.  
				 * Note that 'now' will be set to a number
				 * between 'stepStart' and 'stepEnd', depending
				 * where we are in the animation.
				 */
				step: function (now) {
					var x = distance * Math.sin(now) + origin.x,
						y = distance * Math.cos(now) + origin.y
						
					$el.css({
						left: x - $el.width()/2,
						top: y - $el.height()/2
					});
				},
				
				loop: true
			}));
		});
	}
	
}
	
	
$(window).bind('load', example1.init);
	