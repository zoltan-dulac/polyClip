var example1 = new function () {
	var me = this,
		$michael, $peggy, $title, $fullText, $fullCast, $textContainer,
		oldIE = $('html').hasClass('ie9down'),
		ie9 = $('html').hasClass('ie9'),
		ie8 = $('html').hasClass('ie8'),
		ie7 = $('html').hasClass('ie7'),
		ieMobile = navigator.userAgent.match(/IEMobile/i) ? true : false,
		stats,
		//useRAF = false,
		useRAF = true,
		lastWindowWidth,
		noResize,
		qs = new Querystring();
		
	me.config = function () {
		
		
		if (qs.get('noRAF')) {
			useRAF=false
		}
		
		if (qs.get('SVG')) {
			polyClip.supportsSVG=true;
		}
		
		if (qs.get('noResize')) {
			noResize = true;
		}
		
		
	}
			
	me.init = function () {
		$michael = $('#michael');
		$peggy = $('#peggy');
		$clarence = $('#clarence');
		$title = $('#title');
		$fullCast = $('#full-cast');
		$finalText = $('#finalText');
		$textContainer = $('#textContainer');
		stats=document.getElementById('stats');
		
		/*
		 * Hack for old Win Mobile Devices that don't do the conditional 
		 * comment thing (like the Nokia Lumia 900)
		 */
		if (ieMobile) {
			$('html').addClass('modern').removeClass('ie9 ie9down');
		}
		
		if (qs.get('showStats')) {
			$('body').addClass('showStats');
		}
		
		
		
		$('#support').html(
			polyClip.supportsSVG?"I am using SVG":"I am using Canvas"
		);
		
		resizeEvent();
		
		$(window).bind('resize', resizeEvent);
		
		setTimeout(startDemo, 1000);
	}
	
	
	function startDemo() {
		me.startAnimation($michael, animateClarence);
	}
	
	function animateClarence() {
		$michael.css('display', 'none');
			
		me.startAnimation($clarence, animatePeggy);
	}	
	
	function animatePeggy() {
		$clarence.css('display', 'none');
				
		me.startAnimation($peggy, fadeInCopy);
	}
		
	function fadeInCopy () {
		$peggy.css('display', 'none');
		var animation = new Silk(null, null, {
			stepStart: 0,
			stepEnd: 1,
			duration: 2000,
			complete: function () {
				$finalText.addClass('fadeComplete');
				if (qs.get('showStats')) {
					alert(stats.innerHTML);
				}
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
		$title.html($jNode.attr('data-tagline'));
		
		if (useRAF) {
			$title.css({
				top: 1189
			});
			
			var animation = new Silk($title, {
				top: -320
			}, {
				stepStart: 1439,
				stepEnd: -70,
				duration: 3000,
				complete: function () {
					if (window.console) {
						console.log('Animation Completed: ' + new Date());
					}
					stats.innerHTML += 'animation frames: ' + (animation.framesRendered / 3) + ' per second\n';
					complete(); 
				},
				easing: 'easeInOutCubic',
				step: function (now, fx) {
					
					//$title.css('top', now-250);
					
					$jNode = polyClip.clipImage($jNode.get(0), '0, ' + now + ", 726, " + (now - 413) + "526, 726, 0, 0, 0");
				}
			})
		} else {
			var framesRendered = 0;
			polyClip.$animationNode.css({
				textIndent: 1439
			}).animate({
				textIndent: -70
			}, {
				step: function (now, fx) {
					$title.css('top', now-250);
					
					$jNode = polyClip.clipImage($jNode.get(0), '0, ' + now + ", 726, " + (now - 413) + "526, 726, 0, 0, 0");
					framesRendered++;
				},
				easing: 'easeInOutCubic',
				duration: 3000,
				complete:  function () {
					if (window.console) {
						console.log('Animation Completed: ' + new Date());
					}
					stats.innerHTML += 'animation frames: ' + (framesRendered / 3) + ' per second\n';
					complete(); 
				}
			}) 
		}
		
		
	}
	
	
	
	function resizeEvent (e) {
		
		if (noResize) return;
		
		var $frame = $('#frame'),
			winHeight = $(window).height(),
			winWidth = $(window).width(),
			frameWidth = $frame.width(),
			frameHeight = $frame.height(),
			scaleFactor = winHeight / frameHeight,
			transformVal = 'scale(' + scaleFactor +')',
			transformCSS = {
				"-moz-transform": transformVal,
				"-webkit-transform": transformVal,
				"-o-transform": transformVal,
				"transform": transformVal
			};
			
			if (ieMobile) {
				transformCSS['-ms-transform'] = transformVal;
			}
		//console.log(scaleFactor);
		//console.log(winHeight + ',' + frameHeight)
		if (lastWindowWidth == winWidth) {
			return;
		}
				
		lastWindowWidth = winWidth;
		
		/* Width modern browsers, we use CSS3 to scale #frame. */
		if (polyClip.supportsSVG) {
			$('svg').each(function(index, el){
				polyClip.polygonCache[el.id].setAttribute('transform', transformVal);
			});
			
			if (!ie9) {
				$frame.width(frameWidth*scaleFactor).height(frameHeight*scaleFactor);
			}
			$textContainer.css(transformCSS);
			
			ieScale($textContainer.get(0), scaleFactor)
		} else {
			$frame.css(transformCSS);
		}
		
		if (oldIE) {
			var frame = $('#frame').get(0);
			
			if (!polyClip.supportsSVG) {
				ieScale(frame, scaleFactor);
			}
			
			if (ie7 || ie8 || polyClip.supportsSVG) {
				var newWidth = frameWidth * scaleFactor,
					newHeight = frameHeight * scaleFactor;
					
				$frame.css({
					left: (frameWidth - newWidth) / 2
				})
			
			}
		}
		
		
	}
	
	function ieScale(node, scaleFactor) {
		//console.log(node.id)
		if (ie9) {
			//node.style.zoom = scaleFactor;
			node.style.msTransformOrigin = '50% 0%';
			node.style.msTransform = 'scale(' + scaleFactor +')';
			//console.log(node.style.zoom + ' , ' +  scaleFactor)
		} else if (ie8 || ie7) {
			
			/* 
			 * With 8, it is better to resize with filter instead of zoom, 
			 * since using zoom won't work on VML underneath.  Note only
			 * IE8 -- IE7 will lock up if this is executed.  Who knows
			 * why ... IE7 is the new IE6!
			 */
			filterHelpers.replaceFilter(
				node,
				'progid:DXImageTransform.Microsoft.Matrix',
				'M11=' + scaleFactor +',M12=0,M21=0,M22=' + scaleFactor +',SizingMethod="auto expand"'
			);
			
			/* filterHelpers.replaceFilter(
				$textContainer,
				'progid:DXImageTransform.Microsoft.Matrix',
				'M11=' + scaleFactor +',M12=0,M21=0,M22=' + scaleFactor +',SizingMethod="auto expand"'
			); */
			
			 
			
			
			//document.body.style.filter = 'progid:DXImageTransform.Microsoft.Matrix(M11=' + scaleFactor +',M12=0,M21=0,M22=' + scaleFactor +',SizingMethod="auto expand"';
		}
	}
 	
}

//$(document).ready(example1.init)
polyClip.addCallback(example1.init)
example1.config();
