const tongji_show = false;   // 是否显示统计信息
const tongji_name = "";
let tongji_url = "http://localhost:8011/";
const tongji_blackicon = "/img/avatar.png";

// 评论编辑器组件
function createCommentEditor(opts) {
    let $div = document.createElement("div");
    $div.className = opts.wrapperClass || "";

    let $textarea = document.createElement("textarea");
    $textarea.className = "textarea";
    $textarea.placeholder = opts.placeholder || "";
    if (opts.textareaHeight) $textarea.style.height = opts.textareaHeight;
    $div.appendChild($textarea);

    let uploadedFiles = [];
    let hasToolbar = opts.showToolbar !== false;
    let self = { $div: $div, $textarea: $textarea, clear: function () { $textarea.value = ""; uploadedFiles = []; $div.querySelectorAll(".preview-item").forEach(function (el) { el.remove(); }); } };

    // 点击外部关闭表情面板
    function setupClosePicker($btn, $picker) {
        let handler = function (e) {
            if (!$btn.contains(e.target) && !$picker.contains(e.target)) {
                $picker.classList.remove("visible");
            }
        };
        document.addEventListener("click", handler);
        return handler;
    }

    if (hasToolbar) {
        let $toolbar = document.createElement("div");
        $toolbar.className = "comment-toolbar";
        $div.appendChild($toolbar);

        // 表情
        let $emojiBtn = document.createElement("button");
        $emojiBtn.type = "button";
        $emojiBtn.className = "toolbar-btn";
        $emojiBtn.textContent = "😊 表情";
        $toolbar.appendChild($emojiBtn);

        let $emojiPicker = document.createElement("div");
        $emojiPicker.className = "emoji-picker";
        emojis.forEach(function (emoji) {
            let $span = document.createElement("span");
            $span.className = "emoji-item";
            $span.textContent = emoji;
            $span.addEventListener("click", function () {
                $textarea.value += this.textContent;
                $textarea.focus();
            });
            $emojiPicker.appendChild($span);
        });
        $toolbar.appendChild($emojiPicker);
        $emojiBtn.addEventListener("click", function () {
            $emojiPicker.classList.toggle("visible");
        });
        setupClosePicker($emojiBtn, $emojiPicker);

        // 图片上传
        let $imgBtn = document.createElement("button");
        $imgBtn.type = "button";
        $imgBtn.className = "toolbar-btn";
        $imgBtn.textContent = "📷 图片";
        $toolbar.appendChild($imgBtn);

        let $fileInput = document.createElement("input");
        $fileInput.type = "file";
        $fileInput.accept = "image/*";
        $fileInput.multiple = true;
        $fileInput.className = "file-input";
        $toolbar.appendChild($fileInput);

        let $preview = document.createElement("div");
        $preview.className = "image-preview";
        $div.appendChild($preview);

        $imgBtn.addEventListener("click", function () { $fileInput.click(); });
        $fileInput.addEventListener("change", function () {
            Array.from(this.files).forEach(function (file) {
                if (file.size > 5 * 1024 * 1024) return;
                uploadedFiles.push(file);
                let reader = new FileReader();
                reader.onload = function (ev) {
                    let $thumb = document.createElement("div");
                    $thumb.className = "preview-item";
                    $thumb.innerHTML = '<img src="' + ev.target.result + '"><span class="preview-remove">&times;</span>';
                    $thumb.querySelector(".preview-remove").addEventListener("click", function () {
                        let idx = uploadedFiles.indexOf(file);
                        if (idx > -1) uploadedFiles.splice(idx, 1);
                        $thumb.remove();
                    });
                    $preview.appendChild($thumb);
                };
                reader.readAsDataURL(file);
            });
            this.value = "";
        });

        // 提示文字行
        let $hintRow = document.createElement("div");
        $hintRow.className = "hint-row";
        let $hintText = document.createElement("span");
        $hintText.className = "hint-text";
        $hintText.textContent = "支持图片（限5MB）";
        $hintRow.appendChild($hintText);
        $div.appendChild($hintRow);
    }

    // 提交按钮
    let $btn = document.createElement("button");
    $btn.className = "submit";
    $btn.textContent = opts.btnText || "提交";
    if (opts.btnStyle) $btn.style.cssText = opts.btnStyle;
    $div.appendChild($btn);

    $btn.addEventListener("click", async function () {
        let comment = $textarea.value.trim();
        if (!comment) return;

        if (opts.onSubmit) {
            await opts.onSubmit(comment, uploadedFiles, self);
        }
    });

    return self;
}

