"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("./server");
const port = Number(process.env.PORT || 3000);
server_1.app.listen(port, '0.0.0.0', () => console.log(`ExamMe SSR listening on ${port}`));
