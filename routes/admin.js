const express = require('express');
const router = express.Router();
const adminModel = require("../Model/adminModel");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const Format = require("../js/Format");

// 登录：http://localhost:8089/admins/login
router.post("/login", (req, res) => {
    let user = req.body.user; // 获取对象
    //查询
    adminModel.findAll({
        where: {
            username: user.username
        },
    }).then(data => {
        if (data.length !== 0) { // 表示查询到了数据：用户名存在
            if (data[0].password === user.password) { // 密码相同
                // 合法用户，生成token
                let newToken = jwt.sign({...data[0]}, "zhuangxiu", {
                    expiresIn: 1440 // token的过期时间
                })
                data[0].update({
                    last_login_at: new Date()
                }).then(result => {
                    res.json({
                        status: 201,
                        msg: "更新成功"
                    })
                }).catch(err => {
                    console.log(err);
                })
                // 将token和其他信息打包后响应给客户端
                res.json({
                    status: 200,
                    msg: "登录成功",
                    token: newToken,
                    role: data[0].role, // 待删除
                    data: {
                        username: data[0].username,
                        name: data[0].name,
                        role: data[0].role,
                        last_login_at: data[0].last_login_at.Format("yyyy.MM.dd hh:mm:ss"),
                        created_at: data[0].created_at.Format("yyyy.MM.dd hh:mm:ss"),
                        updated_at: data[0].updated_at.Format("yyyy.MM.dd hh:mm:ss")
                    }
                })
            } else { // 用户名存在,但密码错误
                res.json({
                    status: 403,
                    msg: "密码错误"
                })
            }
        } else { // 没有查询到数据
            res.json({
                code: 400,
                msg: "用户不存在"
            })
        }
    }).catch((err) => {
        console.log(err);
    })
})

// 找回密码验证身份：http://localhost:8089/admins/test
router.post("/test", (req, res) => {
    let user = req.body.user; // {"username":"张三","name":"张三"}
    adminModel.findOne({
        where: {
            username: user.username,
            name: user.name
        }
    }).then(result => {
        if (result == null) {
            res.json({
                status: 404,
                msg: "用户名或真实姓名错误"
            })
        } else {
            res.json({
                status: 200,
                msg: "身份验证成功",
                data: result // 一个对象，查询的这行的信息
            })
        }
    }).catch(err => {
        res.json({
            status: 404,
            msg: "身份验证失败"
        })
        console.log(err);
    })
})

// 找回密码：http://localhost:8089/admins/updatePwd
router.post("/updatePwd", (req, res) => {
    let user = req.body.user;
    let password = req.body.password;
    // let md5 = crypto.createHash("md5");
    // let newPwd = md5.update(password).digest("hex");
    adminModel.findOne({
        where: {
            username: user.username,
            name: user.name
        }
    }).then(person => {
        person.update({
            password: password,
            updated_at: new Date()
        }).then(result => {
            res.json({
                status: 201,
                msg: "修改密码成功"
            })
        }).catch(err => {
            console.log(err);
            res.json({
                status: 422,
                msg: "修改密码失败"
            })
        })
    }).catch(err => {
        res.json({
            status: 404,
            msg: "查询失败"
        })
        console.log(err);
    })
})

// 注册：http://localhost:8089/admins/register
router.post("/register", (req, res) => {
    let user = req.body.user; // 从前端接收到对象
    // let password = user.password; // 将密码解析出来
    // let md5 = crypto.createHash("md5"); // 创建md5对象
    // let newPwd = md5.update(password).digest("hex"); // 新密码
    adminModel.findOne({
        where: {
            username: user.username
        }
    }).then(person => {
        if (person !== null) {
            res.json({
                status: 422,
                msg: "改账户已存在"
            })
        } else {
            adminModel.create({
                id: null,
                username: user.username,
                password: user.password,
                name: user.name,
                role: user.role,
                last_login_at: new Date(),
                created_at: new Date(),
                updated_at: new Date()
            }).then(result => {
                res.json({
                    status: 201,
                    msg: "注册成功"
                })
            }).catch(err => {
                console.log(err);
                res.json({
                    status: 422,
                    msg: "注册失败"
                })
            })
        }
    })
})

