/* =========================================
   BRAINPORT ROUTER.JS
========================================= */


/* =========================================
   ROUTES
========================================= */

const routes = {

  dashboard: {
    title: "Главная"
  },

  catalog: {
    title: "Каталог"
  },

  upload: {
    title: "Загрузка"
  },

  favorites: {
    title: "Избранное"
  },

  profile: {
    title: "Профиль"
  },

  admin: {
    title: "Админ-панель"
  }

};


/* =========================================
   INIT ROUTER
========================================= */

document.addEventListener("DOMContentLoaded", () => {

  initRouter();

});


/* =========================================
   ROUTER INIT
========================================= */

function initRouter() {

  handleRoute();

  window.addEventListener("hashchange", handleRoute);

}


/* =========================================
   HANDLE ROUTE
========================================= */

function handleRoute() {

  let hash =
    window.location.hash.replace("#", "");

  if (!hash) {

    hash = "dashboard";

  }


  navigate(hash);

}


/* =========================================
   NAVIGATE
========================================= */

function navigate(routeName) {

  const route = routes[routeName];

  if (!route) {

    show404();

    return;

  }


  hideAllPages();

  showPage(routeName);

  updateTitle(route.title);

  updateActiveSidebar(routeName);

}


/* =========================================
   HIDE ALL PAGES
========================================= */

function hideAllPages() {

  const sections =
    document.querySelectorAll("main section");

  sections.forEach(section => {

    section.classList.add("hidden-page");

  });

}


/* =========================================
   SHOW PAGE
========================================= */

function showPage(pageId) {

  const page =
    document.getElementById(pageId);

  if (!page) return;


  page.classList.remove("hidden-page");

  page.classList.add("fade-in");


  setTimeout(() => {

    page.classList.remove("fade-in");

  }, 500);

}


/* =========================================
   UPDATE TITLE
========================================= */

function updateTitle(title) {

  document.title =
    `BrainPort | ${title}`;

}


/* =========================================
   ACTIVE SIDEBAR LINK
========================================= */

function updateActiveSidebar(routeName) {

  const buttons =
    document.querySelectorAll("[data-route]");


  buttons.forEach(button => {

    button.classList.remove("active-route");

  });


  const activeButton =
    document.querySelector(
      `[data-route="${routeName}"]`
    );


  if (activeButton) {

    activeButton.classList.add("active-route");

  }

}


/* =========================================
   404 PAGE
========================================= */

function show404() {

  hideAllPages();

  const main =
    document.querySelector("main");

  const existing =
    document.getElementById("page404");


  if (existing) {

    existing.classList.remove("hidden-page");

    return;

  }


  const page404 =
    document.createElement("section");

  page404.id = "page404";

  page404.innerHTML = `

    <div class="glass"
      style="
        padding:60px;
        border-radius:30px;
        text-align:center;
        margin-top:40px;
      "
    >

      <h1
        style="
          font-size:100px;
          margin-bottom:20px;
          color:#3b82f6;
        "
      >

        404

      </h1>

      <h2
        style="
          font-size:40px;
          margin-bottom:20px;
        "
      >

        Страница не найдена

      </h2>

      <p
        style="
          color:#94a3b8;
          margin-bottom:30px;
          font-size:18px;
        "
      >

        Такой страницы не существует

      </p>

      <button
        class="btn btn-primary"
        onclick="goHome()"
      >

        На главную

      </button>

    </div>

  `;

  main.appendChild(page404);

}


/* =========================================
   GO HOME
========================================= */

function goHome() {

  window.location.hash = "dashboard";

}


/* =========================================
   SIDEBAR NAVIGATION
========================================= */

function setupRouterLinks() {

  const links =
    document.querySelectorAll("[data-route]");


  links.forEach(link => {

    link.addEventListener("click", () => {

      const route =
        link.getAttribute("data-route");

      window.location.hash = route;

    });

  });

}


document.addEventListener("DOMContentLoaded", () => {

  setupRouterLinks();

});


/* =========================================
   PROTECTED ROUTES
========================================= */

const protectedRoutes = [
  "upload",
  "favorites",
  "profile",
  "admin"
];


/* =========================================
   AUTH CHECK
========================================= */

function isAuthenticated() {

  return localStorage.getItem("isAuth") === "true";

}


