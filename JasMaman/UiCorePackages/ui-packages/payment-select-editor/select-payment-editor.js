$(document).ready(function() {
    $(".payments-select-editor").each(function(){
        var $this = $(this);
        var editorName = $this.data("editorName");
        var isReadonly = $this.data("isReadonly");
        var title = $this.data("title");
        var actions = $this.data("actions");

        if(title){
            $this.append($("<span class='payments-select-editor-title'>").text(title));
        }


        var $btnGroup = $("<div class='btn-toolbar'>");

        if (isReadonly !== true || actions.length > 0) {
            $this.append($btnGroup);
        }

        if(isReadonly != true){
            var $btn = $("<button class='btn btn-primary select-payments-btn' type='button'>");
            $btn.text("Выбрать платежи");
            $btnGroup.append($btn);
            $btn.click(function() {
                var payments = $this.data("selectedPayments");
                var availablePayments = $this.data("availablePayments");
                var $ul = $("<ul class='list-group select-payments-panel'>");
                if(availablePayments.length == 0){
                    $ul.append("<li class='list-group-item no-payment-item'>{0}</li>".format(T("Нет доступных платежей (если только что оплатили онлайн, а платеж не появился, обновите страницу через некоторое время)")));
                } else {
                    for(var i = 0; i < availablePayments.length; i++) {
                        var curPayment = availablePayments[i];
                        $li = $("<li class='list-group-item payment-item'><div><span class='payment-checkbox fa fa-square-o'></span> <span class='payment-amount'></span>тг. - <span class='payment-date'></span>, №<span class='payment-num'></span></div><div class='payment-purpose'></div></li>");
                        $li.find(".payment-amount").text(curPayment.flPaymentAmount);
                        $li.find(".payment-date").text(curPayment.flPaymentDateStr);
                        $li.find(".payment-num").text(curPayment.flPaymentNum);
                        $li.find(".payment-purpose").text(curPayment.flPurpose);

                        
                        selected = payments.find(function(t){ return t.flPaymentId == curPayment.flPaymentId });
                        if(selected) {
                            $li.addClass("selected");
                            $li.find(".payment-checkbox").addClass("fa-check-square-o").removeClass("fa-square-o");
                        }
                        $li.data("payment", curPayment);

                        $ul.append($li);
                    }
                }
                
                $ul.on("click", "li.payment-item", function(){
                    $(this).toggleClass("selected");
                    $(this).find(".payment-checkbox").toggleClass("fa-check-square-o fa-square-o");
                });

                var $div = $("<div>");
                $div.append($ul);
                $div.dialog({
                    buttons: [
                        {text:T("Ок"), click:function() {
                            var selectedPayments = [];
                            $ul.find(".selected").each(function(){
                                selectedPayments.push($(this).data("payment"));
                            });
                            $this.data("selectedPayments", selectedPayments);
                            refreshSelectedPaymentsList();
                            $div.dialog("close");
                        }},
                        {text:T("Отмена"), click:function(){
                            $div.dialog("close");
                        }},
                    ]
                });
            });
        }

        for (var i = 0; i < actions.length; i++) {
            var action = actions[i];
            var $link = $("<a>");
            $link.addClass(action.CssClass);
            $link.text(action.Text);
            $link.attr({ href: action.Url });

            $btnGroup.append($link);
        }



        var $div = $("<div>");
        $this.append($div);
        var $ul = $("<ul class='list-group'>");
        $div.append($ul);

        function refreshSelectedPaymentsList() {
            var payments = $this.data("selectedPayments");
            $ul.empty();
            if(payments.length == 0) {
                $ul.append("<li class='list-group-item'><span class='no-selected-payments'>{0}</span></li>".format(T("Нет выбранных платежей")));
                return;
            }
            
            for(var i=0;i<payments.length;i++){
                var curPayment = payments[i];
                $li = $("<li class='list-group-item'><div><span class='payment-amount'></span>тг. - <span class='payment-date'></span> №<span class='payment-num'></span></div><div class='payment-purpose'></div></li>");
                $li.find(".payment-amount").text(curPayment.flPaymentAmount);
                $li.find(".payment-date").text(curPayment.flPaymentDateStr);
                $li.find(".payment-num").text(curPayment.flPaymentNum);
                $li.find(".payment-purpose").text(curPayment.flPurpose);
                $ul.append($li);
            }
        }

        refreshSelectedPaymentsList();

        $this.closest("form").submit(function(){
            var selectedPayments = $this.data("selectedPayments");
            var $input = $("<input type='hidden' name='{0}'>".format(editorName));
            $input.val(JSON.stringify(selectedPayments));
            $this.append($input);
        });
    });
});