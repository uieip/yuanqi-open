jQuery.extend({
    // 统一的 AJAX 请求配置
    _request: function (action, data, callback) {
        $.ajax({
            method: "POST",
            url: "/_login.html",
            dataType: "json",
            data: { action, ...data },
            success: callback,
            error: function (xhr, status, error) {
                callback({ error: 99, info: error });
            }
        });
    },
    // 获取url参数
    urlRequest: function (param) {
        if (!param) return null;

        const url = new URL(location.href.replace(/#$/, ''));
        return url.searchParams.get(param.toLowerCase());
    },
    // 登录
    login: function (opts, callback) {
        const options = {
            loginName: "",
            passwd: "",
            captcha: "",
            ...opts
        };

        const handlePreLogin = (res) => {
            if (res.error !== 0) {
                return callback(res);
            }
            let hashedPasswd = options.passwd;
            if (res.serverSalt) {
                hashedPasswd = PasswordEncoder.hashBase64(options.passwd, res.serverSalt, res.saltType);
            }
            if (res.sessionSalt) {
                hashedPasswd = PasswordEncoder.hashBase64(hashedPasswd, res.sessionSalt, res.saltType);
            }
            this._request("login", { passwd: hashedPasswd }, callback);
        };

        if (!options.mask) {
            this._request("prelogin", {
                loginName: options.loginName,
                captcha: options.captcha
            }, handlePreLogin);
            return;
        }

        // 先验证掩码，成功后继续登录流程
        this._request("checkcode", {
            type: "1",
            mask: options.mask
        }, (res) => {
            if (res.error === 0) {
                this._request("prelogin", {
                    loginName: options.loginName,
                    captcha: options.captcha
                }, handlePreLogin);
            } else {
                callback(res);
            }
        });
    },
    // 登出
    logout: function (callback) {
        this._request("logout", {}, callback);
    },
    // 登录状态
    loginState: function (callback) {
        this._request("loginstate", {}, callback);
    },
    // 修改密码
    upppw: function (opts, callback) {
        const options = {
            passwd: "",
            ...opts
        };

        this._request("upppw", {
            passwd: options.passwd,
            salttype: "SHA256"
        }, callback);
    }
});

/**
 * 密码编码器组件 - 提供多种哈希算法和安全编码功能
 */
class PasswordEncoder {
    /**
     * 哈希函数 - 支持SHA1, SHA256, SHA512，使用URL安全的base64编码
     * @param {string} passwd - 要加密的密码
     * @param {string} salt - 盐值
     * @param {string} hashType - 哈希类型 (SHA1, SHA256, SHA512, YUANQI)
     * @returns {string} 加密后的密码
     */
    static hashBase64(passwd, salt, hashType) {
        if (!salt || !hashType) {
            return passwd;
        }

        switch (hashType) {
            case 'YUANQI':
                // 远齐模式：使用UTF-16小端编码，盐在前，密码在后
                return this.hashYuanqi(passwd, salt);
            case 'SHA256':
            case 'SHA1':
            case 'SHA512':
                // 其他哈希类型
                return this.computeStandardHash(passwd, salt, hashType);
            default:
                return passwd;
        }
    }

    /**
     * 计算标准哈希（SHA1, SHA256, SHA512）
     * @param {string} passwd - 密码
     * @param {string} salt - 盐值
     * @param {string} hashType - 哈希类型
     * @returns {string} URL安全的base64编码哈希值
     */
    static computeStandardHash(passwd, salt, hashType) {
        // 准备数据
        const data = new TextEncoder().encode(passwd + salt);
        const dataStr = new TextDecoder().decode(data);
        let hashHex;
        try {
            // 选择合适的哈希库
            switch (hashType) {
                case 'SHA256':
                    if (!sha256) {
                        return passwd;
                    }
                    hashHex = sha256(dataStr);
                    break;
                case 'SHA1':
                    if (!sha1) {
                        return passwd;
                    }
                    hashHex = sha1(dataStr);
                    break;
                case 'SHA512':
                    if (!sha512) {
                        return passwd;
                    }
                    hashHex = sha512(dataStr);
                    break;
            }

            // 将十六进制哈希转换为二进制字符串
            let binary = '';
            const hashLength = hashHex.length / 2;
            for (let i = 0; i < hashLength; i++) {
                const hexPair = hashHex.substr(i * 2, 2);
                binary += String.fromCharCode(parseInt(hexPair, 16));
            }

            // 使用URL安全的base64编码
            return btoa(binary)
                .replace(/\+/g, '-')
                .replace(/\//g, '_');
        } catch (e) {
            return passwd;
        }
    }

    /**
     * YUANQI模式的哈希实现 - 与test-hash.js中的工作实现保持一致
     * @param {string} passwd - 要加密的密码
     * @param {string} salt - 盐值
     * @returns {string} 标准base64编码的哈希值
     */
    static hashYuanqi(passwd, salt) {
        try {
            // 1. 处理密码：转换为UTF-16小端字节序
            const passBytes = [];
            for (let i = 0; i < passwd.length; i++) {
                const code = passwd.charCodeAt(i);
                passBytes.push(code & 0xFF); // 低位字节
                passBytes.push(code >> 8);   // 高位字节
            }
            // 2. 处理盐值：解码base64
            let saltBytes = [];
            try {
                // 尝试解码整个盐值
                saltBytes = atob(salt).split('').map(c => c.charCodeAt(0));
            } catch (e) {
                // 如果解码失败，使用原始字符
                saltBytes = salt.split('').map(c => c.charCodeAt(0));
            }

            // 3. 创建合并的字节数组 - 盐在前，密码在后
            const combined = new Uint8Array(saltBytes.length + passBytes.length);
            let offset = 0;

            // 先添加盐字节
            for (let i = 0; i < saltBytes.length; i++) {
                combined[offset++] = saltBytes[i];
            }

            // 再添加密码字节
            for (let i = 0; i < passBytes.length; i++) {
                combined[offset++] = passBytes[i];
            }
            // 4. 将字节数组转换为二进制字符串供sha1库使用
            let combinedStr = '';
            for (let i = 0; i < combined.length; i++) {
                combinedStr += String.fromCharCode(combined[i]);
            }

            // 5. 计算SHA-1哈希 - 浏览器环境使用Uint8Array
            const uint8Array = new Uint8Array(combinedStr.length);
            for (let i = 0; i < combinedStr.length; i++) {
                uint8Array[i] = combinedStr.charCodeAt(i);
            }

            const hashHex = sha1(uint8Array);
            // 6. 将十六进制哈希转换为二进制字符串
            let binaryStr = '';
            for (let i = 0; i < 40; i += 2) { // SHA-1固定为20字节 = 40个十六进制字符
                const hexPair = hashHex.substr(i, 2);
                binaryStr += String.fromCharCode(parseInt(hexPair, 16));
            }

            // 7. 返回标准base64编码结果
            return btoa(binaryStr);
        } catch (e) {
            throw e;
        }
    }

    /**
     * 将十六进制字符串转换为ArrayBuffer
     * @param {string} hex - 十六进制字符串
     * @returns {ArrayBuffer} 转换后的ArrayBuffer
     */
    static hexToBuffer(hex) {
        const length = hex.length / 2;
        const buffer = new ArrayBuffer(length);
        const view = new Uint8Array(buffer);

        for (let i = 0; i < length; i++) {
            view[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
        }

        return buffer;
    }
}

// 导出类供其他模块使用
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = PasswordEncoder;
} else if (typeof window !== 'undefined') {
    // 浏览器环境导出
    window.PasswordEncoder = PasswordEncoder;
}