(function (app) {
  "use strict";
  app.showPassword = showPassword;

  function showPassword() {
    const x = document.getElementById("new-password");
    const y = document.getElementById("confirm-new-password");
    if (x.type === "password") {
      x.type = "text";
    } else {
      x.type = "password";
    }
    if (y.type === "password") {
      y.type = "text";
    } else {
      y.type = "password";
    }
  }
})((window.app = window.app || {}));
