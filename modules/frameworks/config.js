define({
  resources : {
    script: {
    },
    source: {
      index: "index"
    },
    layout: {
      common: "css/common",
      animate: "css/animate",
      main: "css/main",
      theme_ios7: "css/theme-ios7"
    },
    data: {
      activity: function () {
          return application.config.index
      },
      ui: function () {
          return application.device.ui
      },
      modules: function () {
          return application.modules
      },
      config: function () {
          return application.config
      },
      appInfo: {
        "headerHeight": 62,
        "footerHeight": 59,
        "resourcesUrl": "test_upload/"
      },
      lang: "./lang/zh-CN.json",
      nav: [
        {"text": "activity", "module":"activity"},
        {"text": "discover", "module":"discover"},
        {"text": "message", "module":"message"},
        {"text": "me", "module":"me"}
      ]
    }
  },
  config : {
    layout : ["main", "animate", "common", "theme_ios7"],
    script :[],
    source: ["index"],
    data : ["modules", "config", "lang", "ui", "nav", "activity"],
    iframe : false,
    update : false,
    require: {
      config: {
        base : ".",
        alias : {
          "main": "modules/frameworks/js/main.js"
        }
      },
      use: {
        load: ["main"],
        callback: function (a) {
          a.start();
        }
      }
    }
  }
  
})