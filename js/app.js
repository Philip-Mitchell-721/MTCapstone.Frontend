(function (app) {
  "use strict";
  app.showPassword = showPassword;

  app.index = async () => {
    navBarStatus();
  };

  app.signinPage = async () => {
    wireSigninForm();
    navBarStatus();
  };

  app.registerPage = async () => {
    wireRegisterForm();
    navBarStatus();
  };

  app.personalPage = async () => {
    navBarStatus();
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
    // debugger;
    const response = await apiFetchAsync(
      "Authentication/login",
      "POST",
      requestDto,
      false
    );
    button.disabled = false;

    //TODO: change this to check the body of my api response for the statuscodes.
    //apiFetchAsync is already returning the json'd response.
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
    };

    header.removeChild(oldNav);
    header.appendChild(nav);
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
      let rawResponse = await fetch(request);
      if (needsAuth && rawResponse.status == 401) {
        await refreshTokensAsync();
        rawResponse = await apiFetchAsync(route, httpMethod, data, needsAuth);
      }

      const response = await rawResponse?.json();
      return response;
    } catch (error) {
      //console.log(error);
      return null;
      //TODO: figure out what should return after the error.
    }

    // ASK: Should I return the rawResponse like above?  That way,
    // I have access to the response info like statuscodes.
    // const response = await rawResponse.json();
    // return response;
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
  function errorDiv(error) {
    const newDiv = document.createElement("div");
    const p = document.createElement("p");
    p.innerText = error ?? "Network connection error.";
    newDiv.appendChild(p);
    newDiv.classList.add("error-text");
    return newDiv;
  }
  function goToSignIn() {
    location.href = "/account/signin.html";
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

  // TODO: wrap fetch in app.apiFetch that takes the values for fetch, attaches tokens,
  // checks the response for auth, refreshes if needed, and reruns fetch.
  // Then redirect to login if needed
})((window.app = window.app || {}));
