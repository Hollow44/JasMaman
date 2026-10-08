(function ($) {
    var scrollBarWidth;
    function getScrollBarWidth() {
        if (scrollBarWidth)
            return scrollBarWidth;

        var inner = document.createElement('p');
        inner.style.width = "100%";
        inner.style.height = "200px";

        var outer = document.createElement('div');
        outer.style.position = "absolute";
        outer.style.top = "0px";
        outer.style.left = "0px";
        outer.style.visibility = "hidden";
        outer.style.width = "200px";
        outer.style.height = "150px";
        outer.style.overflow = "hidden";
        outer.appendChild(inner);

        document.body.appendChild(outer);
        var w1 = inner.offsetWidth;
        outer.style.overflow = 'scroll';
        var w2 = inner.offsetWidth;
        if (w1 == w2) w2 = outer.clientWidth;

        document.body.removeChild(outer);

        scrollBarWidth = (w1 - w2);
        return scrollBarWidth;
    };
    
    var $window = $(window);

    var allFixedHeadersInstances = [];

    var FixedHeader = function (element, options) {
        var $this = $(element);
        this.$element = $this;
        this.options = $.extend({ colOrderSizeChanged: function () { } }, options);

        var $markup = $(
			"<div class='fixed-header-table-wrapper'> \
				<div class='header-height-emulation'></div> \
				\
				<div class='fixed-header-container'> \
					<div class = 'fixed-header-inner-positioning'></div> \
				</div> \
				\
				<div class='horizontal-scroll'> \
					<div class='external-scroll_x'> \
						<div class='scroll-element_outer'> \
							<div class='scroll-element_size'></div> \
							<div class='scroll-element_track'></div> \
							<div class='scroll-bar'></div> \
						</div> \
					</div> \
				</div> \
				\
				<div class='fixed-header-content-container'></div> \
			</div>"
		);

        $this.after($markup);

        this.$header = $markup.find(".fixed-header-container");
        this.$headerPos = this.$header.find(".fixed-header-inner-positioning");
        this.$wrapper = this.$header.closest(".fixed-header-table-wrapper");
        this.$headerHeightEmulation = $markup.find(".header-height-emulation");
        this.$content = $markup.find(".fixed-header-content-container");
        this.$scroll = $markup.find(".horizontal-scroll");

        this.$scrollVirtual = $markup.find('.external-scroll_x');
        this.scrollBarWidth = getScrollBarWidth();
        this.initialContentLeft = this.$content.offset().left;

        this.$tbHeader = $this.clone();
        this.$tbHeader.addClass("fixed-header");
        this.$tbHeader.find("tbody").remove();
        this.$headerPos.append(this.$tbHeader);

        this.$content.append($this);
        $this.find("thead").remove();
        this.$tbContent = $this;


        this._enableCustomHorizontalScrollBar();
        this._enableTableColResizer();
        this._enableTabColDragAndDrop();
        this.tableHeight = this.$content.height();
        this.tableOffset = this.$content.offset().top;


        allFixedHeadersInstances.push(this);
    };
    FixedHeader.prototype._fireColOrderChanged = function () {
        this._fireColOrderSizeChanged();
    };
    FixedHeader.prototype._fireColSizeChanged = function () {
        this._fireColOrderSizeChanged();
    };
    FixedHeader.prototype._fireColOrderSizeChanged = function () {
        this.options.colOrderSizeChanged();
    };
    FixedHeader.prototype._enableCustomHorizontalScrollBar = function () {
        var that = this;
        this.$wrapper.scrollbar({
            "autoScrollSize": true,
            "scrollx": this.$scrollVirtual
        });

        this.$wrapper.on("scroll", function () {
            that.$header.css("position", "fixed");
            that.$header.scrollLeft(that.$wrapper.scrollLeft());

            that.refresh();
        });
    };

    FixedHeader.prototype._enableTableColResizer = function () {
        var that = this;
        var setTablesWrappersTotalWidth = function (totalWidth) {
            that.$headerPos.width(totalWidth);
            that.$content.width(totalWidth);
        };

        var syncTableCols = function () {
            var $headerCols = that.$tbHeader.find("col");
            var $contentCols = that.$tbContent.find("col");

            for (var colIndex = 0; colIndex < $headerCols.length; colIndex++) {
                $($contentCols[colIndex]).prop("width", $($headerCols[colIndex]).prop("width"));
            }
        };

        that.$tbHeader.tableColResize({
            beforeColResize: function (e) {
                if (e.mouseDistX > 0) {
                    setTablesWrappersTotalWidth(e.tableTotalWidth);
                }
            },
            afterColResize: function (e) {
                if (e.mouseDistX < 0) {
                    setTablesWrappersTotalWidth(e.tableTotalWidth);
                }
                syncTableCols();

            },
            afterColResizeFinish: function () {
                that._fireColSizeChanged();
            }
        });
    };

    FixedHeader.prototype._enableTabColDragAndDrop = function () {
        var that = this;
        this.$tbHeader.find("th").draggable({
            cursor: "move",
            appendTo: 'body',
            cursorAt: { top: 0, left: 0 },
            cancel: ".iac-col-resize-pin",
            axis: "x",
            start: function (event, ui) {
                $(this).draggable('instance').offset.click = {
                    left: Math.floor(ui.helper.width() / 2),
                    top: Math.floor(ui.helper.height() / 2)
                };
            },
            helper: function (event, ui) {
                var text = $(event.target).text();
                var $helper = $("<div style='z-index:1005'>");
                $helper.text(text);
                return $helper;
            }
        }
	    );
        this.$tbHeader.find("th").droppable({
            hoverClass: "ui-state-hover",
            drop: function (event, ui) {
                var $targetCell = $(this);

                var targetCellWidth = $targetCell.width();

                var $draggingEl = ui.helper;
                var draggingElWidth = $draggingEl.width();

                var targetCellOffsetLeft = $targetCell.offset().left;

                var dropLeftPosition = (ui.offset.left + draggingElWidth / 2) - (targetCellOffsetLeft + targetCellWidth / 2);

                var targetCellIndex = $targetCell.index();
                var sourceCellIndex = ui.draggable.index();
                that._moveCol(sourceCellIndex, targetCellIndex, dropLeftPosition > 0);
                that._fireColOrderChanged();
            }
        });
    };

    FixedHeader.prototype._moveCol = function (colIndex, targetColIndex, placeToRightSide) {
        this._moveTableCol(this.$tbHeader, "th", colIndex, targetColIndex, placeToRightSide);
        this._moveTableCol(this.$tbContent, "td", colIndex, targetColIndex, placeToRightSide);
    };

    FixedHeader.prototype._moveTableCol = function ($table, cellTagName, colIndex, targetColIndex, placeToRightSide) {
        //move col
        var $sourceCol = $table.find("col:eq(" + colIndex + ")");
        var $targetCol = $table.find("col:eq(" + targetColIndex + ")");
        if (placeToRightSide == true) {
            $targetCol.after($sourceCol);
        } else {
            $targetCol.before($sourceCol);
        }

        $table.find("tr").each(function () {
            var $tr = $(this);
            var $sourceCell = $tr.find(cellTagName + ":eq(" + colIndex + ")");
            var $targetCell = $tr.find(cellTagName + ":eq(" + targetColIndex + ")");
            if (placeToRightSide == true) {
                $targetCell.after($sourceCell);
            } else {
                $targetCell.before($sourceCell);
            }
        });
    };


    FixedHeader.prototype.isContentOverflowed = function () {
        var wrapperEl = this.$wrapper[0];
        return (wrapperEl.offsetWidth < wrapperEl.scrollWidth);
    };

    FixedHeader.prototype.fixHeaderPos = function () {
        this.$header.css("position", "fixed");
        this.$scroll.css("position", "fixed");
        this.$scroll.css("top", this.$header.outerHeight());
        this.$scroll.css("left", this.$wrapper.offset().left);
        this.$header.css("left", this.$wrapper.offset().left);
        var scrollLeft = this.$wrapper.scrollLeft();
        if (scrollLeft == 0) {
            this.$header.scrollLeft(0);
        } else {
            this.$header.scrollLeft(scrollLeft);
        }
        this.$scroll.width(this.$wrapper.innerWidth() - 2);
        this.$header.width(this.$wrapper.innerWidth() - 2);
        this.$scroll.css("max-width", this.$wrapper.innerWidth() - 2);
        this.$header.css("max-width", this.$wrapper.innerWidth() - 2);
        this.$scrollVirtual.css("max-width", this.$wrapper.innerWidth() - 2);

        if (this.isContentOverflowed()) {
            this.$scroll.show();
        } else {
            this.$scroll.hide();
        }

        this.$headerHeightEmulation.height(this.$header.height() + this.$scroll.height());
        this.$headerHeightEmulation.show();
    };
    FixedHeader.prototype.unfixHeaderPos = function () {
        this.$header.css("position", "relative");
        this.$scroll.css("position", "relative");
        this.$scroll.css("top", "");
        this.$header.css("top", "");
        this.$scroll.width(this.$wrapper.innerWidth() - 2);
        this.$header.width(this.$wrapper.innerWidth() - 2);
        this.$scroll.css("max-width", this.$wrapper.innerWidth() - 2);
        this.$header.css("max-width", this.$wrapper.innerWidth() - 2);
        this.$scrollVirtual.css("max-width", this.$wrapper.innerWidth() - 2);

        var scrollLeft = this.$wrapper.scrollLeft();
        //var contentWidth = this.$content.width();
        // if(this.$scroll.outerWidth()  >= contentWidth){

        // }else if(this.$scroll.outerWidth() + scrollLeft > contentWidth){
        // scrollLeft = contentWidth - this.$scroll.outerWidth();
        // }

        this.$scroll.css("left", scrollLeft);
        this.$header.css("left", scrollLeft);
        this.$header.scrollLeft(scrollLeft);
        this.$headerPos.css("left", "");
        if (this.isContentOverflowed()) {
            this.$scroll.show();
        } else {
            this.$scroll.hide();
        }

        this.$headerHeightEmulation.hide();
    };
    FixedHeader.prototype.refresh = function () {
        var offset = $window.scrollTop() + this.$header.height();

        if (offset == this.tableOffset) {
            this.fixHeaderPos();
        } else if (offset > this.tableOffset) {
            if ((this.tableOffset + this.tableHeight) - offset > 0) {
                this.fixHeaderPos();
            } else {
                this.unfixHeaderPos();
            }
        }
        else if (offset < this.tableOffset) {
            this.unfixHeaderPos();
        }
    };
    var refreshAllFixedHeaders = function () {
        for (var i = 0; i < allFixedHeadersInstances.length; i++) {
            allFixedHeadersInstances[i].refresh();
        }
    };
    var Plugin = function(option) {
        this.each(function() {
            var $this = $(this);
            var data = $this.data("iac.FixedHeader");
            var options = typeof option == "object" && option;
            if (!data) {
                $this.data("iac.FixedHeader", (data = new FixedHeader(this, options)));
            }
        });
        refreshAllFixedHeaders();
    };
    $.fn.fixedHeader = Plugin;


    $window.on("scroll", refreshAllFixedHeaders);
    $window.on("resize", refreshAllFixedHeaders);


})(jQuery);