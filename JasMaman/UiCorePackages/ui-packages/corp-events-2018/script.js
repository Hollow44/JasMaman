$(document).ready(
    function () {
        if ($("#flCorpEventDateOut").length == 0) {
            return;
        }

        $("#flCorpEventDateOut").attr("disabled", true);
        $("#flCorpEventDateOutStatus").closest("tr").hide();
        $("#flCorpEventDate").change(onChangeStartDate);
        $("#flCorpEventInfoType").change(onChangeInfoType);
        $("#flCorpEventInfoSubType").change(onChangeInfoType);
    }
);

function onChangeInfoType() {
    var $this = $(this);
    var val = $this.val();
    var dateArray = $("#flCorpEventDate").val().split('.');
    var startDate = new Date(parseInt(dateArray[2]), parseInt(dateArray[1]) - 1, dateArray[0]);

    onChangeData(val, startDate);
}

function onChangeStartDate() {
    var $this = $(this);
    var val = $this.val();
    var dateArray = val.split('.');
    var startDate = new Date(parseInt(dateArray[2]), parseInt(dateArray[1]) - 1, dateArray[0]);

    var infoType = $("#flCorpEventInfoType").val();
    var infoSubType = $("#flCorpEventInfoSubType").val();

    onChangeData(infoType, startDate);
    onChangeData(infoSubType, startDate);
}

function onChangeData(val, startDate) {

    Date.prototype.getLocalDateString = function() {
        var year = this.getFullYear();
        var month = this.getMonth() + 1;
        var space = month < 10 ? '0' : '';
        var day = this.getDate();
        var spaceDay = day < 10 ? '0' : '';
        return spaceDay + day + '.' + space + month + '.' + year;
    };
    
    var endDate = startDate;
    var daysCount = getInfoTypeDays(val);
    var daysType = getInfoTypeDaysType(val);
    if (daysCount == -1) {
        return;
    }
    var i = 1;
    var dayInMs = 86400000;
    while (i < daysCount) {
        var tempDate = endDate;
        endDate = addDay(endDate, daysType);
        if (tempDate.getTime() == endDate.getTime()) {
            endDate = new Date(tempDate.getTime() + dayInMs);
        } else {
            i++;
        }
    }

    $("#flCorpEventDateOut").val(endDate.getLocalDateString());
}

function addDay(day, dayType) {
    var dayInMs = 86400000;
    switch (dayType) {
        case 'calendar':
            return new Date(day.getTime() + dayInMs);
        case 'work':
            if (isWorkDay(day)) {
                return new Date(day.getTime() + dayInMs);
            }
            return day;
        default:
            return day;
    }
}

function isWorkDay(day) {
    var notWorkingDays = JSON.parse($("#not-working-days-list").val());

    for (var notWorkingDay in notWorkingDays) {
        var notWorkingDayInt = new Date(notWorkingDays[notWorkingDay]).getTime();
        if (day.getTime() == notWorkingDayInt) {
            return false;
        }
    }
    
    return true;
}

function getInfoTypeDays(infoType) {
    switch (infoType) {
        case 'A2Q07_MRG':
        case 'A2Q07_SEG':
            return 60;
        case 'A2Q06_EXT':
        case 'A2Q06_MIX':
            return 45;
        case 'A2Q06_FTM':
            return 30;
        case 'A2Q08':
        case 'A2Q12':
            return 15;
        case 'A1Q01':
        case 'A1Q02':
        case 'A1Q04':
        case 'A1Q05':
        case 'A1Q06':
        case 'A1Q07':
        case 'A1Q13':
        case 'A1Q17':
        case 'A1Q25':
        case 'A2Q05':
        case 'A2Q01_AO':
        case 'A2Q07_AFF':
        case 'A2Q07_DIV':
            return 10;
        case 'A2Q02':
        case 'A2Q01_FO':
            return 5;
        case 'A1Q03':
        case 'A1Q08':
        case 'A1Q09':
        case 'A1Q10':
        case 'A1Q11':
        case 'A1Q12':
        case 'A1Q14':
        case 'A1Q15':
        case 'A1Q16':
        case 'A1Q18':
        case 'A1Q19':
        case 'A1Q20':
        case 'A1Q21':
        case 'A1Q22':
        case 'A1Q23':
        case 'A1Q24':
        case 'A2Q03':
        case 'A2Q04':
        case 'A2Q09':
        case 'A2Q10':
        case 'A2Q11':
            return 3;
        default:
            return -1;
    }
}

function getInfoTypeDaysType(infoType) {
    switch (infoType.substring(0, 1)) {
        case 'A':
            return 'work';
        case 'C':
            return 'calendar';
        default:
            return 'error';
    }
}