window.onload = async function () {
    if (!tongji_url.endsWith("/")) {
        tongji_url += "/";
    }

    let res = await getLoginState();
    console.log("res", res);
    let usertag = null;

    const navLogin = document.querySelector('.nav-login');

    if (navLogin) {
        let h = '';
        if (res.error == 0) {
            h += '    <li class="nav-item dropdown">';
            let iconHtml = res.row.icon ? '<img src="' + res.row.icon + '" alt="avatar" style="width:20px;height:20px;border-radius:50%">' : '<i class="bi bi-person-circle"></i>';
            console.log("iconHtml", iconHtml);
            h += '        <a href="javascript:void(0)" class="nav-link dropdown-toggle" role="button" data-bs-toggle="dropdown" aria-expanded="false">' + iconHtml + ' ' + res.row.name + '</a>';
            h += '        <ul class="dropdown-menu dropdown-menu-end">';
            h += '            <li><a class="dropdown-item" href="/account/" target="_blank" title="会员中心">会员中心</a></li>';
            h += '            <li><a class="dropdown-item" href="javascript:void(0)" onclick="userlogout();return false;" title="退出登录"><i class="bi bi-box-arrow-right"></i> 退出</a></li>';
            h += '        </ul>';
            h += '    </li>';

            if (res.row.admin) {
                let _div = document.createElement('div');
                //获取路径地址（不含域名）
                let url = window.location.pathname;
                if (url.lastIndexOf(".html") === -1) {
                    url += "index.html";
                }
                console.log(url);
                _div.style = 'position: fixed;top: 0px;right: 0px;z-index: 9998;';
                _div.innerHTML = '<a href="javascript:_modal_file_edit(\'/adp/cms/edit.html?path=' + encodeURIComponent(url) + '\');" title="模板编辑"><img style="width:130px;" src="/adp/cms/page_edit.png"></a>';
                _div.id = 'adminedit_div';
                document.body.appendChild(_div);
            }

            usertag = res.row.usertag;
        } else {
            h += '    <li>';
            h += '        <a href="javascript:void(0)" onclick="userlogin();return false;" title="用户登录" target="_Blank">登录</a>';
            h += '    </li>';
        }
        document.querySelector('.nav-login').innerHTML = h;
    }

    //console.log("login_state", res);
    if (!tongji_show) {
        return;
    }
    await setTongjiView(res.cookieid, usertag);
    await getTongjiList(res.cookieid, usertag);
    await getTongjiComment(res.cookieid, usertag);
}

//获取登录状态
async function getLoginState() {
    try {
        const formData = new FormData();
        formData.append('action', 'loginstate');

        const response = await fetch('/_login.html', {
            method: 'POST',
            body: formData
        });
        return await response.json();
    } catch (error) {
        console.error('getLoginState error:', error);
        return {
            error: 99,
            info: error.message || String(error)
        };
    }
}

// 常用表情列表
const emojis = ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "🤥", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤮", "🥴", "😵", "🤯", "🥳", "😎", "🧐", "😕", "😟", "🙁", "😮", "😯", "😲", "😳", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "💀", "☠️", "💩", "🤡", "👍", "👎", "👊", "✊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✌️", "🤞", "💪", "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "💖", "💝", "✨", "🌟", "⭐", "🔥", "💯"];

//设置统计数量信息
async function setTongjiView(cookieid, usertag) {
    const tongjiAll = document.querySelector('.uieip-tongji-all');
    const tongjiView = document.querySelector('.uieip-tongji-view');

    if (!tongjiAll && !tongjiView) {
        return;
    }

    const res = await tongjiAction(cookieid, usertag, {
        action: "view",
    });
    if (res.error !== 0) {
        console.error("访问统计已提交失败", res);
    }

    if (tongjiAll) {
        tongjiAll.style.display = "block";
        tongjiAll.querySelector(".view").innerHTML = res.error === 0 ? res.total : "0";
    }
    if (tongjiView) {
        tongjiView.style.display = "block";
        tongjiView.querySelector(".view").innerHTML = res.error === 0 ? res.view : "0";
    }
}

