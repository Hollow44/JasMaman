$(document).ready(function() {
    
    $(".phone-number-input").mask("+7 (999) 999 99 99");
    $(".phone-number-input").prop("placeholder", "+7 (___) ___ __ __" );
    $(".phone-number-input").on("blur", function() {
        var last = $(this).val().substr( $(this).val().indexOf("-") + 1 );

        if( last.length == 3 ) {
            var move = $(this).val().substr( $(this).val().indexOf("-") - 1, 1 );
            var lastfour = move + last;
            var first = $(this).val().substr( 0, 9 );

            $(this).val( first + '-' + lastfour );
        }
    });
});