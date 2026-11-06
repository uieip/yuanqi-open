//include("demo/ab_test_m_include.js");

/* 流程初始化 */
//page_callback 为回调函数
function wf_init(wf_data, init_data) {
    try {
        $_yqFlow.wf_init(wf_data, init_data, function (res) {
            page_callback(res);
        });
    }
    catch (e) {
        page_callback({
            error: 9,
            info: e.message
        });
    }
}

//page_callback 为回调函数
function wf_uppuser(wf_data, up_data) {
    try {
        $_yqFlow.wf_uppuser(wf_data, up_data.key, up_data.users, function (res) {
            page_callback(res);
        });
    }
    catch (e) {
        page_callback({
            error: 9,
            info: e.message
        });
    }
}

/* 流程提交处理 */
//page_callback 为回调函数
function wf_submit(wf_data, submit_date) {
    try {
        console.log("wf_submit", submit_date);
        $_yqFlow.localtest(wf_data, submit_date, function (res) {
            page_callback(res);
        });
    }
    catch (e) {
        page_callback({
            error: 9,
            info: e.message
        });
    }
}

//工作流处理程序
var $_yqFlow = {
    formatDate: function (date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },
    //开始节点
    start: function (data) {
        for (var i = 0; i < data.node.length; i++) {
            if (data.node[i].class == 1) {
                return data.node[i];
            }
        }
        return null;

    },
    //退回节点
    return: function (data) {
        for (var i = 0; i < data.node.length; i++) {
            if (data.node[i].class == 2) {
                return data.node[i];
            }
        }
        return null;

    },
    //根据key返回节点
    node: function (data, key) {
        for (var i = 0; i < data.node.length; i++) {
            if (data.node[i].key === key) {
                return data.node[i];
            }
        }
        return null;
    },
    //获取节点执行连线
    toLines: function (data, from) {
        var links = [];
        for (var i = 0; i < data.link.length; i++) {
            if (data.link[i].from == from) {
                links.push(data.link[i]);
            }
        }
        return links;
    },
    //获取节点执行动作
    mmdLists: function (data, from) {
        var links = $_yqFlow.toLines(data, from);
        if (links.length == 0) {
            return [];
        }

        var list = [];
        var mmdIds = [1, 2, 0, 8]
        for (var i = 0; i < mmdIds.length; i++) {
            for (var j = 0; j < links.length; j++) {
                if (links[j].mmdId === mmdIds[i]) {
                    list.push({
                        no: links[j].mmdId,
                        name: links[j].text
                    });
                    break;
                }
            }
        }

        return list;
    },
    //获取节点连线动作名称
    mmdName: function (data, from, mmdId) {
        var links = $_yqFlow.toLines(data, from);
        if (links.length == 0) {
            return null;
        }

        for (var j = 0; j < links.length; j++) {
            if (links[j].mmdId === mmdId) {
                return links[j].text;
            }
        }

        return null;
    },
    //获取节点输入参数
    nodeparams: function (data, node) {
        if (node.params === undefined || node.params == null) {
            return {
                titles: [],
                row: {}
            }
        }

        var titles = [];
        var row = {};
        for (var i = 0; i < node.params.length; i++) {
            for (j = 0; j < data.info.params.length; j++) {
                if (node.params[i].name == data.info.params[j].name) {
                    titles.push({
                        "name": data.info.params[j].name,
                        "ui_title": data.info.params[j].desc,
                        "ui_type": data.info.params[j].type,
                        "ui_width": 80,
                        "ui_visible": true,
                        "ui_readonly": false,
                        "ui_mask": data.info.params[j].ui_mask
                    });

                    row[data.info.params[j].name] = (data.info.params[j].value === undefined ? null : data.info.params[j].value);
                    break;
                }
            }
        }

        return {
            titles: titles,
            row: row
        }
    },
    //获取执行节点
    todos: function (data, from, mmdId) {
        var links = [];
        for (var i = 0; i < data.link.length; i++) {
            if (data.link[i].from == from &&
                data.link[i].mmdId == mmdId) {
                links.push(data.link[i]);
            }
        }
        return links;
    },
    //线表达式校验
    evalTodos: function (todos, parmas) {
        if (todos.length == 1) {
            return todos;
        }

        var todos_ = [];
        for (var i = 0; i < todos.length; i++) {
            if ($_yqFlow.expression(todos[i].expression, parmas)) {
                todos_.push(todos[i]);
            }
        }

        return todos_;
    },
    //校验表达式
    expression: function (exp_str, parmas) {
        if (!(typeof parmas == "object" && typeof exp_str == "string")) {
            return true;
        }

        if (parmas.length == 0 || exp_str == "") {
            return true;
        }

        var context = {};
        for (var i = 0; i < parmas.length; i++) {
            context[parmas[i].name] = parmas[i].value === undefined ? (parmas[i].ui_mask.default === undefined ? null : parmas[i].ui_mask.default) : parmas[i].value;
        }

        // 去掉 @ 前缀
        var cleanedExpression = exp_str.replace(/@\b/g, '');

        // 使用 Function 构造函数动态求值
        try {
            var func = new Function(...Object.keys(context), 'return ' + cleanedExpression);
            return func(...Object.values(context));
        } catch (error) {
            //console.error("表达式求值错误:", error);
            return false;
        }
    },
    //获取提交路径
    submitLines: function (data, submit) {
        if (submit.params === undefined || submit.params === null) {
            submit.params = [];
        }
        if (data.info.params === undefined || data.info.params === null) {
            submit.params = {}
        }

        var todos = $_yqFlow.todos(data, submit.key, submit.mmdId);
        if (todos.length == 0) {
            return {
                error: 9,
                info: "没有路径[mmdId=" + submit.mmdId + "]，不能提交。"
            };
        }
        var params = [];
        for (var i = 0; i < data.info.params.length; i++) {
            var param = deepClone(data.info.params[i]);
            if (submit.params.hasOwnProperty(param.name)) {
                param.value = submit.params[param.name];
            }
            params.push(param);
        }



        //线表达式计算
        var eval_todos = $_yqFlow.evalTodos(todos, params);

        //console.log(data, submit, todos, eval_todos);
        //console.log(eval_todos);
        if (eval_todos.length == 0) {
            return {
                error: 9,
                info: "没有路径[mmdId=" + submit.mmdId + ",有" + todos.length + "条路径，参数校验都为false]，不能提交。"
            };
        }

        return {
            error: 0,
            todos: eval_todos,
            params: params
        };


        function deepClone(obj) {
            if (obj === null || typeof obj !== 'object') {
                return obj;
            }
            if (Array.isArray(obj)) {
                var arr = [];
                for (var i = 0; i < obj.length; i++) {
                    arr[i] = deepClone(obj[i]);
                }
                return arr;
            }
            var copy = {};
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    copy[key] = deepClone(obj[key]);
                }
            }
            return copy;
        }

    },
    //校验当前节点是否有审批权限
    checkPower: function (node, users) {
        return $_yqFlow.submitUser(node, users) === null ? false : true;
    },
    //提交人
    submitUser: function (node, users) {
        var users_ck = node.users;
        if (users_ck === undefined) {
            users_ck = [];
        }
        if (users === undefined) {
            users = [];
        }

        for (var i = 0; i < users_ck.length; i++) {
            for (var j = 0; j < users.length; j++) {
                if (users_ck[i].id == users[j]) {
                    if (users_ck[i].mmdId === undefined) {
                        return {
                            id: users_ck[i].id,
                            name: users_ck[i].name,
                            self: users[j]  //审批人
                        };
                    }
                }
            }
        }

        return null;
    },
    //测试提交人
    submitUser_test: function (node) {
        var users_ck = node.users;
        if (users_ck === undefined) {
            users_ck = [];
        }

        for (var i = 0; i < users_ck.length; i++) {
            if (users_ck[i].mmdId === undefined) {
                return {
                    id: users_ck[i].id,
                    name: users_ck[i].name,
                    self: users_ck[i].id  //审批人
                };
            }
        }

        return null;
    },

    //流程初始化
    wf_init: function (wf_data, init_data, init_callback) {
        if (init_data.parameter === undefined || init_data.parameter === null) {
            return init_callback({
                error: 9,
                info: "参数为空"
            });
        }

        if (init_data.parameter["user_id"] === undefined ||
            init_data.parameter["user_id"] === null) {
            return init_callback({
                error: 9,
                info: "参数为空"
            });
        }

        wf_data.info.wfstate = 0;
        var _u_id = init_data.parameter["user_id"];
        var _u_name = (init_data.parameter["user_name"] === undefined || init_data.parameter["user_name"] === null) ? "未命名" : init_data.parameter["user_name"];
        var _time = $_yqFlow.formatDate(new Date());

        var createuser = function () {
            return [{
                "id": _u_id,
                "name": _u_name,
            }]
        };

        var _start_node = {};   //开始节点key
        var _u_ids = _u_id;
        var _users = _u_name;

        setUser(0, function () {
            if (!(init_data.dbName === undefined ||
                init_data.dbName === null ||
                init_data.dbName === '')) {
                wf_data.info.db_name = init_data.dbName;
            }
            if (!(init_data.tbName === undefined ||
                init_data.tbName === null ||
                init_data.tbName === '')) {
                wf_data.info.tb_name = init_data.tbName;
            }
            wf_data.info.wfname = init_data.wfName;
            wf_data.info.topic = init_data.topic;
            wf_data.info.tb_id = init_data.tbId;
            wf_data.info.s_time = _time;

            init_callback({
                error: 0,
                info: "success",
                wf: wf_data,
                users: [_u_id]
            });
        })

        //设置用户
        function setUser(index, callback) {
            if (index >= wf_data.node.length) {
                callback();
                return;
            }

            var cb = false;
            if (wf_data.node[index].class == 1 ||
                wf_data.node[index].class == 2) {
                wf_data.node[index].users = createuser();

                if (wf_data.node[index].class == 1) {
                    _start_node = wf_data.node[index];
                    wf_data.node[index].todo = 1;
                    wf_data.node[index].s_time = _time;
                }
            } else if (wf_data.node[index].class == 5) {
                var roleType = wf_data.node[index].roleType;
                var roleMark = wf_data.node[index].roleMark;
                if (roleType === undefined || roleType === null) {
                    roleType = 1;
                }
                if (roleMark === undefined || roleMark === null) {
                    roleMark = [];
                }
                if (roleType == 1 || roleType == 2 || roleType == 3 ||
                    roleType == 4 || roleType == 5) {
                    var users = wf.getUser(roleType, roleMark, init_data.parameter);
                    wf_data.node[index].users = users;

                    for (var j = 0; j < users.length; j++) {
                        if (!(users[j].id === undefined || users[j].id === null)) {
                            if (_u_ids.indexOf(users[j].id) == -1) {
                                _u_ids += (_u_ids == "" ? "" : ",") + users[j].id;
                                _users += (_users == "" ? "" : ",") + users[j].name;
                            }
                        }
                    }
                }
                /* */
                else if (roleType == 99) {
                    // 动态调用函数
                    if ($_yqFlow[roleMark] && typeof $_yqFlow[roleMark] === "function") {
                        cb = true;
                        $_yqFlow[roleMark](init_data.parameter, function (users) {
                            wf_data.node[index].users = users;

                            for (var j = 0; j < users.length; j++) {
                                if (!(users[j].id === undefined || users[j].id === null)) {
                                    if (_u_ids.indexOf(users[j].id) == -1) {
                                        _u_ids += (_u_ids == "" ? "" : ",") + users[j].id;
                                        _users += (_users == "" ? "" : ",") + users[j].name;
                                    }
                                }
                            }

                            setUser(index + 1, callback);
                        });
                    } else {
                        console.error("Function not found:", functionName);
                    }
                }
            }

            if (!cb) {
                setUser(index + 1, callback);
            }
        }
    },

    //更新用户数据
    wf_uppuser: function (wf_data, key, users, callback) {
        for (var i = 0; i < wf_data.node.length; i++) {
            if (wf_data.node[i].key == key) {
                wf_data.node[i].roleIsEdit = true;
                wf_data.node[i].users = users;
                break;
            }
        }

        callback({
            error: 0,
            wf: wf_data
        });
    },

    //本地流程提交测试
    localtest: function (f_data, submit, callback) {
        var data = JSON.parse(JSON.stringify(f_data));

        var _time = $_yqFlow.formatDate(new Date());

        var s_node = $_yqFlow.node(data, submit.key);

        for (var j = 0; j < s_node.users.length; j++) {
            if (s_node.users[j].id == submit.user.self &&
                s_node.users[j].mmdId === undefined
            ) {
                s_node.users[j].mmdId = submit.mmdId;
                s_node.users[j].e_time = _time;
                if (s_node.users[j].id != submit.user.id) {
                    s_node.users[j].checkin = submit.user.id;
                }

                break;
            }
        }

        if (data.submit === undefined) {
            data.submit = [];
        }
        //审批和执行人相同，删除执行人self，self为流程对应的执行人
        if (submit.user.id == submit.user.self) {
            delete submit.user.self;
        }
        //提交时间
        submit.time = _time;
        //节点第二次开始提交时，记录提交次数
        if (!(data.info.onNum === undefined)) {
            submit.onNum = data.info.onNum;
        }
        data.submit.push(submit);

        //console.log("submit", s_node, submit)

        //执行状态
        var mmdId = -1;

        /*
        duplicateType:通过方式
            1: 单人审批
            2: 最小通过人数
            3: 最小通过百分比
            4: 全部通过
            duplicateNum: 审批阀值

        mmdId
            1:提交,同意
            2:重新提交
            0:退回
            8:取消
        */


        //判断审批人数校验
        if (s_node.duplicateType === undefined) {
            s_node.duplicateType = 1;
        }

        if (s_node.duplicateType == 1) {  //单人审批
            mmdId = submit.mmdId;
        } else {
            var mmdId_1 = 0;
            var mmdId_2 = 0;
            var mmdId_0 = 0;
            var mmdId_8 = 0;
            for (var j = 0; j < s_node.users.length; j++) {
                if (!(s_node.users[j].mmdId === undefined)) {
                    if (s_node.users[j].mmdId == 1) {
                        mmdId_1++;
                    } else if (s_node.users[j].mmdId == 2) {
                        mmdId_2++;
                    } else if (s_node.users[j].mmdId == 0) {
                        mmdId_0++;
                    } else if (s_node.users[j].mmdId == 8) {
                        mmdId_8++;
                    }
                }
            }

            if (s_node.duplicateType == 2) {  //最小通过人数
                if (s_node.duplicateNum > s_node.users.length) {
                    s_node.duplicateNum = s_node.users.length;
                }

                if (s_node.duplicateNum <= 1 || s_node.users.length == 1) {
                    mmdId = submit.mmdId;
                } else {
                    if (mmdId_1 >= s_node.duplicateNum) {
                        mmdId = 1;
                    } else if ((mmdId_2 + mmdId_0 + mmdId_8) > 0 && ((mmdId_2 + mmdId_0 + mmdId_8) >
                        (s_node.users.length - s_node.duplicateNum))) {
                        if (mmdId_2 > 0) {
                            mmdId = 2;
                        } else if (mmdId_0 > 0) {
                            mmdId = 0;
                        } else if (mmdId_8 > 0) {
                            mmdId = 8;
                        }
                    }
                }
            } else if (s_node.duplicateType == 3) {  //最小通过百分比
                if (s_node.duplicateNum > 100) {
                    s_node.duplicateNum = 100;
                }

                if (s_node.users.length == 1) {
                    mmdId = submit.mmdId;
                } else {
                    if ((mmdId_1 * 100 / s_node.users.length) >= s_node.duplicateNum) {
                        mmdId = 1;
                    } else if ((mmdId_2 + mmdId_0 + mmdId_8) > 0 &&
                        (((mmdId_2 + mmdId_0 + mmdId_8) * 100 / s_node.users.length) >
                            (100 - s_node.duplicateNum))) {
                        if (mmdId_2 > 0) {
                            mmdId = 2;
                        } else if (mmdId_0 > 0) {
                            mmdId = 0;
                        } else if (mmdId_8 > 0) {
                            mmdId = 8;
                        }
                    }
                }
            } else if (s_node.duplicateType == 4) {  //全部通过
                if (s_node.users.length == 1) {
                    mmdId = submit.mmdId;
                } else {
                    if (mmdId_1 == s_node.users.length) {
                        mmdId = 1;
                    } else if ((mmdId_2 + mmdId_0 + mmdId_8) > 0) {
                        if (mmdId_2 > 0) {
                            mmdId = 2;
                        } else if (mmdId_0 > 0) {
                            mmdId = 0;
                        } else if (mmdId_8 > 0) {
                            mmdId = 8;
                        }
                    }
                }
            }
        }

        if (mmdId == -1) {
            callback({
                error: 0,
                info: "ok",
                wf: data
            });
            return;
        }

        submit.mmdId = mmdId;
        var res = $_yqFlow.submitLines(data, submit);
        if (res.error != 0) {
            callback({
                error: 99,
                info: res.info
            });
            return;
        }

        s_node.todo = 9;
        s_node.e_time = _time;

        data.info.params = res.params;
        var eval_todos = res.todos;

        //退回，记录执行次数+1
        if (mmdId == 2) {
            data.info.onNum = (data.info.onNum === undefined ? 2 : (data.info.onNum + 1));
        }


        var node_keys = [];

        //线完成
        to_link(eval_todos, 0, function (res) {
            if (res.error == 0) {
                res.wf = data;
            }
            callback(res);
        });

        //线处理
        function to_link(links, index, _callback) {
            if (links.length == index) {
                _callback({
                    error: 0,
                    info: "ok"
                });
                return;
            }

            if (data.info.wfstate == 8 || data.info.wfstate == 9) {
                _callback({
                    error: 0,
                    info: "ok"
                });
                return;
            }

            var from = links[index].from;
            var to = links[index].to;
            for (var i = 0; i < data.link.length; i++) {
                if (data.link[i].from == from && data.link[i].to == to) {
                    data.link[i].todo = 9;
                    break;
                }
            }

            //下一节点
            to_node(to, function (res) {
                if (res.error == 0) {
                    to_link(links, index + 1, _callback);
                } else {
                    _callback(res);
                }
            });
        }

        //线处理
        /*
        主信息：              class
            9000 主信息    
        点：
            9001 开始节点  1
            9002 退回节点  2

            9005 执行节点  5
            9007 程序节点  7
            9006 判断节点  6

            9008 取消节点  8
            9009 结束节点  9

            9010 文档节点
        线
            9099 线
        */

        function to_node(key, _callback) {
            var _node = $_yqFlow.node(data, key);
            if (_node === null) {
                _callback({
                    error: 0,
                    info: "ok"
                });
                return;
            }

            _node.s_time = _time;

            if (_node.class == 1 ||  //开始节点
                _node.class == 2 ||  //退回节点
                _node.class == 5     //审批节点
            ) {
                delete _node.endTime;
                _node.todo = 1;

                //流程状态
                data.info.wfstate = _node.class;

                remove_next(key, function (res) {
                    _callback(res);
                });
            } else if (_node.class == 6) {  //判断节点
                _node.todo = 9;

                //流程状态
                data.info.wfstate = 5;

                //执行判断
                var links_6 = $_yqFlow.toLines(data, key);
                var eval_links_6 = $_yqFlow.evalTodos(links_6, data.info.params);

                to_link(eval_links_6, 0, function (res) {
                    _callback(res);
                });
            } else if (_node.class == 7) {   //程序节点
                _node.todo = 9;

                //流程状态
                data.info.wfstate = 5;

                //执行判断 测试流程默认同意
                var links_7 = $_yqFlow.todos(data, key, 1);
                var eval_links_7 = $_yqFlow.evalTodos(links_7, data.info.params);
                to_link(eval_links_7, 0, function (res) {
                    _callback(res);
                });
            } else if (_node.class == 8 ||   //取消节点
                _node.class == 9) {    //结束节点
                _node.todo = 9;

                //流程状态
                data.info.wfstate = _node.class;

                _callback({
                    error: 0,
                    info: "ok"
                });
            }
        }


        //移除后面线和节点的状态
        function remove_next(key, _callback) {
            var lines = $_yqFlow.toLines(data, key);

            run_lines(0, function (res) {
                _callback(res);
            });

            function run_lines(i, __callback) {
                if (i == lines.length) {
                    __callback({
                        error: 0,
                        info: "ok"
                    });

                    return;
                }

                var node = $_yqFlow.node(data, lines[i].to);
                if (node === null) {
                    __callback({
                        error: 9,
                        info: "节点[key=" + lines[i].to + "]不存在。"
                    });

                    return;
                }

                if (node.class == 5 || node.class == 6 ||
                    node.class == 7) {
                    for (var j = 0; j < node_keys.length; j++) {
                        if (node_keys[j] == node.key) {
                            __callback({
                                error: 9,
                                info: "节点[" + node.text + "]存在递归，请检查流程。"
                            });

                            return;
                        }
                    }

                    node_keys.push(lines[i].to);
                }


                //终点为退回开始、节点，保留线的状态
                if (!(node.class == 1 || node.class == 2)) {
                    delete lines[i].todo;
                    delete node.todo;
                }

                if (node.class == 1 || node.class == 2 || node.class == 5) {
                    delete node.s_time;
                    delete node.e_time;
                    for (var j = 0; j < node.users.length; j++) {
                        if (!(node.users[j].mmdId === undefined)) {
                            delete node.users[j].mmdId;
                            delete node.users[j].e_time;
                            delete node.users[j].checkin;
                        }
                    }
                }

                if (node.class == 5 || node.class == 6 ||
                    node.class == 7) {
                    remove_next(lines[i].to, function (res) {
                        if (res.error == 0) {
                            run_lines(i + 1, __callback);
                        } else {
                            __callback(res);
                        }
                    });
                } else {
                    run_lines(i + 1, __callback);
                }
            }
        }
    },

    getUser_demo: function (parameter, callback) {
        console.log("getUser_demo", parameter);
        callback(
            [{
                id: "1111",
                name: "name111"
            }]
        );
    },
}