var example1 = new function () {
	var me = this,
		$michael, $peggy, $title, $fullText, $fullCast,
		oldIE , ie7, ie8, ie9,
		stats,
		//useRAF = false,
		useRAF = true,
		lastWindowWidth,
		isInArticle = location.href.indexOf('/blog/') > 0,
		qs = new Querystring(),
		$startDemo,
		demoPlaying = false;
		
	me.config = function () {
		
		
		if (qs.get('noRAF')) {
			useRAF=false
		}
		
		if (qs.get('SVG')) {
			polyClip.supportsSVG=true;
		}
		
		
	}
			
	me.init = function () {
		
		$michael = $('#michael'),
		$peggy = $('#peggy'),
		$clarence = $('#clarence'),
		$title = $('#title'),
		$fullCast = $('#full-cast'),
		$finalText = $('#finalText');
		$startDemo = $('#startDemo');
		
		oldIE = $('body').hasClass('ie9down');
		ie9 = $('body').hasClass('ie9');
		ie8 = $('body').hasClass('ie8');
		ie7 = $('body').hasClass('ie7');
		
		
		stats=document.getElementById('stats');
		
		
		if (qs.get('showStats')) {
			$('body').addClass('showStats');
		}
		
		
		
		/* $('#support').html(
			polyClip.supportsSVG?"I am using SVG":"I am using Canvas"
		); */
		
		//resizeEvent();
		
		//$(window).bind('resize', resizeEvent);
		
		if (isInArticle) {
			$startDemo.click(startDemo2);
			$('#startAgain').click(startAgain);
		} else {
			setTimeout(startDemo2, 500);
		}
	}
	
	
	function startDemo2() {
		if (demoPlaying) return;
		
		
		demoPlaying = true;
		$startDemo.css({
			opacity: 0
		})
		
		setTimeout(function () {
			$startDemo.css({
				display: 'none'
			}, 500);
		})
		me.startAnimation($michael, animateClarence);
	}
	
	function startAgain() {
		var cast = [$michael, $peggy, $clarence];
		
		for (var i=0; i<cast.length; i++) {
			polyClip.clipImage(cast[i].get(0), '0, 0, 726, 0, 726, 939, 0, 939, 0, 0');
		}
		
		fadeCopy(true);
		startDemo2();
	}
	
	function animateClarence() {
		//$michael.css('display', 'none');
			
		me.startAnimation($clarence, animatePeggy);
	}	
	
	function animatePeggy() {
		//$clarence.css('display', 'none');
				
		me.startAnimation($peggy, fadeCopy);
	}
		
	function fadeCopy (isFadeOut) {
		
		var stepStart=0, stepEnd =1, duration=2000;
		
		if (isFadeOut) {
			stepStart = 1;
			stepEnd = 0;
			duration = 200;
		}
		
		
		//$peggy.css('display', 'none');
		var animation = new Silk(null, null, {
			stepStart: stepStart,
			stepEnd: stepEnd,
			duration: duration,
			complete: function () {
				$finalText.addClass('fadeComplete');
				demoPlaying = false;
			},
			step: function (now, fx) {
				var cssObj;
				
				if (oldIE) {
					var $textShadows = $('h1, p, img', $finalText);
					
					filterHelpers.replaceFilter(
						$textShadows, 
						'progid:DXImageTransform.Microsoft.Alpha', 
						'opacity=' + Math.round(now * 100)
					);
					
				} else {
					
					$finalText.css({
						opacity: now
					});
				}
				
			}
		})
					
					
			
	}
	
	me.startAnimation = function ($jNode, complete) {
		var animation;
		$title.html($jNode.attr('data-tagline'));
		
		
		
		
		if (useRAF) {
			$title.css({
				top: 596 //1189
			});
			
			animation = new Silk($title, {
				top: -160 //-320
			}, {
				stepStart: 719,
				stepEnd: -35,
				duration: 3000,
				complete: function () {
					stats.innerHTML += 'animation frames: ' + (animation.framesRendered / 3) + ' per second\n';
					complete();
					
					
				},
				easing: 'easeInOutCubic',
				step: function (now, fx) {
					
					//$title.css('top', now-250);
					
					$jNode = polyClip.clipImage($jNode.get(0), '0, ' + now + ", 355, " + (now - 206) + "355, 459, 0, 0, 0");
				}
			})
		} else {
			polyClip.$animationNode.css({
				textIndent: 719
			}).animate({
				textIndent: -35
			}, {
				step: function (now, fx) {
					$title.css('top', now-250);
					
					$jNode = polyClip.clipImage($jNode.get(0), '0, ' + now + ", 355, " + (now - 206) + "355, 459, 0, 0, 0");
				},
				easing: 'easeInOutCubic',
				duration: 3000,
				complete: complete
			}) 
		}
		
		
	}
	
	
	
	function resizeEvent (e) {
		
		var $frame = $('#frame'),
			$frameContainer = $('#frameContainer'),	
			winHeight = $(window).height(),
			winWidth = $(window).width(),
			frameWidth = $frame.width(),
			frameHeight = $frame.height(),
			scaleFactor = winHeight / frameHeight,
			transformVal; 
		
              if (isInArticle) {
			scaleFactor *= 0.8;
		}

		transformVal = 'scale(' + scaleFactor +')';
		
		if (lastWindowWidth == winWidth) {
			return;
		}
		
		lastWindowWidth = winWidth;
		
		/* Width modern browsers, we use CSS3 to scale #frame. */
		if (polyClip.supportsSVG) {
			$('svg').each(function(index, el){
				polyClip.polygonCache[el.id].setAttribute('transform', transformVal);
			})
		} else {
			$frame.css({
				"-moz-transform": transformVal,
				"-webkit-transform": transformVal,
				"-o-transform": transformVal,
				"transform": transformVal
			});
		}
		
		if (oldIE) {
			var frame = $('#frame').get(0);
			
			if (ie9) {
				frame.style.zoom = scaleFactor;
			} else if (ie8) {
				
				/* 
				 * With 8, it is better to resize with filter instead of zoom, 
				 * since using zoom won't work on VML underneath.  Note only
				 * IE8 -- IE7 will lock up if this is executed.  Who knows
				 * why ... IE7 is the new IE6!
				 */
				filterHelpers.replaceFilter(
					$frame,
					'progid:DXImageTransform.Microsoft.Matrix',
					'M11=' + scaleFactor +',M12=0,M21=0,M22=' + scaleFactor +',SizingMethod="auto expand"'
				);
				
			}
			
			if (ie7 || ie8 || polyClip.supportsSVG) {
				var newWidth = frameWidth * scaleFactor,
					newHeight = frameHeight * scaleFactor;
					
				$frame.css({
					left: (frameWidth - newWidth) / 2
				})
			
			}
		}
		
		$frameContainer.height(frameHeight * scaleFactor);
		
	}
 	
}

//$(document).ready(example1.init)
polyClip.addCallback(example1.init)
example1.config();
