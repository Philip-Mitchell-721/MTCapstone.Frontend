(function (app) {
  "use strict";
  app.showPassword = showPassword;

  app.index = async () => {};

  app.signinPage = async () => {
    wireSigninForm();
  };

  app.registerPage = async () => {
    wireRegisterForm();
  };
  // TODO: add appropriate startups for each page.

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

    const response = await apiFetchAsync(
      "Authentication/register",
      "POST",
      requestDto
    );
    console.log(response);
    // if (response.success === true) {
    //   location.href = "../";
    // }
  }

  function wireSigninForm() {
    const form = document.querySelector("#sign-in form");
    // const button = document.getElementById("register-button");
    // button.addEventListener("click", submitRegisterForm);
    console.log(form);
    form.onsubmit = submitSigninForm;
  }
  async function submitSigninForm(e) {
    e.preventDefault();
    const form = document.querySelector("#sign-in form");
    const requestDto = {};
    requestDto.userName = form.querySelector("#username").value;
    requestDto.password = form.querySelector("#password").value;
    console.log(requestDto);

    // const response = await apiFetchAsync(
    //   "Authentication/login",
    //   "POST",
    //   requestDto
    // );
    // console.log(response);
  }

  async function apiFetchAsync(route, httpMethod, data, needsAuth = true) {
    const url = "https://localhost:7277/api/" + route;

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Access-Control-Allow-Headers", "*");
    myHeaders.append("Accept", "application/json");

    if (needsAuth) {
      const tokens = getTokens();
      myHeaders.append("Authorization", `Bearer ${tokens.accessToken}`);
    }

    const myOptions = {
      method: httpMethod,
      headers: myHeaders,
      mode: "cors",
    };
    if (httpMethod == "POST" || httpMethod == "PUT" || httpMethod == "PATCH") {
      myOptions.body = JSON.stringify(data);
    }

    const request = new Request(url, myOptions);

    try {
      // TODO: write out piece to get accessToken from localStorage and
      // check to see if it is still valid (expiration).  Handle with refresh
      // if needed, then attach to request.
      // TODO: look up redirect urls with query params
      // TODO: store the response from get personal decks in sessionStorage,
      //       then when adding/removing cards add them to the cache in
      //       addition to fetching
      // rawResponse.
      const rawResponse = await fetch(request);
      if (rawResponse.StatusCode == 401) {
        refreshTokensAsync();
        apiFetchAsync(route, httpMethod, data, needsAuth);
      }
      const response = await rawResponse.json();
      return response;
    } catch (error) {
      console.log(error);
    }
  }

  async function refreshTokensAsync() {
    const oldTokens = getTokens();
    const response = await apiFetchAsync(
      "Authentication/refresh",
      "POST",
      oldTokens,
      false
    );
    if (response.ok) {
      const newTokens = response.json();
      storeTokens(newTokens.value);
    } else {
      goToSignIn();
    }
  }

  function getTokens() {
    const tokens = localStorage.getItem("tokens");
    if (!tokens) {
      goToSignIn();
    }

    return tokens;
  }

  function goToSignIn() {
    location.href = "/account/signin.html";
  }

  function storeTokens(tokens) {
    localStorage.set("tokens", tokens);
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
