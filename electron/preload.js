const {remote} = require("electron");
const native = require("../build/Release/addon");

window.addEventListener('DOMContentLoaded', () => {
    $("#alert").hide();
    // m3u8 文件地址
    $("#exampleInputEmail1").val("https://www.yxlmbbs.com:65/20200318/6PnR6gn6/1500kb/hls/index.m3u8");

    // 选择文件夹按钮
    $("#selectFolder").click(() => {
        remote.dialog.showOpenDialog({
            defaultPath: remote.app.getPath("downloads"),
            properties: ["openDirectory"]
        }).then(({filePaths}) => {
            if (filePaths.length !== 1) {
                return false
            }
            $("#folder").val(filePaths[0])
        })
    });

    $("#startDownload").click((event) => {
        event.preventDefault();
        const nameValue = $("#exampleInputPassword1").val();
        const pathValue = $("#folder").val();
        const urlValue = $("#exampleInputEmail1").val();
        if (nameValue && pathValue && urlValue) {
            $("#alert").hide();
            console.log(native.add(nameValue, pathValue, urlValue))
        } else {
            $("#alert").show()
        }
    });
});
