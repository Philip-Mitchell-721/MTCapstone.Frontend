(function (app) {
  "use strict";
  app.showPassword = showPassword;

  app.registerPage = async () => {
    wireRegisterForm();

    const requestDto = {
      userName: "Zidantur1",
      email: "zidantur1@example.com",
      password: "7890&*()uiopUIOP",
      confirmPassword: "7890&*()uiopUIOP",
    };
    const response = await apiFetch(
      "Authentication/register",
      "POST",
      requestDto
    );
  };

  function wireRegisterForm() {
    const form = document.querySelector("#register form");
    // const button = document.getElementById("register-button");
    // button.addEventListener("click", submitRegisterForm);
    form.onsubmit = submitRegisterForm;
  }
  async function submitRegisterForm(e) {
    e.preventDefault();
    const form = document.querySelector("#register form");
    const requestDto = {};
    requestDto.userName = form.querySelector("#username").value;
    requestDto.email = form.querySelector("#email").value;
    requestDto.password = form.querySelector("#password").value;
    requestDto.confirmPassword = form.querySelector("#confirm-password").value;

    const response = await apiFetch(
      "Authentication/register",
      "POST",
      requestDto
    );
    // if (response.success === true) {
    //   location.href = "../";
    // }
  }
  async function apiFetch(route, httpMethod, data) {
    const url = "https://localhost:7277/api/" + route;
    try {
      const rawResponse = await fetch(url, {
        method: `${httpMethod}`, // *GET, POST, PUT, DELETE, etc.
        // mode: "cors", // no-cors, *cors, same-origin
        // cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
        // credentials: "same-origin", // include, *same-origin, omit
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Headers": "*",
          Accept: "application/json",
        },
        // redirect: "follow", // manual, *follow, error
        // referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
        body: JSON.stringify(data), // body data type must match "Content-Type" header
      });

      const response = await response.json();
      console.log(response);
      return response;

    } catch (error) {
      console.log(error);
    }
    // if (response.StatusCode != 401) {
    //   return response;
    // }
  }

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

  // TODO: wrap fetch in app.apiFetch that takes the values for fetch, attaches tokens,
  // checks the response for auth, refreshes if needed, and reruns fetch.
  // Then redirect to login if needed
})((window.app = window.app || {}));
