(function (app) {
  "use strict";
  app.showPassword = showPassword;

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
  async function apiFetchAsync(route, httpMethod, data) {
    const url = "https://localhost:7277/api/" + route;
    try {
      const rawResponse = await fetch(url, {
        method: `${httpMethod}`, // *GET, POST, PUT, DELETE, etc.
        mode: "cors", // no-cors, *cors, same-origin
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Headers": "*",
          Accept: "application/json",
          //TODO: get accessToken
          Authorization: `Bearer ${(accessToken = "")}`,
        },
        body: JSON.stringify(data), // body data type must match "Content-Type" header
      });
      // TODO: write out piece to get accessToken from localStorage and
      // check to see if it is still valid (expiration).  Handle with refresh
      // if needed, then attach to request.

      // TODO: look up redirect urls with query params
      // TODO: store the response from get personal decks in sessionStorage,
      //       then when adding/removing cards add them to the cache in
      //       addition to fetching
      // rawResponse.

      const response = await rawResponse.json();
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
