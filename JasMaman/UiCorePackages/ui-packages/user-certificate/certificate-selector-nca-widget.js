
// NCALayer instance
var ncaLayer = function(){
	var ncaUrl = 'wss://127.0.0.1:13579/';

	var ret = { 
		// General exec
		exec: function(method, args, onExecuted, onConnectError){
			if(!onConnectError){
				onConnectError = onExecuted;
			}
			var socket = new WebSocket(ncaUrl);
			socket.onopen = function () {
				// console.log("Connection opened");
				var data = JSON.stringify({
					"method": method,
					"args": args
				});
				socket.send(data);
			};

			socket.onclose = function (event) {
				// console.log("Connection closed (code: " + event.code + "; reason: " + event.reason + ")");
				if (!event.wasClean) {
				    var data = {
				        statusCode: "CONNECTION_ERROR",
				        statusDescription: "Не удалось подключиться к прослойке NCA Layer. Убедитесь, что приложение запущенно",
				        errorCode: "CONNECTION_ERROR"
				    };
				    onConnectError(data);
				}
			};

			socket.onmessage = function (event) {
				var data = JSON.parse(event.data);
				if(!data.errorCode && data.result && data.result.version){
					return;	 // Эти *безответственные* в восьмой версии стали в ответку отсылать сообщение с версией на любой вызов...
				}
				socket.close();
				if(data.errorCode === "NONE"){
					data.statusCode = "OK";
					data.statusDescription = "Выполнено успешно";
				} else {
					if(!data.errorCode){
						data.errorCode="UNKNOWN";
					}
					data.statusCode = "ERROR";
					data.statusDescription = "NCA Layer возвратил ошибку";
				}
				onExecuted(data);
			};
		},
		_registerAPI: function(method, args){
			var argsStr = args.join();
			var funcText = 
'this.' + method + ' = function (' + argsStr + ', callback, onConnectError) {\n' + 
'	this.exec("' + method + '", [' + argsStr + '], callback, onConnectError);\n' +
'}';
			eval(funcText);
		}
	};
	
	// -------------- NCA Layer API ------------------ //
	ret._registerAPI("browseKeyStore", ["storageName", "fileExtension", "currentDirectory"]);
	ret._registerAPI("loadSlotList", ["storageName"]);
	ret._registerAPI("showFileChooser", ["fileExtension", "currentDirectory"]);
	ret._registerAPI("getKeys", ["storageName", "storagePath", "password", "type"]);
	ret._registerAPI("getNotAfter", ["storageName", "storagePath", "alias", "password"]);
	ret._registerAPI("getNotBefore", ["storageName", "storagePath", "alias", "password"]);
	ret._registerAPI("getSubjectDN", ["storageName", "storagePath", "alias", "password"]);
	ret._registerAPI("getIssuerDN", ["storageName", "storagePath", "alias", "password"]);
	ret._registerAPI("getRdnByOid", ["storageName", "storagePath", "alias", "password", "oid", "oidIndex"]);
	ret._registerAPI("signPlainData", ["storageName", "storagePath", "alias", "password", "dataToSign"]);
	ret._registerAPI("verifyPlainData", ["storageName", "storagePath", "alias", "password", "dataToVerify", "base64EcodedSignature"]);
	ret._registerAPI("createCMSSignature", ["storageName", "storagePath", "alias", "password", "dataToSign", "attached"]);
	ret._registerAPI("createCMSSignatureFromFile", ["storageName", "storagePath", "alias", "password", "filePath", "attached"]);
	ret._registerAPI("verifyCMSSignature", ["sigantureToVerify", "signedData"]);
	ret._registerAPI("verifyCMSSignatureFromFile", ["signatureToVerify", "filePath"]);
	ret._registerAPI("signXml", ["storageName", "storagePath", "alias", "password", "xmlToSign"]);
	ret._registerAPI("signXmlByElementId", ["storageName", "storagePath", "alias", "password", "xmlToSign", "elementName", "idAttrName", "signatureParentElement"]);
	ret._registerAPI("verifyXml", ["xmlSignature"]);
	ret._registerAPI("verifyXmlById", ["xmlSignature", "xmlIdAttrName", "signatureElement"]);
	ret._registerAPI("getHash", ["data, digestAlgName"]);

	// -------------- NCA Layer Extended API ------------------ //
    ret.getCertPem = function(storageName, storagePath, alias, password, onExecuted, onConnectError) {
        this.signXml(storageName, storagePath, alias, password, "<xml></xml>", function(ret) {
            if (ret.errorCode == "NONE") {
                try {
                    ret.result = $(ret.result).find("ds\\:X509Certificate").text().trim();
                } catch(ex) {
                    ret.errorCode = "PARSE_ERROR";
                    ret.statusCode = "ERROR";
                    ret.statusDescription = "Parse XML error";
                    ret.result = "";
                }
            }
            onExecuted(ret);
        }, onConnectError);
    };
	
	return(ret);
}();

