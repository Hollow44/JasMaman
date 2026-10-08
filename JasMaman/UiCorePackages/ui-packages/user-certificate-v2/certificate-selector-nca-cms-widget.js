// NCALayer instance
var ncaLayer = function() {
    var ncaUrl = 'wss://127.0.0.1:13579/';

    var ret = {
        // General exec
        exec: function(method, args, onExecuted, onConnectError) {
            if (!onConnectError) {
                onConnectError = onExecuted;
            }
            var socket = new WebSocket(ncaUrl);
            socket.onopen = function() {
                // console.log("Connection opened");

                var lang = rootDir.replaceAll('/', '');
                if (lang == 'kz') {
                    lang = 'kk'
                }

                var data = JSON.stringify({
                    //"module": "kz.gov.pki.knca.commonUtils",
                    //"method": method,
                    //"args": args

                    "module": "kz.gov.pki.knca.basics",
                    "method": "sign",
                    "args": {
                        allowedStorages: [
                            "AKKaztokenStore",
                            "AKKZIDCardStore",
                            "AKEToken72KStore",
                            "AKEToken5110Store",
                            "AKJaCartaStore",
                            "PKCS12"
                        ],
                        data: args[0],
                        format: "cms",
                        locale: lang,
                        signerParams: { extKeyUsageOids: [], chain: [] },


                        //decode - false по умолчанию. Если true, то data будет декодировано из base64
                        //encapsulate - true по умолчанию, встраивает значение в cms.Если false, то будет detached
                        signingParams: { decode: "true", encapsulate: "false", digested: "false", tsaProfile: null }
                    }
                });
                socket.send(data);
            };

            socket.onclose = function(event) {
                if (!event.wasClean) {
                    var data = {
                        statusCode: "CONNECTION_ERROR",
                        statusDescription: "Не удалось подключиться к прослойке NCA Layer. Убедитесь, что приложение запущенно",
                        errorCode: "CONNECTION_ERROR"
                    };
                    onConnectError(data);
                }
            };

            socket.onmessage = function(event) {
                var data = JSON.parse(event.data);
                if (!data.errorCode && data.result && data.result.version) {
                    return; // Эти *безответственные* в восьмой версии стали в ответку отсылать сообщение с версией на любой вызов...
                }
                socket.close();
                if (data.code === "200") {
                    data.statusCode = "OK";
                    data.statusDescription = "Выполнено успешно";
                } else if (data.code === "500") {
                    data.statusCode = data.code;
                    data.statusDescription = "Прослойка NCA Layer не корректно отработала запрос, убедитесь, что параметры вашего прокси сервера указаны в настройках NCA Layer";
                } else {
                    if (!data.errorCode) {
                        data.errorCode = "UNKNOWN";
                    }
                    data.statusCode = data.code;
                    data.statusDescription = "NCA Layer возвратил ошибку";
                }
                onExecuted(data);
            };
        },
        _registerAPI: function(method, args) {
            var argsStr = args.join();
            var funcText =
                'this.' + method + ' = function (' + argsStr + ', callback, onConnectError) {\n' +
                '	this.exec("' + method + '", [' + argsStr + '], callback, onConnectError);\n' +
                '}';
            eval(funcText);
        }
    };

    // -------------- NCA Layer API ------------------ //
    ret._registerAPI("signCmsByNcaLayer", ["base64ToSign" ]);

    // -------------- NCA Layer Extended API ------------------ //
    ret.getCertPem = function(storageName, storagePath, alias, password, onExecuted, onConnectError) {
        this.signXml(storageName, storagePath, alias, password, "<xml></xml>", function(ret) {
            if (ret.errorCode == "NONE") {
                try {
                    ret.result = $(ret.result).find("ds\\:X509Certificate").text().trim();
                } catch (ex) {
                    ret.errorCode = "PARSE_ERROR";
                    ret.statusCode = "ERROR";
                    ret.statusDescription = "Parse XML error";
                    ret.result = "";
                }
            }
            onExecuted(ret);
        }, onConnectError);
    };

    return (ret);
}();

