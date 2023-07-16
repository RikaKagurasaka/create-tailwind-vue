#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

function isUsingYarn() {
  return (process.env.npm_config_user_agent || '').indexOf('yarn') === 0;
}
console.log(`Using ${isUsingYarn() ? 'yarn' : 'npm'}...`);


function createProject(projectName) {
  console.log(`Creating a new ${projectName} project...`);
  if (isUsingYarn())
    execSync(`yarn create vite ${projectName} --template vue-ts`, { stdio: 'inherit' });
  else
    execSync(`npx create-vite ${projectName} --template vue-ts`, { stdio: 'inherit' });
  console.log(`${projectName} project created successfully.`);

  process.chdir(projectName);
}

function installPackage(packageName) {
  console.log(`Installing ${packageName}...`);
  if (isUsingYarn())
  execSync(`yarn add ${packageName}`, { stdio: 'inherit' });
  else  
  execSync(`npm install ${packageName}`, { stdio: 'inherit' });
  console.log(`${packageName} installed successfully.`);
}

function configureTailwind() {
  console.log('Configuring Tailwind CSS...');

  // Generate Tailwind configuration file
  if (isUsingYarn())
  execSync('yarn add -D postcss autoprefixer && yarn run tailwindcss init -p', { stdio: 'inherit' });
  else
  execSync('npm install -D postcss autoprefixer && npx tailwindcss init -p', { stdio: 'inherit' });

  // Modify tailwind.config.js to include custom content
  const tailwindConfigPath = './tailwind.config.js';
  let tailwindConfigContent = fs.readFileSync(tailwindConfigPath, 'utf-8');

  const contentRegex = /(content:\s*)\[.*?\]/s;
  const contentReplacement = "content: ['./src/**/*.html', './src/**/*.vue', './src/**/*.jsx', './src/**/*.tsx']";
  tailwindConfigContent = tailwindConfigContent.replace(contentRegex, contentReplacement);

  fs.writeFileSync(tailwindConfigPath, tailwindConfigContent);

  // Modify main.css to include Tailwind CSS
  const cssFilePath = './src/style.css';
  const cssContent = `@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';
`;
  fs.writeFileSync(cssFilePath, cssContent);

  console.log('Tailwind CSS configured successfully.');
}

function configureVueRouter() {
  console.log('Configuring Vue Router...');

  // Modify main.ts to import and use Vue Router
  const mainTsFilePath = './src/main.ts';
  let mainTsContent = fs.readFileSync(mainTsFilePath, 'utf-8');

  mainTsContent = mainTsContent.replace(
    `import { createApp } from 'vue'`,
    `import { createApp } from 'vue'\nimport { createRouter, createWebHistory } from 'vue-router'`
  );

  mainTsContent = mainTsContent.replace(
    `createApp(App)`,
    `const router = createRouter({
    history: createWebHistory(),
    routes: [
    { path: '/', component: Home },
    // Add your routes here
    ],
})

createApp(App).use(router)`
  );

  fs.writeFileSync(mainTsFilePath, mainTsContent);

  console.log('Vue Router configured successfully.');

  // Modify App.vue to include <router-view/> element
  const appVueFilePath = './src/App.vue';
  let appVueContent = fs.readFileSync(appVueFilePath, 'utf-8');

  const templateRegex = /(<template>)/;
  const templateReplacement = '$1\n  <router-view/>';
  appVueContent = appVueContent.replace(templateRegex, templateReplacement);

  fs.writeFileSync(appVueFilePath, appVueContent);

  console.log('App.vue modified successfully.');
}

function configurePinia() {
  console.log('Configuring Pinia...');

  // Modify main.ts to import and use Pinia
  const mainTsFilePath = './src/main.ts';
  let mainTsContent = fs.readFileSync(mainTsFilePath, 'utf-8');

  mainTsContent = mainTsContent.replace(
    `import { createApp } from 'vue'`,
    `import { createApp } from 'vue'\nimport { createPinia } from 'pinia'`
  );

  mainTsContent = mainTsContent.replace(
    `createApp(App)`,
    `createApp(App).use(createPinia())`
  );

  fs.writeFileSync(mainTsFilePath, mainTsContent);

  console.log('Pinia configured successfully.');
}

function createVueShim() {
  console.log('Creating vue-shim.d.ts file...');

  // Create vue-shim.d.ts file
  const vueShimFilePath = './src/vue-shim.d.ts';
  const vueShimContent = `declare module '*.vue' {
  import { ComponentOptions } from 'vue';
  const componentOptions: ComponentOptions;
  export default componentOptions;
}`;
  fs.writeFileSync(vueShimFilePath, vueShimContent);

  console.log('vue-shim.d.ts file created successfully.');
}

async function main() {
  let projectName;

  if (process.argv.length >= 3) {
    projectName = process.argv[2];
  } else {
    const prompt = 'Enter a name for your project: ';
    projectName = require('readline-sync').question(prompt);
  }

  const packagesToInstall = ['tailwindcss', 'vue-router', 'pinia'];
  const packageChoices = {};

  for (const package of packagesToInstall) {
    const prompt = `Do you want to install ${package}? (y/N): `;
    const input = require('readline-sync').question(prompt).toLowerCase();

    packageChoices[package] = input === 'y';
  }

  createProject(projectName);
  createVueShim();

  for (const [package, shouldInstall] of Object.entries(packageChoices)) {
    if (shouldInstall) {
      installPackage(package);

      if (package === 'tailwindcss') {
        configureTailwind();
      } else if (package === 'vue-router') {
        configureVueRouter();
      } else if (package === 'pinia') {
        configurePinia();
      }
    }
  }

  console.log(`\n🎉 Successfully created a new ${projectName} project! 🎉`);
}

main().catch((error) => {
  console.error('An error occurred:', error);
});
