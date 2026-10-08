/*
Copyright (c) 2003-2012, CKSource - Frederico Knabben. All rights reserved.
For licensing, see LICENSE.html or http://ckeditor.com/license
*/

CKEDITOR.editorConfig = function (config) {
    config.toolbar_myBasic = [['Bold', 'Italic', 'Underline', 'Strike', '-', 'Subscript', 'Superscript'],
        ['JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock'],
        ['Link', 'Unlink']];
    config.toolbar = 'myBasic';
    config.removePlugins = 'elementspath';
    config.resize_enabled = true;
    config.height = 200;
    config.width = 800;
    
    // Define changes to default configuration here. For example:
    config.language = 'ru';
    // config.uiColor = '#AADC6E';
};
