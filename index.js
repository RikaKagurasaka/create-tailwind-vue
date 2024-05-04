#!/usr/bin/env node

const { execSync, exec } = require("child_process");
const fs = require("fs");

function isUsingYarn() {
  return (process.env.npm_config_user_agent || "").indexOf("yarn") === 0;
}
console.log(`Using ${isUsingYarn() ? "yarn" : "npm"}...`);

class MainTsConfigure {
  constructor({ projectName, packagesToInstall }) {
    this.mainTsFilePath = "./src/main.ts";
    this.packagesToInstall = packagesToInstall;
    this.mainTsContent = {
      imports: ["import { createApp } from 'vue'", "import App from './App.vue'", 'import "./style.css"'],
      createApp: ["const app = createApp(App);"],
      uses: [],
      mount: ['app.mount("#app");'],
    };
    this.cmds = {
      create() {
        console.log(`Creating a new ${projectName} project...`);
        execSync(isUsingYarn() ? `yarn create vite ${projectName} --template vue-ts` : `npx create-vite ${projectName} --template vue-ts`);
        console.log(`${projectName} project created successfully.`);
      },
      chdir() {
        process.chdir(projectName);
      },
      tailwindcss() {
        console.log("Installing tailwindcss...");
        execSync(isUsingYarn() ? "yarn add -D tailwindcss@latest postcss@latest autoprefixer@latest" : "npm install -D tailwindcss@latest postcss@latest autoprefixer@latest");
        console.log("Configuring tailwindcss...");
        execSync("npx tailwindcss init -p");
        let tailwindcssJsContent = fs.readFileSync("tailwind.config.js", "utf-8");
        tailwindcssJsContent = tailwindcssJsContent.replace(/'content\s*:\[\],/g, "'content': ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],");
        fs.writeFileSync("tailwind.config.js", tailwindcssJsContent);
        fs.writeFileSync("style.css", "@tailwind base;\n@tailwind components;\n@tailwind utilities;");
        console.log("tailwindcss installed and configured successfully.");
      },
      "vue-router"() {
        console.log("Installing vue-router...");
        execSync(isUsingYarn() ? "yarn add vue-router@next" : "npm install vue-router@next --save");
        console.log("Configuring vue-router...");
        fs.writeFileSync(
          "src/router.ts",
          `import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    name: "Home",
    component: () => import("./views/Home.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
`
        );
        this.mainTsContent.imports.push("import router from './router'");
        this.mainTsContent.uses.push("app.use(router)");
        console.log("vue-router installed and configured successfully.");
      },
      pinia() {
        console.log("Installing pinia...");
        execSync(isUsingYarn() ? "yarn add pinia" : "npm install pinia --save");
        console.log("Configuring pinia...");
        this.mainTsContent.imports.push("import { createPinia } from 'pinia'");
        this.mainTsContent.uses.push("app.use(createPinia())");
        console.log("pinia installed and configured successfully.");
      },
      vueuse() {
        console.log("Installing vueuse...");
        execSync(isUsingYarn() ? "yarn add @vueuse/core" : "npm install @vueuse/core --save");
        console.log("vueuse installed successfully.");
      },
      daisyui() {
        console.log("Installing daisyui...");
        execSync(isUsingYarn() ? "yarn add -D daisyui" : "npm install -D daisyui@latest");
        console.log("Configuring daisyui...");
        if (fs.existsSync("tailwind.config.js")) {
          let tailwindcssJsContent = fs.readFileSync("tailwind.config.js", "utf-8");
          tailwindcssJsContent = tailwindcssJsContent.replace(/'plugins'\s*:\s*\[\]/g, "'plugins': [require('daisyui')],");
          fs.writeFileSync("tailwind.config.js", tailwindcssJsContent);
        } else {
          console.warn("tailwind.config.js not found, skipping daisyui configuration.");
        }
      },
      "font-awesome"() {
        console.log("Installing fontawesome...");
        execSync(isUsingYarn() ? "yarn add @fortawesome/fontawesome-svg-core @fortawesome/free-solid-svg-icons @fortawesome/free-regular-svg-icons @fortawesome/vue-fontawesome" : "npm install @fortawesome/fontawesome-svg-core @fortawesome/free-solid-svg-icons @fortawesome/free-regular-svg-icons @fortawesome/vue-fontawesome --save");
      },
      mainTs() {
        let mainTsContent = "";
        for (const key in this.mainTsContent) {
          mainTsContent += this.mainTsContent[key].join("\n") + "\n";
        }
        fs.writeFileSync(this.mainTsFilePath, mainTsContent);
      },
    };
  }
  installAll() {
    let packagesToInstall = ["create", "chdir", ...this.packagesToInstall, "mainTs"];
    for (const p of packagesToInstall) {
      if (shouldInstall) {
        this.cmds[p]();
      }
    }
  }
}

async function main() {
  let projectName;

  if (process.argv.length >= 3) {
    projectName = process.argv[2];
  } else {
    const prompt = "Enter a name for your project: ";
    projectName = require("readline-sync").question(prompt);
  }

  const packagesToInstall = ["tailwindcss", "vue-router", "pinia", "vueuse", "daisyui", "font-awesome"];
  const packageChoices = {};

  for (const pack of packagesToInstall) {
    if (pack === "daisyui" && !packageChoices["tailwindcss"]) {
      continue;
    }
    const prompt = `Do you want to install ${pack}? (y/N): `;
    const input = require("readline-sync").question(prompt).toLowerCase();

    packageChoices[pack] = input === "y";
  }

  config.installAll();
  const config = new MainTsConfigure({ projectName, packagesToInstall: packagesToInstall.filter((pack) => packageChoices[pack]) });

  console.log(`\n🎉 Successfully created a new ${projectName} project! 🎉`);
}

main().catch((error) => {
  console.error("An error occurred:", error);
});
