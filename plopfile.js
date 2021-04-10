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
          type: "add",
          path: "renderer/{{dashCase name}}/main.tsx",
          templateFile: "plop-templates/view/main.tsx.hbs",
          data: { name, title },
        },
        {
          type: "add",
          path: "renderer/{{dashCase name}}/index.scss",
          templateFile: "plop-templates/view/index.scss.hbs",
          data: { name, title },
        },
        {
          type: "add",
          path: "renderer/{{dashCase name}}/App.tsx",
          templateFile: "plop-templates/view/App.tsx.hbs",
          data: { name, title },
        },
        {
          type: "add",
          path: "{{dashCase name}}.html",
          templateFile: "plop-templates/view/index.html.hbs",
          data: { name, title },
        },
      ];
    },
  });
};
