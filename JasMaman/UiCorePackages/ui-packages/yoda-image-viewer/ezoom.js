
var ezoom = {};

ezoom = {
    thisImg: null,
    rotate: 0,
    scale: 1,
    grabbing: false,
    gesturing: false,
    translateX: 0,
    translateY: 0,
    translateScale: 1,
    isShowed: false,
    imgTag: null,
	zoomModal: null,
	options: null,
    onInit: function (domElement, options) {
		options = options || {};
		ezoom.options = options;
		ezoom.createZoomModalTag();
		// In case the param to be passed to is an url string, else the neatest domeElement <img>
		if (ezoom.options.src && typeof ezoom.options.src == "string") {
			domElement.on('click', function(e) {
				ezoom.thisImg = $(this);
				ezoom.show(ezoom.options.src);
			});
		} else {
			domElement.addClass('ezoom').on('click', function(e) {
				ezoom.thisImg = $(this);
				ezoom.show(ezoom.thisImg.attr('src'));
			});
		}
        ezoom.initMouseScrolling();
		ezoom.initEvent();
		
	},
    createZoomModalTag: function() {
		
		// Use this if using `$('#zoomModal').hide();`
		if ($('#yoda-image-viewer-modal').length > 0) return;

		var $ezoomWrap = $('<div id="yoda-image-viewer-modal" class="modal"></div>'),
			$closeBtn = $('<span title="Close" class="mdi mdi-close" id="yoda-image-viewer-modal-close"></span>'),
			$rotateRightBtn = $('<span title="Rotate right" class="mdi mdi-rotate-right" id="yoda-image-viewer-modal-right"></span>'),
			$rotateLeftBtn = $('<span title="Rotate left" class="mdi mdi-rotate-left" id="yoda-image-viewer-modal-left"></span>'),
			$image = $('<img title="Please scroll the mouse pointer to zoom in/out the image." id="yoda-image-viewer-modal-item">');
		
		if (!ezoom.options.hideControlBtn) {
			$ezoomWrap.append($rotateRightBtn, $rotateLeftBtn);
		}

		$ezoomWrap.append($image, $closeBtn );
		$('body').append($ezoomWrap);

        ezoom.imgTag = $image;
		ezoom.zoomModal = $ezoomWrap;
		
        $closeBtn.on('click', ezoom.remove);
        
		$rotateRightBtn.on('click', function() {
			ezoom.doRotate("right");
		});
        
        $rotateLeftBtn.on('click', function() {
			ezoom.doRotate("left");
		});

    },
    show: function(src) {
        ezoom.isShow = true;
        ezoom.reset();
		$('#yoda-image-viewer-modal').show();
		$('#yoda-image-viewer-modal #yoda-image-viewer-modal-item').attr('src', src);
		ezoom.poscalSizeAndPosition();
		if (typeof ezoom.options.onShow && typeof ezoom.options.onShow == "function") {
			ezoom.options.onShow(ezoom);
		}
    },
    remove: function(op) {
		ezoom.isShow = false;
		$('#yoda-image-viewer-modal #yoda-image-viewer-modal-item').attr('src', '');
		// $('#yoda-image-viewer-modal').remove();
		$('#yoda-image-viewer-modal').hide();
		ezoom.setTransformOrigin(1, null, 0, 0);
		if (typeof ezoom.options.onClose && typeof ezoom.options.onClose == "function") {
			ezoom.options.onClose(ezoom);
		}
	},
	doRotate: function(to) {
		const option = to == "left" ? "-90" : "+90";
		ezoom.rotate = (ezoom.rotate + +option)%360;
		ezoom.setTransformOrigin(1, null, 0, 0);
		if (typeof ezoom.options.onRotate && typeof ezoom.options.onRotate == "function") {
			ezoom.options.onRotate(ezoom);
		}
	},
    reset: function() {
		// scale-1 rotate-0  translateX-0  translateY-0
		ezoom.setTransformOrigin(1, 0, 0, 0);
	},
    poscalSizeAndPosition: function(d) {
		var $image = ezoom.thisImg;
		var	nWidth_  = $image[0].naturalWidth || +Infinity,
			nHeight_ = $image[0].naturalHeight || +Infinity,
			nWidth = d == 'odd' ? nHeight_ : nWidth_, 
			nHeight = d == 'odd' ? nWidth_ : nHeight_, 
			wWidth  = $(window).width(), 
			wHeight = $(window).height(),
			aWidth  = Math.min(nWidth, wWidth * 0.98), 
			aHeight = Math.min(nHeight, wHeight * 0.98),
			scaleX  = aWidth / nWidth,
			scaleY  = aHeight / nHeight,
			scale   = Math.min(scaleX, scaleY); 

		// console.log('nheight,wHeight,aHeight',nHeight,wHeight,aHeight);
        // console.log('nwidth,wWidth,aWidth',nWidth,wWidth,aWidth);
        
		// $('#yoda-image-viewer-modal').css({
		// 	'width': nWidth * scale,
		// 	'height': nHeight * scale
		// });
		// $('#yoda-image-viewer-modal').css({
		// 	'height': $(window).height(),
		// 	'top': $(document).scrollTop()
        // });
        
	},
    setTransformOrigin: function(s, r, x, y) {
		if (s) ezoom.scale = s;
		if (ezoom.translateScale != 1) {
			s *= ezoom.translateScale;
			ezoom.translateScale = 1;
        }
		if (r != undefined || r != null ) ezoom.rotate = r;
		if (x != undefined || x != null) ezoom.translateX = x;
		if (y != undefined || y != null) ezoom.translateY = y;

		var trans = 'scale(' + ezoom.scale + ') translateX(' + ezoom.translateX + 'px) translateY(' + ezoom.translateY + 'px) rotate(' + ezoom.rotate + 'deg)';
		// console.log(trans);
		ezoom.imgTag.css({
			'-webkit-transform': trans,
			'-moz-transform': trans,
			'-ms-transform': trans,
			'-o-transform': trans,
			'transform': trans,
			'transform-origin': 'center center'
		});
    },
    initMouseScrolling: function() {
		var isFirefox = navigator.userAgent.indexOf("Firefox") > -1 ;
		var MOUSEWHEEL_EVENT = isFirefox ? "DOMMouseScroll" : "mousewheel";

		// if(document.attachEvent) {
		// 	ezoom.imgTag[0].attachEvent("on" + MOUSEWHEEL_EVENT, function(e) {
		// 		mouseWheelScroll(e);
		// 	});
		// } else if(document.addEventListener) {
		// 	ezoom.imgTag[0].addEventListener(MOUSEWHEEL_EVENT, function(e) {
		// 		mouseWheelScroll(e);
		// 	}, false);
		// }

		if (document.attachEvent) {
			ezoom.zoomModal[0].attachEvent("on" + MOUSEWHEEL_EVENT, function(e) {
				mouseWheelScroll(e);
			});
		} else if(document.addEventListener) {
			ezoom.zoomModal[0].addEventListener(MOUSEWHEEL_EVENT, function(e) {
				mouseWheelScroll(e);
			}, false);
		}

		function mouseWheelScroll(e) {
			ezoom._preventDefault(e);
			var _delta = parseInt(e.wheelDelta || -e.detail);

			if (_delta > 0) {
				ezoom.scale += 0.1;
                if (ezoom.scale >= 15) {
                    ezoom.scale = 15;
                    return;
                }
                ezoom.setTransformOrigin();
			}
			else {
				ezoom.scale -= 0.1;
                if (ezoom.scale <= 0.1) {
                    ezoom.scale = 0.1;
                    return;
                }
                ezoom.setTransformOrigin();
			}
		}
    },
    reposition: function() {
		if (!ezoom.isShow) return;
		ezoom.poscalSizeAndPosition();
	},
	initEvent: function() {

		$(window).on('resize', ezoom.reposition);

		ezoom.zoomModal.on('gesturestart', function (e) {
			e = e || window.event;
			ezoom.gesturing = true;
			ezoom.translateScale = 1;
			if (typeof ezoom.options.onMoveStarted && typeof ezoom.options.onMoveStarted == "function") {
				ezoom.options.onMoveStarted(ezoom);
			}

		});

		$(document).on('gestureend', function (e) {
			e = e || window.event;
			ezoom.gesturing = false;
			ezoom.translateScale = e.scale;
			if (ezoom.options.onMovedCompleted && typeof ezoom.options.onMovedCompleted == "function") {
				ezoom.options.onMovedCompleted(ezoom);
			}
		});

		ezoom.zoomModal.on('gesturechange', function (e) {
			e = e || window.event;
			e.stopPropagation();
			if (ezoom.gesturing) {
				ezoom.translateScale = e.scale;
				ezoom.setTransformOrigin();
				ezoom._preventDefault();
				if (typeof ezoom.options.onMoving && typeof ezoom.options.onMoving == "function") {
					ezoom.options.onMoving(ezoom);
				}
			}
		});

		$(document).on('scroll', ezoom.reposition);
		
		ezoom.zoomModal.on('mousedown touchstart', function (e) {
			e = e || window.event;
			ezoom.grabbing = true;
			if (!e) {
				e = window.e;
				ezoom.zoomModal.onselectstart = function () {
					return false;
				}
			}
			startX = e.type == "mousedown" ? e.clientX : e.originalEvent.touches[0].pageX;
			startY = e.type == "mousedown" ? e.clientY : e.originalEvent.touches[0].pageY;
			translateX_ = ezoom.translateX;
			translateY_ = ezoom.translateY;
			if (typeof ezoom.options.onMoveStarted && typeof ezoom.options.onMoveStarted == "function") {
				ezoom.options.onMoveStarted(ezoom);
			}

        });

		$(document).on('mouseup touchend', function () {
			ezoom.grabbing = false;
			translateX_ = ezoom.translateX;
			translateY_ = ezoom.translateY;
			if (ezoom.options.onMovedCompleted && typeof ezoom.options.onMovedCompleted == "function") {
				ezoom.options.onMovedCompleted(ezoom);
			}
        });
        
		$(document).on('mousemove', function (e) {
			e = e || window.event;
			if (ezoom.grabbing) {
				var nowX = e.clientX; 
				var nowY = e.clientY; 
				var disX = nowX - startX;
				var disY = nowY - startY;

				ezoom.translateX = translateX_ + disX;
				ezoom.translateY = translateY_ + disY;
				ezoom.setTransformOrigin();
				ezoom._preventDefault();
				if (typeof ezoom.options.onMoving && typeof ezoom.options.onMoving == "function") {
					ezoom.options.onMoving(ezoom);
				}
				return false;
			}
		});
		ezoom.zoomModal.on('touchmove', function (e) {
			e = e || window.event;
			e.stopPropagation();
			if (ezoom.grabbing) {
				var nowX = e.originalEvent.touches[0].pageX; 
				var nowY = e.originalEvent.touches[0].pageY; 
				var disX = nowX - startX;
				var disY = nowY - startY;

				ezoom.translateX = translateX_ + disX;
				ezoom.translateY = translateY_ + disY;
				ezoom.setTransformOrigin();
				ezoom._preventDefault();
				if (typeof ezoom.options.onMoving && typeof ezoom.options.onMoving == "function") {
					ezoom.options.onMoving(ezoom);
				}
			}
		});

		//$(document).on('keydown', function(e) {
		//	e = e || window.event;
		//	ezoom._preventDefault(e);
		//	if (e.keyCode && ezoom.isShow) {
		//		// console.log(e.keyCode);

		//		if (!ezoom.options.hideControlBtn) { 
		//			// Arrow direction key and the A D W S key
		//			if(e.keyCode == 37 || e.keyCode == 65 ) { // left A
		//				ezoom.setTransformOrigin(1, 270, 0, 0);
		//			}
		//			if(e.keyCode == 39 || e.keyCode == 68 ) { // right D
		//				ezoom.setTransformOrigin(1, 90, 0, 0);
		//			}
		//			if(e.keyCode == 38 || e.keyCode == 87 ) { // top W
		//				ezoom.setTransformOrigin(1, 0, 0, 0);
		//			}
		//			if(e.keyCode == 40 || e.keyCode == 83 ) { // down S
		//				ezoom.setTransformOrigin(1, 180, 0, 0);
		//			}
		//		}

		//		// ESC key
		//		if (e.keyCode == 27) {
		//			if (ezoom.isShow) {
		//				if (ezoom.scale != 1 || ezoom.rotate != 0 || ezoom.translateX != 0 || ezoom.translateY != 0) {
		//					ezoom.reset();
		//				}
		//				else {
		//					ezoom.remove();
		//				}
		//			}
		//		}
		//		// R key
		//		if (e.keyCode == 82) {
		//			ezoom.doRotate("right");
		//		}
		//	}
		//});

	},
	// Prevent the default scroll event of the up and down keys
    _preventDefault: function(e) {
		if (e && e.preventDefault) {
			e.preventDefault();
		}
		else {
			window.event.returnValue = false;
		}
		return false;
	}
}
