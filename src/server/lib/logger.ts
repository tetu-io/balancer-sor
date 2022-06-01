import { Logger } from 'winston';
import winston = require('winston');

const logger: Logger = winston.createLogger({
    format: winston.format.json(),
    transports: [new winston.transports.Console()],
});

export default logger;