// 查询个人信息：http://localhost:8089/admins/one
router.get("/one", (req, res) => {
    let username = req.query.username;
    adminModel.findOne({
        where: {
            username: username
        }
    }).then(result => {
        if (result !== null) {
            res.json({
                status: 200,
                msg: "查找成功",
                data: {
                    username: result.username,
                    name: result.username,
                    role: result.role,
                    last_login_at: result.last_login_at.Format("yyyy.MM.dd hh:mm:ss"),
                    created_at: result.created_at.Format("yyyy.MM.dd hh:mm:ss"),
                    updated_at: result.updated_at.Format("yyyy.MM.dd hh:mm:ss")
                }
            })
        } else {
            res.json({
                status: 404,
                msg: "数据库无此记录"
            })
        }
    }).catch(err => {
        console.log(err);
    })
})

// 修改密码：http://localhost:8089/admins/modifypwd
router.post("/modifypwd", (req, res) => {
    let username = req.body.username; // 获取用户名
    let pwd = req.body.pwd; // 获取原密码+新密码
    adminModel.findOne({
        where: {
            username: username,
            password: pwd.password
        }
    }).then(person => { // 查找出来的用户
        if (person !== null) {
            person.update({
                password: pwd.newPwd,
                updated_at: new Date()
            }).then(result => {
                res.json({
                    status: 201,
                    msg: "修改密码成功"
                })
            })
        } else { // 没有找到当前信息
            res.json({
                status: 404,
                msg: "原密码错误"
            })
        }
    }).catch(err => {
        console.log(err);
    })
})

// 修改用户名：http://localhost:8089/admins/modifyname
router.post("/modifyname", (req, res) => {
    let username = req.body.username;
    let name = req.body.name;
    let newName = req.body.newName;
    if (newName.username == undefined && newName.name == undefined) { // 如果传回来两个空值
        res.json({
            status: 400,
            msg: "请输入要修改的电话号码或真实姓名"
        })
    } else if (newName.username && (newName.name == undefined || newName.name == "")) {
        // 只修改电话号码
        adminModel.findOne({
            where: {
                username: newName.username
            }
        }).then(person => { // 查询新输入的电话号码有没有重复
            if (person !== null) { // 如果查到了这个电话号码
                res.json({
                    status: 422,
                    msg: "该电话号码已经存在了"
                })
            } else { // 没查到，可以更改
                adminModel.findOne({
                    where: {
                        username: username,
                        name: name
                    }
                }).then(result => { // result查询出来的信息
                    result.update({
                        username: newName.username,
                        updated_at: new Date()
                    }).then(info => {
                        res.json({
                            status: 201,
                            msg: "修改电话号码成功",
                            data: {
                                username: info.username,
                                name: info.name,
                                role: info.role,
                                last_login_at: info.last_login_at.Format("yyyy.MM.dd hh:mm:ss"),
                                created_at: info.created_at.Format("yyyy.MM.dd hh:mm:ss"),
                                updated_at: info.updated_at.Format("yyyy.MM.dd hh:mm:ss")
                            }
                        })
                    }).catch(err => {
                        res.json({
                            status: 422,
                            msg: "修改失败"
                        })
                        console.log(err);
                    })
                })
            }
        }).catch(err => {
            res.json({
                status: 422,
                msg: "修改失败"
            })
            console.log(err);
        })
    } else if ((newName.username == undefined || newName.username == "") && newName.name) {
        // 只修改真实姓名
        adminModel.findOne({
            where: {
                username: username,
                name: name
            }
        }).then(person => {
            person.update({
                name: newName.name,
                updated_at: new Date()
            }).then(result => {
                res.json({
                    status: 201,
                    msg: "修改真实姓名成功",
                    data: {
                        username: result.username,
                        name: result.name,
                        role: result.role,
                        last_login_at: result.last_login_at.Format("yyyy.MM.dd hh:mm:ss"),
                        created_at: result.created_at.Format("yyyy.MM.dd hh:mm:ss"),
                        updated_at: result.updated_at.Format("yyyy.MM.dd hh:mm:ss")
                    }
                })
            }).catch(err => {
                res.json({
                    status: 422,
                    msg: "修改失败"
                })
                console.log(err);
            })
        }).catch(err => {
            res.json({
                status: 422,
                msg: "修改失败"
            })
            console.log(err);
        })
    } else { // 两个都改
        // 只修改电话号码
        adminModel.findOne({
            where: {
                username: newName.username
            }
        }).then(person => { // 查询新输入的电话号码有没有重复
            if (person !== null) { // 如果查到了这个电话号码
                res.json({
                    status: 422,
                    msg: "该电话号码已经存在了"
                })
            } else { // 没查到，可以更改
                adminModel.findOne({
                    where: {
                        username: username,
                        name: name
                    }
                }).then(result => { // result查询出来的信息
                    result.update({
                        username: newName.username,
                        name: newName.name,
                        updated_at: new Date()
                    }).then(info => {
                        res.json({
                            status: 201,
                            msg: "修改电话号码成功",
                            data: {
                                username: info.username,
                                name: info.name,
                                role: info.role,
                                last_login_at: info.last_login_at.Format("yyyy.MM.dd hh:mm:ss"),
                                created_at: info.created_at.Format("yyyy.MM.dd hh:mm:ss"),
                                updated_at: info.updated_at.Format("yyyy.MM.dd hh:mm:ss")
                            }
                        })
                    }).catch(err => {
                        res.json({
                            status: 422,
                            msg: "修改失败"
                        })
                        console.log(err);
                    })
                })
            }
        }).catch(err => {
            res.json({
                status: 422,
                msg: "修改失败"
            })
            console.log(err);
        })
    }
})

