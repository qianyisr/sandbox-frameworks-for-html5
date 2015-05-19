define({
  resources : {
    script: {
      "main01": "main"
    },
    source: {
      feed: "index"
    },
    layout: {
      common: "frameworks::common",
      main: "./main"
    },
    data: {
      feed: "./list.json|param",
      config: "frameworks::config",
      ui: "frameworks::ui",
      appInfo: "frameworks::appInfo",
      lang: "frameworks::lang"
    }
  },
  config : {
    complex: true,
    layout : ["common", "main"],
    script : ["main01"],
    fragments : ["feedList"],
    source: ["feed"],
    data : ["feed", "config", "ui", "appInfo", "lang"],
    sandbox : true,
    update : false,
    infinite : false,
    mirroring: {
      target: "#blurlay",
      nodes: ["#scroller", "#scroller section"],
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