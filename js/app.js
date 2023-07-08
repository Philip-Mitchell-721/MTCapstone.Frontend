(function (app) {
  ("use strict");
  app.showPassword = showPassword;
  //functions that run on every page
  navBarStatus();
  setCopyrightDate();

  // TODO: add appropriate startups for each page.
  app.index = async () => {};

  app.signinPage = async () => {
    wireSigninForm();
  };

  app.registerPage = async () => {
    wireRegisterForm();
  };

  app.personalPage = async () => {
    navBarStatus();
    personalPageSetup();
  };

  app.confirmEmailPage = () => {
    confirmEmailPageSetup();
  };

  app.requestEmailConfirmationPage = () => {
    requestEmailConfirmationPageSetup();
  };

  /////////////////////////////////////////////////////////////////////////////////

  async function apiFetchAsync(route, httpMethod, data, needsAuth = true) {
    const url = "https://localhost:7277/api/" + route;
    const encodedURL = encodeURI(url);
    // ASK: Do I need to encode the URI like this if I'm using the encodeURIcomponents before calling apiFetchAsync?

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

    debugger;
    let rawResponse;
    try {
      rawResponse = await fetch(request);
    } catch (error) {
      // console.log(error.name);
      // console.log(error.message);
      return {
        errors: [`${error.message}`],
        success: false,
      };
    }

    if (needsAuth && rawResponse.status == 401) {
      await refreshTokensAsync();
      return await apiFetchAsync(route, httpMethod, data, needsAuth);
    }

    try {
      return await rawResponse.json();
    } catch (error) {
      //The only time this should happen is when there is no body to the response,
      //which is only true if the api returned ok(), nocontent(), etc.
      //Otherwise, the api sends back Response<T>.  In all cases, the request was successful.
      return { success: true };
    }
  }

  /////////////////////////////////////////////////////////////////////////////////

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

    if (response?.success) {
      sessionStorage.setItem("email-token", response.value.accessToken);

      //Figure out what .value is from the api here.
      location.href = "../account/confirmemail.html";
      return;
    }
    const errorsDiv = errorDiv(response?.errors);
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

    if (response?.success) {
      //const names = Object.getOwnPropertyNames(tokens);
      storeTokens(response.value);
      location.href = "../decks/personal.html";
      return;
    }

    // Add checks for other possible outcomes like 400, 403, 404, 500
    const errorsDiv = errorDiv(response?.errors);
    form.appendChild(errorsDiv);
    button.addEventListener("click", () => {
      errorsDiv.remove();
    });
  }

  function confirmEmailPageSetup() {
    const div = document.getElementById("confirm-email");
    const button = div.querySelector("#confirm");
    const requestNewButton = div.querySelector("#request-email-button");
    const token = sessionStorage.getItem("email-token");

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
    // const route = `authentication/confirm-email?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
    debugger;
    button.disabled = true;
    const response = await apiFetchAsync(route, "POST", requestDto, false);
    button.disabled = false;

    if (response?.success) {
      button.innerText = "SUCCESS";
      button.style.backgroundColor = "Green";
      sessionStorage.removeItem("email-token");
      location.href = "../account/signin.html";
      return;
    }

    const errorsDiv = errorDiv(response?.errors);
    form.appendChild(errorsDiv);
    button.addEventListener("click", () => {
      errorsDiv.remove();
    });
  }

  function requestEmailConfirmationPageSetup() {
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
      "Authentication/confirm-email-request",
      "POST",
      requestDto,
      false
    );
    button.disabled = false;

    if (response?.success) {
      sessionStorage.setItem("email-token", response.value.accessToken);

      location.href = "../account/confirmemail.html";
      return;
    }
    const errorsDiv = errorDiv(response?.errors);
    form.appendChild(errorsDiv);
    button.addEventListener("click", () => {
      errorsDiv.remove();
    });
  }

  function personalPageSetup() {
    // TODO: uncomment getFormatOptions
    // getFormatOptions()
    document
      .getElementById("create-deck")
      .addEventListener("click", addDeckAsync);
    document.getElementById("add-deck-cancel").addEventListener("click", () => {
      document.querySelector("form.add-deck").reset();
    });

    getPersonalDecks();
  }

  /////////////////////////////////////////////////////////////////////////////////
  async function getPersonalDecks() {
    const table = document.querySelector(".deck-table");
    const tableBody = table.querySelector("tbody");

    // TODO: uncomment this AND set the needs Auth param to true
    // const response = await apiFetchAsync("Decks/Personal", "GET", {}, false);
    const response = {
      success: true,
      value: [
        {
          id: 1,
          name: "Yidris Rocks",
          format: "commander",
          isPrivate: true,
        },
        {
          id: 2,
          name: "Xenagos",
          format: "commander",
          isPrivate: false,
        },
        {
          id: 3,
          name: "Gitrog",
          format: "commander",
          isPrivate: true,
        },
      ],
    };

    if (!response?.success) {
      const errorsDiv = errorDiv(response?.errors);
      document.querySelector("main").append(errorsDiv);
      return;
    }

    response.value.forEach((deck) => {
      const row = tableBody.insertRow();

      const name = row.insertCell(0);
      const a = document.createElement("a");
      a.href = `../decks/${deck.Id}`;
      a.innerText = `${deck.name}`;
      a.classList.add("personal-page-links");
      name.append(a);

      const format = row.insertCell(1);
      format.innerText = `${deck.format}`;

      const isPrivate = row.insertCell(2);
      if (deck.isPrivate == true) {
        isPrivate.innerText = "Private";
      } else {
        isPrivate.innerText = "Public";
      }
    });
  }
  function getDeckById(deckId) {
    location.href = `../decks/${deckId}`;
  }

  function getFormatOptions() {
    fetch("https://api.scryfall.com/cards/random")
      .then((rawResponse) => {
        return rawResponse.json();
      })
      .then((response) => {
        const names = Object.getOwnPropertyNames(response.legalities);
        const selectContainer = document.querySelector(".select-container");

        const newSelect = document.createElement("select");
        newSelect.name = "format";
        newSelect.id = "format";
        newSelect.classList.add("form-select");
        names.forEach((name) => {
          const option = document.createElement("option");
          option.value = name;
          option.innerText = name;
          if (name == "commander") {
            const selected = document.createAttribute("selected");
            option.setAttributeNode(selected);
          }
          newSelect.append(option);
        });

        selectContainer.append(newSelect);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  async function addDeckAsync(e) {
    e.preventDefault();
    const form = document.querySelector(".add-deck");
    const deckName = form.querySelector("#name").value;
    const isPrivate = form.querySelector("#private").checked;
    const format = form.querySelector("#format")?.value ?? "commander";
    const button = document.getElementById("create-deck");
    const addDeckCancelButton = document.getElementById("add-deck-cancel");

    const requestDto = {
      name: deckName,
      isPrivate: isPrivate,
      format: format,
      primer: "",
    };

    button.disabled = true;
    const response = await apiFetchAsync("Decks", "POST", requestDto, true);
    button.disabled = false;

    if (!response?.success) {
      const errorsDiv = errorDiv(response?.errors);
      form.appendChild(errorsDiv);
      button.addEventListener("click", () => {
        errorsDiv.remove();
      });
      addDeckCancelButton.addEventListener("click", () => {
        errorsDiv.remove();
      });
      return;
    }
    // TODO: Test this function.
    // TODO: When response is successfull, set location to the new deck.
    location.href = `../decks/${response.value.Id}`;
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
  function errorDiv(errors = ["Network connection error."]) {
    const newDiv = document.createElement("div");
    errors.forEach((er) => {
      const p = document.createElement("p");
      p.innerText = er;
      newDiv.appendChild(p);
    });

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

  function setCopyrightDate() {
    document.getElementById("copyright-year").innerText =
      new Date().getFullYear();
  }
})((window.app = window.app || {}));
