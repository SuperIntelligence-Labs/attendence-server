import { Logger, type ILogObj } from "tslog";

const logger = new Logger<ILogObj>({
    type: "pretty",
    hideLogPositionForProduction: false,
    prettyLogTemplate: "{{yyyy}}-{{mm}}-{{dd}} {{hh}}:{{MM}}:{{ss}}.{{ms}} {{logLevelName}} {{fileNameWithLine}} >>> ",
});

export default logger;