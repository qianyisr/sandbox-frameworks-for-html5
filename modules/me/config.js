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
    complex: true,
    fragments : ["feedList"],
    layout : ["common", "main"],
    script : [],
    source: ["index"],
    data : ["me", "feed", "appInfo", "ui", "lang"],
    sandbox : true,
    update : false,
    infinite: false,
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