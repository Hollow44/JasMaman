(function ($) {
	$.widget("nt.dialog", {
		_create: function () {
			var self = this;
			var options = $.extend({
				title: "Диалог",
				buttons: [
					{
						text: "Закрыть",
						click: function () {
							self.close();
						}
					}
				],
				close: function () { },
				destroy: function () { },
				open: function () { }
			}, this.options);

			this.options = options;


			var $this = $(self.element);

			this.$_initialParent = $this.parent();

			var modalHtml =
				'<div class="modal fade" tabindex="-1" role="dialog" aria-labelledby="dialogLabel">'
				+ '  <div class="modal-dialog" role="document">'
				+ '    <div class="modal-content">'
				+ '      <div class="modal-header">'
				+ '        <h4 class="modal-title" id="dialogLabel"></h4>'
				+ '        <button type="button" class="close" data-dismiss="modal" aria-label="Закрыть"><span aria-hidden="true">&times;</span></button>'
				+ '      </div>'
				+ '      <div class="modal-body">'
				+ '      </div>'
				+ '      <div class="modal-footer">'
				/*+ '        <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>'
				+ '        <button type="button" class="btn btn-primary">Save changes</button>'*/
				+ '      </div>'
				+ '    </div>'
				+ '  </div>'
				+ '</div>';

			var $modal = $(modalHtml.replace());
			$modal.find(".modal-title").text(options.title);
			var $body = $modal.find(".modal-body");
			var $footer = $modal.find(".modal-footer");


			//button : {text:'', click:function(){}};
			function addBtn(button) {
				var $btn = $('<button type="button"></button>');
				$btn.addClass(button.class || "btn btn-default");
				$btn.text(button.text);
				$btn.data("button", button);
				$footer.append($btn);
			}

			if ($.isArray(options.buttons)) {
				for (var i = 0; i < options.buttons.length; i++) {
					addBtn(options.buttons[i]);
				}
			} else {
				for (var name in options.buttons) {
					if (options.buttons.hasOwnProperty(name)) {
						addBtn({ text: name, click: options.buttons[name] });
					}
				}
			}

			$footer.on("click", "button", function () {
				var $that = $(this);
				if ($that.data("button").click) {
					$that.data("button").click.call(self);
				}
			});

			$body.append($this);

			this.$_modal = $modal;
			if (this.$_initialParent.length > 0) {
				$(document.body).append($modal);
			}

			$modal.modal();

			$modal.on("hidden.bs.modal", function (e) {
				self._onClose();
			});

			if (options.open) {
				options.open.call(this);
			}
		},
		close: function () {
			this.$_modal.modal("hide");
		},
		_onClose: function () {
			this.options.close.call(this);
		},
		destroy: function () {
			$.Widget.prototype.destroy.call(this);
			if (this.$_initialParent.length > 0) {
				this.$_initialParent.append($(this.element));
			} else {
				$(this.element).remove();
			}
			this.$_modal.modal("destroy");
			this.$_modal.remove();

		},
	});
})(jQuery);