    function insertIacApplet(certAlgType) {
        document.writeln(getAppletHtml("IacApplet", "appletInited", certAlgType));
    }

    function getJarFilePath(fileName) {
        return iacAppletRootPath + fileName;
    }

    function getAppletHtml(applentName, appletInitCallback, certAlgType) {
        var sourceJarFiles;
        if (certAlgType == "gost") {
            if (PluginDetect.isMinVersion('Java', '1.7.0.45') == 1) {
                sourceJarFiles = getJarFilePath(iacAppletGostJarFile) + "," + getJarFilePath("lib-v2/commons-logging-1.1.1.jar") + "," + getJarFilePath("lib-v2/xmlsec-1.4.4.jar") + "," + getJarFilePath("lib-v2/" + cryptoProviderJarFile);
            } else {
                sourceJarFiles = getJarFilePath(iacAppletGostJarTrusted) + "," + getJarFilePath("lib-v2-trusted/commons-logging-1.1.1.jar") + "," + getJarFilePath("lib-v2-trusted/xmlsec-1.4.4.jar") + "," + getJarFilePath("lib-v2-trusted/" + cryptoProviderJarFile);
            }
        } else {
            if (PluginDetect.isMinVersion('Java', '1.7.0.45') == 1) {
                sourceJarFiles = getJarFilePath(iacAppletRsaJarFile);
            } else {
                sourceJarFiles = getJarFilePath(iacAppletRsaJarTrusted);
            }
        }
        // https://javadl-esd-secure.oracle.com/update/baseline.version
        var retHtml = "";
//        retHtml += 
//            "<div style='padding-bottom:3px'>" + 
//            "<span style='color:red; font-weight:bold'>ВНИМАНИЕ!</span> " +
//            "Если приложение подписи не запускается, настройте компьютер согласно " +
//            "<a href='https://www.gosreestr.kz/ru/downloads/RunJavaApplet.pdf'>инструкции</a>." + 
//            "</div>";
        retHtml += '<applet width="226px" height="48px"';
        retHtml += ' code="iac.certificateSelector.CertSelector"';
        retHtml += ' archive="' + sourceJarFiles + '"';
        retHtml += ' type="application/x-java-applet"';
        retHtml += ' mayscript="true"';
        retHtml += ' id="' + applentName + '" name="' + applentName + '">';
        retHtml += '<param name="code" value="iac.certificateSelector.CertSelector">';
        retHtml += '<param name="archive" value="' + sourceJarFiles + '">';
        retHtml += '<param name="mayscript" value="true">';
        retHtml += '<param name="scriptable" value="true">';
        retHtml += '<param name="fileExtension" value="P12">';
        retHtml += '<param name="AppletLoadCompletedCallback" value="' + appletInitCallback + '">';
        retHtml += '</applet>';
        return retHtml;
    }

    function insertCertificateSelectorWidget(certAlgType) {
        document.writeln("<div class='certificate-selector-widget'></div>");
        $(document).ready(function () {
            var dataToSign = $('#server-provided-unsigned-data').val();
            
            var $container = $(".certificate-selector-widget");
            $container.certificateSelector({
                dataToSign: dataToSign,
                certSelectedFunc: setSelectedCert
            });
        });
    }

    function insertCertificateSelectorNcaWidget(certAlgType) {
        document.writeln("<div class='certificate-selector-widget'></div>");
        $(document).ready(function () {
            var dataToSign = $('#server-provided-unsigned-data').val();

            var $container = $(".certificate-selector-widget");
            $container.certificateSelectorNca({
                dataToSign: dataToSign,
                certSelectedFunc: setSelectedCert
            });
        });
    }
    
    function getLinkToJavaHtml() {
        var html =
            "<div class='applet-java-download-info'>"
            + T("Скачать Java:") + " "
            + "<a href='https://www.gosreestr.kz/ru/downloads/jre-i586.exe' target='_blank'>" + T("32-разрядная версия") + "</a>"
            + " / "
            + "<a href='https://www.gosreestr.kz/ru/downloads/jre-x64.exe' target='_blank'>" + T("64-разрядная версия") + "</a>"
            + "</div>";
        return (html);
    }

    function writeLinkToJava() {
        var html = getLinkToJavaHtml();
        document.writeln(html);
    }

    function getLinkToNcaHtml() {
        var html =
            "<div class='widget-extra-info'>"
            //+ "<a href='http://pki.gov.kz/index.php/ru/ncalayer' target='_blank'>" + T("Функция подписи использует программу «NCALayer» НУЦ РК") + "</a>"
            + "<a href='http://www.gosreestr.kz/ru/downloads/NCALayer.zip' target='_blank'>" + T("Функция подписи использует программу «NCALayer» НУЦ РК") + "</a>"
            + "</div>";
        return (html);
    }

    function writeLinkToNca() {
        var html = getLinkToNcaHtml();
        document.writeln(html);
    }

    $(document).ready(function () {
        if (!window.writeLinkToJava) {
            window.writeLinkToJava = writeLinkToJava;
        }
    });

    function tryInsertCertificateSelector(certAlgType) {
        if (certAlgType == "rsa") {
            insertCertificateSelectorWidget(certAlgType);
        } else {
            writeLinkToNca();
            insertCertificateSelectorNcaWidget(certAlgType);
            
            /*
            writeLinkToJava();
            if (!$.browser.msie && !navigator.javaEnabled()) {
                alert('Нет поддержки java');
            } else {
                insertIacApplet(certAlgType);
            }
            */
        }
    }

    function insertCertInfoArea() {
        document.writeln('<div id="selected-cert-info">');
        document.writeln('<div id="no-selected-cert">');
        document.writeln(T("Сертификат не выбран"));
        document.writeln('</div>');
        document.writeln('<div id="selected-cert-description" style="display:none">');
        document.writeln('<table class="cert-info">');
        document.writeln('<col/>');
        document.writeln('<col/>');
        document.writeln('</table>');
        document.writeln('</div>');
        document.writeln('</div>');
    }

    function appletInited() {
        setAppletParams();
    }
    
    function setAppletParams() {
        var data = $('#server-provided-unsigned-data').val();
        document.IacApplet.InitApplet(data, "setSelectedCert");
    }
    function setSelectedCert(signedData, certInfo, base64Cert) {
        $('#no-selected-cert').css('display', 'none');
        $('#selected-cert-description').css('display', 'block');
        $('#send-cert-data').css('display', 'block');

        fillCertDescription(certInfo);
        
        if (!$("#Email").val())
            $("#Email").val($("#client-cert-EMail").val());
        
        $('#client-cert-data').val(base64Cert);
        $('#client-signed-data').val(signedData);

        try {
            $("#client-cert-data").closest("form").find("#flPassword").focus();
        } catch (err) {
            console.log("Cannot focus password field: " + err);
        }
    }

    function appendCertData(t, title, value, valueTdClass) {
        if(valueTdClass == undefined || valueTdClass == null) {
            valueTdClass = "";
        }
        t.append('<tr><td>' + title + '</td><td class="' + valueTdClass + '">' + value + '</td></tr>');
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
    }
    
    function refreshCertInfoTable() {
        var t = $('#selected-cert-description table');
        t.html('');
        t.append('<col />');
        t.append('<col />');

        var certValidClass = "";
        var message = "";
        var validToString = $("#client-cert-valid-to").val();
        if (validToString != "") {
            var validTo = validToString.split(".");
            var date = new Date(validTo[2], validTo[1] - 1, validTo[0]);
            var currentDate = new Date();
            var currentDateStr = formatDate('dd.mm.yy', currentDate);
            var daysLeft = parseInt((date - currentDate) / 1000 / 3600 / 24);

            if (daysLeft < 0) {
                message = " - " + T("истек срок действия сертификата, текущая дата компьютера:") + " " + currentDateStr;
                certValidClass = "td-cert-expired";
            } else if (daysLeft <= 10) {
                message = " - " + T("срок действия сертификата истекает, текущая дата компьютера:") + " " + currentDateStr;
                certValidClass = "td-cert-expiring";
            }
        }

        appendCertData(t, T('Кому выдан'), $("#client-cert-owner").val(), "td-cert-owner");
        appendCertData(t, T('Кем выдан'), $("#client-cert-issuer").val());
        appendCertData(t, T('Действителен'), $("#client-cert-valid-date").val() + message, certValidClass);
        appendCertData(t, T('Алгоритм ключа'), $("#client-cert-alg").val());
        appendCertData(t, T('ИИН'), $("#client-cert-IIN").val());
        appendCertData(t, T('БИН'), $("#client-cert-BIN").val());
        appendCertData(t, T('E-Mail'), $("#client-cert-EMail").val());

        $("#user-full-name").val($("#client-cert-owner").val());
        $("#user-iin").val($("#client-cert-IIN").val());
        $("#user-iin-hidden").val($("#client-cert-IIN").val());

        if ($("#client-cert-IIN").val() != null && $("#client-cert-IIN").val() != '') {
            $('#no-selected-cert').css('display', 'none');
            $('#selected-cert-description').css('display', 'block');
        }
    }