// 查询所有管理员信息：http://localhost:8089/admins/all
router.get("/all", (req, res) => {
    adminModel.findAll({
        raw: true
    }).then(result => { // result本身就是数组
        res.send({
            status: 200,
            msg: "查询成功",
            data: result.map((item) => {
                return {
                    id: item.id,
                    username: item.username,
                    name: item.name,
                    role: item.role,
                    last_login_at: item.last_login_at.Format("yyyy.MM.dd hh:mm:ss"),
                    created_at: item.created_at.Format("yyyy.MM.dd hh:mm:ss"),
                    updated_at: item.updated_at.Format("yyyy.MM.dd hh:mm:ss")
                }
            })
        })
    }).catch(err => {
        res.send({
            status: 400,
            msg: "未查询到数据"
        })
        console.log(err);
    })
})

// 修改管理员信息：http://localhost:8089/admins/modifyInfo
router.post("/modifyInfo", (req, res) => {
    let user = req.body.user; // 获取用户名、真实姓名、身份
    let id = req.body.id;
    adminModel.findOne({
        where: {
            id: id
        }
    }).then(person => {
        person.update({
            username: user.username,
            name: user.name,
            role: user.role,
            updated_at: new Date()
        }).then(result => {
            res.json({
                status: 201,
                msg: "修改信息成功"
            })
        }).catch(err => {
            console.log(err);
        })
    })
})

// 删除该用户：http://localhost:8089/admins/delete
router.delete("/delete", (req, res) => {
    let id = req.body.id;
    // console.log(id)
    adminModel.destroy({
        where: {
            id: id
        }
    }).then(result => {
        res.json({
            status: 204,
            msg: "删除成功"
        })
    }).catch(err => {
        console.log(err);
    })
})

// 群体查询用户信息：http://localhost:8089/admins/some
router.post("/some", (req, res) => {
    let username = req.body.username;
    adminModel.findAll({
        where: {
            username: {
                [Op.like]: "%" + username + "%" // 模糊匹配
            }
        }
    }).then(result => {
        if (result !== null) {
            res.json({
                status: 200,
                msg: "查找成功",
                data: result.map((item) => {
                    return {
                        id: item.id,
                        username: item.username,
                        name: item.name,
                        role: item.role,
                        last_login_at: item.last_login_at.Format("yyyy.MM.dd hh:mm:ss"),
                        created_at: item.created_at.Format("yyyy.MM.dd hh:mm:ss"),
                        updated_at: item.updated_at.Format("yyyy.MM.dd hh:mm:ss")
                    }
                })
            })
        } else {
            res.json({
                status: 404,
                msg: "数据库无此记录"
            })
        }
    }).catch(err => {
        console.log(err);
    })
})

// 查询身份信息：http://localhost:8089/admins/role
router.post("/role", (req, res) => {
    adminModel.findAll({
        where: {
            role: req.body.role
        }
    }).then(result => {
        if (result !== null) {
            res.json({
                status: 200,
                msg: "查找成功",
                data: result.map((item) => {
                    return {
                        id: item.id,
                        username: item.username,
                        name: item.name,
                        role: item.role,
                        last_login_at: item.last_login_at.Format("yyyy.MM.dd hh:mm:ss"),
                        created_at: item.created_at.Format("yyyy.MM.dd hh:mm:ss"),
                        updated_at: item.updated_at.Format("yyyy.MM.dd hh:mm:ss")
                    }
                })
            })
        } else {
            res.json({
                status: 404,
                msg: "数据库无此记录"
            })
        }
    }).catch(err => {
        console.log(err);
    })
})

module.exports = router;