//提交统计信息
async function tongjiAction(cookieid, usertag, data, images) {
    if (!data.action) {
        return { error: 1, info: "action不能为空" };
    }
    const action = data.action;
    if (action !== "view") {
        let res = await getLoginState();
        if (res.error !== 0) {
            console.error("登录状态获取失败", res);
            return { error: 1, info: "登录状态获取失败" };
        }
    }

    if (!_tongji.url) {
        return { error: 1, info: "url不能为空" };
    }
    if (!cookieid) {
        return { error: 1, info: "cookieid不能为空" };
    }
    if (!document.title) {
        return { error: 1, info: "title不能为空" };
    }

    let logmsg = {};
    if (action === "view") {
        logmsg = {
            ...data,
            name: tongji_name,
            url: _tongji.url,
            cookieid: cookieid,
            title: document.title,
            ...(_tongji.tbtag && { tbtag: _tongji.tbtag }),
            ...(_tongji.tid && { tid: _tongji.tid }),
            ...(usertag && { usertag: usertag }),
        };
    } else {
        logmsg = {
            ...data,
            name: tongji_name,
            url: _tongji.url,
            cookieid: cookieid,
            ...(usertag && { usertag: usertag }),
        };
    }

    let formData = new FormData();
    formData.append("action", action);
    formData.append("json", JSON.stringify(logmsg));
    if (images && images.length > 0) {
        images.forEach(function (file, i) {
            formData.append("images[" + i + "]", file);
        });
    }
    let fetchOpts = {
        method: "POST",
        body: formData,
    };

    const res = await (await fetch(tongji_url + "_tongji.html", fetchOpts)).json();

    return res;
}

//获取统计数量信息
async function getTongjiList(cookieid, usertag) {
    const tongjiList = document.querySelectorAll('.uieip-tongji-list');
    if (tongjiList.length === 0) {
        return;
    }

    const _list = [];
    tongjiList.forEach((item) => {
        item.style.display = "block";
        _list.push({
            action: item.dataset.type.split(","),
            url: item.dataset.link,
        });
    });

    const logmsg = {
        name: tongji_name,
        rows: _list,
    };
    if (usertag) {
        logmsg.usertag = usertag;
    }

    let formData = new FormData();
    formData.append("action", "infos");
    formData.append("json", JSON.stringify(logmsg));

    const res = await (await fetch(tongji_url + "_tongji.html", {
        method: "POST",
        body: formData,
    })).json();

    //console.log(res);
    if (res.error !== 0) {
        return;
    }

    // 构建 link->DOM 映射，同时缓存已切分的 actions，避免重复 split
    const linkMap = new Map();
    tongjiList.forEach((el) => {
        linkMap.set(el.dataset.link, {
            el: el,
            actions: el.dataset.type.split(","),
        });
    });

    for (let i = 0; i < res.rows.length; i++) {
        const _item = res.rows[i];
        const entry = linkMap.get(_item.url);
        if (!entry) {
            continue;
        }

        const _item2 = entry.el;
        const _action = entry.actions;
        const _status = _item2.dataset.status;

        for (let j = 0; j < _action.length; j++) {
            const actionName = _action[j];
            const _item3 = _item2.querySelector('.' + actionName);
            if (!_item3) {
                continue;
            }

            // 防止服务端未返回对应 value 时显示 "undefined"
            _item3.innerHTML = _item.value[actionName] ?? "";

            if (actionName === "view") {
                continue;
            }

            if (usertag) {
                _item3.classList.toggle("active", !!_item.value["s_" + actionName]);

                // 状态非 active 时跳过交互逻辑
                if (_status !== "active") {
                    _item3.style.cursor = "default";
                    continue;
                }

                if (actionName === "comment") {
                    continue;
                }

                _item3.style.cursor = "pointer";

                // 通过克隆替换移除旧监听器，绑定新事件
                const clone = _item3.cloneNode(true);
                _item3.parentNode.replaceChild(clone, _item3);
                clone.addEventListener("click", async (e) => {
                    const target = e.currentTarget;
                    const action = target.classList.contains("like") ? "like" : "fav";
                    const action_add = (target.classList.contains("active") ? "un" : "") + action;
                    const res2 = await tongjiAction(cookieid, usertag, {
                        action: action_add,
                    });
                    //console.log(res2);

                    if (res2.error === 0) {
                        target.classList.toggle("active", !!res2.status);
                        target.innerHTML = res2[action];
                    } else {
                        console.log(res2);
                    }
                });
            } else {
                _item3.classList.remove("active");
                if (actionName === "comment") {
                    continue;
                }

                _item3.style.cursor = "pointer";

                const clone = _item3.cloneNode(true);
                _item3.parentNode.replaceChild(clone, _item3);
                clone.addEventListener("click", async () => {
                    userlogin();
                });
            }
        }
    }
}

