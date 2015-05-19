define({
  resources : {
    script: {
      "index" : "modules/boutique/js/index"
    },
    source: {
      index: "index",
    },
    layout: {
      main: "main",
      common: "frameworks::common"
    },
    data: {
      config: "frameworks::config",
      ui: "frameworks::ui",
      lang: "frameworks::lang"
    }
  },
  config : {
    layout : ["main", "common"],
    script : ["index"],
    source: ["index"],
    data : ["config", "ui", "lang"],
    sandbox : true,
    update : false,
    infinite: true,
    require: {
      config: {
        base : "."
      },
      use: {
        load: "index",
        callback: function (a) {
          a.start();
        }
      }
    }
  }
})