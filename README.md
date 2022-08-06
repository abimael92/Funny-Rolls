<h1 align="center">Welcome!</h1>

## Project

This project was initialised using [Create React App](https://reactjs.org/docs/create-a-new-react-app.html) and added an addition configuration of eslint, prettier, editorconfig and finaly husky for precommit scripts.

## You will need

- [Prettier - Code formatter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode).
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint).
- [EditorConfig for VS Code](https://marketplace.visualstudio.com/items?itemName=EditorConfig.EditorConfig).

## Recommended

- [ES7+ React/Redux/React-Native snippets](https://marketplace.visualstudio.com/items?itemName=dsznajder.es7-react-js-snippets).
- [Lintel](https://marketplace.visualstudio.com/items?itemName=mflo999.lintel).

## Benefits of using Prettier and ESLint

Prettier was configured to format file on save and there is no need to worry about code formatting anymore. Eslint is used to find problems and syntax issues in the code, it will help us find broken logic that would be found only in run time. This forces a specific code style across the whole codebase.

## Technologies

VS Code with EditorConfig and ESLint

The project was mainly developed with the following technologies:

```
  "dependencies": {
    "@testing-library/jest-dom": "^5.14.1",
    "@testing-library/react": "^13.0.0",
    "@testing-library/user-event": "^13.2.1",
    "@types/jest": "^27.0.1",
    "@types/node": "^16.7.13",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "typescript": "^4.4.2",
    "web-vitals": "^2.1.0"
  },

  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^5.32.0",
    "@typescript-eslint/parser": "^5.32.0",
    "eslint": "^7.32.0 || ^8.2.0",
    "eslint-config-airbnb": "^19.0.4",
    "eslint-config-airbnb-typescript": "^17.0.0",
    "eslint-config-prettier": "^8.5.0",
    "eslint-import-resolver-typescript": "^3.4.0",
    "eslint-plugin-import": "^2.25.3",
    "eslint-plugin-jsx-a11y": "^6.5.1",
    "eslint-plugin-prettier": "^4.2.1",
    "eslint-plugin-react": "^7.28.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "prettier": "^2.7.1",
    "husky": "^8.0.0"
  }

```

## Folders

```
├── public
│   ├── ...
├── src
│   ├── App.tsx
│   ├── index.tsx
│   ├── react-app-env.d.ts
│   ├── reportWebVitals.ts
│   └──  setupTests.ts
├── .editorconfig
├── .eslintignore
├── .eslintrc.json
├── .gitignore
├── .prettierrc
├── README.md
├── package.json
├── tsconfig.json
└── yarn.lock
```

## How to clone and use

To clone and run this application, we will need NodeJS + Yarn (prefferly) installed on computer.

After this clone the repository, from our command line:

```
# Clone this repository
$ git clone

# Go into the repository
$ cd

# Install dependencies
$ yarn install

# Run the app
$ yarn start
```

### `yarn start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Need an upgrade?

```
$ yarn upgrade
```

Upgrades packages to their latest version based on the specified range.

## Available Scripts

```
"scripts": {
"start": "react-scripts start",
"build": "react-scripts build",
"test": "react-scripts test",
"eject": "react-scripts eject",
"lint": "eslint .",
"lint:fix": "eslint --fix .",
"format": "prettier --write . --config ./.prettierrc",
"prepare": "husky install"
}
```
