#!/usr/bin/env node

const { execSync, exec } = require("child_process");
const fs = require("fs");

function isUsingYarn() {
  return (process.env.npm_config_user_agent || "").indexOf("yarn") === 0;
}
console.log(`\nUsing ${isUsingYarn() ? "yarn" : "npm"}...`);
console.log(`args: ${process.argv}`);

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
    let that = this;
    this.cmds = {
      create() {
        console.log(`Creating a new ${projectName} project...`);
        execSync(isUsingYarn() ? `yarn create vite ${projectName} --template vue-ts` : `npx create-vite ${projectName} --template vue-ts`, { stdio: "inherit" });
        console.log("Configuring the project...");
        process.chdir(projectName);
        execSync(isUsingYarn() ? "yarn add -D @types/node" : "npm install -D @types/node", { stdio: "inherit" });
        let viteConfigTsContent = fs.readFileSync("vite.config.ts", "utf-8");
        viteConfigTsContent = viteConfigTsContent.replace(/import vue from ['"]@vitejs\/plugin-vue['"]/, 'import vue from "@vitejs/plugin-vue"\nimport { fileURLToPath, URL } from "url";');
        viteConfigTsContent = viteConfigTsContent.replace(
          "})",
          `  resolve: {
    alias: [{ find: "@", replacement: fileURLToPath(new URL("./src", import.meta.url)) }],
  },
})`
        );
        fs.writeFileSync("vite.config.ts", viteConfigTsContent);
        let tsconfigJsonContent = fs.readFileSync("tsconfig.json", "utf-8");
        tsconfigJsonContent = tsconfigJsonContent.replace(
          '"jsx": "preserve",',
          `"jsx": "preserve",
    "paths": {
      "@/*": ["./src/*"]
    },`
        );
        fs.writeFileSync("tsconfig.json", tsconfigJsonContent);
        console.log(`${projectName} project created successfully.`);
      },
      tailwindcss() {
        console.log("Installing tailwindcss...");
        execSync(isUsingYarn() ? "yarn add -D tailwindcss@latest postcss@latest autoprefixer@latest" : "npm install -D tailwindcss@latest postcss@latest autoprefixer@latest", { stdio: "inherit" });
        console.log("Configuring tailwindcss...");
        execSync("npx tailwindcss init -p", { stdio: "inherit" });
        let tailwindcssJsContent = fs.readFileSync("tailwind.config.js", "utf-8");
        let tailwindcssJsContentAfter = tailwindcssJsContent.replace(/content\s*:\s*\[\],/g, "content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],");
        if (tailwindcssJsContentAfter == tailwindcssJsContent) {
          console.warn("tailwindcss configuration failed.");
        }
        fs.writeFileSync("tailwind.config.js", tailwindcssJsContentAfter);
        fs.writeFileSync("./src/style.css", "@tailwind base;\n@tailwind components;\n@tailwind utilities;");
        console.log("tailwindcss installed and configured successfully.");
      },
      "vue-router"() {
        console.log("Installing vue-router...");
        execSync(isUsingYarn() ? "yarn add vue-router@next" : "npm install vue-router@next --save", { stdio: "inherit" });
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
        that.mainTsContent.imports.push("import router from './router'");
        that.mainTsContent.uses.push("app.use(router)");
        fs.mkdirSync("src/views", { recursive: true });
        fs.writeFileSync("src/views/Home.vue", "<template><h1>Home</h1></template>");
        console.log("vue-router installed and configured successfully.");
      },
      pinia() {
        console.log("Installing pinia...");
        execSync(isUsingYarn() ? "yarn add pinia" : "npm install pinia --save", { stdio: "inherit" });
        console.log("Configuring pinia...");
        that.mainTsContent.imports.push("import { createPinia } from 'pinia'");
        that.mainTsContent.uses.push("app.use(createPinia())");
        console.log("pinia installed and configured successfully.");
      },
      vueuse() {
        console.log("Installing vueuse...");
        execSync(isUsingYarn() ? "yarn add @vueuse/core" : "npm install @vueuse/core --save", { stdio: "inherit" });
        console.log("vueuse installed successfully.");
      },
      daisyui() {
        console.log("Installing daisyui...");
        execSync(isUsingYarn() ? "yarn add -D daisyui" : "npm install -D daisyui@latest", { stdio: "inherit" });
        console.log("Configuring daisyui...");
        if (fs.existsSync("tailwind.config.js")) {
          let tailwindcssJsContent = fs.readFileSync("tailwind.config.js", "utf-8");
          tailwindcssJsContent = tailwindcssJsContent.replace(/plugins\s*:\s*\[\]/g, "plugins: [require('daisyui')]");
          fs.writeFileSync("tailwind.config.js", tailwindcssJsContent);
        } else {
          console.warn("tailwind.config.js not found, skipping daisyui configuration.");
        }
      },
      "font-awesome"() {
        console.log("Installing fontawesome...");
        execSync(isUsingYarn() ? "yarn add @fortawesome/fontawesome-svg-core @fortawesome/free-solid-svg-icons @fortawesome/free-regular-svg-icons @fortawesome/vue-fontawesome" : "npm install @fortawesome/fontawesome-svg-core @fortawesome/free-solid-svg-icons @fortawesome/free-regular-svg-icons @fortawesome/vue-fontawesome --save", { stdio: "inherit" });
      },
      "vite-jsx"() {
        console.log("Installing vite-jsx...");
        execSync(isUsingYarn() ? "yarn add @vitejs/plugin-vue-jsx" : "npm install @vitejs/plugin-vue-jsx --save", { stdio: "inherit" });
        let viteConfigTsContent = fs.readFileSync("vite.config.ts", "utf-8");
        viteConfigTsContent = `import vueJsx from '@vitejs/plugin-vue-jsx'\n` + viteConfigTsContent;
        viteConfigTsContent = viteConfigTsContent.replace(/plugins\s*:\s*\[(.*)\]/, (match, p1) => `plugins: [${p1}, vueJsx()]`);
        fs.writeFileSync("vite.config.ts", viteConfigTsContent);
        console.log("vite-jsx installed and configured successfully.");
      },
      removeSample() {
        fs.unlinkSync("src/components/HelloWorld.vue");
        fs.unlinkSync("src/assets/vue.svg");
        fs.writeFileSync("src/App.vue", `<template><div id="app"></div></template>`);
      },
      mainTs() {
        let mainTsContent = "";
        for (const key in that.mainTsContent) {
          mainTsContent += that.mainTsContent[key].join("\n") + "\n";
        }
        fs.writeFileSync(that.mainTsFilePath, mainTsContent);
      },
    };
  }
  installAll() {
    let packagesToInstall = ["create", ...this.packagesToInstall, "mainTs", "removeSample"];
    for (const p of packagesToInstall) {
      this.cmds[p]();
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

  const packagesToInstall = ["tailwindcss", "vue-router", "vite-jsx", "pinia", "vueuse", "daisyui", "font-awesome"];
  const packageChoices = {};

  for (const pack of packagesToInstall) {
    if (pack === "daisyui" && !packageChoices["tailwindcss"]) {
      continue;
    }
    const prompt = `Do you want to install ${pack}? (y/N): `;
    const input = require("readline-sync").question(prompt).toLowerCase();

    packageChoices[pack] = input === "y";
  }

  const config = new MainTsConfigure({ projectName, packagesToInstall: packagesToInstall.filter((pack) => packageChoices[pack]) });
  config.installAll();

  console.log(`\n🎉 Successfully created a new ${projectName} project! 🎉`);
}

main().catch((error) => {
  console.error("An error occurred:", error);
});
