function getActiveTokensCall() {
    blockScreen();
	getActiveTokens("getActiveTokensBack");
}

function getActiveTokensBack(result) {
    unblockScreen();
    if (result['code'] === "500") {
        alert(result['message']);
    } else if (result['code'] === "200") {
        var listOfTokens = result['responseObject'];        
        $('#storageSelect').empty();
        $('#storageSelect').append('<option value="PKCS12">PKCS12</option>');
        for (var i = 0; i < listOfTokens.length; i++) {
            $('#storageSelect').append('<option value="' + listOfTokens[i] + '">' + listOfTokens[i] + '</option>');
        }
    }
}

function getKeyInfoCall() {
    blockScreen();
    var selectedStorage = "PKCS12";
    getKeyInfo(selectedStorage, "getKeyInfoBack");
}



function signXmlCall() {
    var xmlToSign = $("#xmlToSign").val();
    var selectedStorage = "PKCS12";
	blockScreen();
    signXml(selectedStorage, "SIGNATURE", xmlToSign, "signXmlBack");
}

function signXmlBack(result) {
	unblockScreen();
    if (result['code'] === "500") {
        alert(result['message']);
    } else if (result['code'] === "200") {
        var res = result['responseObject'];
        $("#signedXml").val(res);
    }
}

function createCMSSignatureFromFileCall() {
    var selectedStorage = "PKCS12";
    var flag = $("#flag").is(':checked');
    var filePath = $("#filePath").val();
    if (filePath !== null && filePath !== "") {
		blockScreen();
        createCMSSignatureFromFile(selectedStorage, "SIGNATURE", filePath, flag, "createCMSSignatureFromFileBack");
    } else {
        alert("Не выбран файл для подписи!");
    }
}

function createCMSSignatureFromFileBack(result) {
	unblockScreen();
    if (result['code'] === "500") {
        alert(result['message']);
    } else if (result['code'] === "200") {
        var res = result['responseObject'];
        $("#createdCMS").val(res);
    }
}

function createCMSSignatureFromBase64Call() {
    var selectedStorage = "PKCS12";
    var flag = $("#flagForBase64").is(':checked');
    var base64ToSign = $("#base64ToSign").val();
    if (base64ToSign !== null && base64ToSign !== "") {
		$.blockUI();
        createCMSSignatureFromBase64(selectedStorage, "SIGNATURE", base64ToSign, flag, "createCMSSignatureFromBase64Back");
    } else {
        alert("Нет данных для подписи!");
    }
}

function createCMSSignatureFromBase64Back(result) {
	$.unblockUI();
    if (result['code'] === "500") {
        alert(result['message']);
    } else if (result['code'] === "200") {
        var res = result['responseObject'];
        $("#createdCMSforBase64").val(res);
    }
}

function showFileChooserCall() {
    blockScreen();
    showFileChooser("ALL", "", "showFileChooserBack");
}

function showFileChooserBack(result) {
    unblockScreen();
    if (result['code'] === "500") {
        alert(result['message']);
    } else if (result['code'] === "200") {
        var res = result['responseObject'];
        $("#filePath").val(res);
    }
}

function changeLocaleCall() {
    var selectedLocale = $('#localeSelect').val();
    changeLocale(selectedLocale);
}

/*function setSelectedCert(certInfo) {
    $('#no-selected-cert').css('display', 'none');
    $('#selected-cert-description').css('display', 'block');
    $('#send-cert-data').css('display', 'block');

    fillCertDescription(certInfo);
    
    if (!$("#Email").val())
        $("#Email").val($("#client-cert-EMail").val());
    
}

function fillCertDescription(certInfo) {
    if (certInfo == null)
        return;

    $("#client-cert-owner").val(certInfo.Owner);
    $("#client-cert-issuer").val(certInfo.Issuer);
    $("#client-cert-valid-date").val("с " + certInfo.ValidFrom + " по " + certInfo.ValidTo);
    $("#client-cert-alg").val(certInfo.Alg);
    $("#client-cert-IIN").val(certInfo.IIN);
    $("#client-cert-BIN").val(certInfo.BIN);
    $("#client-cert-EMail").val(certInfo.Email);
    $("#client-cert-valid-from").val(certInfo.ValidFrom);
    $("#client-cert-valid-to").val(certInfo.ValidTo);
    refreshCertInfoTable();
}*/