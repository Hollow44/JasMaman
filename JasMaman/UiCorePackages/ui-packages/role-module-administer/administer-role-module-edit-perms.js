$(document).ready(function ($) {
    $(".role-perms-editor").each(function () {
        var $this = $(this);
        var editorName = $this.attr("editorName");
        var roleData = JSON.parse($this.attr("roleData"));

        var $table = $("<table class='role-info-markup-table'>");
        function addRoleInfoItem(caption, value) {
            $table.append("<tr><td class='role-info-caption'>{0}</td><td class='role-info-value'>{1}</td></tr>".format(caption, value));
        }

        function getReadableBoolean(bool) {
            switch (bool) {
                case "True":
                    return "Да";
                case "False":
                    return "Нет";
                default:
                    return bool;
            }
        }

        function getReadableProfile(prof) {
            switch (prof) {
                case "internal":
                    return "Внутренний";
                case "external":
                    return "Внешний";
                default:
                    return prof;
            }
        }

        addRoleInfoItem("Id", roleData.RoleId);
        addRoleInfoItem("Имя", roleData.RoleName);
        addRoleInfoItem("Описание", roleData.RoleDescription);
        addRoleInfoItem("Проект", roleData.ProjectText);
        addRoleInfoItem("Профиль роли", getReadableProfile(roleData.RoleProfileText));
        addRoleInfoItem("Автоприсвоение", getReadableBoolean(roleData.AutoAssignText));
        $this.append($table);

        var $permsRolesVisib = $("<input type='checkbox' id='roles-list-for-permissions'/>");
        var $permsRolesVisibBtnText = $("<label for='roles-list-for-permissions' class='roles-list-for-permission-text-hidden'>");

        $permsRolesVisib.change(function () {
            if ($(this).prop("checked")) {
                $(".roles-list-for-permission-hidden").removeClass().addClass("roles-list-for-permission");
                $(".roles-list-for-permission-text-hidden").removeClass().addClass("roles-list-for-permission-text");
            } else {
                $(".roles-list-for-permission").removeClass().addClass("roles-list-for-permission-hidden");
                $(".roles-list-for-permission-text").removeClass().addClass("roles-list-for-permission-text-hidden");
            }
        });

        var $permsCheckedVisib = $("<input type='checkbox' id='selected-permissions-visibility-button'/>");
        var $permsCheckedVisibBtnText = $("<label for='selected-permissions-visibility-button' class='selected-permissions-visibility-button-text'>").text("Показать отмеченные");

        $this.append("<div class='btn-panel'><span class='expand-all'>Развернуть все</span><span class='collaps-all'>Свернуть все</span></div>");

        $(".btn-panel").append($permsRolesVisib);
        $(".btn-panel").append($permsRolesVisibBtnText);

        $permsCheckedVisib.change(function () {
            if ($(this).prop("checked")) {
                $(".perm-checkbox:checked").closest(".perms-container").removeClass().addClass("perms-container");
            } else {
                $(".perm-checkbox:not(checked)").closest(".perms-container").removeClass().addClass("perms-container hidden");
            }
        });

        $(".btn-panel").append($permsCheckedVisib);
        $(".btn-panel").append($permsCheckedVisibBtnText);

        $this.delegate(".expand-all", "click", function () {
            $this.find(".module-perms-title").removeClass("collapsed").addClass("expanded");
            $this.find(".perms-container").removeClass("hidden");
        });
        $this.delegate(".collaps-all", "click", function () {
            $this.find(".module-perms-title").removeClass("expanded").addClass("collapsed");
            $this.find(".perms-container").addClass("hidden");
        });

        var $searchContainer = $("<div class='search-container'>");
        var $searchField = $("<input type='text' class='search-field' />");
        var $searchBtn = $("<input type='button' class='search-button-permission' value='Поиск' />");

        $searchContainer.append($searchField);
        $searchContainer.append($searchBtn);
        $this.append($searchContainer);

        var $modulePermsWrapper = $("<div>");
        for (var i = 0; i < roleData.ModulesPerms.length; i++) {
            var curModulePerms = roleData.ModulesPerms[i];
            var $curModuleContainer = $("<div class='module-perms-container'>");
            var $curModuleTitle = $("<span class='module-perms-title collapsed'>");
            $curModuleTitle.text(curModulePerms.ModuleText);
            $curModuleContainer.append($curModuleTitle);

            var $permsContainer = $("<div class='perms-container hidden'>");
            
            for (var j = 0; j < curModulePerms.Perms.length; j++) {
                var curPerm = curModulePerms.Perms[j];
                var checkBoxId = "ch_" + i + "_" + j;
                var $checkbox = $("<input class='perm-checkbox' type='checkbox' id='{0}'>".format(checkBoxId));
                $checkbox.attr("data", JSON.stringify({ ModuleName: curPerm.ModuleName, PermName: curPerm.PermName }));
                var $label = $("<label for='{0}'>".format(checkBoxId));
                $label.text(curPerm.Text);

                $checkbox.prop("checked", curPerm.Checked == true);

                var $cont = $("<div>");
                $cont.append($checkbox);
                $cont.append($label);
                $permsContainer.append($cont);

//                if (curPerm.IsInherited == true) {
//                    $checkbox.attr("disabled", true);
//                    $label.addClass("disabled");
//                    var $inheritedFrom = $("<span class='perm-inherited-from-info'>");
//                    $inheritedFrom.text(curPerm.InheritedFromText);
//                    $cont.append($inheritedFrom);
//                }
                    var $usedRoles = $("<span class='roles-list-for-permission-hidden'>");
                    $usedRoles.text(curPerm.PermissionRoles);
                    $cont.append($usedRoles);
                
            }
            $curModuleContainer.append($permsContainer);

            $modulePermsWrapper.append($curModuleContainer);
        }
        $this.append($modulePermsWrapper);

        $modulePermsWrapper.delegate(".module-perms-title", "click", function () {
            var $permsTitle = $(this);
            var $permsContainer = $permsTitle.next(".perms-container");
            $permsTitle.toggleClass("collapsed");
            $permsTitle.toggleClass("expanded");
            $permsContainer.toggleClass("hidden");
        });

        $this.delegate(".search-button-permission", "click", function () {
            searchPermissions();
        });

        $this.keypress(function(e) {
            if (e.which == 13) {
                e.preventDefault();
                e.stopImmediatePropagation();
                searchPermissions();
            }
        });

        function searchPermissions() {
            var searchText = $(".search-field").val().toLowerCase();

            if (searchText == "") {
                return;
            }

            $(".module-perms-container").each(function() {
                $moduleContainer = $(this);
                var searchCounter = 0;
                $moduleContainer.find("label").each(function() {
                    var $permLabel = $(this);
                    if ($permLabel.html().toLowerCase().search(searchText) > -1) {
                        $permLabel.addClass("label-selected");
                        searchCounter++;
                    } else {
                        $permLabel.removeClass();
                    }
                });
                
                if (searchCounter > 0) {
                    $moduleContainer.children(".perms-container").removeClass().addClass("perms-container");
                    $moduleContainer.children(".module-perms-title").removeClass().addClass("module-perms-title expanded");
                } else {
                    $moduleContainer.children(".perms-container").removeClass().addClass("perms-container hidden");
                    $moduleContainer.children(".module-perms-title").removeClass().addClass("module-perms-title collapsed");

                }
            });
        }

        $this.closest("form").submit(function () {
            var $input = $("<input type='hidden'>");
            $input.attr("name", editorName);

            var vals = [];

            $this.find(".perm-checkbox:checked:not(:disabled)").each(function () {
                var $checkbox = $(this);
                vals.push(JSON.parse($checkbox.attr("data")));
            });

            $input.val(JSON.stringify(vals));
            $this.append($input);
        });
    });
});