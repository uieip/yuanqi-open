var test_fun = {
    add: function (row, userid, username, callback) {
        row.c_userid = userid;
        row.c_username = username;
        row.createtime = test_fun.formatDate(new Date());
        row.m_userid = userid;
        row.m_username = username;
        row.modifytime = row.createtime;

        var res = data.action(_dbName, _vName, [{
            action: "add",
            row: row
        }]);

        callback(res);
    },
    upp: function (row, userid, username, callback) {
        row.m_userid = userid;
        row.m_username = username;
        row.modifytime = test_fun.formatDate(new Date());
        var res = data.action(_dbName, _vName, [{
            action: "upp",
            row: row
        }]);

        callback(res);
    },
    del: function (row, userid, username, callback) {
        var res = data.action(_dbName, _vName, [{
            action: "del",
            row: row
        }]);

        callback(res);
    },
    state: function (row, userid, username, callback) {
        row.m_userid = userid;
        row.m_username = username;
        row.modifytime = test_fun.formatDate(new Date());
        var res = data.action(_dbName, _vName, [{
            action: "upp_",
            row: row
        }]);

        if (typeof callback == "function") {
            callback(res);
        }

        if (typeof page_callback == "function") {
            page_callback(res);
        }
    },
    formatDate: function (date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
}