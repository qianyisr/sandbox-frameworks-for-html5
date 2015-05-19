define({
  resources : {
    script: {
      "main01": "main"
    },
    source: {
      index: "index",
    },
    layout: {
      common: "frameworks::common",
      main: "main"
    },
    data: {
      discover: "./list.json",
      appInfo: "frameworks::appInfo",
      ui: "frameworks::ui"
    }
  },
  config : {
    complex: true,
    layout : ["common", "main"],
    script : ["main01"],
    source: ["index"],
    data : ["discover", "appInfo", "ui"],
    sandbox : true,
    update : false,
    infinite: false,
    mirroring: {
      target: "#blurlay",
      nodes: [".content-main, #scroller-banner"],
      infinite: true
    },
    require: {
      config: {
        base : "."
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