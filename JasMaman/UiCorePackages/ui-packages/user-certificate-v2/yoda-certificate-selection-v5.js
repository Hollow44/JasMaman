    function T(str) {
        return str;
    }

    function getLinkToNcaHtml() {
        var html =
            "<div class='widget-extra-info'>"
            + "<a href='https://pki.gov.kz/ncalayer/' target='_blank'>" + T("Функция подписи использует программу «NCALayer» НУЦ РК") + "</a>"
            + "</div>";
        return (html);
    }

    function writeLinkToNca() {
        var html = getLinkToNcaHtml();
        document.writeln(html);
    }


	function getKeyInfoCall() {
		blockScreen();
		//var selectedStorage = $('#storageSelect').val();
		getKeyInfo("PKCS12", "getKeyInfoBack");
    }



$(document).ready(function () {
    var $cert = $(".sign-box");
    var $signboxHolder = $("<div>");
    $cert.append($signboxHolder);

    var certSignConfig = $cert.data("config");
    var inputName = $cert.data("name");
    //////////////////////////
    // certSignConfig:
    //    CertAlgType: rsa | gost
    //    DataToSign - что подписывается
    //    SignData:
    //       CertInfo:
    //          Owner
    //          Issuer
    //          ValidFrom
    //          ValidTo
    //          Alg
    //          IIN
    //          BIN
    //          Email
    //       CertInBase64: - публичный сертификат пользователя, которым подписывались данные
    //       SignedData: - подписанные данные
    //////////////////////////
    var $input = $("<input type='hidden' name='" + inputName + "'>");
    $cert.append($input);
    var $certInfoPanel = $("<div >");
    $cert.append($certInfoPanel);

    function printCertInfo(signData) {
        $certInfoPanel.empty();

        if (!signData.CertInfo.IIN) {
            $certInfoPanel.append("<div class='cert-alert-wrong'>Неверный тип сертификата</div>");
            return;
        }
        
        $certInfoPanel.append(
            $("<input type='hidden' name='" + inputName + "'>").val(JSON.stringify(signData))
        );

        var $divCertInfo = $("<div>");
        $certInfoPanel.append($divCertInfo);

        var $tableCertInfo = $("<table class='cert-info-table'>");
        $divCertInfo.append($tableCertInfo);

        function addVal(title, value, valueCssClass) {
            var $tr = $("<tr>");
            var $title = $("<td class='cert-info-attr-title'>").text(title);
            var $value = $("<td class='cert-info-attr-value'>").text(value);
            if (valueCssClass) {
                $value.addClass(valueCssClass);
            }
            $tr.append($title);
            $tr.append($value);
            $tableCertInfo.append($tr);
        }

        var certValidClass = "";
        var message = "";

        var certInfo = signData.CertInfo;

        if (certInfo.ValidTo != "") {
            var validTo = certInfo.ValidTo.split(".");
            var date = new Date(validTo[2], validTo[1] - 1, validTo[0]);
            var currentDate = new Date();
            var currentDateStr = jQuery.datepicker.formatDate('dd.mm.yy', currentDate);
            var daysLeft = parseInt((date - currentDate) / 1000 / 3600 / 24);

            if (daysLeft < 0) {
                message = " - " + T("истек срок действия сертификата, текущая дата компьютера:") + " " + currentDateStr;
                certValidClass = "td-cert-expired";
            } else if (daysLeft <= 10) {
                message = " - " + T("срок действия сертификата истекает, текущая дата компьютера:") + " " + currentDateStr;
                certValidClass = "td-cert-expiring";
            }
        }

        addVal(T('Кому выдан'), certInfo.Owner);
        addVal(T('Кем выдан'), certInfo.Issuer);
        addVal(T('Действителен'), "с " + certInfo.ValidFrom + " по " + certInfo.ValidTo, certValidClass);
        addVal(T('Алгоритм ключа'), certInfo.Alg);
        addVal(T('ИИН'), certInfo.IIN);
        addVal(T('БИН'), certInfo.BIN);
        addVal(T('E-Mail'), certInfo.Email);
    }
    function printNoCertInfo() {
        $certInfoPanel.empty();
        $certInfoPanel.append("<div class='cert-alert-none'>Сертификат не выбран</div>");
    }
    
    if (certSignConfig.SignData != null) {
        printCertInfo(certSignConfig.SignData);
    }
    else {
        printNoCertInfo();
    }

    function onCertSelected(signedData, certInfo, certInBase64) {
        printCertInfo({
            CertInfo: certInfo,
            CertInBase64: certInBase64,
            SignedData: signedData
        });
    }

    //if (certSignConfig.CertAlgType === "rsa") {
    //    $signboxHolder.certificateSelector({ dataToSign: certSignConfig.DataToSign, certSelectedFunc: onCertSelected });
    //}
    //else {
        $cert.prepend(getLinkToNcaHtml());
        $signboxHolder.certificateSelectorNca({ dataToSign: certSignConfig.DataToSign, certSelectedFunc: onCertSelected });
    //}
});

    
    


function getKeyInfoBack(result) {
    unblockScreen();
    if (result['code'] === "500") {
        alert(result['message']);
    } else if (result['code'] === "200") {
        var res = result['responseObject'];

        var alias = res['alias'];

        var keyId = res['keyId'];

        var algorithm = res['algorithm'];

        var subjectCn = res['subjectCn'];

        var subjectDn = res['subjectDn'];

        var issuerCn = res['issuerCn'];

        var issuerDn = res['issuerDn'];

        var serialNumber = res['serialNumber'];

        var dateString = res['certNotAfter'];
        var dateto = new Date(Number(dateString));

        dateString = res['certNotBefore'];
        var datefrom = new Date(Number(dateString));

        var authorityKeyIdentifier = res['authorityKeyIdentifier'];

        var pem = res['pem'];

        var subject = parseDn(subjectDn);

        var certInfo = {
            Owner: (getStr(subject.CN) + " " + getStr(subject.G)).trim(),
            Issuer: issuerCn,
            ValidFrom: jQuery.datepicker.formatDate('dd.mm.yy', datefrom),
            ValidTo: jQuery.datepicker.formatDate('dd.mm.yy', dateto),
            Alg: algorithm,
            IIN: getStr(subject.SERIALNUMBER).substring(3),
            BIN: getStr(subject.OU).substring(3),
            Email: getStr(subject.E)
        };
        setSelectedCert(certInfo);
    }
}

var getStr = function(obj) {
    if (!obj) {
        return ("");
    }
    return (obj + "");
};

var parseDn = function(dn) {
    var parts = dn.split(",");
    var ret = { };
    var lastKey = null;
    for (var i = 0; i < parts.length; i++) {
        var kv = parts[i].split("=");
        if(kv.length == 1) {
            if(lastKey) {
                ret[lastKey] += kv[0];
            }
            continue;
        }
        var key = kv[0].trim();
        var value = kv[1].trim();
        ret[key] = value;
        lastKey = key;
    }

    return (ret);
};