/**
 * 获取评论列表
 * 
 *     const _files = [
        {
            "sto_type": 2,
            "sto_name": "sqlite",
            "name": "知识库.png",
            "size": 2828311,
            "type": "image/png",
            "sid": "e7c5bb7f-7acd-11f1-a366-00155d96c0e3"
        }
    ];
 
    let res = {
        error: 0,
        info: "success",
        comment: 8,
        rows: [
            {
                sid: "id-1",
                comment: {
                    text: "这是一个评论。。。",
                    files: [{
                        "src": "/uploads/tongji/demo.jpg"
                    }]
                },
                m_time: "2023-08-01 10:00:00",
                username: "用户1",
                userpic: "http://localhost:8011/images/userdemo.png",
                subs: [
                    {
                        sid: "id-1-1",
                        comment: {
                            text: "这是一个回复。。。",
                            files: [{
                                "src": "/uploads/tongji/demo.jpg"
                            }]
                        },
                        m_time: "2023-08-01 10:00:00",
                        username: "用户2",
                        userpic: "http://localhost:8011/images/userdemo.png",
                    },
                    {
                        sid: "id-1-2",
                        comment: {
                            text: "这是一个回复。。。",
                            files: _files
                        },
                        m_time: "2023-08-01 10:00:00",
                        username: "用户3",
                        userpic: "http://localhost:8011/images/userdemo.png",
                    },
                ]
            }, {
                sid: "id-2",
                comment: {
                    text: "这是一个评论。。。",
                    files: [{
                        "src": "uploads/tongji/demo.jpg"
                    }]
                },
                m_time: "2023-08-01 10:00:00",
                userpic: "http://localhost:8011/images/userdemo.png",
                username: "用户2"
            }, {
                sid: "id-3",
                comment: {
                    text: "这是一个评论。。。",
                    files: _files
                },
                m_time: "2023-08-01 10:00:00",
                userpic: "http://localhost:8011/images/userdemo.png",
                username: "用户3",
                subs: [
                    {
                        sid: "id-4",
                        comment: {
                            text: "这是一个评论。。。",
                            files: _files
                        },
                        m_time: "2023-08-01 10:00:00",
                        userpic: "http://localhost:8011/images/userdemo.png",
                        username: "用户1",
                    },
                ]
            }
        ],
    };
 */
async function tongjiComments(cookieid, usertag, pageno) {
    let formData = new FormData();
    const logmsg = {
        name: tongji_name,
        action: "comments",
        url: _tongji.url,
        cookieid: cookieid,
        ...(usertag && { usertag: usertag }),
    };
    formData.append("json", JSON.stringify(logmsg));
    formData.append("pageno", pageno);
    let fetchOpts = {
        method: "POST",
        body: formData,
    };

    const res = await (await fetch(tongji_url + "_tongji.html?action=comments", fetchOpts)).json();

    return res;
}

let tongji_res = {};
let tongjiComment = null;
let tongjiTitle = null;
let tongjiMainList = null;

async function getTongjiComment(cookieid, usertag) {
    tongjiComment = document.querySelector('.uieip-tongji-comment');
    if (!tongjiComment) {
        return;
    }

    tongjiComment.style.display = "block";
    tongjiComment.innerHTML = "";

    const res = await tongjiComments(cookieid, usertag, 1);

    console.log(res);

    tongji_res = res;

    renderTongjiComment(cookieid, usertag);
}

