$(function () {
    $('[data-toggle="tooltip"]').tooltip()
})



   
$(document).ready(function () {
    $('#mobile-navbar-menu-btn').click(function () {
        if ($('.mobile-navbar-menu').is(':hidden')) {
            $('.mobile-navbar-menu').show();
            document.body.style.position = 'fixed';
            document.body.style.top = `-${window.scrollY}px`;
        } else {
            $('.mobile-navbar-menu').hide();
            const scrollY = document.body.style.top;
            document.body.style.position = '';
            document.body.style.top = '';
            window.scrollTo(0, parseInt(scrollY || '0') * -1);
        }
    });
});
