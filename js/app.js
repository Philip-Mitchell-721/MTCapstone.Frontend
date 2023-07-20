(function (app) {
  ("use strict");
  app.showPassword = showPassword;
  app.timerId;

  //TODO: Remember to undo this part to test API again.
  app.deck = JSON.parse(localStorage.getItem("deck")) ?? {};
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
    personalPageSetup();
  };

  app.confirmEmailPage = () => {
    confirmEmailPageSetup();
  };

  app.requestEmailConfirmationPage = () => {
    requestEmailConfirmationPageSetup();
  };

  app.viewDeckPage = async () => {
    deckPageSetup();
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

    // debugger;
    let rawResponse;
    try {
      rawResponse = await fetch(request);
    } catch (error) {
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

      // TODO: This isn't true, take some time to work through this and figure out how this SHOULD work.  There are
      // several asp httpresponse helper methods that don't return a body, and .json() will error.  That has
      // nothing to do with whether or not the api fetch was successful.
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
    getFormatOptions();
    document.getElementById("add-deck-form").onsubmit = addDeckAsync;
    // document
    //   .getElementById("create-deck")
    //   .addEventListener("click", addDeckAsync);
    document.getElementById("add-deck-cancel").addEventListener("click", () => {
      document.querySelector("form.add-deck").reset();
    });

    getPersonalDecks();
  }

  async function deckPageSetup() {
    cardSearchSetup();
    await getDeckAsync();
    displayDeck();
  }

  function cardSearchSetup() {
    document
      .querySelector("#card-search")
      .addEventListener("input", autoCompleteCardNamesDelay);

    document.querySelector(".results-list").addEventListener("click", (e) => {
      throttleClick(addCardByScryfallId, 2000, e);
    });

    document.getElementById("add-card-form").onsubmit = formDoNothing;
  }

  /////////////////////////////////////////////////////////////////////////////////
  async function addCardByScryfallId(e) {
    e.preventDefault();
    const cardNameToAdd = e.target.innerText;
    const card = await getCardFromscryfallAsync(cardNameToAdd);
    if (!card) {
      // TODO: handle when card is not found from scryfall
      return;
    }

    const requestDto = {};
    requestDto.scryfallId = card.id;
    console.log(app.deck.id);
    const response = await apiFetchAsync(
      `decks/${app.deck.id}/cards`,
      "POST",
      requestDto,
      true
    );
    console.log(response);
    //TODO: Make addCard update the page upon successful response.
  }

  async function getCardFromscryfallAsync(cardNameToAdd) {
    const encodedCardName = encodeURIComponent(cardNameToAdd);
    try {
      const rawResponse = await fetch(
        `https://api.scryfall.com/cards/named?exact=${encodedCardName}`
      );
      const response = await rawResponse.json();
      return response;
    } catch (error) {
      console.log(error);
    }
  }

  function throttleClick(func, delay, e) {
    if (app.timerId) {
      return;
    }

    func(e);
    app.timerId = setTimeout(function () {
      app.timerId = undefined;
    }, delay);
  }

  async function autoCompleteCardNames() {
    let cardName = document.getElementById("card-search").value;
    if (!cardName || cardName.trim().length < 3) {
      return;
    }
    fetch(`https://api.scryfall.com/cards/autocomplete?q=${cardName}`)
      .then((rawResponse) => {
        return rawResponse.json();
      })
      .then((response) => {
        const div = document.querySelector(".results-list");
        const newDiv = document.createElement("div");
        response.data.forEach((name) => {
          const a = document.createElement("a");
          a.innerText = name;
          a.classList.add("list-group-item");
          a.classList.add("list-group-item-action");
          newDiv.append(a);
        });

        div.innerHTML = newDiv.innerHTML;
      })
      .catch((err) => {
        console.log(err);
      });
  }

  function autoCompleteCardNamesDelay() {
    clearTimeout(app.timerId);
    app.timerId = setTimeout(async () => {
      await autoCompleteCardNames();
      app.timerId = undefined;
    }, 1500);
  }

  function displayDeck() {
    //continue: deck is in app.deck, now work on pieces to display the deck
    if (Object.keys(app.deck).length === 0) {
      return;
    }

    document.querySelector("h1").innerText = app.deck.name;
    const categories = getDeckCategories();
  }

  async function getDeckCategories() {
    const categories = [];
    const div = document.createElement("div");
    app.deck.cards.forEach((card, index) => {
      //TODO: this is a test, change this to display cards.
      setTimeout(() => {
        console.log(card);
        const img = document.createElement("img");
        img.src = card.imageUris.normal;
        img.alt = card.name;
        div.append(img);
      }, index * 100);
    });
    document.querySelector("main").append(div);
  }

  async function getPersonalDecks() {
    const table = document.querySelector(".deck-table");
    const tableHead = table.querySelector("thead");
    const tableBody = table.querySelector("tbody");

    const response = await apiFetchAsync("Decks/Personal", "GET", {}, true);
    // const response = {
    //   success: true,
    //   value: [
    //     {
    //       id: 1,
    //       name: "Yidris Rocks",
    //       format: "commander",
    //       isPrivate: true,
    //     },
    //     {
    //       id: 2,
    //       name: "Xenagos",
    //       format: "commander",
    //       isPrivate: false,
    //     },
    //     {
    //       id: 3,
    //       name: "Gitrog",
    //       format: "commander",
    //       isPrivate: true,
    //     },
    //   ],
    // };

    if (!response?.success) {
      const errorsDiv = errorDiv(response?.errors);
      document.querySelector("main").append(errorsDiv);
      return;
    }
    if (response.value.length === 0) {
      return;
    }
    tableHead.removeAttribute("hidden");

    response.value.forEach((deck) => {
      const row = tableBody.insertRow(0);

      const name = row.insertCell(0);
      const a = document.createElement("a");
      //TODO: once the response is changed back so that it comes form the api
      // check if deck.id or deck.Id works.
      a.href = `../decks/index.html?id=${deck.id}`;
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

  async function getDeckAsync() {
    const params = new URLSearchParams(window.location.search);
    //TODO: if link that was created in getPersonalDecks was changed to use deck.Id (capital I),
    // make sure to change the params.get to "Id".
    const deckId = Number.parseInt(params.get("id"));
    if (isNaN(deckId)) {
      return;
    }
    const response = await apiFetchAsync(`Decks/${deckId}`, "GET", {}, false);
    if (!response?.success) {
      const errorsDiv = errorDiv(response?.errors);
      document.querySelector("main").append(errorsDiv);
      return;
    }
    app.deck = response?.value ?? {};
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
    // TODO: When response is successfull, set location to the new deck.
    // location.href = `../decks?id=${response.value.Id}`;
    location.reload();
  }

  function navBarStatus() {
    const header = document.querySelector("header");
    const oldNav = header.querySelector("nav");

    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      return;
    }
    const payLoad = parseJwt(accessToken);

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
  // function errorDiv(errors = ["Network connection error."]) {
  function errorDiv(errors = [""]) {
    const newDiv = document.createElement("div");
    errors.forEach((er) => {
      if (er === "Failed to fetch") {
        er = "Network connection error.";
      }
      const p = document.createElement("p");
      p.innerText = er;
      newDiv.appendChild(p);
    });

    newDiv.classList.add("alert");
    // newDiv.classList.add("alert-danger");
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
  function formDoNothing(e) {
    e.preventDefault();
  }
  function setCopyrightDate() {
    document.getElementById("copyright-year").innerText =
      new Date().getFullYear();
  }
})((window.app = window.app || {}));