async function renderTongjiComment(cookieid, usertag) {
    tongjiComment.innerHTML = "";
    if (tongji_res.error !== 0) {
        console.log(tongji_res);
        return;
    }

    let $c_title = document.createElement("h3");
    $c_title.classList.add("listtitle");
    tongjiComment.appendChild($c_title);
    tongjiTitle = $c_title;
    setTongjiComment_title();

    if (usertag) {
        let $editor = createCommentEditor({
            placeholder: "请输入评论内容",
            btnText: "发表评论",
            wrapperClass: "comment-editor",
            onSubmit: async function (comment, images) {
                let _comment = {
                };
                if (comment) {
                    _comment.text = comment;
                }
                //console.log("评论内容:", { comment: _comment, images: images });

                const res2 = await tongjiAction(cookieid, usertag, {
                    action: "comment",
                    data: {
                        comment: _comment
                    }
                }, images);
                //console.log(res2);

                if (res2.error === 0) {
                    tongji_res.comment = res2.comment;
                    setTongjiComment_title();
                    tongji_res.total++;
                    tongji_res.rows.unshift(res2.row);

                    let $item = document.createElement("div");
                    $item.className = "list-group-item";
                    // 评论列表,追加到第一个位置
                    tongjiMainList.insertBefore($item, tongjiMainList.firstChild);
                    setTongjiComment_row(cookieid, usertag, $item, res2.row);

                } else {
                    showCommentError($editor.$div, res2.info);
                }
            }
        });
        tongjiComment.appendChild($editor.$div);
    }

    let $c_list = document.createElement("div");
    $c_list.classList.add("list-group");
    tongjiComment.appendChild($c_list);

    tongjiMainList = $c_list;

    if (tongji_res.error !== 0) {
        console.log(tongji_res);
        return;
    }

    setTongjiComment(cookieid, usertag, $c_list, tongji_res.rows);

    let totalPage = Math.ceil(tongji_res.total / tongji_res.pagesize);
    if (tongji_res.pageno >= totalPage) {
        return;
    }
    let $viewmore = document.createElement("div");
    $viewmore.classList.add("viewmore");
    let $viewmore_link = document.createElement("a");
    $viewmore_link.href = "javascript:void(0)";
    $viewmore_link.innerHTML = "查看更多...";
    $viewmore.appendChild($viewmore_link);
    const handleViewMore = async function () {
        const res = await tongjiComments(cookieid, usertag, tongji_res.pageno + 1);
        console.log(res);
        if (res.error !== 0) {
            console.log(res);
            return;
        }

        tongji_res.comment = res.comment;
        tongji_res.pageno = res.pageno;
        tongji_res.pagesize = res.pagesize;
        tongji_res.total = res.total;

        tongji_res.rows.push(...res.rows);

        if (tongji_res.pageno >= totalPage) {
            $viewmore_link.removeEventListener("click", handleViewMore);
            $viewmore_link.classList.add("disabled");
            $viewmore_link.innerHTML = "没有更多了";
        }

        setTongjiComment(cookieid, usertag, tongjiMainList, res.rows);
    };
    $viewmore_link.addEventListener("click", handleViewMore);

    tongjiComment.appendChild($viewmore);
}

function setTongjiComment_title() {
    tongjiTitle.innerHTML = "评论 " + tongji_res.comment;
}

function setTongjiComment(cookieid, usertag, $list, rows) {
    rows.forEach((row) => {
        let $item = document.createElement("div");
        $item.className = "list-group-item";

        $list.appendChild($item);
        setTongjiComment_row(cookieid, usertag, $item, row);
    });
}

