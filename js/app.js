(function (app) {
  "use strict";
  app.showPassword = showPassword;

  function showPassword() {
    const x = document.querySelectorAll(".password");
    x.forEach((el) => {
      if (el.type === "password") {
        el.type = "text";
      } else {
        el.type = "password";
      }
    });
  }
})((window.app = window.app || {}));
