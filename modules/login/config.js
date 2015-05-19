define({
  resources : {
    script: {
    },
    source: {
      index: "index",
    },
    layout: {
      common: "frameworks::common",
      main: "main"
    },
    data: {
      ui: "frameworks::ui"
    }
  },
  config : {
    complex: false,
    layout : ["common", "main"],
    script : [],
    source: ["index"],
    data : ["ui"],
    sandbox : true,
    update : false,
    infinite: true,
    require: {
      config: {
        base : ".",
        alias : {
          "login": "modules/login/main.js"
        }
      },
      use: {
        load: ["login"],
        callback: function (a) {
          a.start();
        }
      }
    }
  }
})