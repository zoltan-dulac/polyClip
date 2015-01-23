var cf = new function () {
	var me = this,
		animationShape = "400, 0, 508, 274, 798, 290, 573, 476, 648, 760, 400, 602, 153, 760, 227, 478, 0, 292,	293, 274",
		item = 0,
		$name,
		names = ['Sean', 'Ian', 'Dave', 'Zolt'],
		sumRotate = 0,
		$clipParent,
		clipParentNode,
		animation;
	
	me.init = function () {
		
		$name = $('#name');
		$clipParent = $('.clipParent');
		clipParentNode = $clipParent.get(0);
		
		if ($('body').hasClass('modern')) {
			resizeAnimation();
			
			$(window).bind('resize', resizeAnimation)
		}
		animateNext();
		
		
		
	}
	
	function resizeAnimation() {
		var winH = $(window).height(),
			scale =  winH / ($clipParent.height() + 30);
		
		if (winH >= 800) {
			scale = 1;
		} 
		cssSandpaper.setTransform(clipParentNode, 'scale(' + scale + ')');
	}
	
	function animateNext() {
		item++;
		var $img = $('#img' + item);
		
		if ($img.length > 0) {
			animate($img, function () {
				setTimeout(function() {
					animateNext()
				}, 1000)
			});
		} else {
			finalFade();
		}
	}
	
	function animate($node, complete) {
		
		$name.css({
			opacity: 0
		}).html(names[item-1]);
		var path = $node.attr('data-animation-shape');
		
		
		
		// translation matrix 
		
		var translateFactor = 400;
		animation = new Silk($node, {
			
		}, {
			stepStart: 0,
			stepEnd: 3.2,
			duration: 1000,
			complete: function () {
				// do nothing for now.
				sumRotate += 3.2 * 0.5 * Math.PI / 3
				$name.html('')
				complete();
			},
			easing: 'easeInCubic',
			step: function (now, fx) {
				
				//console.error('step ' + now);
				
				var scaleFactor = now ,
					scaleM = Matrix.I(3).x(now),
					rotRad = sumRotate + now * 0.5 * Math.PI / 3;
					rotM = Matrix.RotationZ(rotRad),
					transformString = 'scale(' + scaleFactor + ') rotate(' + rotRad + 'rad)',
					transformMatrix = scaleM.x(rotM);
				
				$jNode = polyClip.clipImage($node.get(0), animationShape, transformString, translateFactor, translateFactor);
				//$jNode = polyClip.clipImage($node.get(0), animationShape, transformMatrix, translateFactor, translateFactor);
				
				cssSandpaper.setTransform($name.get(0), 'rotate(' + rotRad + 'rad) scale(' + (now / 3.2) + ')');
				cssSandpaper.setOpacity($name.get(0), 1 - (now / 3.2) + 0.3);
			}
		})
	}
	
	function finalFade() {
		var $mainCopy = $('#main-copy');
		
		animation = new Silk($mainCopy, {
			opacity: 1
		}, {
			stepStart: 0,
			stepEnd: 1,
			duration: 500,
			complete: function () {
				// do nothing for now.
				//complete();
			},
			easing: 'easeInOutCubic',
			step: function (now, fx) {
				
			}
		})
	}
}

polyClip.addCallback(cf.init);