// NCA Certificate selector widget
(function($) {
    $.widget("crt.certificateSelectorNca", {
        _create: function() {
            var self = this;
            var $this = $(self.element);

            $this.append("<div class='cert-selector-container'>");
            $this.append("<div class='certificate-upload-button'>Выбрать сертификат ЭЦП из файла</div>");
            $this.append("</div>");

            var $btnSelectCert = $(".certificate-upload-button", $this);

            var handleConnectError = this._handleConnectError;

            function b64EncodeUnicode(str) {
                // first we use encodeURIComponent to get percent-encoded UTF-8,
                // then we convert the percent encodings into raw bytes which
                // can be fed into btoa.
                return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
                    function toSolidBytes(match, p1) {
                        return String.fromCharCode('0x' + p1);
                    }));
            }

            $btnSelectCert.click(function() {
                if ($btnSelectCert.hasClass("disabled")) {
                    return;
                }

                $btnSelectCert.addClass("disabled");
                var base64String = b64EncodeUnicode(self.options.dataToSign);
                ncaLayer.signCmsByNcaLayer(base64String, function(ret) {
                    $btnSelectCert.removeClass('disabled');
                    if (handleConnectError(ret)) {
                        return;
                    }

                    if (ret.body.result == undefined) {
                        return;
                    }

                    //var singedCmsData = ret.responseObject;
                    var singedCmsData = ret.body.result.replace('-----BEGIN CMS-----', '').replace('-----END CMS-----', '').replace(/[\r\n]/g, "");
                    var cmsCertificateInfo = getCertficiateInfoFromCms(singedCmsData);
                    self._setSign(singedCmsData, cmsCertificateInfo.certificate, cmsCertificateInfo.certificatePem);
                });
            });
        },

        _handleConnectError: function(ret) {
            if (ret.errorCode === "CONNECTION_ERROR") {
                var $info = $(
                    "<div class='nca-layer-error-dlg'>" +
                    " <div class='main-info'>" +
                    "Для функции подписи требуется программа «NCALayer» " +
                    "</div> " +
                    " <div class='extra-info'>" +
                    "Программу «<a href='https://pki.gov.kz/ncalayer/' target='_blank'>NCALayer</a>» необходимо установить и запустить, согласно <a href='https://pki.gov.kz/docs/nl_ru/windows/' target='_blank'>инструкции</a>" +
                    "</div> " +
                    " <div class='links'>Ссылки:</div> " +
                    " <ul>" +
                    "  <li><a href='https://pki.gov.kz/docs/nl_ru/windows/' target='_blank'>Инструкция по настройке «NCALayer» на сайте НУЦ РК</a></li>" +
                    "  <li><a href='https://pki.gov.kz/ncalayer/' target='_blank'>Скачать «NCALayer»</a></li>" +
                    " </ul> " +
                    " <div class='extra-steps-container'>" +
                    "  <span class='extra-steps-header'>Если программа установлена и запущена, но появляется данное сообщение...</span>" +
                    "  <div class='extra-steps'>" +
                    "   <ul>" +
                    "    <li>Для <b>Mozilla Firefox</b> потребуется <b>вручную</b> установить корневые сертификаты в браузер согласно инструкции по установке «NCALayer»</li>" +
                    "    <li>Попробуйте <b>переустановить</b> программу от имени <b>администратора</b> ПК, следуя инструкции по установке «NCALayer»</li>" +
                    "   </ul> " +
                    "  </div>" +
                    "</div> " +
                    "</div>"
                );

                $info.find(".extra-steps-header").click(function() {
                    $(this).closest(".extra-steps-container").toggleClass("expanded");
                });

                $info.dialog({
                    title: "Не удалось подключиться к NCALayer",
                    resizable: false,
                    width: 600,
                    modal: true,
                    buttons: {
                        "OK": function() {
                            $info.dialog("close");
                        },
                    },
                    close: function() {
                        $info.dialog("destroy");
                    }
                });
                return (true);
            }
            if (ret.message == "action.canceled") {
                return (true);
            }
            if (ret.code == "500") {
                var $info = $(
                    "<div class='nca-layer-error-dlg'>" +
                    " <div class='main-info'>" +
                    "Прослойка NCA Layer не корректно отработала запрос, убедитесь, что параметры вашего прокси сервера указаны в настройках NCA Layer" +
                    "</div> " +
                    "</div>"
                );
                $info.dialog({
                    title: "Ошибка с NCALayer",
                    resizable: false,
                    width: 600,
                    modal: true,
                    buttons: {
                        "OK": function () {
                            $info.dialog("close");
                        },
                    },
                    close: function () {
                        $info.dialog("destroy");
                    }
                });
                return (true);
            }
            return (false);
        },
        _setSign: function(signedDataCms, certificate, certificatePem) {
            var self = this;
            var certSelectedFunc = this.options.certSelectedFunc;

            var certPem = null;
            var certInfo = {
                Owner: null,
                Issuer: null,
                ValidFrom: null,
                ValidTo: null,
                Alg: null,
                IIN: null,
                BIN: null,
                Email: null
            };

            function getOwnerAttr(attrId){
                return self._getCertAttributeValue(certificate.subject, attrId);
            }
            function getIssuerAttr(attrId){
                return self._getCertAttributeValue(certificate.issuer, attrId);
            }

            certInfo.Alg = self._getCertificateAlgorithmName(certificate.signatureAlgorithm.algorithmId);
            certPem = certificatePem;
            certPem = certPem.replace('-----BEGIN CERTIFICATE-----', '');
            certPem = certPem.replace('-----END CERTIFICATE-----', '');
            certInfo.ValidFrom = certificate.notBefore.value.toLocaleDateString();
            certInfo.ValidTo = certificate.notAfter.value.toLocaleDateString();

            var attrsIds = {
                CN: "2.5.4.3",
                G: "2.5.4.42",
                SERIALNUMBER: "2.5.4.5",
                OU: "2.5.4.11",
                E: "1.2.840.113549.1.9.1"
            };

            certInfo.Owner = (getOwnerAttr(attrsIds.CN) + " " +  getOwnerAttr(attrsIds.G)).trim();
            certInfo.IIN = getOwnerAttr(attrsIds.SERIALNUMBER).substring(3);
            certInfo.BIN =  getOwnerAttr(attrsIds.OU).substring(3);
            certInfo.Email =  getOwnerAttr(attrsIds.E);

            certInfo.Issuer = getIssuerAttr(attrsIds.CN);

            certSelectedFunc(signedDataCms, certInfo, certPem);
        },
        _getCertAttributeValue(certificateAttributes, attributeId){
            var attr = certificateAttributes.typesAndValues.find(x=>x.type == attributeId);
            if(attr === undefined){
                return "";
            }
            return attr.value.valueBlock.value;
        },
        _getCertificateAlgorithmName(oid){
            var dgstmap = {
                "2.16.840.1.101.3.4.2.1": "SHA-256",
                "2.16.840.1.101.3.4.2.3": "SHA-512",
                "1.2.840.113549.1.1.11": "sha256WithRSAEncryption",
                "1.2.398.3.10.1.1.1.2": "ГОСТ 34.310",
                "1.2.398.3.10.1.1.2.3.2": "ГОСТ 34.310 2015"
            };
            return dgstmap[oid] || oid;
        },

        destroy: function() {
            $.Widget.prototype.destroy.call(this);
        },
    });
})(jQuery);
