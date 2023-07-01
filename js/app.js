(function (app) {
  "use strict";
  app.showPassword = showPassword;
  app.email = {};
  //functions that run on every page
  navBarStatus();
  setCopyrightDate();

  app.index = async () => {};

  app.signinPage = async () => {
    wireSigninForm();
  };

  app.registerPage = async () => {
    wireRegisterForm();
  };

  app.personalPage = async () => {};

  app.confirmEmailPage = () => {
    confirmEmailPageSetup();
  };
  app.requestEmailConfirmationPage = () => {
    requestEmailConfirmationPageSetup();
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
    const button = form.querySelector("button");

    const requestDto = {};
    requestDto.userName = form.querySelector("#username").value;
    requestDto.email = form.querySelector("#email").value;
    requestDto.password = form.querySelector("#password").value;
    requestDto.confirmPassword = form.querySelector("#confirm-password").value;
    button.disabled = true;
    const response = await apiFetchAsync(
      "Authentication/register",
      "POST",
      requestDto,
      false
    );
    button.disabled = false;
    if (!response) {
      const div = errorDiv();
      form.appendChild(div);
      button.addEventListener("click", () => {
        div.remove();
      });
      return;
    }
    if (response?.success) {
      sessionStorage.setItem("email-token", response.value.accessToken);

      //Figure out what .value is from the api here.
      location.href = "../account/confirmemail.html";
      return;
    }
    const errorsDiv = errorDiv(response.errors);
    form.appendChild(errorsDiv);
    button.addEventListener("click", () => {
      errorsDiv.remove();
    });
  }

  function wireSigninForm() {
    const form = document.querySelector("#sign-in form");
    form.onsubmit = submitSigninForm;
  }
  async function submitSigninForm(e) {
    e.preventDefault();
    const form = document.querySelector("#sign-in form");
    const button = form.querySelector("button");

    const requestDto = {};
    requestDto.userName = form.querySelector("#username").value;
    requestDto.password = form.querySelector("#password").value;
    button.disabled = true;
    const response = await apiFetchAsync(
      "Authentication/login",
      "POST",
      requestDto,
      false
    );
    button.disabled = false;

    if (!response) {
      const div = errorDiv();
      form.appendChild(div);
      button.addEventListener("click", () => {
        div.remove();
      });
      return;
    }
    if (response?.success) {
      //const names = Object.getOwnPropertyNames(tokens);
      storeTokens(response.value);
      location.href = "../";
      return;
    }

    // Add checks for other possible outcomes like 400, 403, 404, 500
    const errorsDiv = errorDiv(response.errors);
    form.appendChild(errorsDiv);
    button.addEventListener("click", () => {
      errorsDiv.remove();
    });
  }
  function navBarStatus() {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      return;
    }
    const payLoad = parseJwt(accessToken);

    const header = document.querySelector("header");
    const oldNav = header.querySelector("nav");

    const nav = document.createElement("nav");

    const hello = document.createElement("span");
    hello.innerText = `Hello, ${payLoad.name}!`;
    nav.appendChild(hello);

    const home = document.createElement("a");
    home.innerText = "home";
    home.href = "../";
    nav.appendChild(home);

    const personal = document.createElement("a");
    personal.innerText = "my decks";
    personal.href = "../decks/personal.html";
    nav.appendChild(personal);

    const logOut = document.createElement("a");
    logOut.innerText = "sign out";
    logOut.href = "../";
    nav.appendChild(logOut);

    logOut.onclick = () => {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      location.href = "../";
    };

    header.removeChild(oldNav);
    header.appendChild(nav);
  }
  async function apiFetchAsync(route, httpMethod, data, needsAuth = true) {
    const url = "https://localhost:7277/api/" + route;
    const encodedURL = encodeURI(url);

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

    const request = new Request(encodedURL, myOptions);

    try {
      debugger;
      let rawResponse = await fetch(request);
      if (needsAuth && rawResponse.status == 401) {
        await refreshTokensAsync();
        rawResponse = await apiFetchAsync(route, httpMethod, data, needsAuth);
      }
      //ASK: This returns the body of the response.  That body is null/undefined
      // if the api didn't send anything in the HTTP response.  How should I check this
      //after apifetchasync returns to the calling function?
      // for instance, right now they are looking for response.success (or if the response is null)
      const response = await rawResponse?.json();
      return response;
    } catch (error) {
      //console.log(error);
      return null;
      //TODO: figure out what should return after the error.
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
    if (response.success) {
      storeTokens(response.value);
    } else {
      goToSignIn();
    }
  }

  function parseJwt(token) {
    var base64Url = token.split(".")[1];
    var base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    var jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );

    return JSON.parse(jsonPayload);
  }

  function getTokens() {
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");
    if (!accessToken || !refreshToken) {
      goToSignIn();
    }

    return {
      accessToken: accessToken,
      refreshToken: refreshToken,
    };
  }
  function errorDiv(errors) {
    const newDiv = document.createElement("div");
    if (errors) {
      errors.forEach((er) => {
        const p = document.createElement("p");
        p.innerText = er;
        newDiv.appendChild(p);
      });
    } else {
      const p = document.createElement("p");
      p.innerText = "Network connection error.";
      newDiv.appendChild(p);
    }
    newDiv.classList.add("error-text");
    return newDiv;
  }
  function goToSignIn() {
    location.href = "/account/signin.html";
  }
  function confirmEmailPageSetup() {
    const div = document.getElementById("confirm-email");
    const button = div.querySelector("#confirm");
    const requestNewButton = div.querySelector("#request-email-button");
    const token = sessionStorage.getItem("email-token");
    ////
    //TODO: Remove this section once this is tested.
    // app.email.email = sessionStorage.getItem("email-token");
    //   app.email.email ||
    //   '<a href="https://localhost:7277/authentication/confirm-email?email=meghan@gmail.com&token=CfDJ8CG1BlKyLk1CowHwsJVQe2XccakC5aA2yMM0tcwfBXxp8n7XZX7XAmaUQNNVxYvF3JbwSCw3TAYVfSdl4KbFpQgcor0kioKtrSJl29KeqEQDbFPfGFYFv85z9rhT3I8eN+HeJVtGuc9ceYwqw9jDpTRMLKlVX/nIHZ8qCMQAVJeu3+wWrQPggR0+vvPY6FfqnQ==" >Reset Password</a>';
    // console.log(app.email.email);
    ////
    button.onclick = submitEmailConfirmation;
    requestNewButton.onclick = (e) => {
      e.preventDefault();
      location.href = "../account/request-email-confirmation.html";
    };
    if (token == undefined) {
      div.appendChild(errorDiv(["No email token found."]));
      button.disabled = true;
      return;
    }
  }
  async function submitEmailConfirmation(e) {
    e.preventDefault();
    const form = document.querySelector("form");
    const button = form.querySelector("button");
    // const emailToken = `<a href="https://localhost:7277/authentication/confirm-email?email=meghan@gmail.com&token=CfDJ8CG1BlKyLk1CowHwsJVQe2XccakC5aA2yMM0tcwfBXxp8n7XZX7XAmaUQNNVxYvF3JbwSCw3TAYVfSdl4KbFpQgcor0kioKtrSJl29KeqEQDbFPfGFYFv85z9rhT3I8eN+HeJVtGuc9ceYwqw9jDpTRMLKlVX/nIHZ8qCMQAVJeu3+wWrQPggR0+vvPY6FfqnQ==" >Reset Password</a>`
    const emailToken = sessionStorage.getItem("email-token");
    debugger;
    const aContainer = document.createElement("div");
    aContainer.innerHTML = emailToken;
    const a = aContainer.querySelector("a");
    const url = new URL(a.href);
    var params = new URLSearchParams(url.search);
    const email = params.get("email");
    const token = params.get("token").replaceAll(" ", "+");
    const requestDto = {
      email: email,
      token: token,
    };
    const route = `authentication/confirm-email`;
    // const route = `authentication/confirm-email?email=${email}&token=${token}`;
    debugger;
    button.disabled = true;
    const response = await apiFetchAsync(route, "POST", requestDto, false);
    button.disabled = false;
    if (!response) {
      const div = errorDiv();
      form.appendChild(div);
      button.addEventListener("click", () => {
        div.remove();
      });
      return;
    }
    if (response?.success) {
      button.innerText = "SUCCESS";
      button.style.backgroundColor = "Green";
      sessionStorage.removeItem("email-token");
      location.href = "../account/signin.html";
      return;
    }
    const errorsDiv = errorDiv(response.errors);
    form.appendChild(errorsDiv);
    button.addEventListener("click", () => {
      errorsDiv.remove();
    });
  }
  async function requestEmailConfirmationPageSetup() {
    const form = document.querySelector("#request-email form");
    form.onsubmit = requestEmailConfirmation;
  }
  async function requestEmailConfirmation(e) {
    e.preventDefault();

    const form = document.querySelector("#request-email form");
    const button = form.querySelector("button");

    const requestDto = {};
    requestDto.userName = form.querySelector("#username").value;
    button.disabled = true;
    const response = await apiFetchAsync(
      //TODO:Check this endpoint route
      "Authentication/confirm-email-request",
      "POST",
      requestDto,
      false
    );
    button.disabled = false;
    if (!response) {
      const div = errorDiv();
      form.appendChild(div);
      button.addEventListener("click", () => {
        div.remove();
      });
      return;
    }
    if (response?.success) {
      sessionStorage.setItem("email-token", response.value.accessToken);

      location.href = "../account/confirmemail.html";
      return;
    }
    const errorsDiv = errorDiv(response.errors);
    form.appendChild(errorsDiv);
    button.addEventListener("click", () => {
      errorsDiv.remove();
    });
  }

  function storeTokens(tokens) {
    localStorage.setItem("accessToken", tokens.accessToken);
    localStorage.setItem("refreshToken", tokens.refreshToken);
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

  function setCopyrightDate() {
    document.getElementById("copyright-year").innerText =
      new Date().getFullYear();
  }
})((window.app = window.app || {}));
