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
      message: "./list.json",
      appInfo: "frameworks::appInfo",
      ui: "frameworks::ui"
    }
  },
  config : {
    complex: true,
    layout : ["common", "main"],
    script : [],
    source: ["index"],
    data : ["message", "appInfo", "ui"],
    sandbox : true,
    update : false,
    infinite: false,
    mirroring: {
      target: "#blurlay",
      nodes: [".scroller"],
      infinite: true
    },
    require: {
      config: {
        base : ".",
        alias : {
          "main01": "modules/message/main.js"
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