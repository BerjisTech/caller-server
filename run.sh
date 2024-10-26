#!/bin/bash

# Step a: Install dependencies
yarn install

# Step b: Run all necessary parts of the codebase
yarn build & yarn start
