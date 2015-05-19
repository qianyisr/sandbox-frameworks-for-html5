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
      message: "./list.json|param",
      appInfo: "frameworks::appInfo",
      ui: "frameworks::ui"
    }
  },
  config : {
    complex: false,
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
    animation: function (event) {
      application.modules.fragments.plugins.animation(event);
    },
    require: {
      config: {
        base : ".",
        alias : {
          "catelog": "modules/catelog/main.js"
        }
      },
      use: {
        load: ["catelog"],
        callback: function (a) {
          a.start();
        }
      }
    }
  }
})