include("demo/ab_test_m_include.js");

//page_callback 为回调函数
function action(jsons, userid, username) {
    try {
        var rows = [];
        run(0, function () {
            var back = {
                error: 0,
                info: "success",
                rows: rows,
            };
            console.log("callback", back);

            page_callback(back);
        });
    }
    catch (e) {
        var back = {
            error: 9,
            info: e.message,
            rows: [],
        };
        console.log(e);

        page_callback(back);
    }

    function run(index, callback) {
        if (index >= jsons.length) {
            callback(rows);
            return;
        }

        var json = jsons[index];
        if (json.action == "add" || json.action == "upp" || json.action == "del") {
            test_fun[json.action](json.row, userid, username, function (res) {
                if (res.error == 0) {
                    rows.push(res.rows[0]);
                } else {
                    rows.push(res);
                }

                run(index + 1, callback);
            });
        } else {
            var res = data.action(_dbName, _vName, [json]);
            if (res.error == 0) {
                rows.push(res.rows[0]);
            } else {
                rows.push(res);
            }

            run(index + 1, callback);
        }
    }
}