/* =========================================
   ROLE CHECK
========================================= */

function getUserRole() {

  return localStorage.getItem("role") || "student";

}


/* =========================================
   ROUTE GUARD
========================================= */

function checkAccess(routeName) {

  if (
    protectedRoutes.includes(routeName)
    && !isAuthenticated()
  ) {

    alert("Необходимо войти в аккаунт");

    window.location.hash = "dashboard";

    return false;

  }


  if (
    routeName === "admin"
    && getUserRole() !== "admin"
  ) {

    alert("Доступ запрещён");

    window.location.hash = "dashboard";

    return false;

  }


  return true;

}


/* =========================================
   OVERRIDE NAVIGATE
========================================= */

const originalNavigate = navigate;

navigate = function(routeName) {

  if (!checkAccess(routeName)) {

    return;

  }

  originalNavigate(routeName);

};


/* =========================================
   BREADCRUMBS
========================================= */

function renderBreadcrumbs(routeName) {

  const breadcrumb =
    document.getElementById("breadcrumbs");

  if (!breadcrumb) return;


  breadcrumb.innerHTML = `

    <span>
      Главная
    </span>

    <span style="margin:0 10px;">
      /
    </span>

    <span style="color:#60a5fa;">
      ${routes[routeName]?.title || "404"}
    </span>

  `;

}


/* =========================================
   PAGE TRANSITION
========================================= */

function pageTransition(page) {

  page.classList.add("page-transition");

  setTimeout(() => {

    page.classList.remove("page-transition");

  }, 400);

}


/* =========================================
   AUTO SCROLL TOP
========================================= */

function scrollTopSmooth() {

  window.scrollTo({

    top: 0,
    behavior: "smooth"

  });

}


/* =========================================
   EXTENDED NAVIGATE
========================================= */

const oldNavigate = navigate;

navigate = function(routeName) {

  if (!checkAccess(routeName)) {

    return;

  }

  oldNavigate(routeName);

  renderBreadcrumbs(routeName);

  scrollTopSmooth();

};


/* =========================================
   MOBILE CLOSE SIDEBAR
========================================= */

function closeSidebarMobile() {

  const sidebar =
    document.querySelector(".sidebar");

  if (!sidebar) return;

  sidebar.classList.remove("active");

}


/* =========================================
   AUTO CLOSE SIDEBAR ON MOBILE
========================================= */

document.addEventListener("click", e => {

  const sidebar =
    document.querySelector(".sidebar");

  const menuBtn =
    document.getElementById("mobileMenuBtn");

  if (!sidebar || !menuBtn) return;


  const clickedInsideSidebar =
    sidebar.contains(e.target);

  const clickedMenu =
    menuBtn.contains(e.target);


  if (
    !clickedInsideSidebar
    && !clickedMenu
    && window.innerWidth < 992
  ) {

    closeSidebarMobile();

  }

});


/* =========================================
   PRELOADER
========================================= */

window.addEventListener("load", () => {

  const loader =
    document.getElementById("loader");

  if (!loader) return;


  loader.style.opacity = "0";

  setTimeout(() => {

    loader.style.display = "none";

  }, 400);

});


/* =========================================
   SAVE LAST PAGE
========================================= */

window.addEventListener("hashchange", () => {

  localStorage.setItem(
    "lastRoute",
    location.hash
  );

});


/* =========================================
   RESTORE LAST PAGE
========================================= */

window.addEventListener("load", () => {

  const lastRoute =
    localStorage.getItem("lastRoute");

  if (
    lastRoute &&
    location.hash === ""
  ) {

    location.hash = lastRoute;

  }

});


/* =========================================
   ROUTER DEBUG
========================================= */

function routerDebug() {

  console.log("Текущий route:", location.hash);

  console.log("Routes:", routes);

}


/* =========================================
   KEYBOARD NAVIGATION
========================================= */

document.addEventListener("keydown", e => {

  if (e.altKey && e.key === "1") {

    location.hash = "dashboard";

  }

  if (e.altKey && e.key === "2") {

    location.hash = "catalog";

  }

  if (e.altKey && e.key === "3") {

    location.hash = "upload";

  }

});


/* =========================================
   INIT
========================================= */

console.log(
  "BrainPort Router initialized"
);