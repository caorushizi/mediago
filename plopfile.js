module.exports = function (plop) {
  plop.setGenerator("test", {
    description: "generate a test",
    prompts: [
      {
        type: "input",
        name: "name",
        message: "请输入窗口名称",
      },
      {
        type: "input",
        name: "title",
        message: "请输入页面名称",
      },
    ],
    actions() {
      const name = "{{name}}";
      const title = "{{title}}";
      return [
        {
          type: "add", //类型创建模板文件
          path: "renderer/{{dashCase name}}/main.tsx", //文件创建路径
          templateFile: "plop-templates/view/main.tsx.hbs", //文件模板
          data: { name, title },
        },
        {
          type: "add",
          path: "renderer/{{dashCase name}}/index.scss",
          templateFile: "plop-templates/view/index.scss.hbs",
          data: { name, title },
        },
        {
          type: "add", //类型创建模板文件
          path: "renderer/{{dashCase name}}/App.tsx", //文件创建路径
          templateFile: "plop-templates/view/App.tsx.hbs", //文件模板
          data: { name, title },
        },
        {
          type: "add", //类型创建模板文件
          path: "{{dashCase name}}.html", //文件创建路径
          templateFile: "plop-templates/view/index.html.hbs", //文件模板
          data: { name, title },
        },
      ];
    },
  });
};