function setTongjiComment_row(cookieid, usertag, $item, row) {
    $item.innerHTML = "";

    $item.className = "list-group-item";
    let _html = `
        <div class="row">`;

    console.log("setTongjiComment_row:", row);

    if (row.userpic) {
        _html += `  <img src="${tongji_url + row.userpic}" alt="${escapeHtml(row.username)}" class="avatar"/>`;
    } else {
        _html += `  <img src="${tongji_url + tongji_blackicon}" alt="${escapeHtml(row.username)}" class="avatar"/>`;
    }
    _html += `  <div class="content">
            <div class="header">
              <span class="username">${escapeHtml(row.username)}</span>
              <span class="time">${escapeHtml(row.m_time)}</span>
              `;
    if (usertag) {
        _html += `      <span class="dianzan glyphicon glyphicon-thumbs-up"></span>
                      <div class="dropdown">
            <button class="btn btn-default btn-xs dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
              <span class="bi bi-caret-down-fill"></span>
            </button>
            <ul class="dropdown-menu dropdown-menu-end">
              <li><a href="javascript:void(0)" class="dropdown-item reply-btn">回复</a></li>${row.iscu ? `
              <li><a href="javascript:void(0)" class="dropdown-item delete-btn">删除</a></li>` : ''}
            </ul>
          </div>`;
    } else {
        _html += `      <span class="dianzan glyphicon glyphicon-thumbs-up"></span>
      `;
    }
    _html += `    </div>`;
    if (row.comment && row.comment.text) {
        _html += `    <div class="text">${escapeHtml(row.comment.text)}</div>`;
    }
    if (row.comment && row.comment.files && row.comment.files.length > 0) {
        _html += `    <div class="comment-files">`;
        row.comment.files.forEach(function (file) {
            let url = getFileLink(file);
            if (url) {
                _html += `<img src="${url}" alt="评论图片" class="comment-image" />`;
            }
        });
        _html += `    </div>`;
    }
    _html += `  </div>
        </div>`;

    $item.innerHTML = _html;

    // 图片点击预览
    $item.querySelectorAll(".comment-image").forEach(function ($img) {
        $img.addEventListener("click", function () {
            openImagePreview($img.src, $img.alt);
        });
    });

    if (usertag) {
        let $replyBtn = $item.querySelector(".reply-btn");
        let sid = row.sid;
        let username = row.username;
        $replyBtn.addEventListener("click", function (e) {
            let $replyArea = $item.querySelector(".reply-area");
            if ($replyArea) {
                $replyArea.remove();
            } else {
                let $editor = createCommentEditor({
                    placeholder: "回复 " + username + "...",
                    btnText: "回复",
                    wrapperClass: "reply-area",
                    textareaHeight: "60px",
                    onSubmit: async function (comment, images, editor) {
                        let _comment = {
                        };
                        if (comment) {
                            _comment.text = comment;
                        }

                        editor.clear();
                        const res2 = await tongjiAction(cookieid, usertag,
                            {
                                action: "comment",
                                data: {
                                    cid: sid,
                                    comment: _comment,
                                },
                            }, images);

                        if (res2.error === 0) {
                            tongji_res.comment = res2.comment;
                            setTongjiComment_title();

                            if (!row.subs) {
                                row.subs = [];
                            }
                            row.subs.unshift(res2.row);
                            setTongjiComment_row(cookieid, usertag, $item, row);

                        } else {
                            showCommentError(editor.$div, res2.info, function () {
                                if (editor.$div.parentNode) editor.$div.remove();
                            });
                        }
                    }
                });
                $item.querySelector(".content").appendChild($editor.$div);
            }
        });

        // 下拉菜单打开时隐藏回复编辑框
        $item.querySelector(".dropdown > .dropdown-toggle").addEventListener("mousedown", function () {
            let $replyArea = $item.querySelector(".reply-area");
            if ($replyArea) $replyArea.remove();
        });

        if (row.iscu) {
            let $deleteBtn = $item.querySelector(".delete-btn");
            $deleteBtn.addEventListener("click", function (e) {
                showConfirm({
                    title: "确认删除",
                    content: "确认删除此评论？",
                    confirmText: "确认删除",
                    confirmClass: "btn-danger",
                    target: $deleteBtn,
                    offsetX: -15,
                    offsetY: -58,
                    onConfirm: async function () {
                        const res2 = await tongjiAction(cookieid, usertag,
                            {
                                action: "uncomment",
                                data: {
                                    sid: row.sid,
                                    comment: {
                                        cid: row.cid,
                                        isdel: true,
                                    }
                                }
                            }
                        );

                        //console.log(res2);
                        if (res2.error === 0) {
                            tongji_res.comment = res2.comment;
                            setTongjiComment_title();
                            $item.remove();
                        } else {
                            showCommentError($item, res2.info, function () {
                                if ($item.parentNode) $item.remove();
                            });
                        }
                    }
                });
            });
        }
    }

    $item.querySelectorAll(".dianzan").forEach(function ($dianzan) {
        $dianzan.textContent = row.like || "点赞";
        if (!usertag) {
            $dianzan.title = "点赞";
            $dianzan.addEventListener("click", async function () {
                userlogin();
            })
            return;
        }

        $dianzan.title = row.islike ? "取消点赞" : "点赞";
        $dianzan.classList.toggle("active", row.islike);

        $dianzan.addEventListener("click", async function () {
            const action = row.islike ? "com-unlike" : "com-like";
            const res2 = await tongjiAction(cookieid, usertag, {
                action: action,
                data: { sid: row.sid }
            });

            if (res2.error === 0) {
                row.islike = res2.status;
                row.like = res2.like;
                $dianzan.textContent = res2.like || "点赞";
                $dianzan.title = res2.status ? "取消点赞" : "点赞";
                $dianzan.classList.toggle("active", res2.status);
            } else {
                showCommentError($item, res2.info, function () {
                    if ($item.parentNode) $item.remove();
                });
            }
        });
    });

    if (row.subs && row.subs.length > 0) {
        let $c_list = document.createElement("div");
        $c_list.className = "list-group children";
        $item.appendChild($c_list);

        setTongjiComment(cookieid, usertag, $c_list, row.subs);
    }
}

