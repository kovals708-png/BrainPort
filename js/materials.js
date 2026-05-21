/* =========================================
   BRAINPORT MATERIALS.JS
========================================= */


/* =========================================
   MATERIALS STORAGE
========================================= */

let materials = JSON.parse(
  localStorage.getItem("materials")
) || [

  {
    id: 1,

    title: "React.js Полный курс",

    description:
      "Полный курс по React.js для начинающих.",

    category: "Программирование",

    course: "3 курс",

    author: "Анна Смирнова",

    date: "2026-05-21",

    type: "PDF",

    size: "12 MB",

    tags: ["react", "frontend", "javascript"],

    downloads: 240,

    likes: 45
  },

  {
    id: 2,

    title: "Высшая математика",

    description:
      "Лекции по высшей математике.",

    category: "Математика",

    course: "2 курс",

    author: "Иван Орлов",

    date: "2026-05-18",

    type: "DOCX",

    size: "5 MB",

    tags: ["математика", "алгебра"],

    downloads: 180,

    likes: 30
  },

  {
    id: 3,

    title: "Основы физики",

    description:
      "Презентации по физике.",

    category: "Физика",

    course: "1 курс",

    author: "Мария Иванова",

    date: "2026-05-10",

    type: "PPTX",

    size: "18 MB",

    tags: ["физика", "механика"],

    downloads: 96,

    likes: 15
  }

];


/* =========================================
   SAVE MATERIALS
========================================= */

function saveMaterials() {

  localStorage.setItem(
    "materials",
    JSON.stringify(materials)
  );

}


/* =========================================
   GET MATERIAL BY ID
========================================= */

function getMaterialById(id) {

  return materials.find(
    material => material.id === id
  );

}


/* =========================================
   ADD MATERIAL
========================================= */

function addMaterial(materialData) {

  const material = {

    id: Date.now(),

    title: materialData.title || "Без названия",

    description:
      materialData.description || "",

    category:
      materialData.category || "Общее",

    course:
      materialData.course || "Не указан",

    author:
      materialData.author || "Неизвестно",

    date:
      new Date().toISOString().split("T")[0],

    type:
      materialData.type || "FILE",

    size:
      materialData.size || "0 MB",

    tags:
      materialData.tags || [],

    downloads: 0,

    likes: 0

  };


  materials.unshift(material);

  saveMaterials();

  renderMaterials(materials);

  showNotification(
    "Материал успешно добавлен",
    "success"
  );

}


/* =========================================
   DELETE MATERIAL
========================================= */

function deleteMaterial(id) {

  const confirmDelete = confirm(
    "Удалить материал?"
  );

  if (!confirmDelete) return;


  materials = materials.filter(
    material => material.id !== id
  );


  saveMaterials();

  renderMaterials(materials);

  showNotification(
    "Материал удалён",
    "success"
  );

}


/* =========================================
   UPDATE MATERIAL
========================================= */

function updateMaterial(id, updatedData) {

  const material =
    getMaterialById(id);

  if (!material) return;


  Object.assign(material, updatedData);

  saveMaterials();

  renderMaterials(materials);

  showNotification(
    "Материал обновлён",
    "success"
  );

}


/* =========================================
   DOWNLOAD MATERIAL
========================================= */

function downloadMaterial(id) {

  const material =
    getMaterialById(id);

  if (!material) return;


  material.downloads++;

  saveMaterials();

  renderMaterials(materials);

  showNotification(
    `Скачивание: ${material.title}`,
    "success"
  );

}


/* =========================================
   LIKE MATERIAL
========================================= */

function likeMaterial(id) {

  const material =
    getMaterialById(id);

  if (!material) return;


  material.likes++;

  saveMaterials();

  renderMaterials(materials);

}


/* =========================================
   SEARCH MATERIALS
========================================= */

function searchMaterials(query) {

  query = query.toLowerCase();


  const filtered = materials.filter(material => {

    return (

      material.title
        .toLowerCase()
        .includes(query)

      ||

      material.description
        .toLowerCase()
        .includes(query)

      ||

      material.category
        .toLowerCase()
        .includes(query)

      ||

      material.author
        .toLowerCase()
        .includes(query)

      ||

      material.tags.join(" ")
        .toLowerCase()
        .includes(query)

    );

  });


  renderMaterials(filtered);

}


/* =========================================
   FILTER BY CATEGORY
========================================= */

function filterMaterials(category) {

  if (
    category === "Все категории"
  ) {

    renderMaterials(materials);

    return;

  }


  const filtered = materials.filter(material => {

    return material.category === category;

  });


  renderMaterials(filtered);

}


/* =========================================
   SORT MATERIALS
========================================= */

function sortMaterials(sortType) {

  let sorted = [...materials];


  switch (sortType) {

    case "downloads":

      sorted.sort(
        (a, b) => b.downloads - a.downloads
      );

      break;


    case "likes":

      sorted.sort(
        (a, b) => b.likes - a.likes
      );

      break;


    case "date":

      sorted.sort(
        (a, b) =>
          new Date(b.date) - new Date(a.date)
      );

      break;


    case "title":

      sorted.sort(
        (a, b) =>
          a.title.localeCompare(b.title)
      );

      break;

  }


  renderMaterials(sorted);

}