// NCA Certificate selector widget
(function ($){
	$.widget("crt.certificateSelectorNca", {
		_create: function(){
			var self = this;
			var $this = $(self.element);
			
			$this.append("<div class='cert-selector-container'>");
			$this.append("<div class='certificate-upload-button'>Выбрать сертификат ЭЦП из файла</div>");
			$this.append("</div>");

			var $btnSelectCert = $(".certificate-upload-button", $this);
			
			var handleConnectError = this._handleConnectError;

		    var getFirstKeyInfo = function(result) {
		        var slots = result.split("\n");
		        for (var i = 0; i < slots.length; i++) {
		            if (!slots[i]) {
		                continue;
		            }
		            var slotParts = slots[i].split("|");

		            var keyInfo = {
		                alg: slotParts[0],
		                title: slotParts[1],
		                alias: slotParts[3]
		            };

		            return (keyInfo);
		        }
		        return (null);
		    };

		    var recentCertPath = function(value) {
		        try {
		            if (!value) {
		                var ret = localStorage.getItem("NcaRecentCertPath");
		                return (ret);
		            }
		            localStorage.setItem("NcaRecentCertPath", value);
		            return (value);
		        } catch(e) {
		            return ("");
		        }
		    };
			
            $btnSelectCert.click(function(){
				if($btnSelectCert.hasClass("disabled")){
					return;
				}
				
				$btnSelectCert.addClass("disabled");
				ncaLayer.browseKeyStore("PKCS12","P12",recentCertPath(), function(ret){
					$btnSelectCert.removeClass('disabled');
					if(handleConnectError(ret)){
						return;
					}
					var filePath = ret.result;
					if(!filePath){
						return;
					}
					recentCertPath(filePath);
					
					ncaLayer.getKeys("PKCS12", filePath, "sample-invalid-pwd", "SIGN", function(ret){
						if(handleConnectError(ret)){
							return;
						}
						if((ret.errorCode != "NONE") && (ret.errorCode != "WRONG_PASSWORD")/* && (ret.errorCode != "COMMON")*/){	// Вдруг совпадет o_O
							alert("NCALayer возвратил код ошибки '" + ret.errorCode + "'. Возможно, выбранный вами файл не содержит ключ ЭЦП, либо произошла внутренняя ошибка в программе NCALayer");
							//return;
						}
						
						var $prompt = $(
							"<div class='password-prompt-dlg'>" +
							" <span class='password-label'>Введите пароль:</span> " +
							" <input type='password' class='password-input' />" +
							" <span class='password-invalid-msg'>Введен некорректный пароль</span>"+
							"</div>");
						var $pwd = $(".password-input",$prompt);
						var promptOkFunc = function() {
							var password = $pwd.val();
							if (password == ""){
								return;
							}
							ncaLayer.getKeys("PKCS12", filePath, password, "SIGN", function(ret){
								if(handleConnectError(ret)){
									return;
								}
								if((ret.errorCode == "WRONG_PASSWORD")/* || (ret.errorCode == "COMMON")*/){
									$prompt.addClass("invalid-pwd");
									$pwd.val(null);
									$pwd.focus();
									return;
								}
								
								if(ret.errorCode === "EMPTY_KEY_LIST"){
									$prompt.dialog("close");
									alert("Ключ не предназначен для подписи. Возможно, он предназначен для авторизации");
								    return;
								}
								
								if(ret.errorCode != "NONE"){
								    alert("NCALayer возвратил код ошибки '" + ret.errorCode + "'. Возможно, выбранный вами файл не содержит ключ ЭЦП, либо произошла внутренняя ошибка в программе NCALayer");
								    return;
								}
								$prompt.dialog("close");
								
								var keyInfo = getFirstKeyInfo(ret.result);
								if(!keyInfo){
								    alert("В указанном хранилище ключи не найдены");
									return;
								}
								self._loadP12Cert({
									storage:"PKCS12",
									path:filePath,
									password:password,
									alias:keyInfo.alias,
									alg:keyInfo.alg,
									title:keyInfo.title
								});
							});
						};
						var promptCancelFunc = function(){
							$prompt.dialog("close");
						};
						$prompt.keypress(function(e) {
							if (e.keyCode == $.ui.keyCode.ENTER) {
								promptOkFunc();
							} else if (e.keyCode == $.ui.keyCode.ESCAPE) {  // NOTE: Not works on keypress, only on keydown, but dialog's ESC handler handles this event and close dialog automatically
								promptCancelFunc();
							}
						});
						$prompt.dialog({
							title: "Пароль к файлу ключа",
							resizable: false,
							width:300,
							height:160,
							modal: true,
							buttons: {
								"OK": promptOkFunc,
								"Отмена": promptCancelFunc
							},
							close: function() {
								$prompt.dialog("destroy");
							}
						});
					});
				});
			});
		},
		
		_handleConnectError: function(ret){
			if (ret.errorCode === "CONNECTION_ERROR"){
                var $info = $(
					"<div class='nca-layer-error-dlg'>" +
					" <div class='main-info'>" + 
						"Для функции подписи требуется программа «NCALayer» " + 
					"</div> " +
					" <div class='extra-info'>" + 
						"Программу «<a href='http://www.gosreestr.kz/ru/downloads/NCALayer.zip' target='_blank'>NCALayer</a>» необходимо установить и запустить, согласно <a href='http://www.gosreestr.kz/ru/downloads/NCALayer.pdf' target='_blank'>инструкции</a>" + 
					"</div> " +
					" <div class='links'>Ссылки:</div> " +
					" <ul>" +
					"  <li><a href='http://pki.gov.kz/index.php/ru/ncalayer' target='_blank'>Инструкция по настройке «NCALayer» на сайте НУЦ РК</a></li>" +
					"  <li><a href='http://www.gosreestr.kz/ru/downloads/NCALayer.zip' target='_blank'>Скачать «NCALayer»</a></li>" +
					"  <li><a href='http://www.gosreestr.kz/ru/downloads/NCALayer.pdf' target='_blank'>Скачать инструкцию по установке «NCALayer»</a></li>" +
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
				
				$info.find(".extra-steps-header").click(function(){
					$(this).closest(".extra-steps-container").toggleClass("expanded");
				});
				
			    $info.dialog({
					title: "Не удалось подключиться к NCALayer",
					resizable: false,
					width:600,
					modal: true,
					buttons: {
						"OK": function () {
							$info.dialog("close");
						},
					},
					close: function() {
						$info.dialog("destroy");
					}
				});
				return(true);
			}
			return(false);
		},
		/*{
			storage:"PKCS12",
			path:filePath,
			password:password,
			alias:alias
			alg:alg
			title:title
		}*/
        _loadP12Cert: function (keyInfo) {
			var handleConnectError = this._handleConnectError;
			
            var dataToSign = this.options.dataToSign;
			var certSelectedFunc = this.options.certSelectedFunc;
			
			var certPem = null;
			var clientSignedData = null;
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
			
			certInfo.Alg = keyInfo.alg;

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

            var getStr = function(obj) {
                if (!obj) {
                    return ("");
                }
                return (obj + "");
            };
			
			var cmdQueue = {
				_funcs: [],
				add: function(func){
					this._funcs.push(func);
					return(this);
				},
				addNca: function(funcName, extraArgs, func){
					var self = this;
					this._funcs.push(function(){
						var args = [keyInfo.storage, keyInfo.path, keyInfo.alias, keyInfo.password];
						if(extraArgs){
							args = args.concat(extraArgs);
						}
					    args.push(function(ret) {
					        if (handleConnectError(ret)) {
					            return;
					        }
					        if (ret.errorCode != "NONE") {
					            alert("Не удалось получить данные из сертификата");
					            return;
					        }
					        if (func(ret) !== false) {
					            self.runNext();
					        }
					    });
						ncaLayer[funcName].apply(ncaLayer, args);
					});
					return(this);
				},
				runNext: function(){
					if(this._funcs.length <= 0){
						return;
					}
					var func = this._funcs.shift();
					func(this);
				}
			};
			
			cmdQueue
				.addNca("getCertPem", null, function(ret){
					certPem = ret.result;
				})
				.addNca("signPlainData",[dataToSign], function(ret){
					clientSignedData = ret.result;
				})
				.addNca("getNotBefore", null, function(ret){
					certInfo.ValidFrom = ret.result.split(" ")[0];
				})
				.addNca("getNotAfter", null, function(ret){
					certInfo.ValidTo = ret.result.split(" ")[0];
				})
				.addNca("getSubjectDN", null, function(ret){
					var subject = parseDn(ret.result);
					certInfo.Owner = (getStr(subject.CN) + " " + getStr(subject.G)).trim();
					certInfo.IIN = getStr(subject.SERIALNUMBER).substring(3);
					certInfo.BIN = getStr(subject.OU).substring(3);
					certInfo.Email = getStr(subject.E);
				})
				.addNca("getIssuerDN", null, function(ret){
					var issuer = parseDn(ret.result);
					certInfo.Issuer = getStr(issuer.CN);
				})
				.add(function(){
					certSelectedFunc(clientSignedData, certInfo, certPem);
				})
				.runNext();
        },
		
		destroy: function(){
			$.Widget.prototype.destroy.call(this);
		},
	});
})(jQuery);