// 取得文件连接
function getFileLink(data) {
    if (!data) {
        return undefined;
    }
    if (data.src) {
        return tongji_url + (data.src.startsWith("/") ? data.src.slice(1) : data.src);
    }
    if (typeof data.sto_name === 'undefined' || typeof data.sid === 'undefined') {
        return undefined;
    }

    if (data.sto_type === 1) {
        return `!${data.sto_name}_${data.sid}`;
    } else if (data.sto_type === 2) {
        return `@${data.sto_name}_${data.sid}`;
    }
    return undefined;
}

function escapeHtml(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

// 在编辑器容器中显示错误提示，完成后执行 cleanup
function showCommentError($container, msg, cleanup) {
    var $err = $container.querySelector('.comment-error');
    if (!$err) {
        $err = document.createElement('div');
        $err.className = 'comment-error alert alert-danger alert-dismissible';
        $err.innerHTML = '<button type="button" class="close" data-dismiss="alert">&times;</button><span></span>';
        $container.appendChild($err);
    }
    $err.querySelector('span').textContent = msg;

    function dismiss() {
        if ($err.parentNode) $err.remove();
        if (cleanup) cleanup();
    }
    $err.querySelector('.close').addEventListener('click', dismiss);
    setTimeout(dismiss, 5000);
}

// 确认弹框，target 为空时居中弹框，否则在 target 下方弹出；offsetX/offsetY 微调位置
function showConfirm(_ref2) {
    var title = _ref2.title,
        content = _ref2.content,
        confirmText = _ref2.confirmText,
        confirmClass = _ref2.confirmClass,
        target = _ref2.target,
        offsetX = _ref2.offsetX,
        offsetY = _ref2.offsetY,
        onConfirm = _ref2.onConfirm;

    if (target) {
        // 在 target 下方弹出确认框
        var rect = target.getBoundingClientRect();
        var popoverEl = document.createElement('div');
        popoverEl.className = 'confirm-popover';
        popoverEl.style.top = (rect.bottom + (offsetY || 4)) + 'px';
        popoverEl.style.left = (rect.left + (offsetX || 0)) + 'px';
        popoverEl.innerHTML = '<div class="confirm-content">' + content + '</div>' +
            '<div class="confirm-actions">' +
            '<button type="button" class="btn btn-default btn-xs">取消</button>' +
            '<button type="button" class="btn ' + (confirmClass || 'btn-primary') + ' btn-xs confirm-btn">' + confirmText + '</button>' +
            '</div>';

        // 点击外部关闭
        function outsideClick(e) {
            if (!popoverEl.contains(e.target) && e.target !== target) {
                popoverEl.remove();
                document.removeEventListener('click', outsideClick, true);
            }
        }
        document.addEventListener('click', outsideClick, true);

        popoverEl.querySelector('.btn-default').addEventListener('click', function () {
            popoverEl.remove();
            document.removeEventListener('click', outsideClick, true);
        });
        popoverEl.querySelector('.confirm-btn').addEventListener('click', function () {
            popoverEl.remove();
            document.removeEventListener('click', outsideClick, true);
            if (onConfirm) onConfirm();
        });

        document.body.appendChild(popoverEl);
        return;
    }

    // 无 target 时使用居中 Modal
    var modalId = 'confirm_' + Date.now();
    var backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) backdrop.remove();
    var modalHtml = '<div class="modal fade" id="' + modalId + '" tabindex="-1">' +
        '<div class="modal-dialog modal-sm">' +
        '<div class="modal-content">' +
        '<div class="modal-header">' +
        '<button type="button" class="close" data-dismiss="modal">&times;</button>' +
        '<h4 class="modal-title">' + title + '</h4>' +
        '</div>' +
        '<div class="modal-body"><p>' + content + '</p></div>' +
        '<div class="modal-footer">' +
        '<button type="button" class="btn btn-default" data-dismiss="modal">取消</button>' +
        '<button type="button" class="btn ' + (confirmClass || 'btn-primary') + ' confirm-btn">' + confirmText + '</button>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>';
    var modalEl = document.createElement('div');
    modalEl.innerHTML = modalHtml;
    document.body.appendChild(modalEl.firstChild);
    $('#' + modalId).modal('show').on('shown.bs.modal', function () {
        document.querySelector('#' + modalId + ' .confirm-btn').addEventListener('click', function () {
            $('#' + modalId).modal('hide');
            if (onConfirm) onConfirm();
        });
    }).on('hidden.bs.modal', function () {
        $('#' + modalId).remove();
    });
}