/* =========================================
   CREATE MATERIAL CARD
========================================= */

function createMaterialCard(material) {

  return `

    <div class="material-card glass fade-in">

      <div class="material-top">

        <span class="material-type">

          ${material.type}

        </span>


        <button
          class="favorite-btn"
          onclick="addToFavorites(${material.id})"
        >

          ⭐

        </button>

      </div>


      <h3>

        ${material.title}

      </h3>


      <p
        style="
          color:#94a3b8;
          margin:15px 0;
          line-height:1.5;
        "
      >

        ${material.description}

      </p>


      <div class="material-info">

        <div>
          📚 ${material.category}
        </div>

        <div>
          🎓 ${material.course}
        </div>

        <div>
          👨‍🏫 ${material.author}
        </div>

        <div>
          📅 ${material.date}
        </div>

        <div>
          💾 ${material.size}
        </div>

        <div>
          ⬇ ${material.downloads}
        </div>

        <div>
          ❤️ ${material.likes}
        </div>

      </div>


      <div
        style="
          display:flex;
          flex-wrap:wrap;
          gap:10px;
          margin:20px 0;
        "
      >

        ${material.tags.map(tag => `

          <span
            style="
              background:rgba(59,130,246,.2);
              color:#93c5fd;
              padding:8px 12px;
              border-radius:999px;
              font-size:12px;
            "
          >

            #${tag}

          </span>

        `).join("")}

      </div>


      <div class="material-actions">

        <button
          class="btn btn-primary"
          onclick="downloadMaterial(${material.id})"
        >

          Скачать

        </button>


        <button
          class="btn btn-secondary"
          onclick="previewMaterial(${material.id})"
        >

          👁

        </button>


        <button
          class="btn btn-secondary"
          onclick="likeMaterial(${material.id})"
        >

          ❤️

        </button>


        <button
          class="btn btn-secondary"
          onclick="deleteMaterial(${material.id})"
        >

          🗑

        </button>

      </div>

    </div>

  `;

}


/* =========================================
   RENDER MATERIALS
========================================= */

function renderMaterials(data = materials) {

  const container =
    document.getElementById(
      "materialsContainer"
    );

  const catalog =
    document.getElementById(
      "catalogContainer"
    );


  if (container) {

    container.innerHTML = "";

    data.forEach(material => {

      container.innerHTML +=
        createMaterialCard(material);

    });

  }


  if (catalog) {

    catalog.innerHTML = "";

    data.forEach(material => {

      catalog.innerHTML +=
        createMaterialCard(material);

    });

  }

}


/* =========================================
   PREVIEW MATERIAL
========================================= */

function previewMaterial(id) {

  const material =
    getMaterialById(id);

  if (!material) return;


  alert(

    `Название: ${material.title}

Описание: ${material.description}

Автор: ${material.author}

Категория: ${material.category}`

  );

}


/* =========================================
   MATERIAL STATISTICS
========================================= */

function getStatistics() {

  return {

    total: materials.length,

    downloads:
      materials.reduce(
        (sum, item) =>
          sum + item.downloads,
        0
      ),

    likes:
      materials.reduce(
        (sum, item) =>
          sum + item.likes,
        0
      )

  };

}


/* =========================================
   UPDATE DASHBOARD
========================================= */

function updateDashboardStats() {

  const stats = getStatistics();


  const totalElement =
    document.getElementById(
      "totalMaterials"
    );

  const downloadsElement =
    document.getElementById(
      "totalDownloads"
    );


  if (totalElement) {

    totalElement.innerText =
      stats.total;

  }


  if (downloadsElement) {

    downloadsElement.innerText =
      stats.downloads;

  }

}


/* =========================================
   INIT MATERIALS
========================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    renderMaterials();

    updateDashboardStats();

  }
);


/* =========================================
   EXPORT MATERIALS
========================================= */

function exportMaterials() {

  const data =
    JSON.stringify(materials, null, 2);

  const blob =
    new Blob([data], {
      type: "application/json"
    });

  const url =
    URL.createObjectURL(blob);

  const a =
    document.createElement("a");

  a.href = url;

  a.download = "materials.json";

  a.click();

}


/* =========================================
   IMPORT MATERIALS
========================================= */

function importMaterials(event) {

  const file = event.target.files[0];

  if (!file) return;


  const reader = new FileReader();

  reader.onload = function(e) {

    try {

      const imported =
        JSON.parse(e.target.result);

      materials = imported;

      saveMaterials();

      renderMaterials();

      showNotification(
        "Материалы импортированы",
        "success"
      );

    } catch {

      showNotification(
        "Ошибка импорта",
        "error"
      );

    }

  };

  reader.readAsText(file);

}


/* =========================================
   AUTO SAVE
========================================= */

setInterval(() => {

  saveMaterials();

}, 10000);


/* =========================================
   DEBUG
========================================= */

console.log(
  "Materials module initialized"
);