//扩展函数
(function ($) {
    $.extend({
        //取得全部数据库
        yqDbs: function (opts, callback) {
            var options = {
                ajaxUrl: "_db.html"
            };
            var o = $.extend({}, options, opts);

            o.action = "dbs";
            var ajaxUrl = o.ajaxUrl;
            //测试
            ajaxUrl = "/yqwin/data/a_dblist.json";

            $.ajax({
                type: 'post',
                url: ajaxUrl,
                dataType: "json",
                data: o,
                success: function (res) {
                    callback(res);
                },
                error: function (XMLHttpRequest, textStatus, errorThrown) {
                    console.log(XMLHttpRequest.responseText);
                    callback({ "error": 99, "info": errorThrown });
                }
            });
        },

        yqTbTitle: function (opts, callback) {
            var options = {
                ajaxUrl: "_db.html",
                dbname: "yqbase",                //数据库
                tbname: "",                       //表
                tempno: "-1"
            };

            var o = $.extend({}, options, opts);
            /*
             测试
             */
            var ajaxUrl = o.ajaxUrl;
            if (o.tbname == "tree1" || o.tbname == "tree2") {
                ajaxUrl = "/yqwin/data/a_treeTitle.json";
            }
            else if (o.tbname == "sys.sys_fields") {
                ajaxUrl = "/yqwin/data/sys_fields_titles.json";
            }
            else {
                ajaxUrl = "/yqwin/data/a_test_tbTitle.json";
            }

            delete o.ajaxUrl;
            $.ajax({
                type: 'post',
                url: ajaxUrl,
                dataType: "json",
                data: o,
                success: function (res) {
                    callback(res);
                },
                error: function (XMLHttpRequest, textStatus, errorThrown) {
                    console.log(XMLHttpRequest.responseText);
                    callback({ "error": 99, "info": errorThrown });
                }
            });
        },

        yqTbModel: function (opts, callback) {
            var options = {
                ajaxUrl: "_db.html",
                dbname: "yqbase",                //数据库
                tbname: "",                       //表
                tempno: "-1"
            };

            var o = $.extend({}, options, opts);
            /*
             测试
             */
            var ajaxUrl = o.ajaxUrl;
            if (o.tbname == "tree1" || o.tbname == "tree2") {
                ajaxUrl = "/yqwin/data/a_treeTitle.json";
            }
            else if (o.tbname == "sys.sys_fields") {
                ajaxUrl = "/yqwin/data/sys_fields_titles.json";
            }
            else {
                ajaxUrl = "/yqwin/data/a_test_tbTitle.json";
            }

            delete o.ajaxUrl;
            $.ajax({
                type: 'post',
                url: ajaxUrl,
                dataType: "json",
                data: o,
                success: function (res) {
                    var model= JSON.stringify(res.titles);
                    delete res.titles;
                    res.model=model;
                    callback(res);
                },
                error: function (XMLHttpRequest, textStatus, errorThrown) {
                    console.log(XMLHttpRequest.responseText);
                    callback({ "error": 99, "info": errorThrown });
                }
            });
        },


        //查询,不分页
        yqDbTbSelect: function (opts, callback) {
            var options = {
                ajaxUrl: "_db.html",
                dbname: "yqbase",                //数据库
                tbname: "",                       //表
                where: "",
                order: ""
            };

            var o = $.extend({}, options, opts);

            if (o.where === null) {
                o.where = "";
            }
            if (o.order === null) {
                o.order = "";
            }

            var ajaxUrl = o.ajaxUrl;
            delete o.ajaxUrl;

            var rows = [];

            switch (true) {
                default:
                    if (o.tbname == "sys.sys_fields") {
                        ajaxUrl = "/yqwin/data/sys_fields_data.json";
                    }
                    else {
                        ajaxUrl = "/yqwin/data/a_test_tbSelect.json";
                    }

                    $.ajax({
                        type: 'post',
                        url: ajaxUrl,
                        dataType: "json",
                        data: o,
                        success: function (res) {
                            //测试，正式环境删除---------
                            //res.pageNo = o.pageno;
                            if (o.tbname == "foreignkey") {
                                var tbname = o.where.substring(16, o.where.length - 3);
                                if (o.where.indexOf("textbox like '%") != -1) {
                                    var rows = [];
                                    for (let i = 0; i < res.rows.length; i++) {
                                        if (res.rows[i]["textbox"].indexOf(tbname) != -1) {
                                            rows.push(res.rows[i]);
                                        }
                                    }
                                    res.rows = rows;
                                }
                            }
                            //--------------------------


                            callback(res);
                        },
                        error: function (XMLHttpRequest, textStatus, errorThrown) {
                            console.log(XMLHttpRequest.responseText);
                            callback({ "error": 99, "info": errorThrown });
                        }
                    });

                    break;
                case o.tbname == "tree1":     //一次加载模式
                    for (var i = 0; i < 10; i++) {
                        var add = (i + 1).toString();
                        rows.push({
                            "sid": "sid-" + add,
                            "name": "name-" + add,
                            "foreignkey": "foreignkey-" + add,
                        });

                        if (!(i == 3 || i == 5 || i == 10)) {
                            for (var j = 0; j < 5; j++) {
                                var add2 = (j + 1).toString();
                                rows.push({
                                    "sid": "sid-" + add + "-" + add2,
                                    "pid": "sid-" + add,
                                    "name": "name-" + add + "-" + add2,
                                    "foreignkey": "foreignkey-" + add,
                                });
                                if (!(j == 1 || j == 3)) {
                                    for (var l = 0; l < 3; l++) {
                                        var add3 = (l + 1).toString();
                                        rows.push({
                                            "sid": "sid-" + add + "-" + add2 + "-" + add3,
                                            "pid": "sid-" + add + "-" + add2,
                                            "name": "name-" + add + "-" + add2 + "-" + add3,
                                            "foreignkey": "foreignkey-" + add,
                                        });
                                    }
                                }
                            }
                        }
                    }

                    var res = {
                        error: 0,
                        info: "ok",
                        rows: rows
                    }

                    callback(res);

                    break;
                case o.tbname == "tree2":     //树形结构逐层加载
                    if (o.where.indexOf('(') == -1) {    //第一级
                        for (var i = 0; i < 15; i++) {
                            var add = (i + 1).toString();
                            rows.push({
                                "sid": "sid-" + add,
                                "name": "name-" + add,
                                "foreignkey": "foreignkey-" + add,
                            });
                        }
                    }
                    else {
                        //o.where = "pid in ('1','2','3')";
                        var where = o.where.substring(o.where.indexOf('(') + 1, o.where.length - 1);
                        var ids = where.split(",");
                        for (var j = 0; j < ids.length; j++) {
                            var pid = ids[j].substring(1, ids[j].length - 1);

                            if (pid.split("-").length >= 5) {
                                break;
                            }

                            if (!(j == 3 || j == 10 || j == 12)) {
                                for (var i = 0; i < 5; i++) {
                                    var add = (i + 1).toString();
                                    rows.push({
                                        "pid": pid,
                                        "sid": pid + "-" + add,
                                        "name": "name-" + pid + "-" + add,
                                        "foreignkey": "foreignkey-" + add,
                                    });
                                }
                            }
                        }
                    }

                    var res = {
                        error: 0,
                        info: "ok",
                        rows: rows
                    }

                    callback(res);

                    break;
            }



            /*
            $.ajax({
                type: 'post',
                url: ajaxUrl,
                dataType: "json",
                data: o,
                success: function (res) {
                    callback(res);
                },
                error: function (XMLHttpRequest, textStatus, errorThrown) {
                    console.log(XMLHttpRequest.responseText);
                    callback({ "error": 99, "info": errorThrown });
                }
            });
            */
        },

        //查询，分页
        yqDbTbPaging: function (opts, callback) {
            var options = {
                ajaxUrl: "_db.html",
                dbname: "yqbase",                //数据库
                tbname: "",                       //表
                where: "",
                order: "",
                pagesize: 5,
                pageno: 1
            };

            var o = $.extend({}, options, opts);

            if (o.where === null) {
                o.where = "";
            }
            if (o.order === null) {
                o.order = "";
            }

            var ajaxUrl = o.ajaxUrl;
            delete o.ajaxUrl;

            //测试，正式环境删除---------
            ajaxUrl = "/yqwin/data/a_test_tbPaging.json";
            //--------------------------------

            $.ajax({
                type: 'post',
                url: ajaxUrl,
                dataType: "json",
                data: o,
                success: function (res) {
                    //测试，正式环境删除---------
                    res.pageNo = o.pageno;
                    if (o.tbname == "foreignkey") {
                        var tbname = o.where.substring(16, o.where.length - 3);
                        if (o.where.indexOf("textbox like '%") != -1) {
                            var rows = [];
                            for (let i = 0; i < res.rows.length; i++) {
                                if (res.rows[i]["textbox"].indexOf(tbname) != -1) {
                                    rows.push(res.rows[i]);
                                }
                            }
                            res.rows = rows;
                        }
                    }
                    //--------------------------

                    callback(res);
                },
                error: function (XMLHttpRequest, textStatus, errorThrown) {
                    console.log(XMLHttpRequest.responseText);
                    callback({ "error": 99, "info": errorThrown });
                }
            });
        },

        //查询,不分页
        yqDbTbRow: function (opts, callback) {
            var options = {
                ajaxUrl: "_db.html",
                dbname: "yqbase",                //数据库
                tbname: "",                       //表
                keyid: "sid",
                keyval: ""
            };

            var o = $.extend({}, options, opts);

            var opts_ = {
                ajaxUrl: o.ajaxUrl,
                dbname: o.tbname,                //数据库
                tbname: o.tbname,                       //表
                where: o.keyid + "='" + o.keyval + "'",
                order: o.keyid
            };

            $.yqDbTbSelect(opts_, function (res) {
                //测试
                var res_ = {
                    "error": res.error,
                    "info": res.info, row: null
                };

                for (var i = 0; i < res.rows.length; i++) {
                    if (res.rows[i][o.keyid] == o.keyval) {
                        res_.row = res.rows[i];
                        break;
                    }
                }

                callback(res_);
            });
        },

        //取外键值
        /*
                rows: [{ 
                    dbname: "yqbase",      //数据库
                    tbname: "a_test_tb",   //表
                    field:"foreignkey",           //关键字段
                    keyid:"sid",           //关键字段
                    ids: ["id1", "id2"] }, //ids
                { 
                    dbname: "yqbase",
                    tbname: "a_test_tb2", 
                    field:"foreignkey",
                    keyid:"sid",
                    ids: ["id-1", "id-2"] }
                ]
        */
        yqDbTbForienKey: function (opts, callback) {
            var options = {
                ajaxUrl: "_db.html",
                rows: [],
            };

            var o = $.extend({}, options, opts);
            var ajaxUrl = o.ajaxUrl;
            o.json = JSON.stringify(o.rows);
            delete o.ajaxUrl;
            delete o.rows;

            //获取测试数据
            var b_rows = [];
            for (var i = 0; i < opts.rows.length; i++) {
                var row = opts.rows[i];
                row.rows = [];
                for (j = 0; j < row.ids.length; j++) {
                    var p = {};
                    p[row.keyid] = row.ids[j];
                    p["textbox"] = "fkname" + (j + 1);
                    p["code"] = "fkcode" + (j + 1);
                    row.rows.push(p);
                }
                delete row.ids;
                b_rows.push(row);
            }

            callback({ "error": 0, "info": "ok", "rows": b_rows });
            /*
              $.ajax({
                  type: 'get',
                  url: ajaxUrl,
                  dataType: "json",
                  data: o,
                  success: function (res) {
                      callback(res);
                  },
                  error: function (XMLHttpRequest, textStatus, errorThrown) {
                      console.log(XMLHttpRequest.responseText);
                      callback({ "error": 99, "info": errorThrown });
                  }
              });
              */
        },

        /*
          rows:[{"action":"add",row:{"name","name1","code":"code1"}},...]
           添加 
           {
                "action": "add",
                "row": {
                    "name": "name1",
                    ...
                }
            }  

            修改
            {
                "action": "upp",
                "row": {
                    "sid": "sid-1",
                    "name": "name1",
                    ...
                }
            }  

            删除：
            {
                "action": "del",
                "row": {
                    "sid": "sid-6"
                }
            }

            粘贴：
            {
                "action": "paste",
                "row": {
                    "pid_field": "pid",
                    "sid": "sid-6",
                    "pid": "sid-7-1",
                    "pid_old": "sid-7"
                }
            }
            
            移动：
            {
                "action": "move",
                "row": {
                    "binding_field":"mm_id",
                    "mm_id":"aaaaaaaa",
                    "pid_field":"pid",
                    "pid":"bbbbbbbbbbb",
                    "ids": ["sid-1", "sid-4", "sid-3", "sid-2"]
                }
            }
                
            注销：可以应用 修改单一属性值接口
            {
                "action":"upp_",
                "row":{
                    "sid":"sid-1",
                    "isdel":false
                }
            }
            修改单一属性值：
            {
                "action":"upp_",
                "row":{
                    "sid":"sid-1",
                    "name":"name1",
                    "code":"code1"
                }
            }
        */

        yqDbAction: function (opts, callback) {
            var options = {
                ajaxUrl: "_db.html",
                dbname: "yqbase",                //数据库
                tbname: "",                       //表
                rows: "[]",
            };

            var paste = {
                "action": "paste",
                row: {
                    "sid_field": "sid",
                    "pid_field": "pid",
                    "sid": "sid-6",
                    "pid": "sid-7-1",
                    "pid_old": "sid-7"
                }
            }

            var o = $.extend({}, options, opts);
            var ajaxUrl = o.ajaxUrl;
            o.json = JSON.stringify(o.rows);
            delete o.ajaxUrl;
            delete o.rows;

            //测试。。。
            var res = { "error": 0, "info": "ok", "rows": [] };
            for (var i = 0; i < opts.rows.length; i++) {
                var sid = 'yyxxxxxxxx'.replace(/[xy]/g, function (c) {
                    var r = Math.random() * 16 | 0,
                        v = c == 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });

                res.rows.push({
                    "error": 0,
                    "info": "ok",
                    "action": opts.rows[i].action,
                    "sid": (opts.rows[i].action == "add" ? ("add-" + sid) : opts.rows[i].row.sid)
                });
            }
            callback(res);

            /*
           $.ajax({
               type: 'get',
               url: ajaxUrl,
               dataType: "json",
               data: o,
               success: function (res) {
                   callback(res);
               },
               error: function (XMLHttpRequest, textStatus, errorThrown) {
                   console.log(XMLHttpRequest.responseText);
                   callback({ "error": 99, "info": errorThrown });
               }
           });
           */
        },

        //取得菜单信息
        yqDbMenus: function (opts, callback) {
            var options = {
                ajaxUrl: "_menu.html",
                appno: 1                //系统no
            };

            var o = $.extend({}, options, opts);
            var ajaxUrl = o.ajaxUrl;
            delete o.ajaxUrl;

            /*
            测试
            */
            ajaxUrl = "/yqwin/data/menus.json";
            $.ajax({
                type: 'post',
                url: ajaxUrl,
                dataType: "json",
                data: o,
                success: function (res) {
                    callback(res);
                },
                error: function (XMLHttpRequest, textStatus, errorThrown) {
                    console.log(XMLHttpRequest.responseText);
                    callback({ "error": 99, "info": errorThrown });
                }
            });
        },

        //数据导出
        yqDataToExcel: function (opts, callback) {
            var options = {
                header: [
                    { name: "a", title: "A" },
                    { name: "b", title: "B" },
                    { name: "c", title: "C" }],
                data: [
                    { a: "a1", b: "b1", c: 1 },
                    { a: "a2", b: "b2", c: 2 },
                    { a: "a3", b: "b3", c: 3 }],
                filename: "download.xls",
                ajaxUrl: "/_db.html"
            };
            var o = $.extend({}, options, opts);

            var form = new FormData();
            form.append('action', "toexcel");
            form.append('header', JSON.stringify(o.header));
            form.append('data', JSON.stringify(o.data));
            form.append('filename', o.filename);

            var xhr = new XMLHttpRequest();
            xhr.open('POST', o.ajaxUrl, true);
            xhr.responseType = 'blob';//返回类型为blob
            xhr.send(form);
            xhr.onload = function (e) {
                if (this.status == 200) {//请求成功执行
                    var blob = new Blob([this.response], {
                        type: "application/vnd.ms-excel"
                    });

                    var aa = document.createElement('a');
                    aa.href = URL.createObjectURL(blob);
                    aa.innerHTML = 'link';
                    aa.download = o.filename;
                    aa.style.display = 'none';
                    document.body.appendChild(aa);
                    aa.click();

                    callback({ error: 0, info: "ok" })
                } else {
                    callback({ error: 9, info: "下载失败。" })
                }
            };
        },

    });
})(jQuery);