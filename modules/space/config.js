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
      me: "./list.json",
      feed: "./list.json",
      appInfo: "frameworks::appInfo",
      ui: "frameworks::ui",
      lang: "frameworks::lang"
    }
  },
  config : {
    complex: false,
    fragments : ["feedList"],
    layout : ["common", "main"],
    script : [],
    source: ["index"],
    data : ["me", "feed", "appInfo", "ui", "lang"],
    sandbox : true,
    update : false,
    infinite: false,
    animation: function (event) {
      application.modules.frameworks.plugins.animation(event);
    },
    require: {
      config: {
        base : ".",
        alias : {
          "main01": "modules/me/main.js"
        }
      },
      use: {
        load: ["main01"],
        callback: function (a) {
          a.start();
        }
      }
    }
  }
})