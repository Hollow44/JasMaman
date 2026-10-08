(function($){
	var TableColResizer = function(element, options) {
		var $this = $(element);
		this.$element = $this;
		this.options = $.extend({}, TableColResizer.DEFAULTS, options);
		
		$this.find("thead>tr:last>th").each(function(index){
			var $td = $(this);
						
			var $divColWrapper = $("<div style='position:relative' class='iac-col-resize-pin-wrapper'>");
			$divColWrapper.append($td.children());
			$divColWrapper.append("<span class='iac-col-resize-pin'></span>");
			
			$td.append($divColWrapper);
		});
	};

	TableColResizer.DEFAULTS = {
		beforeColResize: function() {},
		afterColResize: function() {},
	};
	
	TableColResizer.prototype._beforeColResize = function(resizeData){
		if(this.options.beforeColResize){
			this.options.beforeColResize(resizeData);
		}
	};
	TableColResizer.prototype._afterColResize = function(resizeData){
		if(this.options.afterColResize){
			this.options.afterColResize(resizeData);
		}
	};
    TableColResizer.prototype._afterColResizeFinish = function() {
        if (this.options.afterColResizeFinish) {
            this.options.afterColResizeFinish();
        }
    };
	
	
	var Plugin = function(option){
		this.each(function(){
			var $this = $(this);
			var data = $this.data("iac.TableColResizer");
			var options = typeof option == "object" && option;
			if(!data) {
				$this.data("iac.TableColResizer", (data = new TableColResizer(this, options)));
			}
		});
	};
	
	$.fn.tableColResize = Plugin;
	var mouseDown=null;
	$(document).on('mousedown touchstart', ".iac-col-resize-pin", function(e) {
		var $this = $(this);
		e.preventDefault();
		
		var totalWidth = 0;
		var $table = $this.closest("table");
		$table.find("col").each(function(){
			totalWidth += parseInt($(this).prop("width"));
		});
		
		var colIndex  = $this.closest("th").index();
		var $col = $($table.find("col")[colIndex]);
		var colWidth = parseInt($col.prop("width"));
	    mouseDown = {
	        colIndex: colIndex,
	        $pressedPin: $this,
	        $col: $col,
	        initialCellWidth: colWidth,
	        initialTableWidth: $table.outerWidth(),
	        totalWidth: totalWidth,
	        mouseDownPositionX: e.pageX,
	        tableColResizerInstance: $table.data("iac.TableColResizer")
	    };
	});
	var minDist=50;
	
	
	
	$(document).on('mousemove touchmove', function(e) {
	  if(mouseDown) {
		e.preventDefault();
		var distX = e.pageX - mouseDown.mouseDownPositionX;
		var width = mouseDown.initialCellWidth + distX;
		if(distX < 0 && width < 50){
			width = 50;
		}
						
		var totalWidth = mouseDown.initialTableWidth - mouseDown.initialCellWidth + width + 2;
		
		var colResizer = mouseDown.tableColResizerInstance;
	      var colResizeData = {
	          $table: colResizer.$element,
	          colIndex: mouseDown.colIndex,
	          initialCellWidth: mouseDown.initialCellWidth,
	          initialTableWidth: mouseDown.initialTableWidth,
	          mouseDistX: distX,
	          tableTotalWidth: totalWidth,
	          colWidth: width
	      };
		
		mouseDown.tableColResizerInstance._beforeColResize(colResizeData);
		
		mouseDown.$col.prop("width", width);
		
		mouseDown.tableColResizerInstance._afterColResize(colResizeData);
	  }
	});
	
	$(document).on('mouseup touchend', function(event) {
	    if(mouseDown!=null) {
	        mouseDown.tableColResizerInstance._afterColResizeFinish();
	        mouseDown = null;
	    }
	});
})(jQuery);