/**
 * 打开图片预览（公告、评论等通用）
 * @param {string} src  - 图片 URL
 * @param {string} alt  - 图片描述
 */
function openImagePreview(src, alt) {
    let overlay = document.createElement("div");
    overlay.className = "image-preview-overlay";
    let $img = document.createElement("img");
    $img.src = src;
    $img.alt = alt || "";
    overlay.appendChild($img);
    document.body.appendChild(overlay);

    let closePreview = function () { overlay.remove(); };
    overlay.addEventListener("click", closePreview);
    $img.addEventListener("click", function (e) { e.stopPropagation(); });
    document.addEventListener("keydown", function handler(e) {
        if (e.key === "Escape") { closePreview(); document.removeEventListener("keydown", handler); }
    });
}

//页面编辑（纯JS）
function _modal_file_edit(url) {
    var _old_overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    //隐藏右上角的"模板编辑"入口，避免遮挡弹窗
    var adminEditDiv = document.getElementById("adminedit_div");
    if (adminEditDiv) {
        adminEditDiv.style.display = "none";
    }

    var m_edit = document.querySelector(".modal_file_edit");
    if (!m_edit) {
        document.body.insertAdjacentHTML("beforeend", `
                <div class="modal fade modal_file_edit">
                    <div class="modal-dialog" style="float: right;width: 900px;max-width: initial;margin:0">
                        <div class="modal-content" style="border-radius: 0;width: 900px;height:900px;z-index: 9999;">
                        </div>
                    </div>
                </div>`);
        m_edit = document.querySelector(".modal_file_edit");
    }
    var _w = Math.min(window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth, 900);
    var _h = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

    m_edit.style.overflow = "hidden";
    var modalContent = m_edit.querySelector(".modal-content");
    modalContent.style.width = _w + "px";
    modalContent.style.height = _h + "px";

    modalContent.innerHTML = '<iframe src="' + url + '" style="width: 100%;height:100%;"></iframe>';

    var modalInstance = null;
    var backdropEl = null;

    //点击模态框外部区域关闭
    m_edit.addEventListener("click", function (e) {
        if (e.target === m_edit) {
            if (modalInstance) {
                modalInstance.hide(); // Bootstrap 路径：让 Bootstrap 自行清理 backdrop
            } else {
                _closeModal();
            }
        }
    });

    function _closeModal() {
        document.body.style.overflow = _old_overflow;
        document.body.classList.remove("modal-open");
        if (adminEditDiv) {
            adminEditDiv.style.display = "";
        }
        if (backdropEl) {
            backdropEl.remove();
            backdropEl = null;
        }
        document.querySelectorAll('.modal-backdrop').forEach(function (el) {
            el.remove();
        });
        m_edit.remove();
    }

    m_edit.addEventListener('hidden.bs.modal', _closeModal);

    if (typeof bootstrap !== "undefined" && bootstrap.Modal) {
        modalInstance = new bootstrap.Modal(m_edit, { backdrop: true, keyboard: true });
        modalInstance.show();
    } else {
        m_edit.classList.add("in");
        m_edit.style.display = "block";
        document.body.classList.add("modal-open");
        backdropEl = document.createElement("div");
        backdropEl.className = "modal-backdrop fade in";
        backdropEl.addEventListener("click", function () {
            _closeModal();
        });
        document.body.appendChild(backdropEl);
    }
}

//登录
function userlogin() {
    var backurl = window.document.location.href;
    window.top.location = "/login/login.html?backurl=" + encodeURIComponent(backurl);
}

//退出
function userlogout() {
    var backurl = window.document.location.href;
    window.top.location = "/login/logout.html?backurl=" + encodeURIComponent(backurl);
}