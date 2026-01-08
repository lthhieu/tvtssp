FROM node:20-alpine
COPY package*.json ./
WORKDIR /hieulth/backend
RUN npm install
RUN npm install -g @babel/core @babel/cli
COPY . .
RUN npm run build-src
CMD ["npm","run","build"]